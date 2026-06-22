import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Replace with your Firebase project configuration from https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "AIzaSyA3XB66GdaqpikztySew_Pl_Wh2qN_mkxI",
  authDomain: "webshop-hi.firebaseapp.com",
  projectId: "webshop-hi",
  storageBucket: "webshop-hi.firebasestorage.app",
  messagingSenderId: "357003233505",
  appId: "1:357003233505:web:435b5e90533cb336aa0fa0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
