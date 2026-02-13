import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import { PKPass } from "passkit-generator"; 

admin.initializeApp();
const db = admin.firestore();

// Secretos
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

/**
 * Procesa el secreto y audita su contenido
 */
function processSecret(name, value) {
    let str = value?.toString().trim() || "";
    if (!str) {
        console.error(`[Audit] ${name} está TOTALMENTE VACÍO.`);
        return null;
    }
    
    let buffer;
    if (str.includes("-----BEGIN")) {
        buffer = Buffer.from(str, "utf-8");
    } else {
        const cleanStr = str.replace(/[^A-Za-z0-9+/=]/g, "");
        buffer = Buffer.from(cleanStr, "base64");
    }

    const decodedText = buffer.toString("utf-8");
    const hasCert = decodedText.includes("BEGIN CERTIFICATE");
    const hasKey = decodedText.includes("BEGIN PRIVATE KEY") || decodedText.includes("BEGIN RSA PRIVATE KEY");
    
    console.log(`[Audit] ${name} -> Cert: ${hasCert ? "SI" : "NO"}, Llave: ${hasKey ? "SI" : "NO"}`);
    
    return buffer;
}

export const generateapplepass = onRequest({
    region: "us-central1",
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64]
}, async (req, res) => {
    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros bid/cid.");

    try {
        console.log(`[ApplePass] Generando para Cliente: ${cid}`);

        const [customerSnap, businessSnap] = await Promise.all([
            db.doc(`businesses/${bid}/customers/${cid}`).get(),
            db.doc(`businesses/${bid}`).get()
        ]);

        if (!customerSnap.exists) return res.status(404).send("Cliente no existe.");
        
        const bizData = businessSnap.data();
        const custData = customerSnap.data();

        // 1. Validar Certificados
        const wwdr = processSecret("WWDR_CERT", APPLE_WWDR_CERT_BASE64.value());
        const signer = processSecret("SIGNER_CERT", APPLE_PASS_CERT_BASE64.value());
        const password = APPLE_PASS_PASSWORD.value()?.toString().trim();

        if (!wwdr || !signer) {
            throw new Error("Certificados no cargados correctamente.");
        }

        // 2. Preparar JSON y Assets
        const dot = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        
        const passJson = {
            formatVersion: 1,
            passTypeIdentifier: "pass.com.loyalfly.card",
            teamIdentifier: "8W9R78X846",
            organizationName: bizData?.name || "Loyalfly",
            description: `Tarjeta de lealtad de ${bizData?.name}`,
            logoText: bizData?.name || "Loyalfly",
            foregroundColor: "rgb(0,0,0)",
            backgroundColor: "rgb(255,255,255)",
            serialNumber: cid,
            storeCard: {
                primaryFields: [{ key: "stamps", label: "SELLOS", value: String(custData?.stamps || 0) }],
                secondaryFields: [{ key: "customer", label: "CLIENTE", value: custData?.name || "Cliente" }]
            },
            barcodes: [{
                format: "PKBarcodeFormatQR",
                message: cid,
                messageEncoding: "iso-8859-1"
            }]
        };

        // 3. Instanciar PKPass y configurar manualmente
        // En v3, crear la instancia vacía y llenar con setters es lo más seguro
        const pass = new PKPass();

        // Configurar Certificados
        pass.setCertificates({
            wwdr: wwdr,
            signerCert: signer,
            signerKey: signer,
            signerKeyPassphrase: password
        });

        // Añadir archivos al buffer del pase
        pass.addBuffer("pass.json", Buffer.from(JSON.stringify(passJson)));
        pass.addBuffer("icon.png", dot);
        pass.addBuffer("icon@2x.png", dot);
        pass.addBuffer("logo.png", dot);

        // 4. Generar Buffer final
        // export() devuelve una Promise<Buffer> en v3.x
        const buffer = await pass.export(); 

        console.log("[ApplePass] ¡Pase generado correctamente!");
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=pass.pkpass`);
        return res.status(200).send(buffer);

    } catch (e) {
        console.error("[ApplePass] ERROR:", e.message);
        return res.status(500).send(`Error: ${e.message}`);
    }
});