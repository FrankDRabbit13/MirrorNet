// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getStripePayments } from "@stripe/firestore-stripe-payments";

// Your new Firebase project configuration.
const firebaseConfig = {
  apiKey: "AIzaSyCBuhVHXJTeIBACEdjOk76EA2OnnrJCOAE",
  authDomain: "mirrornet-80185.firebaseapp.com",
  projectId: "mirrornet-80185",
  storageBucket: "mirrornet-80185.appspot.com",
  messagingSenderId: "183315681766",
  appId: "1:183315681766:web:31efac3da2c4a75c4e0627"
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
