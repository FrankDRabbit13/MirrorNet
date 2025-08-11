// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getStripePayments } from "@stripe/firestore-stripe-payments";

// Your new Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCWa7WdbskdsTaGvxs1ORDEYNdKCijAHvc",
  authDomain: "mirrornet-96cce.firebaseapp.com",
  projectId: "mirrornet-96cce",
  storageBucket: "mirrornet-96cce.appspot.com",
  messagingSenderId: "277723871042",
  appId: "1:277723871042:web:ccf266035c41c65e3c7adb"
};

// A more robust way to initialize Firebase, especially for server-side code.
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const payments = getStripePayments(app, {
  productsCollection: "products",
  customersCollection: "users",
});


export { app, auth, db, storage, googleProvider, payments };
