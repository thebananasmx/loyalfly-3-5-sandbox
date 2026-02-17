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

        // Apple Wallet requiere HTTPS y la versión v1 en la URL
        pass.webServiceURL = "https://applewalletweb-2idcsaj5va-uc.a.run.app/v1";
        pass.authenticationToken = cid;

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
                    console.warn(`Error cargando imagen:`, err.message);
                }
            }
        }

        const buffer = await pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Last-Modified", new Date().toUTCString());
        return res.status(200).send(buffer);
    } catch (e) {
        console.error("Error Apple Pass:", e);
        return res.status(500).send(`Error: ${e.message}`);
    }
});

// ==========================================
// 2. APPLE WALLET WEB SERVICE (Endpoints de Apple)
// ==========================================
export const applewalletweb = onRequest({
    region: "us-central1",
    memory: "256MiB",
    invoker: "public"
}, async (req, res) => {
    try {
        const { method, path: rawPath, headers, body } = req;
        // Normalizamos la ruta para manejar prefijos de función o dominios directos
        const fullPath = rawPath.startsWith("/applewalletweb") ? rawPath.replace("/applewalletweb", "") : rawPath;
        const parts = fullPath.split("/").filter(p => p !== ""); 
        const authToken = (headers.authorization || "").replace("ApplePass ", "");

        console.log(`[PASS_LOG] Request: ${method} ${fullPath}`);

        // 2.1 REGISTRO: POST v1/devices/{deviceId}/registrations/{passType}/{serial}
        if (method === "POST" && fullPath.includes("/registrations/")) {
            const deviceId = parts[2];     
            const serialNumber = parts[5]; 
            const pushToken = body.pushToken;

            if (!authToken || authToken !== serialNumber) return res.status(401).send();

            // Buscamos al cliente por el campo 'cid' que aseguraremos que exista
            const customersSnap = await db.collectionGroup("customers").where("cid", "==", serialNumber).get();
            if (!customersSnap.empty) {
                await customersSnap.docs[0].ref.collection("registrations").doc(deviceId).set({
                    pushToken,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[PASS] Registrado dispositivo ${deviceId} para cliente ${serialNumber}`);
                return res.status(200).send();
            }
            return res.status(404).send();
        }

        // 2.2 LISTA DE CAMBIOS: GET v1/devices/{deviceId}/registrations/{passType}
        if (method === "GET" && parts.includes("devices") && parts.includes("registrations")) {
            const deviceId = parts[2];
            // Apple pregunta qué tarjetas han cambiado para este dispositivo.
            const regsSnap = await db.collectionGroup("registrations").where(admin.firestore.FieldPath.documentId(), "==", deviceId).get();
            
            if (regsSnap.empty) return res.status(204).send();

            const serialNumbers = regsSnap.docs.map(doc => doc.ref.parent.parent.id);
            return res.status(200).json({
                lastUpdated: new Date().toISOString(),
                serialNumbers: serialNumbers
            });
        }

        // 2.3 ENTREGA DE PASE: GET v1/passes/{passTypeIdentifier}/{serialNumber}
        if (method === "GET" && parts.includes("passes")) {
            const serialNumber = parts[parts.length - 1]; // El último segmento es el serial (CID)
            if (!authToken || authToken !== serialNumber) return res.status(401).send();

            const customersSnap = await db.collectionGroup("customers").where("cid", "==", serialNumber).get();
            if (customersSnap.empty) return res.status(404).send();
            
            const customerDoc = customersSnap.docs[0];
            const bid = customerDoc.ref.parent.parent.id;
            
            // Redirigimos a la generación del pase dinámico
            return res.redirect(`https://generateapplepass-2idcsaj5va-uc.a.run.app?bid=${bid}&cid=${serialNumber}`);
        }

        // 2.4 ELIMINACIÓN: DELETE v1/devices/{deviceId}/registrations/{passType}/{serial}
        if (method === "DELETE" && fullPath.includes("/registrations/")) {
            const deviceId = parts[2];
            const serialNumber = parts[5];
            const customersSnap = await db.collectionGroup("customers").where("cid", "==", serialNumber).get();
            if (!customersSnap.empty) {
                await customersSnap.docs[0].ref.collection("registrations").doc(deviceId).delete();
            }
            return res.status(200).send();
        }

        res.status(404).send();
    } catch (err) {
        console.error("Web Service Error:", err);
        res.status(500).send();
    }
});

// ==========================================
// 3. GOOGLE WALLET GENERATOR
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

        const [busSnap, cardSnap, custSnap] = await Promise.all([
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!custSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const business = busSnap.data();
        const cardSettings = cardSnap.exists ? cardSnap.data() : {};
        const customer = custSnap.data();

        const bizName = (cardSettings.name || business.name || "Loyalfly").substring(0, 20);
        const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
        const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
        const classId = `${ISSUER_ID}.V31_${safeBid}`;
        const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

        let cardColor = cardSettings.color || "#5134f9";
        if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

        const genericObject = {
            id: objectId,
            classId: classId,
            hexBackgroundColor: cardColor,
            logo: cardSettings.logoUrl ? { sourceUri: { uri: cardSettings.logoUrl.replace('.svg', '.png') } } : undefined,
            cardTitle: { defaultValue: { language: "es-419", value: bizName } },
            header: { defaultValue: { language: "es-419", value: (customer.name || "Cliente").substring(0, 25) } },
            subheader: { defaultValue: { language: "es-419", value: "Nombre" } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: `${customer.stamps || 0}` },
                { id: "recompensas", header: "Recompensas", body: `${customer.rewardsRedeemed || 0}` }
            ],
            barcode: { type: "QR_CODE", value: cid, alternateText: cid.substring(0, 8) }
        };

        const claims = {
            iss: serviceAccount.client_email,
            aud: "google",
            typ: "savetowallet",
            payload: { 
                genericClasses: [{ id: classId, issuerName: bizName }], 
                genericObjects: [genericObject] 
            },
        };

        const token = jwt.sign(claims, serviceAccount.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
        return res.redirect(`https://pay.google.com/gp/v/save/${token}`);
    } catch (error) {
        console.error("ERROR GOOGLE WALLET:", error);
        return res.status(500).send("Error: " + error.message);
    }
});

// ==========================================
// 4. REAL-TIME UPDATE TRIGGER (Google & Apple)
// ==========================================
export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "512MiB",
    secrets: [APPLE_PASS_CERT_BASE64],
    maxInstances: 5
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    
    // Aseguramos que el campo 'cid' exista para búsquedas en applewalletweb
    if (!newData.cid) {
        await event.data.after.ref.update({ cid: event.params.cid });
    }

    if (newData.stamps === oldData.stamps && newData.name === oldData.name && newData.rewardsRedeemed === oldData.rewardsRedeemed) return null;

    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    // --- 1. ACTUALIZAR GOOGLE WALLET ---
    try {
        const auth = new GoogleAuth({
            credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key.replace(/\\n/g, '\n') },
            scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
        });
        const client = await auth.getClient();
        const gToken = (await client.getAccessToken()).token;

        const patchData = {
            header: { defaultValue: { language: "es-419", value: (newData.name || "Cliente").substring(0, 25) } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: `${newData.stamps || 0}` },
                { id: "recompensas", header: "Recompensas", body: `${newData.rewardsRedeemed || 0}` }
            ]
        };

        await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${gToken}`, "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        });
    } catch (error) {
        console.error("Error Google Wallet:", error.message);
    }

    // --- 2. NOTIFICAR APPLE WALLET (PUSH) ---
    try {
        const regsSnap = await event.data.after.ref.collection("registrations").get();
        if (!regsSnap.empty) {
            for (const doc of regsSnap.docs) {
                const { pushToken } = doc.data();
                console.log(`[PUSH] Enviando notificación a Apple: ${pushToken}`);
                // Aquí iría el envío físico del push vía HTTP/2
            }
        }
    } catch (error) {
        console.error("Error Apple Push:", error.message);
    }
    
    return null;
});