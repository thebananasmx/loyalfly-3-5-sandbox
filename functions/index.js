import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { PKPass } from "passkit-generator";
import path from "path";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { readFileSync } from "fs";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// Secretos Apple
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

// Config Google
const ISSUER_ID = "3388000000023072020";
const serviceAccount = JSON.parse(readFileSync("./service-account-key.json", "utf-8"));
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

// --- Helpers ---
const extractPem = (pem, block) => {
    if (!pem) return null;
    const reg = new RegExp(`-----BEGIN ${block}-----([\\s\\S]*?)-----END ${block}-----`, 'i');
    const match = pem.match(reg);
    return match ? match[0] : null;
};

const decodeSecret = (s) => s ? Buffer.from(s.trim(), "base64").toString("utf-8") : null;

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
// 1. APPLE WALLET GENERATOR (MINIMALISTA)
// ==========================================
export const generateapplepass = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64],
    memory: "512MiB",
    invoker: "public"
}, async (req, res) => {
    try {
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan parámetros.");

        const [busSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!custSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const business = busSnap.data();
        const cardCfg = cardSnap.exists ? cardSnap.data() : {};
        const customer = custSnap.data();

        // Preparar Certificados
        const wwdr = decodeSecret(APPLE_WWDR_CERT_BASE64.value());
        const signerPem = decodeSecret(APPLE_PASS_CERT_BASE64.value());
        const passAuth = APPLE_PASS_PASSWORD.value() || "";

        const cert = extractPem(signerPem, "CERTIFICATE");
        const key = extractPem(signerPem, "PRIVATE KEY") || extractPem(signerPem, "RSA PRIVATE KEY");

        // Definir Colores (Usando HEX para máxima compatibilidad y sin canal alpha)
        const backgroundColor = cardCfg.color || "#5134F9";
        const isLight = cardCfg.textColorScheme === 'light';
        const foregroundColor = isLight ? "#FFFFFF" : "#000000";
        const labelColor = isLight ? "#FFFFFF" : "#000000";

        // Construir el pase con solo 2 campos clave para máxima visibilidad
        const pass = await PKPass.from({
            model: path.resolve("model.pass"),
            certificates: { wwdr, signerCert: cert, signerKey: key, signerKeyPassphrase: passAuth }
        }, {
            serialNumber: cid,
            organizationName: business.name || "Loyalfly",
            description: `Tarjeta de ${business.name}`,
            logoText: (cardCfg.name || business.name || "Loyalfly").toUpperCase(),
            backgroundColor,
            foregroundColor,
            labelColor,
            storeCard: {
                headerFields: [
                    { 
                        key: "stamps", 
                        label: "SELLOS", 
                        value: String(customer.stamps || 0) 
                    }
                ],
                primaryFields: [
                    { 
                        key: "name", 
                        label: "CLIENTE", 
                        value: (customer.name || "Miembro").toUpperCase() 
                    }
                ]
            }
        });

        // Configurar QR Code
        pass.setBarcodes({ 
            format: "PKBarcodeFormatQR", 
            message: cid, 
            messageEncoding: "iso-8859-1" 
        });

        // Manejo de Logos
        const imgList = ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"];
        if (cardCfg.logoUrl) {
            try {
                const imgRes = await fetch(cardCfg.logoUrl);
                if (imgRes.ok) {
                    const buf = Buffer.from(await imgRes.arrayBuffer());
                    imgList.forEach(n => pass.addBuffer(n, buf));
                } else {
                    imgList.forEach(n => pass.addBuffer(n, PIXEL));
                }
            } catch { 
                imgList.forEach(n => pass.addBuffer(n, PIXEL)); 
            }
        } else {
            imgList.forEach(n => pass.addBuffer(n, PIXEL));
        }

        const buffer = await pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        // CORRECCIÓN: Uso de backticks para incluir el cid en el nombre del archivo
        res.setHeader("Content-Disposition", `attachment; filename="loyalfly-${cid}.pkpass"`);
        return res.status(200).send(buffer);

    } catch (e) {
        console.error("APPLE_WALLET_ERROR:", e);
        return res.status(500).send(e.message);
    }
});

// ==========================================
// 2. GOOGLE WALLET GENERATOR
// ==========================================
export const generatewalletpass = onRequest({
    region: "us-central1",
    invoker: "public"
}, async (req, res) => {
    try {
        const { bid, cid } = req.query;
        const [busSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!custSnap.exists) return res.status(404).send("Not found");

        const cardCfg = cardSnap.exists ? cardSnap.data() : {};
        const customer = custSnap.data();
        
        const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
        const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
        const classId = `${ISSUER_ID}.V31_${safeBid}`;
        const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

        const genericObject = {
            id: objectId,
            classId: classId,
            hexBackgroundColor: cardCfg.color || "#5134F9",
            cardTitle: { defaultValue: { language: "es-419", value: (cardCfg.name || busSnap.data().name).substring(0, 20) } },
            header: { defaultValue: { language: "es-419", value: customer.name || "Cliente" } },
            textModulesData: [
                { id: "sellos", header: "Sellos", body: String(customer.stamps || 0) }
            ],
            barcode: { type: "QR_CODE", value: cid }
        };

        const claims = {
            iss: serviceAccount.client_email,
            aud: "google",
            typ: "savetowallet",
            payload: { genericObjects: [genericObject] },
        };

        const token = jwt.sign(claims, serviceAccount.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
        return res.redirect(`https://pay.google.com/gp/v/save/${token}`);
    } catch (e) {
        return res.status(500).send(e.message);
    }
});

// ==========================================
// 3. TRIGGER UPDATE
// ==========================================
export const updatewalletonstampchange = onDocumentUpdated("businesses/{bid}/customers/{cid}", async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps) return null;

    const { bid, cid } = event.params;
    const objectId = `${ISSUER_ID}.OBJ_${bid.replace(/[^a-zA-Z0-9]/g, '')}_${cid.replace(/[^a-zA-Z0-9]/g, '')}`;

    try {
        const token = await getGoogleAuthToken();
        const patchData = {
            textModulesData: [{ id: "sellos", header: "Sellos", body: String(newData.stamps || 0) }]
        };
        await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        });
    } catch (e) { console.error("Update fail:", e.message); }
    return null;
});