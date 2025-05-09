// /config/firebase.js
const admin = require("firebase-admin");
const { FieldValue } = require('firebase-admin/firestore');

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://medlink-71068-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.firestore();
const auth = admin.auth();
const GeoPoint = admin.firestore.GeoPoint; 



module.exports = {
  admin,
  db,
  auth,
  FieldValue,
  GeoPoint
};
