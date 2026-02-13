import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import * as PassKitLib from "passkit-generator"; // Importación total para mayor compatibilidad
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

// Manejo de interoperabilidad ESM: extraemos la clase PKPass de forma segura
const PKPass = PassKitLib.PKPass || (PassKitLib.default && PassKitLib.default.PKPass) || PassKitLib.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount = null;
const saPath = path.join(__dirname, "service-account-key.json");

function loadServiceAccount() {
  if (serviceAccount) return serviceAccount;
  try {
    if (existsSync(saPath)) {
      serviceAccount = JSON.parse(readFileSync(saPath, "utf8"));
      return serviceAccount;
    }
  } catch (err) {
    console.error("ERROR cargando service-account-key.json:", err.message);
  }
  return null;
}

admin.initializeApp();
const db = admin.firestore();

const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

const ISSUER_ID = "3388000000023072020";

function processCertificate(raw, name) {
    if (!raw) throw new Error(`El secreto ${name} está vacío.`);
    const str = raw.toString().trim();
    if (str.includes("-----BEGIN")) return Buffer.from(str, "utf-8");
    const cleaned = str.replace(/^['"]|['"]$/g, '').replace(/\s/g, '');
    try {
        return Buffer.from(cleaned, "base64");
    } catch (e) {
        throw new Error(`Error decodificando Base64 en ${name}: ${e.message}`);
    }
}

async function fetchImageBuffer(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error("Error descargando imagen:", url, e.message);
        return null;
    }
}

export const generateapplepass = onRequest({
    region: "us-central1",
    memory: "512MiB",
    maxInstances: 10,
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64]
}, async (req, res) => {
    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros.");

    try {
        // 1. Preparar Certificados
        const wwdr = processCertificate(APPLE_WWDR_CERT_BASE64.value(), "WWDR");
        const signer = processCertificate(APPLE_PASS_CERT_BASE64.value(), "SIGNER");
        const rawPass = APPLE_PASS_PASSWORD.value()?.toString() || "";
        const password = rawPass.trim().replace(/^['"]|['"]$/g, '');

        // 2. Obtener Datos
        const [businessCardSnap, businessMainSnap, customerSnap] = await Promise.all([
            db.doc(`businesses/${bid}/config/card`).get(),
            db.doc(`businesses/${bid}`).get(),
            db.doc(`businesses/${bid}/customers/${cid}`).get()
        ]);

        if (!customerSnap.exists) return res.status(404).send("Cliente no existe.");

        const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
        const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
        const customerData = customerSnap.data();

        const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
        const isLight = businessCardData.textColorScheme === 'light';
        const txtColor = isLight ? "rgb(255,255,255)" : "rgb(0,0,0)";

        // 3. Definir pass.json (Estructura pura)
        const passJson = {
            formatVersion: 1,
            passTypeIdentifier: "pass.com.loyalfly.card",
            teamIdentifier: "8W9R78X846",
            organizationName: bizName,
            description: `Tarjeta de Lealtad de ${bizName}`,
            serialNumber: cid,
            backgroundColor: businessCardData.color || "#5134f9",
            foregroundColor: txtColor,
            labelColor: txtColor,
            logoText: "Loyalfly",
            sharingProhibited: true,
            storeCard: {
                primaryFields: [{ key: "bizName", label: "NEGOCIO", value: bizName }],
                secondaryFields: [{ key: "customer", label: "CLIENTE", value: customerData.name || "Cliente" }],
                auxiliaryFields: [{ key: "stamps", label: "SELLOS", value: `${customerData.stamps || 0}` }],
                backFields: [{ key: "info", label: "Información", value: "Presenta este código en caja para acumular sellos." }]
            },
            barcodes: [{
                format: "PKBarcodeFormatQR",
                message: cid,
                messageEncoding: "iso-8859-1",
                altText: customerData.phone || cid.substring(0, 8)
            }]
        };

        // 4. Crear el Modelo en memoria con imágenes
        const logoUrl = businessCardData.logoUrl || "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762622899/ico_loyalfly_xgfdv8.png";
        const logoBuffer = await fetchImageBuffer(logoUrl);

        const modelFiles = {
            "pass.json": Buffer.from(JSON.stringify(passJson))
        };

        if (logoBuffer) {
            modelFiles["logo.png"] = logoBuffer;
            modelFiles["icon.png"] = logoBuffer;
            modelFiles["logo@2x.png"] = logoBuffer;
            modelFiles["icon@2x.png"] = logoBuffer;
        }

        // 5. Instanciar usando PKPass.from() (Forma más segura en v3)
        const pass = await PKPass.from({
            model: modelFiles,
            certificates: {
                wwdr: wwdr,
                signerCert: signer,
                signerKey: signer,
                signerKeyPassphrase: password
            }
        });

        // 6. Exportar
        const buffer = await pass.export();
        
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=pass_${cid}.pkpass`);
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("FATAL ERROR:", error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

/** GOOGLE WALLET **/
async function getGoogleAuthToken() {
  const sa = loadServiceAccount();
  if (!sa) throw new Error("SA missing");
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key.replace(/\\n/g, '\n'),
    },
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

export const generatewalletpass = onRequest({ 
    region: "us-central1", 
    memory: "256MiB"
}, async (req, res) => {
  const { bid, cid } = req.query;
  try {
    const sa = loadServiceAccount();
    const [customerSnap, bizSnap, bizCardSnap] = await Promise.all([
        db.doc(`businesses/${bid}/customers/${cid}`).get(),
        db.doc(`businesses/${bid}`).get(),
        db.doc(`businesses/${bid}/config/card`).get()
    ]);
    
    if (!customerSnap.exists) return res.status(404).send("No customer");
    
    const bizData = bizSnap.data();
    const cardData = bizCardSnap.data() || {};
    const customerData = customerSnap.data();

    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    const genericObject = {
      id: objectId,
      classId: `${ISSUER_ID}.V26_${safeBid}`,
      hexBackgroundColor: cardData.color || "#5134f9",
      cardTitle: { defaultValue: { language: "es-419", value: cardData.name || bizData.name } },
      header: { defaultValue: { language: "es-419", value: customerData.name } },
      textModulesData: [{ id: "sellos", header: "Sellos", body: `${customerData.stamps || 0}` }],
      barcode: { type: "QR_CODE", value: cid }
    };

    const claims = {
      iss: sa.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: { genericObjects: [genericObject] },
    };

    const token = jwt.sign(claims, sa.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    memory: "256MiB"
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps) return null;
    const { bid, cid } = event.params;
    try {
      const token = await getGoogleAuthToken();
      const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
      const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
      const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;
      await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            textModulesData: [{ id: "sellos", header: "Sellos", body: `${newData.stamps || 0}` }]
          })
      });
    } catch (e) { console.error(e); }
    return null;
});