const admin = require("firebase-admin");
const { FieldValue } = require('firebase-admin/firestore');

var serviceAccount = require("../../serviceAccountKey-Telehealth.json");

// Initialize with a unique name
const telehealthApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://medlink-telehealth-test-3-env-default-rtdb.europe-west1.firebasedatabase.app",
}, 'telehealth'); // Note the second parameter for unique name

const db = telehealthApp.firestore();
const auth = telehealthApp.auth();
const GeoPoint = admin.firestore.GeoPoint; 

module.exports = {
  admin,
  db,
  auth,
  FieldValue,
  GeoPoint
};