// GDI Firebase-verbinding.
// Deze waarden horen bij de Firebase Web App van tacticboard-gdi.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxnbEaSMP2lINhm2LLS_02-qU-DHTMOfM",
  authDomain: "tacticboard-gdi.firebaseapp.com",
  projectId: "tacticboard-gdi",
  storageBucket: "tacticboard-gdi.firebasestorage.app",
  messagingSenderId: "665212408885",
  appId: "1:665212408885:web:d5d9a6cc2f81ec03d94d7c",
  measurementId: "G-SWJ45TKF2P"
};

export const firebaseReady = true;
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics werkt alleen in ondersteunde browsers/omgevingen.
isSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch((error) => {
    console.info("Firebase Analytics is niet beschikbaar:", error);
  });
