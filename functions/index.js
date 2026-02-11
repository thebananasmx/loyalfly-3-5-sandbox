const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");

// Logs de inicio para diagnóstico
console.log("Iniciando contenedor de funciones...");

// Definición de secretos (Deben existir en Secret Manager)
const APPLE_PASS_CERT = defineSecret('APPLE_PASS_CERT_BASE64');
const APPLE_PASS_PASSWORD = defineSecret('APPLE_PASS_PASSWORD');
const APPLE_WWDR_CERT = defineSecret('APPLE_WWDR_CERT_BASE64');

// Inicialización limpia
try {
    admin.initializeApp();
    console.log("Firebase Admin inicializado correctamente.");
} catch (e) {
    console.error("Error inicializando Firebase Admin:", e);
}

const db = admin.firestore();
const ISSUER_ID = "3388000000023072020";

// Carga diferida de librerías pesadas para evitar timeout en el arranque
let GoogleAuth;
let PKPass;

/**
 * FUNCIÓN 1: Generación de Pase Google Wallet (JWT)
 */
exports.generatewalletpass = onRequest({ 
    region: "us-central1", 
    memory: "512MiB",
    maxInstances: 10 
}, async (req, res) => {
  if (!GoogleAuth) {
    const authLib = require("google-auth-library");
    GoogleAuth = authLib.GoogleAuth;
  }
  
  const { bid, cid } = req.query;
  if (!bid || !cid) return res.status(400).send("Faltan parámetros.");

  try {
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
    
    const classId = `${ISSUER_ID}.V24_${safeBid}`; 
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

    res.status(500).send("La firma del JWT de Google Wallet requiere configuración de llave privada en Secret Manager.");

  } catch (error) {
    res.status(500).send("Error: " + error.message);
  }
});

/**
 * FUNCIÓN 2: Generación de Pase Apple Wallet (.pkpass)
 */
exports.generateapplepass = onRequest({
    region: "us-central1",
    memory: "1GiB", 
    secrets: [APPLE_PASS_CERT, APPLE_PASS_PASSWORD, APPLE_WWDR_CERT]
}, async (req, res) => {
    if (!PKPass) {
        const passLib = require("passkit-generator");
        PKPass = passLib.PKPass;
    }

    const { bid, cid } = req.query;
    if (!bid || !cid) return res.status(400).send("Faltan parámetros.");

    try {
        const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();
        if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado.");

        const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
        const businessMainSnap = await db.doc(`businesses/${bid}`).get();

        const cardData = businessCardSnap.data() || {};
        const mainData = businessMainSnap.data() || {};
        const custData = customerSnap.data();

        const bizName = (cardData.name || mainData.name || "Loyalfly").substring(0, 20);
        const stamps = custData.stamps || 0;
        const rewards = Math.floor(stamps / 10);

        const pass = new PKPass({
            model: null,
            certificates: {
                wwdr: Buffer.from(APPLE_WWDR_CERT.value(), 'base64'),
                signerCert: Buffer.from(APPLE_PASS_CERT.value(), 'base64'),
                signerKeyPassphrase: APPLE_PASS_PASSWORD.value(),
            }
        });

        pass.setPackDetails({
            formatVersion: 1,
            passTypeIdentifier: "pass.com.loyalfly.card",
            serialNumber: cid,
            teamIdentifier: "KWQ7439H65",
            organizationName: bizName,
            description: `Lealtad ${bizName}`,
            backgroundColor: cardData.color || "rgb(81, 52, 249)",
            foregroundColor: cardData.textColorScheme === 'light' ? "rgb(255,255,255)" : "rgb(0,0,0)",
            labelColor: cardData.textColorScheme === 'light' ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)",
        });

        pass.primaryFields.add({ key: "name", label: "CLIENTE", value: custData.name });
        pass.secondaryFields.add({ key: "stamps", label: "SELLOS", value: stamps });
        pass.secondaryFields.add({ key: "rewards", label: "PREMIOS", value: rewards });
        
        pass.setBarcodes({
            message: cid,
            format: "PKBarcodeFormatQR",
            messageEncoding: "iso-8859-1"
        });

        const buffer = await pass.export().then(p => p.asBuffer());

        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename="pass.pkpass"`);
        res.status(200).send(buffer);

    } catch (error) {
        console.error("APPLE PASS GENERATION ERROR:", error);
        res.status(500).send("Error generando pase: " + error.message);
    }
});

/**
 * FUNCIÓN 3: TRIGGER DINÁMICO
 */
exports.updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "512MiB"
}, async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    if (newData.stamps === oldData.stamps && newData.name === oldData.name) return null;

    const { bid, cid } = event.params;
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${cid.replace(/[^a-zA-Z0-9]/g, '')}`;

    try {
      const authLib = require("google-auth-library");
      const auth = new authLib.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
      });
      const client = await auth.getClient();
      const token = (await client.getAccessToken()).token;

      const stamps = newData.stamps || 0;
      const rewards = Math.floor(stamps / 10);
      const custName = (newData.name || "Cliente").substring(0, 25);

      const patchData = {
        header: { defaultValue: { language: "es-419", value: `${custName}` } },
        textModulesData: [
          { id: "sellos", header: "Sellos acumulados", body: `${stamps}` },
          { id: "recompensas", header: "Recompensas", body: `${rewards}` }
        ]
      };

      await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(patchData)
      });
    } catch (error) {
      console.error("Error actualizando pase:", error.message);
    }
    return null;
});