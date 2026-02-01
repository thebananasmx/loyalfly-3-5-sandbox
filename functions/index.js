
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

exports.generateWalletPass = functions.https.onRequest(async (req, res) => {
  const { bid, cid } = req.query;

  console.log(`Diagnosticando pase - Business: ${bid}, Customer: ${cid}`);

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

    // Limpieza estricta de IDs (Solo alfanuméricos)
    const safeBid = bid.replace(/[^a-zA-Z0-9]/g, '');
    const safeCid = cid.replace(/[^a-zA-Z0-9]/g, '');
    
    const classId = `${ISSUER_ID}.CLS_${safeBid}`;
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    // Logo: Google FALLA si no es HTTPS o si es SVG. 
    // Si es Cloudinary, forzamos PNG. Si no hay logo, NO enviamos el objeto logo.
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

    // Payload Mínimo Viable (Sin plantillas complejas para evitar errores de validación)
    const genericClass = {
      id: classId,
      issuerName: (businessMainData.name || "Loyalfly").substring(0, 20),
      reviewStatus: "UNDER_REVIEW"
    };

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
      barcode: {
        type: "QR_CODE",
        value: cid
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
    console.log(`Redirigiendo a Google con Token para objeto: ${objectId}`);
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).send("Error: " + error.message);
  }
});
