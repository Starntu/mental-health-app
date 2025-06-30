import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBr7mh38vDbvFYM5bsSyi29gzF0vO5BTOA",
  authDomain: "tm-app-login.firebaseapp.com",
  projectId: "tm-app-login",
  storageBucket: "tm-app-login.firebasestorage.app",
  messagingSenderId: "1052083079033",
  appId: "1:1052083079033:web:21cded620af067e34751a8",
  measurementId: "G-C2EK5SQ787",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
