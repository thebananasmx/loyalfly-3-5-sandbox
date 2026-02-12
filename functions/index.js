
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

// Configuración de rutas para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carga segura de Service Account
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

// Definición de Secretos
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

const ISSUER_ID = "3388000000023072020";

async function getGoogleAuthToken() {
  const sa = loadServiceAccount();
  if (!sa) throw new Error("Service Account no configurada.");
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

/**
 * FUNCIÓN: Generación de Pase para Apple Wallet (.pkpass)
 */
export const generateapplepass = onRequest({
    region: "us-central1",
    memory: "512MiB",
    maxInstances: 10,
    secrets: [APPLE_PASS_CERT_BASE64, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT_BASE64]
}, async (req, res) => {
    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros bid o cid.");

    try {
        const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
        const businessMainSnap = await db.doc(`businesses/${bid}`).get();
        const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();

        if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
        const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
        const customerData = customerSnap.data();

        const bizName = businessCardData.name || businessMainData.name || "Loyalfly";
        const stamps = customerData.stamps || 0;
        const rewards = Math.floor(stamps / 10);
        
        let cardColor = businessCardData.color || "#5134f9";
        if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

        // LIMPIEZA Y FORMATEO PEM
        const cleanStr = (val) => (val || "").replace(/[\s\n\r\t]/g, '').trim();
        
        const wwdrBase64 = cleanStr(APPLE_WWDR_CERT_BASE64.value());
        const signerBase64 = cleanStr(APPLE_PASS_CERT_BASE64.value());
        const password = cleanStr(APPLE_PASS_PASSWORD.value());

        if (!wwdrBase64 || !signerBase64) {
            throw new Error("Certificados no encontrados en Secret Manager.");
        }

        // Convertir WWDR a PEM (Muchas librerías lo prefieren así sobre el binario puro)
        const wwdrPEM = `-----BEGIN CERTIFICATE-----\n${wwdrBase64}\n-----END CERTIFICATE-----`;
        
        // El Signer puede ser un .p12 (binario) o un PEM. 
        // Si el usuario subió un .p12, no debemos envolverlo en PEM.
        // Lo trataremos como Buffer.
        const signerBuffer = Buffer.from(signerBase64, "base64");

        // Construcción explícita del objeto de certificados
        const certificates = {
            wwdr: wwdrPEM,
            signerCert: signerBuffer,
            signerKey: signerBuffer
        };

        if (password) {
            certificates.signerKeyPassphrase = password;
        }

        console.log(`Intentando crear PKPass con WWDR PEM (L:${wwdrPEM.length}) y Signer Buffer (L:${signerBuffer.length})`);

        const pass = new PKPass(certificates, {
            passTypeIdentifier: "pass.com.loyalfly.loyalty",
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
        const colorString = businessCardData.textColorScheme === 'dark' ? "rgb(0,0,0)" : "rgb(255,255,255)";
        pass.labelColor = colorString;
        pass.foregroundColor = colorString;

        const buffer = await pass.asBuffer();
        
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=pass.pkpass`);
        res.status(200).send(buffer);

    } catch (error) {
        console.error("ERROR GENERATE APPLE PASS:", error);
        res.status(500).send(`Error generando pase Apple: ${error.message}`);
    }
});

/**
 * FUNCIÓN: Generación del Pase Google Wallet (JWT)
 */
export const generatewalletpass = onRequest({ 
    region: "us-central1", 
    memory: "256MiB",
    maxInstances: 10 
}, async (req, res) => {
  const { bid, cid } = req.query;
  if (!bid || !cid) return res.status(400).send("Faltan parámetros bid o cid.");

  try {
    const sa = loadServiceAccount();
    if (!sa) throw new Error("Configuración de servidor incompleta (SA missing).");
    
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();

    if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado.");

    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : {};
    const customerData = customerSnap.data();

    const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
    const custName = (customerData.name || "Cliente").substring(0, 25);
    const stamps = customerData.stamps || 0;
    const rewardsAvailable = Math.floor(stamps / 10);
    
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    
    const classId = `${ISSUER_ID}.V26_${safeBid}`; 
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    let cardColor = businessCardData.color || "#5134f9";
    if (!cardColor.startsWith('#')) cardColor = `#${cardColor}`;

    let logoObj = undefined;
    if (businessCardData.logoUrl && businessCardData.logoUrl.startsWith('http')) {
        let cleanLogo = businessCardData.logoUrl;
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
          cardRowTemplateInfos: [
            {
              twoItems: {
                startItem: {
                  firstValue: {
                    fields: [{ fieldPath: "object.textModulesData['sellos']" }]
                  }
                },
                endItem: {
                  firstValue: {
                    fields: [{ fieldPath: "object.textModulesData['recompensas']" }]
                  }
                }
              }
            }
          ]
        }
      }
    };

    const genericObject = {
      id: objectId,
      classId: classId,
      hexBackgroundColor: cardColor,
      logo: logoObj,
      cardTitle: { defaultValue: { language: "es-419", value: bizName } },
      header: { defaultValue: { language: "es-419", value: `${custName}` } },
      subheader: { defaultValue: { language: "es-419", value: `Nombre` } },
      textModulesData: [
        { id: "sellos", header: "Sellos acumulados", body: `${stamps}` },
        { id: "recompensas", header: "Recompensas", body: `${rewardsAvailable}` }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: cid.substring(0, 8)
      }
    };

    const claims = {
      iss: sa.client_email,
      aud: "google",
      typ: "savetowallet",
      payload: {
        genericClasses: [genericClass],
        genericObjects: [genericObject],
      },
    };

    const token = jwt.sign(claims, sa.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("ERROR GENERATE WALLET:", error);
    res.status(500).send("Error de servidor: Verifica la configuración de la cuenta de servicio.");
  }
});

/**
 * TRIGGER: Actualización en tiempo real para Google Wallet
 */
export const updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "256MiB",
    maxInstances: 5
}, async (event) => {
    if (!loadServiceAccount()) return null;
    const newData = event.data.after.data();
    const oldData = event.data.before.data();

    if (newData.stamps === oldData.stamps && newData.name === oldData.name) return null;

    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    try {
      const token = await getGoogleAuthToken();
      const stamps = newData.stamps || 0;
      const rewards = Math.floor(stamps / 10);
      const custName = (newData.name || "Cliente").substring(0, 25);

      const patchData = {
        header: { defaultValue: { language: "es-419", value: `${custName}` } },
        subheader: { defaultValue: { language: "es-419", value: `Nombre` } },
        textModulesData: [
          { id: "sellos", header: "Sellos acumulados", body: `${stamps}` },
          { id: "recompensas", header: "Recompensas", body: `${rewards}` }
        ]
      };

      const response = await fetch(
        `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(patchData)
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }
      console.log(`Pase Google ${objectId} actualizado.`);
    } catch (error) {
      console.error("Error actualizando pase Google:", error.message);
    }
    return null;
});
