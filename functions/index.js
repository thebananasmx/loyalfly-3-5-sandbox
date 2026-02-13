import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import { PKPass } from "passkit-generator"; // Importación corregida para Node 20 ESM

admin.initializeApp();
const db = admin.firestore();

// Definición de Secretos
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

/**
 * Función de auditoría para verificar la integridad de los secretos
 */
function auditSecret(name, value) {
    const str = value?.toString().trim() || "";
    if (!str) return null;
    
    let buffer;
    if (str.includes("-----BEGIN")) {
        buffer = Buffer.from(str, "utf-8");
    } else {
        buffer = Buffer.from(str.replace(/[^A-Za-z0-9+/=]/g, ""), "base64");
    }
    
    const content = buffer.toString("utf-8");
    console.log(`[Audit] ${name}: Cert=${content.includes("BEGIN CERTIFICATE")}, Key=${content.includes("PRIVATE KEY")}`);
    return buffer;
}

export const generateapplepass = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64]
}, async (req, res) => {
    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros bid/cid.");

    try {
        // 1. Obtener datos de Firestore
        const [custSnap, bizSnap] = await Promise.all([
            db.doc(`businesses/${bid}/customers/${cid}`).get(),
            db.doc(`businesses/${bid}`).get()
        ]);

        if (!custSnap.exists) return res.status(404).send("Cliente no existe.");
        const biz = bizSnap.data();
        const cust = custSnap.data();

        // 2. Procesar Certificados (Auditoría incluida)
        const wwdr = auditSecret("WWDR", APPLE_WWDR_CERT_BASE64.value());
        const signer = auditSecret("SIGNER", APPLE_PASS_CERT_BASE64.value());
        const pass = APPLE_PASS_PASSWORD.value()?.toString().trim();

        if (!wwdr || !signer) throw new Error("Certificados faltantes o inválidos.");

        // 3. Crear el JSON del pase
        const passJson = {
            formatVersion: 1,
            passTypeIdentifier: "pass.com.loyalfly.card",
            teamIdentifier: "8W9R78X846",
            organizationName: biz?.name || "Loyalfly",
            description: "Tarjeta de Lealtad",
            serialNumber: cid,
            backgroundColor: "rgb(255,255,255)",
            foregroundColor: "rgb(0,0,0)",
            storeCard: {
                primaryFields: [{ key: "stamps", label: "SELLOS", value: String(cust?.stamps || 0) }],
                secondaryFields: [{ key: "name", label: "CLIENTE", value: cust?.name || "Cliente" }]
            },
            barcodes: [{ format: "PKBarcodeFormatQR", message: cid, messageEncoding: "iso-8859-1" }]
        };

        // 4. Generar el archivo .pkpass
        // Nota: passkit-generator v3 requiere los buffers de imagen obligatorios
        const dot = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        
        const instance = new PKPass({
            "pass.json": Buffer.from(JSON.stringify(passJson)),
            "icon.png": dot,
            "icon@2x.png": dot,
            "logo.png": dot
        }, {
            wwdr,
            signerCert: signer,
            signerKey: signer,
            signerKeyPassphrase: pass
        });

        const output = await instance.asBuffer();

        console.log(`[Success] Pase generado para ${cust.name}`);
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", "attachment; filename=card.pkpass");
        return res.status(200).send(output);

    } catch (e) {
        console.error("[Error Crítico]", e.message);
        return res.status(500).send(`Error: ${e.message}`);
    }
});