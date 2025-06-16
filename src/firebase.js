// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBr7mh38vDbvFYM5bsSyi29gzF0vO5BTOA",
  authDomain: "tm-app-login.firebaseapp.com",
  projectId: "tm-app-login",
  storageBucket: "tm-app-login.firebasestorage.app",
  messagingSenderId: "1052083079033",
  appId: "1:1052083079033:web:21cded620af067e34751a8",
  measurementId: "G-C2EK5SQ787"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const db = getFirestore(app);
