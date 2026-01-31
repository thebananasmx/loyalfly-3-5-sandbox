
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

  // ID de Emisor de Google Pay (Asegúrate que este ID sea el correcto en tu consola de Google Pay)
  const ISSUER_ID = "3388000000023072020";

  try {
    // 1. Obtener datos del negocio (Configuración de la tarjeta)
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    
    if (!businessCardSnap.exists) {
      return res.status(404).send("Configuración de negocio no encontrada.");
    }
    
    const businessCardData = businessCardSnap.data();
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : { name: "Loyalfly Business" };

    // 2. Obtener datos del cliente
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();
    if (!customerSnap.exists) {
      return res.status(404).send("Cliente no encontrado.");
    }
    const customerData = customerSnap.data();

    // Lógica de sellos
    const currentStamps = customerData.stamps || 0;
    const totalStamps = 10;
    const stampsLabel = `${currentStamps} de ${totalStamps} estrellas`;

    // Identificadores únicos requeridos por Google
    const classId = `${ISSUER_ID}.CLASS_${bid}`;
    const objectId = `${ISSUER_ID}.OBJ_${bid}_${cid}`;

    // 3. Definir la CLASE (La plantilla del negocio)
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
      issuerName: businessMainData.name || businessCardData.name,
      reviewStatus: "UNDER_REVIEW"
    };

    // 4. Definir el OBJETO (La tarjeta del cliente específico)
    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: businessCardData.color || "#4D17FF",
      logo: businessCardData.logoUrl ? {
        sourceUri: {
          uri: businessCardData.logoUrl
        },
        description: {
          defaultValue: { language: "es", value: "Logo" }
        }
      } : undefined,
      cardTitle: {
        defaultValue: { language: "es", value: businessCardData.name || businessMainData.name },
      },
      header: {
        defaultValue: { language: "es", value: customerData.name },
      },
      // Campos de texto dinámicos
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
        alternateText: "ID: " + cid
      }
    };

    // 5. Construir el Token JWT con Clase y Objeto
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

    const token = jwt.sign(
      claims,
      serviceAccount.private_key,
      { algorithm: "RS256" },
    );

    // Redirección final a Google Wallet
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("Error generando el pase:", error);
    res.status(500).send("Error interno al generar el pase: " + error.message);
  }
});
