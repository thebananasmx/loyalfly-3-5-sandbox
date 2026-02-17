import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { PKPass } from "passkit-generator";
import path from "path";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { readFileSync } from "fs";
import express from "express";
import cors from "cors";
import http2 from "http2";

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

/**
 * LÓGICA DE GENERACIÓN DE PASE APPLE
 */
async function createApplePassBuffer(bid, cid, secrets) {
    const [busSnap, cardSnap, custSnap] = await Promise.all([
        db.doc(`businesses/${bid}`).get(),
        db.doc(`businesses/${bid}/config/card`).get(),
        db.doc(`businesses/${bid}/customers/${cid}`).get()
    ]);

    if (!busSnap.exists || !custSnap.exists) throw new Error("Not Found");

    const business = busSnap.data();
    // CORRECCIÓN: .exists es una propiedad, no una función
    const cardSettings = cardSnap.exists ? cardSnap.data() : {};
    const customer = custSnap.data();

    let authToken = customer.appleAuthToken;
    if (!authToken) {
        authToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await db.doc(`businesses/${bid}/customers/${cid}`).update({ appleAuthToken: authToken });
    }

    const wwdrPem = getPemFromSecret(secrets.wwdr, "WWDR");
    const fullSignerPem = getPemFromSecret(secrets.signer, "SIGNER");
    const password = secrets.password || "";

    const certPart = extractPemBlock(fullSignerPem, "CERTIFICATE");
    const keyPart = extractPemBlock(fullSignerPem, "PRIVATE KEY") || extractPemBlock(fullSignerPem, "RSA PRIVATE KEY");

    const bgColor = cardSettings.color || "rgb(81, 52, 249)";
    const isLightScheme = cardSettings.textColorScheme === 'light';
    const fgColor = isLightScheme ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
    const labelColor = isLightScheme ? "rgb(255, 255, 255)" : "rgb(100, 100, 100)";

    const webServiceURL = `https://applepassapi-2idcsaj5va-uc.a.run.app/v1/api/${bid}`;

    const pass = await PKPass.from({
        model: path.resolve("model.pass"),
        certificates: { wwdr: wwdrPem, signerCert: certPart, signerKey: keyPart, signerKeyPassphrase: password }
    }, {
        serialNumber: cid,
        authenticationToken: authToken, 
        webServiceURL: webServiceURL,   
        organizationName: business.name || "Loyalfly",
        description: `Tarjeta de lealtad de ${business.name}`,
        backgroundColor: bgColor,
        foregroundColor: fgColor,
        labelColor: labelColor,
        logoText: (cardSettings.name || business.name || "Loyalfly").toUpperCase()
    });

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

    if (cardSettings.logoUrl) {
        try {
            const response = await fetch(cardSettings.logoUrl);
            if (response.ok) {
                const imageBuffer = Buffer.from(await response.arrayBuffer());
                ["logo.png", "logo@2x.png", "logo@3x.png", "icon.png", "icon@2x.png", "icon@3x.png", "strip.png", "strip@2x.png", "strip@3x.png"].forEach(f => pass.addBuffer(f, imageBuffer));
            }
        } catch (err) { console.warn("Error logo:", err.message); }
    }

    return await pass.getAsBuffer();
}

