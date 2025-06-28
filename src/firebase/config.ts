import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC5wi6x-V1LfZW90Ch5KH5pVnSyaLdNOFw",
  authDomain: "kadii-171f7.firebaseapp.com",
  projectId: "kadii-171f7",
  storageBucket: "kadii-171f7.firebasestorage.app",
  messagingSenderId: "261075441082",
  appId: "1:261075441082:web:9960496d0815757dfef983",
  measurementId: "G-M29H6YL64F"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);