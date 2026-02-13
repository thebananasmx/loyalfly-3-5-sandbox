import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { PKPass } from "passkit-generator"; // Importación estándar v3
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

admin.initializeApp();
const db = admin.firestore();

const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

const ISSUER_ID = "3388000000023072020";

function processCertificate(raw, name) {
    if (!raw) throw new Error(`El secreto ${name} está vacío.`);
    const str = raw.toString().trim();
    let buffer;
    if (str.includes("-----BEGIN")) {
        buffer = Buffer.from(str, "utf-8");
    } else {
        const cleaned = str.replace(/^['"]|['"]$/g, '').replace(/\s/g, '');
        buffer = Buffer.from(cleaned, "base64");
    }
    return buffer;
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

/** APPLE PASS **/
export const generateapplepass = onRequest({
    region: "us-central1",
    memory: "512MiB",
    maxInstances: 10,
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64]
}, async (req, res) => {
    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros.");

    try {
        const wwdr = processCertificate(APPLE_WWDR_CERT_BASE64.value(), "WWDR");
        const signer = processCertificate(APPLE_PASS_CERT_BASE64.value(), "SIGNER");
        const rawPass = APPLE_PASS_PASSWORD.value()?.toString() || "";
        const password = rawPass.trim().replace(/^['"]|['"]$/g, '');

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
            logoText: bizName,
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

        const logoUrl = businessCardData.logoUrl || "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762622899/ico_loyalfly_xgfdv8.png";
        const logoBuffer = await fetchImageBuffer(logoUrl);
        const fallbackIcon = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        const finalIcon = logoBuffer || fallbackIcon;

        // ESTRATEGIA DEFINITIVA: Usar el Factory estático PKPass.from con Buffers
        // Esto evita errores de validación de rutas y asegura que el prototipo esté bien inyectado.
        const pass = await PKPass.from({
            modelBuffers: {
                "pass.json": Buffer.from(JSON.stringify(passJson)),
                "icon.png": finalIcon,
                "icon@2x.png": finalIcon,
                "logo.png": finalIcon,
                "logo@2x.png": finalIcon
            },
            certificates: {
                wwdr,
                signerCert: signer,
                signerKey: signer,
                signerKeyPassphrase: password
            }
        });

        // Verificación de seguridad antes de llamar al método
        if (typeof pass.asBuffer !== "function") {
            throw new Error("La instancia de PKPass no se creó correctamente (asBuffer missing).");
        }

        const buffer = pass.asBuffer();
        
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=pass_${cid}.pkpass`);
        return res.status(200).send(buffer);

    } catch (error) {
        console.error("APPLE PASS ERROR:", error);
        res.status(500).send(`Error de generación: ${error.message}`);
    }
});

// ... resto de las funciones de Google Wallet y Firestore (sin cambios)
async function loadServiceAccount() {
  const saPath = path.join(__dirname, "service-account-key.json");
  try {
    if (existsSync(saPath)) {
      return JSON.parse(readFileSync(saPath, "utf8"));
    }
  } catch (err) { console.error("SA Load Error:", err.message); }
  return null;
}

async function getGoogleAuthToken() {
  const sa = await loadServiceAccount();
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
  if (!bid || !cid) return res.status(400).send("Faltan parámetros.");
  try {
    const sa = await loadServiceAccount();
    if (!sa) throw new Error("SA Key missing");
    const [businessCardSnap, businessMainSnap, customerSnap] = await Promise.all([
        db.doc(`businesses/${bid}/config/card`).get(),
        db.doc(`businesses/${bid}`).get(),
        db.doc(`businesses/${bid}/customers/${cid}`).get()
    ]);
    if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado");
    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
    const customerData = customerSnap.data();
    const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
    const custName = (customerData.name || "Cliente").substring(0, 25);
    const stamps = customerData.stamps || 0;
    const rewards = customerData.rewardsRedeemed || 0;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const classId = `${ISSUER_ID}.V30_${safeBid}`;
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;
    let cardColor = businessCardData.color || "#5134f9";
    if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;
    let logoObj = undefined;
    const rawLogo = businessCardData.logoUrl || "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762622899/ico_loyalfly_xgfdv8.png";
    if (rawLogo.startsWith('http')) {
        let cleanLogo = rawLogo;
        if (cleanLogo.includes('cloudinary.com')) cleanLogo = cleanLogo.replace('.svg', '.png');
        logoObj = { sourceUri: { uri: cleanLogo }, contentDescription: { defaultValue: { language: "es-419", value: "Logo" } } };
    }
    const genericClass = { id: classId, issuerName: bizName };
    const genericObject = {
      id: objectId, classId: classId, hexBackgroundColor: cardColor, logo: logoObj,
      cardTitle: { defaultValue: { language: "es-419", value: bizName } },
      header: { defaultValue: { language: "es-419", value: custName } },
      subheader: { defaultValue: { language: "es-419", value: "Nombre" } },
      textModulesData: [
        { id: "sellos", header: "Sellos acumulados", body: String(stamps) },
        { id: "recompensas", header: "Recompensas", body: String(rewards) }
      ],
      barcode: { type: "QR_CODE", value: cid, alternateText: String(customerData.phone || cid.substring(0, 8)) }
    };
    const claims = { iss: sa.client_email, aud: "google", typ: "savetowallet", payload: { genericClasses: [genericClass], genericObjects: [genericObject] } };
    const token = jwt.sign(claims, sa.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);
  } catch (e) {
    console.error("GOOGLE WALLET ERROR:", e);
    res.status(500).send(`Error: ${e.message}`);
  }
});

export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    memory: "256MiB",
    retry: true
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps && newData.rewardsRedeemed === oldData.rewardsRedeemed && newData.name === oldData.name) return null;
    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;
    try {
      const token = await getGoogleAuthToken();
      const stamps = newData.stamps || 0;
      const rewards = newData.rewardsRedeemed || 0;
      const custName = (newData.name || "Cliente").substring(0, 25);
      await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            header: { defaultValue: { language: "es-419", value: custName } },
            textModulesData: [
                { id: "sellos", header: "Sellos acumulados", body: String(stamps) },
                { id: "recompensas", header: "Recompensas", body: String(rewards) }
            ]
          })
      });
    } catch (e) { console.error("PATCH Error:", e.message); }
    return null;
});