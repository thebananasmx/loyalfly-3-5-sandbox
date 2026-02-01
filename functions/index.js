
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

exports.generateWalletPass = functions.https.onRequest(async (req, res) => {
  const { bid, cid } = req.query;

  if (!bid || !cid) {
    return res.status(400).send("Faltan parámetros requeridos.");
  }

  const ISSUER_ID = "3388000000023072020";

  try {
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();

    if (!customerSnap.exists) return res.status(404).send("Cliente no encontrado.");

    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : { name: "Loyalfly" };
    const customerData = customerSnap.data();

    const currentStamps = customerData.stamps || 0;
    const stampsLabel = `${currentStamps} de 10 sellos`;
    const rewardText = (businessCardData.reward || "¡Premio!").substring(0, 50);

    // Limpieza de IDs
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    
    /**
     * IMPORTANTE: Cambiamos el prefijo a 'V2' para forzar a Google 
     * a crear una nueva definición de clase con los nuevos campos.
     */
    const classId = `${ISSUER_ID}.V2_${safeBid}`;
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    // Logo logic
    let logoObj = undefined;
    let logoUrl = businessCardData.logoUrl;
    if (logoUrl && logoUrl.startsWith('http')) {
        if (logoUrl.includes('cloudinary.com')) {
            logoUrl = logoUrl.replace('.svg', '.png');
        }
        logoObj = {
            sourceUri: { uri: logoUrl },
            contentDescription: { defaultValue: { language: "es-419", value: "Logo" } }
        };
    }

    // Configuración de la CLASE (Diseño y Mapeo)
    const genericClass = {
      id: classId,
      issuerName: (businessMainData.name || "Loyalfly").substring(0, 20),
      reviewStatus: "UNDER_REVIEW",
      classTemplateInfo: {
        cardBarcodeSectionDetails: {
          firstTopDetail: {
            fieldSelector: "f_stamps" // Esto mapea el ID del texto al lugar arriba del QR
          }
        }
      }
    };

    // Configuración del OBJETO (Datos dinámicos del cliente)
    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: (businessCardData.color || "#4D17FF").startsWith('#') ? businessCardData.color : "#4D17FF",
      logo: logoObj,
      cardTitle: {
        defaultValue: { language: "es-419", value: (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20) }
      },
      header: {
        defaultValue: { language: "es-419", value: (customerData.name || "Cliente").substring(0, 20) }
      },
      // Aquí definimos los datos reales
      textModulesData: [
        {
          header: "MIS SELLOS",
          body: stampsLabel,
          id: "f_stamps"
        },
        {
          header: "RECOMPENSA",
          body: rewardText,
          id: "f_reward"
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: `ID: ${cid.substring(0, 8)}`
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

    let privateKey = serviceAccount.private_key;
    if (privateKey && !privateKey.includes('\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});
