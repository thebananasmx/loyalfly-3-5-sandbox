
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

  // ID de Emisor de Google Pay
  const ISSUER_ID = "3388000000023072020";

  try {
    // 1. Obtener datos del negocio
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    if (!businessCardSnap.exists) {
      return res.status(404).send("Configuración de negocio no encontrada.");
    }
    const businessData = businessCardSnap.data();

    // 2. Obtener datos del cliente
    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();
    if (!customerSnap.exists) {
      return res.status(404).send("Cliente no encontrado.");
    }
    const customerData = customerSnap.data();

    // Lógica de sellos (Asumiendo meta de 10)
    const currentStamps = customerData.stamps || 0;
    const stampsLabel = `${currentStamps} / 10 Estrellas`;

    // 3. Construir el objeto para Google Wallet
    const genericObject = {
      id: `${ISSUER_ID}.OBJ_${cid}`,
      classId: `${ISSUER_ID}.CLASS_${bid}`,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: businessData.color || "#5134F9",
      logo: businessData.logoUrl ? {
        sourceUri: {
          uri: businessData.logoUrl
        }
      } : undefined,
      cardTitle: {
        defaultValue: { language: "es", value: businessData.name || "Loyalfly" },
      },
      header: {
        defaultValue: { language: "es", value: customerData.name || "Mi Tarjeta" },
      },
      // Módulos de texto dinámicos
      textModulesData: [
        {
          header: "PROGRESO",
          body: stampsLabel,
          id: "stamps_module"
        },
        {
          header: "RECOMPENSA",
          body: businessData.reward || "Tu Recompensa",
          id: "reward_module"
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: "ID de Cliente: " + cid
      },
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: "google",
      origins: [],
      typ: "savetowallet",
      payload: {
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
