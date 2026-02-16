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
// Nota: Asegúrate de que este archivo esté en la carpeta functions/
const serviceAccount = JSON.parse(readFileSync("./service-account-key.json", "utf-8"));

const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

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

/**
 * Obtiene token de acceso para Google Wallet API
 */
async function getGoogleAuthToken() {
    const auth = new GoogleAuth({
        credentials: {
            client_email: serviceAccount.client_email,
            private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
        },
        scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
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
            logoText: (cardSettings.name || business.name || "Loyalfly").toUpperCase(),
            storeCard: {
                headerFields: [
                    { 
                        key: "stamps", 
                        label: "SELLOS", 
                        value: String(customer.stamps || 0), 
                        textAlignment: "PKTextAlignmentRight" 
                    }
                ],
                primaryFields: [
                    { 
                        key: "name", 
                        label: "CLIENTE", 
                        value: customer.name || "Miembro" 
                    }
                ],
                secondaryFields: [
                    { 
                        key: "rewards", 
                        label: "RECOMPENSAS", 
                        value: String(customer.rewardsRedeemed || 0) 
                    },
                    { 
                        key: "prize", 
                        label: "PREMIO", 
                        value: cardSettings.reward || "Recompensa" 
                    }
                ],
                auxiliaryFields: [
                    { 
                        key: "phone", 
                        label: "TELÉFONO", 
                        value: customer.phone || "-" 
                    }
                ]
            }
        });

        pass.setBarcodes({ 
            format: "PKBarcodeFormatQR", 
            message: cid, 
            messageEncoding: "iso-8859-1",
            altText: "Escanea para sumar sellos"
        });

        // Solo icon y logo. strip.png se omite para que use el archivo físico de model.pass
        const imageFiles = ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"];

        if (cardSettings.logoUrl) {
            try {
                const response = await fetch(cardSettings.logoUrl);
                if (response.ok) {
                    const logoBuffer = Buffer.from(await response.arrayBuffer());
                    imageFiles.forEach(name => pass.addBuffer(name, logoBuffer));
                } else {
                    imageFiles.forEach(name => pass.addBuffer(name, PIXEL));
                }
            } catch (err) { 
                console.warn("Error logo Apple:", err.message); 
                imageFiles.forEach(name => pass.addBuffer(name, PIXEL));
            }
        } else {
            imageFiles.forEach(name => pass.addBuffer(name, PIXEL));
        }

        const buffer = await pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=loyalfly-${cid}.pkpass`);
        return res.status(200).send(buffer);
    } catch (e) {
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
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan parámetros bid o cid.");

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
            let cleanLogo = cardSettings.logoUrl;
            if (cleanLogo.includes('cloudinary.com')) cleanLogo = cleanLogo.replace('.svg', '.png');
            logoObj = {
                sourceUri: { uri: cleanLogo },
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
            subheader: { defaultValue: { language: "es-419", value: `Nombre` } },
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
        const token = await getGoogleAuthToken();
        const stamps = newData.stamps || 0;
        const rewards = newData.rewardsRedeemed || 0;
        const custName = (newData.name || "Cliente").substring(0, 25);

        const patchData = {
            header: { defaultValue: { language: "es-419", value: custName } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: `${stamps}` },
                { id: "recompensas", header: "Recompensas", body: `${rewards}` }
            ]
        };

        const response = await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        });

        if (!response.ok && response.status !== 404) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData));
        }
    } catch (error) {
        console.error("Error actualizando Google Wallet:", error.message);
    }
    return null;
});