export const generateapplepass = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64],
    memory: "512MiB",
    invoker: "public"
}, async (req, res) => {
    try {
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan parámetros.");
        const buffer = await createApplePassBuffer(bid, cid, {
            wwdr: APPLE_WWDR_CERT_BASE64.value(),
            signer: APPLE_PASS_CERT_BASE64.value(),
            password: APPLE_PASS_PASSWORD.value()
        });
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=loyalfly-${cid}.pkpass`);
        return res.status(200).send(buffer);
    } catch (e) {
        return res.status(500).send(`Error: ${e.message}`);
    }
});

const appleApp = express();
appleApp.use(cors({ origin: true }));
appleApp.use(express.json());

appleApp.post("/v1/api/:bid/v1/devices/:devId/registrations/:passType/:serial", async (req, res) => {
    const { bid, devId, serial } = req.params;
    const { pushToken } = req.body;
    const authHeader = req.headers.authorization;
    console.log(`[APPLE_REG] Registro de dispositivo ${devId} para cliente ${serial}`);
    try {
        const custRef = db.doc(`businesses/${bid}/customers/${serial}`);
        const custSnap = await custRef.get();
        if (!custSnap.exists || `ApplePass ${custSnap.data().appleAuthToken}` !== authHeader) {
             console.warn(`[APPLE_REG] No autorizado o cliente inexistente: ${serial}`);
             return res.status(401).send();
        }
        await custRef.collection("appleDevices").doc(devId).set({ 
            pushToken, 
            registeredAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        console.log(`[APPLE_REG] Token guardado para ${serial}`);
        return res.status(201).send();
    } catch (e) { 
        console.error(`[APPLE_REG] Error: ${e.message}`);
        return res.status(500).send(); 
    }
});

appleApp.get("/v1/api/:bid/v1/passes/:passType/:serial", async (req, res) => {
    const { bid, serial } = req.params;
    const authHeader = req.headers.authorization;
    console.log(`[APPLE_UPDATE] El dispositivo pide el pase actualizado para ${serial}`);
    try {
        const custSnap = await db.doc(`businesses/${bid}/customers/${serial}`).get();
        if (!custSnap.exists || `ApplePass ${custSnap.data().appleAuthToken}` !== authHeader) return res.status(401).send();
        const buffer = await createApplePassBuffer(bid, serial, {
            wwdr: APPLE_WWDR_CERT_BASE64.value(),
            signer: APPLE_PASS_CERT_BASE64.value(),
            password: APPLE_PASS_PASSWORD.value()
        });
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Last-Modified", new Date().toUTCString());
        return res.status(200).send(buffer);
    } catch (e) { return res.status(500).send(); }
});

appleApp.get("/v1/api/:bid/v1/devices/:devId/registrations/:passType", (req, res) => res.status(204).send());
appleApp.delete("/v1/api/:bid/v1/devices/:devId/registrations/:passType/:serial", async (req, res) => {
    const { bid, devId, serial } = req.params;
    await db.doc(`businesses/${bid}/customers/${serial}/appleDevices/${devId}`).delete();
    return res.status(200).send();
});

export const applepassapi = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64],
    memory: "512MiB",
    invoker: "public"
}, appleApp);

export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD],
    retry: true,
    memory: "512MiB"
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps && newData.rewardsRedeemed === oldData.rewardsRedeemed && newData.name === oldData.name) return null;

    const { bid, cid } = event.params;

    // --- GOOGLE WALLET UPDATE ---
    try {
        const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
        const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
        const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;
        const auth = new GoogleAuth({
            credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key.replace(/\\n/g, '\n') },
            scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
        });
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${tokenResponse.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                header: { defaultValue: { language: "es-419", value: (newData.name || "Cliente").substring(0, 25) } },
                textModulesData: [
                    { id: "sellos", header: "Sellos acumulados", body: `${newData.stamps || 0}` },
                    { id: "recompensas", header: "Recompensas", body: `${newData.rewardsRedeemed || 0}` }
                ]
            })
        });
    } catch (e) { console.error("Error Google Update:", e.message); }

    // --- APPLE WALLET PUSH ---
    try {
        const devicesSnap = await db.collection(`businesses/${bid}/customers/${cid}/appleDevices`).get();
        if (devicesSnap.empty) return null;
        
        console.log(`[APPLE_PUSH] Enviando notificación a ${devicesSnap.size} dispositivos para el cliente ${cid}`);
        
        const fullSignerPem = getPemFromSecret(APPLE_PASS_CERT_BASE64.value(), "SIGNER");
        const cert = extractPemBlock(fullSignerPem, "CERTIFICATE");
        const key = extractPemBlock(fullSignerPem, "PRIVATE KEY") || extractPemBlock(fullSignerPem, "RSA PRIVATE KEY");
        
        for (const doc of devicesSnap.docs) {
            const { pushToken } = doc.data();
            const client = http2.connect('https://api.push.apple.com:443');
            const pushReq = client.request({
                ':method': 'POST',
                ':path': `/3/device/${pushToken}`,
                'apns-topic': 'pass.com.loyalfly.v2',
                'apns-push-type': 'background',
                'apns-priority': '5'
            }, { cert, key, passphrase: APPLE_PASS_PASSWORD.value() });
            
            pushReq.on('response', (h) => { 
                if (h[':status'] === 200) {
                    console.log(`[APPLE_PUSH] Éxito APNs para dispositivo en cliente ${cid}`);
                } else {
                    console.warn(`[APPLE_PUSH] Fallo APNs (${h[':status']}) para cliente ${cid}`);
                }
            });
            pushReq.end(JSON.stringify({}));
            setTimeout(() => client.close(), 2500);
        }
    } catch (e) { console.error("Error Apple Push:", e.message); }
    return null;
});

// ==========================================
// 4. GOOGLE WALLET GENERATOR (RESTAURADO 100% Y CORREGIDO .exists)
// ==========================================
export const generatewalletpass = onRequest({
    region: "us-central1",
    invoker: "public"
}, async (req, res) => {
    try {
        if (!serviceAccount) return res.status(500).send("Credentials missing.");
        const { bid, cid } = req.query;
        if (!bid || !cid) return res.status(400).send("Faltan bid o cid.");
        
        const [busSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);
        if (!custSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const business = busSnap.data();
        // CORRECCIÓN: .exists es propiedad
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

        let logoObj = null;
        if (cardSettings.logoUrl) {
            logoObj = {
                sourceUri: { uri: cardSettings.logoUrl },
                contentDescription: { defaultValue: { language: "es-419", value: "LOGO" } }
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
        return res.status(500).send("Error: " + error.message);
    }
});
