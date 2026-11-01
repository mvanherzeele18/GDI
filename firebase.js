// GDI Firebase-verbinding.
// Vul hieronder de Web App-configuratie in via Firebase Console > Projectinstellingen > Je apps.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "VUL_HIER_JE_API_KEY_IN",
  authDomain: "VUL_HIER_JE_PROJECT.firebaseapp.com",
  projectId: "VUL_HIER_JE_PROJECT_ID_IN",
  storageBucket: "VUL_HIER_JE_PROJECT.firebasestorage.app",
  messagingSenderId: "VUL_HIER_JE_SENDER_ID_IN",
  appId: "VUL_HIER_JE_APP_ID_IN"
};

export const firebaseReady = Object.values(firebaseConfig).every(value =>
  typeof value === "string" && value.length > 0 && !value.startsWith("VUL_HIER")
);

let app = null;
if (firebaseReady) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
