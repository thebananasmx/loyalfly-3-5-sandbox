
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { GoogleAuth } = require("google-auth-library");
const { PKPass } = require("passkit-generator");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp();
const db = admin.firestore();

// Secretos de Apple
const APPLE_PASS_CERT_BASE64 = defineSecret("APPLE_PASS_CERT_BASE64");
const APPLE_PASS_PASSWORD = defineSecret("APPLE_PASS_PASSWORD");
const APPLE_WWDR_CERT_BASE64 = defineSecret("APPLE_WWDR_CERT_BASE64");

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
 * FUNCIÓN: Generación de Pase para Apple Wallet (.pkpass)
 */
exports.generateapplepass = onRequest({
    region: "us-central1",
    memory: "256MiB",
    maxInstances: 10,
    invoker: "public", // Forzar acceso público
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

        const pass = new PKPass({}, {
            wwdr: Buffer.from(APPLE_WWDR_CERT_BASE64.value(), "base64"),
            signerCert: Buffer.from(APPLE_PASS_CERT_BASE64.value(), "base64"),
            signerKey: Buffer.from(APPLE_PASS_CERT_BASE64.value(), "base64"), 
            signerKeyPassphrase: APPLE_PASS_PASSWORD.value(),
        });

        pass.setMetadata({
            passTypeIdentifier: "pass.com.loyalfly.loyalty", 
            teamIdentifier: "YOUR_TEAM_ID", 
            organizationName: "Loyalfly",
            serialNumber: cid,
            sharingProhibited: true
        });

        pass.type = "storeCard";
        pass.headerFields.add({ key: "logoText", label: "", value: bizName });
        pass.primaryFields.add({ key: "customerName", label: "CLIENTE", value: customerData.name || "Invitado" });
        pass.secondaryFields.add({ key: "stamps", label: "SELLOS", value: `${stamps}` });
        pass.auxiliaryFields.add({ key: "rewards", label: "PREMIOS", value: `${rewards}` });

        pass.setBarcodes({
            format: "PKBarcodeFormatQR",
            message: cid,
            messageEncoding: "iso-8859-1",
            altText: customerData.phone || cid.substring(0, 8)
        });

        pass.setBackgroundColor(cardColor);
        pass.setLabelColor(businessCardData.textColorScheme === 'light' ? "rgb(255,255,255)" : "rgb(0,0,0)");
        pass.setForegroundColor(businessCardData.textColorScheme === 'light' ? "rgb(255,255,255)" : "rgb(0,0,0)");

        const buffer = await pass.asBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename=loyalfly-${cid}.pkpass`);
        res.status(200).send(buffer);

    } catch (error) {
        console.error("ERROR GENERATE APPLE PASS:", error);
        res.status(500).send("Error de generación Apple Pass: " + error.message);
    }
});

/**
 * FUNCIÓN: Generación del Pase Google Wallet (JWT)
 */
exports.generatewalletpass = onRequest({ 
    region: "us-central1", 
    memory: "256MiB",
    invoker: "public", // Forzar acceso público
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
                    fields: [
                      {
                        fieldPath: "object.textModulesData['sellos']"
                      }
                    ]
                  }
                },
                endItem: {
                  firstValue: {
                    fields: [
                      {
                        fieldPath: "object.textModulesData['recompensas']"
                      }
                    ]
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
        { 
          id: "sellos", 
          header: "Sellos acumulados", 
          body: `${stamps}` 
        },
        { 
          id: "recompensas", 
          header: "Recompensas", 
          body: `${rewardsAvailable}` 
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
    res.status(500).send("Error de generación Google Wallet: " + error.message);
  }
});

/**
 * TRIGGER: Actualización en tiempo real para Google Wallet
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
        header: { defaultValue: { language: "es-419", value: `${custName}` } },
        subheader: { defaultValue: { language: "es-419", value: `Nombre` } },
        textModulesData: [
          { 
            id: "sellos", 
            header: "Sellos acumulados", 
            body: `${stamps}` 
          },
          { 
            id: "recompensas", 
            header: "Recompensas", 
            body: `${rewards}` 
          }
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
      console.log(`Pase Google ${objectId} actualizado con éxito.`);
    } catch (error) {
      console.error("Error actualizando pase Google:", error.message);
    }
    return null;
});