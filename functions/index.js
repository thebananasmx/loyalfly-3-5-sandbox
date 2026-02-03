
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { GoogleAuth } = require("google-auth-library");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

const ISSUER_ID = "3388000000023072020";

/**
 * Obtiene un token de acceso OAuth2 para la API de Google Wallet
 */
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

/**
 * FUNCIÓN 1 (v2): Generación del Pase Inicial (JWT)
 */
exports.generatewalletpass = onRequest({ 
    region: "us-central1", 
    memory: "256MiB",
    maxInstances: 10 
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

    const bizName = (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20);
    const custName = (customerData.name || "Cliente").substring(0, 25);
    const stamps = customerData.stamps || 0;
    const rewardsAvailable = Math.floor(stamps / 10);
    
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    
    const classId = `${ISSUER_ID}.V7_${safeBid}`; // Incrementamos versión por cambio de estructura visual
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    let cardColor = businessCardData.color || "#5234f9";
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
        cardBarcodeSectionDetails: {
          // Mapeamos los módulos de texto para que aparezcan en dos columnas sobre el QR
          firstTopDetail: {
            fieldSelector: { fieldPath: "object.textModulesData['sellos_acumulados']" }
          },
          secondTopDetail: {
            fieldSelector: { fieldPath: "object.textModulesData['premios_disponibles']" }
          }
        }
      }
    };

    const genericObject = {
      id: objectId,
      classId: classId,
      hexBackgroundColor: cardColor,
      logo: logoObj,
      cardTitle: { defaultValue: { language: "es-419", value: bizName } },
      // Estructura de la foto: Header es el nombre, Subheader es la etiqueta "Nombre"
      header: { defaultValue: { language: "es-419", value: custName } },
      subheader: { defaultValue: { language: "es-419", value: "Nombre" } },
      textModulesData: [
        { 
          id: "sellos_acumulados", 
          header: "Sellos acumulados", 
          body: `${stamps} sellos` 
        },
        { 
          id: "premios_disponibles", 
          header: "Premios disponibles", 
          body: `${rewardsAvailable} premios` 
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: cid.substring(0, 8)
      }
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: "google",
      origins: [],
      typ: "savetowallet",
      payload: {
        genericClasses: [genericClass],
        genericObjects: [genericObject],
      },
    };

    const token = jwt.sign(claims, serviceAccount.private_key.replace(/\\n/g, '\n'), { algorithm: "RS256" });
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("ERROR GENERATE WALLET:", error);
    res.status(500).send("Error de generación: " + error.message);
  }
});

/**
 * FUNCIÓN 2 (v2): TRIGGER DINÁMICO
 */
exports.updatewalletonstampchange = onDocumentUpdated({
    document: "businesses/{bid}/customers/{cid}",
    retry: true,
    memory: "256MiB",
    maxInstances: 5
}, async (event) => {
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
        header: { defaultValue: { language: "es-419", value: custName } },
        textModulesData: [
          { id: "sellos_acumulados", body: `${stamps} sellos` },
          { id: "premios_disponibles", body: `${rewards} premios` }
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
      console.log(`Pase ${objectId} actualizado con éxito.`);
    } catch (error) {
      console.error("Error actualizando pase:", error.message);
    }
    return null;
});
