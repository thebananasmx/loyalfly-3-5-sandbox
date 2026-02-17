import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { PKPass } from "passkit-generator";
import path from "path";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { readFileSync } from "fs";

// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();

// --- CONFIGURACIÓN DE SECRETOS (Apple) ---
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

// --- CONFIGURACIÓN GOOGLE WALLET ---
const ISSUER_ID = "3388000000023072020";
let serviceAccount;
try {
    serviceAccount = JSON.parse(readFileSync("./service-account-key.json", "utf-8"));
} catch (e) {
    console.warn("Google Service Account not found.");
}

// --- HELPERS GENERALES ---
function extractPemBlock(pemText, blockName) {
    if (!pemText) return null;
    const regex = new RegExp(`-----BEGIN ${blockName}-----([\\s\\S]*?)-----END ${blockName}-----`, 'i');
    const match = pemText.match(regex);
    return match ? match[0] : null;
}

function getPemFromSecret(secretValue, label) {
    if (!secretValue) return null;
    try {
        const raw = secretValue.trim();
        const decoded = Buffer.from(raw, "base64").toString("utf-8");
        return decoded.includes("-----BEGIN") ? decoded : null;
    } catch (e) {
        console.error(`[LOG] Error decodificando secreto ${label}:`, e.message);
        return null;
    }
}

