import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider  } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCUysX6qm1r0YKJpYWKac8Itq3668Yem4o",
  authDomain: "mail-store-fe492.firebaseapp.com",
  projectId: "mail-store-fe492",
  storageBucket: "mail-store-fe492.firebasestorage.app",
  messagingSenderId: "915860605433",
  appId: "1:915860605433:web:bffeb0a289fe311a1f1528",
  measurementId: "G-KCS0LV8ZPL"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };