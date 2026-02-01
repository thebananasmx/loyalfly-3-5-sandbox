
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

exports.generateWalletPass = functions.https.onRequest(async (req, res) => {
  const { bid, cid } = req.query;

  console.log(`Iniciando generación de pase para Business: ${bid}, Customer: ${cid}`);

  if (!bid || !cid) {
    console.error("Faltan parámetros bid o cid");
    return res.status(400).send("Faltan parámetros requeridos.");
  }

  const ISSUER_ID = "3388000000023072020";

  try {
    const businessCardSnap = await db.doc(`businesses/${bid}/config/card`).get();
    const businessMainSnap = await db.doc(`businesses/${bid}`).get();
    
    if (!businessMainSnap.exists) {
        console.error(`Negocio ${bid} no encontrado en Firestore`);
    }

    const businessCardData = businessCardSnap.exists ? businessCardSnap.data() : {};
    const businessMainData = businessMainSnap.exists ? businessMainSnap.data() : { name: "Loyalfly Business" };

    const customerSnap = await db.doc(`businesses/${bid}/customers/${cid}`).get();
    if (!customerSnap.exists) {
      console.error(`Cliente ${cid} no encontrado`);
      return res.status(404).send("Cliente no encontrado.");
    }
    const customerData = customerSnap.data();

    const currentStamps = customerData.stamps || 0;
    const totalStamps = 10;
    const stampsLabel = `${currentStamps} de ${totalStamps} estrellas`;

    // Google Wallet IDs no permiten caracteres especiales complejos, solo guiones bajos y alfanuméricos
    const safeBid = bid.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeCid = cid.replace(/[^a-zA-Z0-9_]/g, '_');
    
    const classId = `${ISSUER_ID}.CLASS_${safeBid}`;
    const objectId = `${ISSUER_ID}.OBJ_${safeBid}_${safeCid}`;

    // Validación de Logo: Google falla con SVG. Forzamos PNG si es Cloudinary.
    let logoObj = undefined;
    let finalLogoUrl = businessCardData.logoUrl || "https://res.cloudinary.com/dg4wbuppq/image/upload/v1762622899/ico_loyalfly_xgfdv8.png";
    
    if (finalLogoUrl.startsWith('http')) {
        // Truco de Cloudinary: Si termina en .svg, lo cambiamos a .png para que Google lo acepte
        if (finalLogoUrl.includes('cloudinary.com') && finalLogoUrl.endsWith('.svg')) {
            finalLogoUrl = finalLogoUrl.replace('.svg', '.png');
        }

        logoObj = {
            sourceUri: { uri: finalLogoUrl },
            contentDescription: {
              defaultValue: { language: "es-419", value: "Logo" }
            }
        };
    }

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
      issuerName: (businessMainData.name || "Loyalfly").substring(0, 20),
      reviewStatus: "UNDER_REVIEW"
    };

    const genericObject = {
      id: objectId,
      classId: classId,
      genericType: "GENERIC_TYPE_UNSPECIFIED",
      hexBackgroundColor: (businessCardData.color || "#4D17FF").toUpperCase(),
      logo: logoObj,
      cardTitle: {
        defaultValue: { language: "es-419", value: (businessCardData.name || businessMainData.name || "Loyalfly").substring(0, 20) },
      },
      header: {
        defaultValue: { language: "es-419", value: (customerData.name || "Cliente").substring(0, 20) },
      },
      textModulesData: [
        {
          header: "ESTRELLAS",
          body: stampsLabel,
          id: "f_stamps_label"
        },
        {
          header: "TU RECOMPENSA",
          body: (businessCardData.reward || "¡Sigue sumando!").substring(0, 50),
          id: "f_reward_section"
        }
      ],
      barcode: {
        type: "QR_CODE",
        value: cid,
        alternateText: "ID: " + cid
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

    console.log("Payload generado listo para firmar:", JSON.stringify(claims));

    let privateKey = serviceAccount.private_key;
    if (privateKey && !privateKey.includes('\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const token = jwt.sign(claims, privateKey, { algorithm: "RS256" });
    
    console.log("JWT firmado con éxito. Redirigiendo...");
    res.redirect(`https://pay.google.com/gp/v/save/${token}`);

  } catch (error) {
    console.error("ERROR CRÍTICO EN FUNCIÓN:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});
