// app/telehealth/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";


const telehealthFirebase = {
  apiKey: process.env.NEXT_PUBLIC_TH_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_TH_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_TH_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_TH_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_TH_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_TH_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_TH_FIREBASE_DATABASE_URL,
};


const telehealthApp = initializeApp(telehealthFirebase, 'telehealth');
const auth = getAuth(telehealthApp);

export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
