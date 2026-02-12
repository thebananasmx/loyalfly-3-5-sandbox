import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { GoogleAuth } from "google-auth-library";
import { PKPass } from "passkit-generator";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import fetch from "node-fetch";

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

// Definición de secretos
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

const ISSUER_ID = "3388000000023072020";

/**
 * Procesa el input de Secret Manager.
 * Detecta si es PEM (String) o Binario (Buffer).
 */
function processCertificate(raw, name) {
    if (!raw) {
        console.error(`DIAGNÓSTICO: El secreto ${name} está VACÍO.`);
        return null;
    }
    
    // 1. Limpieza de caracteres de control y comillas
    let cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
    cleaned = cleaned.replace(/\\n/g, '\n');

    // 2. Log de seguridad (inicio y fin) para detectar truncado
    console.log(`DIAGNÓSTICO ${name}: [${cleaned.substring(0, 20)}...${cleaned.substring(cleaned.length - 20)}] Longitud: ${cleaned.length}`);

    // 3. Si es PEM, la librería espera el STRING, no un Buffer.
    if (cleaned.includes("-----BEGIN")) {
        return cleaned; 
    }
    
    // 4. Si no es PEM, es Base64 binario (.p12 o .cer). Devolvemos Buffer.
    try {
        return Buffer.from(cleaned, "base64");
    } catch (e) {
        console.error(`Error procesando binario en ${name}:`, e.message);
        return null;
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
    if (!bid || !cid) return res.status(400).send("Faltan parámetros bid o cid.");

    try {
        // 1. Extraer y procesar (Devuelve String para PEM, Buffer para binario)
        const wwdr = processCertificate(APPLE_WWDR_CERT_BASE64.value(), "WWDR");
        const signer = processCertificate(APPLE_PASS_CERT_BASE64.value(), "SIGNER");
        const password = APPLE_PASS_PASSWORD.value()?.trim().replace(/^['"]|['"]$/g, '');

        if (!wwdr) throw new Error("Certificado WWDR no encontrado o inválido.");
        if (!signer) throw new Error("Certificado SIGNER no encontrado o inválido.");

        // 2. Obtener datos de Firestore
        const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
        const businessMainSnap = await db.doc(`businesses/${bid}`).get();
        const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();

        if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
        const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
        const customerData = customerSnap.data();

        const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
        const stamps = customerData.stamps || 0;
        const rewards = Math.floor(stamps / 10);
        
        let cardColor = businessCardData.color || "#5134f9";
        if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

        // 3. Crear el pase
        // Importante: Si el signer es PEM y contiene cert + key, se puede pasar igual a ambos campos.
        const certificates = {
            wwdr: wwdr,
            signerCert: signer,
            signerKey: signer, 
            signerKeyPassphrase: (password && password !== "." && password !== "") ? password : undefined
        };

        const pass = new PKPass(certificates, {
            passTypeIdentifier: "pass.com.loyalfly.card",
            teamIdentifier: "8W9R78X846",
            organizationName: bizName,
            serialNumber: cid,
            sharingProhibited: true
        });

        pass.type = "storeCard";
        pass.headerFields.push({ key: "logoText", value: "Loyalfly" });
        pass.primaryFields.push({ key: "bizName", label: "NEGOCIO", value: bizName });
        pass.secondaryFields.push({ key: "customerName", label: "CLIENTE", value: customerData.name || "Invitado" });
        pass.auxiliaryFields.push({ key: "stamps", label: "SELLOS", value: `${stamps}` });
        pass.auxiliaryFields.push({ key: "rewards", label: "PREMIOS", value: `${rewards}` });

        pass.barcodes = [{
            format: "PKBarcodeFormatQR",
            message: cid,
            messageEncoding: "iso-8859-1",
            altText: customerData.phone || cid.substring(0, 8)
        }];

        pass.backgroundColor = cardColor;
        const isDark = businessCardData.textColorScheme !== 'light';
        const textColor = isDark ? "rgb(0,0,0)" : "rgb(255,255,255)";
        pass.labelColor = textColor;
        pass.foregroundColor = textColor;

        // 4. Imágenes
        let imageAdded = false;
        if (businessCardData.logoUrl) {
            const logoBuffer = await fetchImageBuffer(businessCardData.logoUrl);
            if (logoBuffer) {
                pass.addBuffer("logo.png", logoBuffer);
                pass.addBuffer("icon.png", logoBuffer);
                imageAdded = true;
            }
        }

        if (!imageAdded) {
            const defaultIcon = await fetchImageBuffer("https://res.cloudinary.com/dg4wbuppq/image/upload/v1762622899/ico_loyalfly_xgfdv8.png");
            if (defaultIcon) {
                pass.addBuffer("icon.png", defaultIcon);
                pass.addBuffer("logo.png", defaultIcon);
            }
        }

        const buffer = await pass.asBuffer();
        
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=pass.pkpass`);
        res.status(200).send(buffer);

    } catch (error) {
        console.error("ERROR CRÍTICO GENERANDO APPLE PASS:", {
            message: error.message,
            stack: error.stack
        });
        res.status(500).send(`Error: ${error.message}`);
    }
});

/**
 * GOOGLE WALLET Y OTROS
 */
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
    memory: "256MiB",
    maxInstances: 10 
}, async (req, res) => {
  const { bid, cid } = req.query;
  if (!bid || !cid) return res.status(400).send("Faltan bid o cid");

  try {
    const sa = loadServiceAccount();
    if (!sa) throw new Error("SA missing");
    
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();

    if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado");

    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
    const customerData = customerSnap.data();

    const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
    const stamps = customerData.stamps || 0;
    
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const classId = `${ISSUER_ID}.V26_${safeBid}`; 
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    let cardColor = businessCardData.color || "#5134f9";
    if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

    const genericObject = {
      id: objectId,
      classId: classId,
      hexBackgroundColor: cardColor,
      cardTitle: { defaultValue: { language: "es-419", value: bizName } },
      header: { defaultValue: { language: "es-419", value: `${customerData.name || 'Cliente'}` } },
      textModulesData: [
        { id: "sellos", header: "Sellos acumulados", body: `${stamps}` }
      ],
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

  } catch (error) {
    console.error("GOOGLE WALLET ERROR:", error);
    res.status(500).send(error.message);
  }
});

export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "256MiB"
}, async (event) => {
    if (!loadServiceAccount()) return null;
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps) return null;

    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    try {
      const token = await getGoogleAuthToken();
      const patchData = {
        textModulesData: [{ id: "sellos", header: "Sellos acumulados", body: `${newData.stamps || 0}` }]
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