// ==========================================
// 1. APPLE WALLET GENERATOR
// ==========================================
export const generateapplepass = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64],
    memory: "512MiB",
    timeoutSeconds: 30,
    invoker: "public"
}, async (req, res) => {
    try {
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan parámetros bid o cid.");

        const [busSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!busSnap.exists || !custSnap.exists) return res.status(404).send("Negocio o Cliente no encontrado.");

        const business = busSnap.data();
        const cardSettings = cardSnap.exists ? cardSnap.data() : {};
        const customer = custSnap.data();

        const wwdrPem = getPemFromSecret(APPLE_WWDR_CERT_BASE64.value(), "WWDR");
        const fullSignerPem = getPemFromSecret(APPLE_PASS_CERT_BASE64.value(), "SIGNER");
        const password = APPLE_PASS_PASSWORD.value() || "";

        const certPart = extractPemBlock(fullSignerPem, "CERTIFICATE");
        const keyPart = extractPemBlock(fullSignerPem, "PRIVATE KEY") || extractPemBlock(fullSignerPem, "RSA PRIVATE KEY");

        const bgColor = cardSettings.color || "rgb(81, 52, 249)";
        const isLightScheme = cardSettings.textColorScheme === 'light';
        const fgColor = isLightScheme ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
        const labelColor = isLightScheme ? "rgb(255, 255, 255)" : "rgb(100, 100, 100)";

        const pass = await PKPass.from({
            model: path.resolve("model.pass"),
            certificates: { wwdr: wwdrPem, signerCert: certPart, signerKey: keyPart, signerKeyPassphrase: password }
        }, {
            serialNumber: cid,
            organizationName: business.name || "Loyalfly",
            description: `Tarjeta de lealtad de ${business.name}`,
            backgroundColor: bgColor,
            foregroundColor: fgColor,
            labelColor: labelColor,
            logoText: (cardSettings.name || business.name || "Loyalfly").toUpperCase()
        });

        // --- CONFIGURACIÓN DE CAMPOS ---
        pass.secondaryFields.push({ key: "name", label: "CLIENTE", value: customer.name || "Miembro" });
        pass.secondaryFields.push({ key: "stamps", label: "SELLOS", value: String(customer.stamps || 0) });
        pass.backFields.push({ key: "rewards", label: "PREMIOS CANJEADOS", value: String(customer.rewardsRedeemed || 0) });
        pass.auxiliaryFields.push({ key: "rewardText", label: "RECOMPENSA", value: cardSettings.reward || "Recompensa" });

        pass.setBarcodes({ 
            format: "PKBarcodeFormatQR", 
            message: cid, 
            messageEncoding: "iso-8859-1",
            altText: "Escanea, suma sellos"
        });

        // --- MANEJO EXPLÍCITO DE IMÁGENES ---
        // Se añade el logotipo también a la franja (strip.png) como fondo temporal.
        const imageAssets = [
            { 
                url: cardSettings.logoUrl, 
                names: [
                    "logo.png", "logo@2x.png", "logo@3x.png", 
                    "icon.png", "icon@2x.png", "icon@3x.png",
                    "strip.png", "strip@2x.png", "strip@3x.png"
                ] 
            }
        ];

        for (const asset of imageAssets) {
            if (asset.url) {
                try {
                    const response = await fetch(asset.url);
                    if (response.ok) {
                        const imageBuffer = Buffer.from(await response.arrayBuffer());
                        asset.names.forEach(fileName => pass.addBuffer(fileName, imageBuffer));
                    }
                } catch (err) {
                    console.warn(`Error cargando imagen desde ${asset.url}:`, err.message);
                }
            }
        }

        const buffer = await pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=loyalfly-${cid}.pkpass`);
        return res.status(200).send(buffer);
    } catch (e) {
        console.error("Error Apple Pass:", e);
        return res.status(500).send(`Error Apple Pass: ${e.message}`);
    }
});

// ==========================================
// 2. GOOGLE WALLET GENERATOR (JWT)
// ==========================================
export const generatewalletpass = onRequest({
    region: "us-central1",
    memory: "256MiB",
    maxInstances: 10,
    invoker: "public"
}, async (req, res) => {
    try {
        if (!serviceAccount) return res.status(500).send("Google Wallet credentials missing.");
        
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan bid o cid.");

        const [busMainSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!custSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const business = busMainSnap.data();
        const cardSettings = cardSnap.exists ? cardSnap.data() : {};
        const customer = custSnap.data();

        const bizName = (cardSettings.name || business.name || "Loyalfly").substring(0, 20);
        const custName = (customer.name || "Cliente").substring(0, 25);
        const stamps = customer.stamps || 0;
        const rewardsAvailable = customer.rewardsRedeemed || 0;

        const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
        const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
        const classId = `${ISSUER_ID}.V31_${safeBid}`;
        const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

        let cardColor = cardSettings.color || "#5134f9";
        if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

        let logoObj = undefined;
        if (cardSettings.logoUrl) {
            logoObj = {
                sourceUri: { uri: cardSettings.logoUrl.replace('.svg', '.png') },
                contentDescription: { defaultValue: { language: "es-419", value: "Logo" } }
            };
        }

        const genericClass = {
            id: classId,
            issuerName: bizName,
            classTemplateInfo: {
                cardTemplateOverride: {
                    cardRowTemplateInfos: [{
                        twoItems: {
                            startItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['sellos']" }] } },
                            endItem: { firstValue: { fields: [{ fieldPath: "object.textModulesData['recompensas']" }] } }
                        }
                    }]
                }
            }
        };

        const genericObject = {
            id: objectId,
            classId: classId,
            hexBackgroundColor: cardColor,
            logo: logoObj,
            cardTitle: { defaultValue: { language: "es-419", value: bizName } },
            header: { defaultValue: { language: "es-419", value: custName } },
            subheader: { defaultValue: { language: "es-419", value: "Nombre" } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: `${stamps}` },
                { id: "recompensas", header: "Recompensas", body: `${rewardsAvailable}` }
            ],
            barcode: { type: "QR_CODE", value: cid, alternateText: cid.substring(0, 8) }
        };

        const claims = {
            iss: serviceAccount.client_email,
            aud: "google",
            typ: "savetowallet",
            payload: { genericClasses: [genericClass], genericObjects: [genericObject] },
        };

        const token = jwt.sign(claims, serviceAccount.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
        return res.redirect(`https://pay.google.com/gp/v/save/${token}`);
    } catch (error) {
        console.error("ERROR GOOGLE WALLET:", error);
        return res.status(500).send("Error: " + error.message);
    }
});

// ==========================================
// 3. REAL-TIME UPDATE TRIGGER (Google)
// ==========================================
export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "256MiB",
    maxInstances: 5
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps && newData.name === oldData.name && newData.rewardsRedeemed === oldData.rewardsRedeemed) return null;

    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    try {
        const auth = new GoogleAuth({
            credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key.replace(/\\n/g, '\n') },
            scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const token = tokenResponse.token;

        const patchData = {
            header: { defaultValue: { language: "es-419", value: (newData.name || "Cliente").substring(0, 25) } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: `${newData.stamps || 0}` },
                { id: "recompensas", header: "Recompensas", body: `${newData.rewardsRedeemed || 0}` }
            ]
        };

        await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        });
    } catch (error) {
        console.error("Error actualizando Google Wallet:", error.message);
    }
    return null;
});