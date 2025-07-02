import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC07LW_uyp0z_K5tS5_nFmxexowhGIr0i0",
  authDomain: "kadiii.firebaseapp.com",
  projectId: "kadiii",
  storageBucket: "kadiii.firebasestorage.app",
  messagingSenderId: "153138419349",
  appId: "1:153138419349:web:cf12cb1b1ad0a9c7372d9c",
  measurementId: "G-SM06HCRX49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);