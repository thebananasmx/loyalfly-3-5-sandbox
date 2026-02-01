
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

exports.generateWalletPass = functions.https.onRequest(async (req, res) => {
  const { bid, cid } = req.query;

  if (!bid || !cid) {
    return res.status(400).send("Faltan parámetros: bid (Business ID) y cid (Customer ID) son requeridos.");
  }

  // ID de Emisor de Google Pay (Asegúrate que este número coincida con tu consola)
  const ISSUER_ID = "3388000000023072020";

  try {
    // 1. Obtener datos del negocio
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    
    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : { name: "Loyalfly Business" };

    // 2. Obtener datos del cliente
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();
    if (!customerSnap.exists) {
      return res.status(404).send("Cliente no encontrado en la base de datos.");
    }
    const customerData = customerSnap.data();

    const currentStamps = customerData.stamps || 0;
    const totalStamps = 10;
    const stampsLabel = `${currentStamps} de ${totalStamps} estrellas`;

    // Limpiar IDs para evitar caracteres no permitidos por Google
    const safeBid = bid.replace(/[^a-zA-Z0-9_]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9_]/g, '');
    
    const classId = `${ISSUER_ID}.CLASS_${safeBid}`;
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    // 3. Definir la CLASE
    const genericClass = {
      id: classId,
      classTemplateInfo: {
        cardBarcodeSectionDetails: {
          firstTopDetail: {
            fieldSelector: "f_stamps_label"
          }
        },
        primaryLayoutSectionId: "f_reward_section"
      },
      issuerName: businessMainData.name || "Loyalfly Business",
      reviewStatus: "UNDER_REVIEW"
    };

    // 4. Definir el OBJETO
    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: "GENERIC_TYPE_UNSPECIFIED", // Valor estándar para objetos genéricos
      hexBackgroundColor: businessCardData.color || "#4D17FF",
      logo: businessCardData.logoUrl ? {
        sourceUri: {
          uri: businessCardData.logoUrl
        },
        contentDescription: {
          defaultValue: { language: "es-419", value: "Logo de " + (businessMainData.name || "Negocio") }
        }
      } : undefined,
      cardTitle: {
        defaultValue: { language: "es-419", value: businessCardData.name || businessMainData.name || "Tarjeta de Lealtad" },
      },
      header: {
        defaultValue: { language: "es-419", value: customerData.name || "Cliente" },
      },
      textModulesData: [
        {
          header: "ESTRELLAS",
          body: stampsLabel,
          id: "f_stamps_label"
        },
        {
          header: "TU RECOMPENSA",
          body: businessCardData.reward || "¡Sigue sumando!",
          id: "f_reward_section"
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: "ID Cliente: " + cid
      }
    };

    // 5. Configurar el JWT
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

    // Limpieza robusta de la llave privada
    let privateKey = serviceAccount.private_key;
    if (privateKey && !privateKey.includes('\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const token = jwt.sign(
      claims,
      privateKey,
      { algorithm: "RS256" },
    );

    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("Error crítico:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});
