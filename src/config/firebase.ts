import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpJnv-SWgCkgr5jE0X_CCkUk2TAN5gBkM",
  authDomain: "food-recommendation-sytem.firebaseapp.com",
  projectId: "food-recommendation-sytem",
  storageBucket: "food-recommendation-sytem.firebasestorage.app",
  messagingSenderId: "1086612332302",
  appId: "1:1086612332302:web:22e7c2c3496d6de983815f",
  measurementId: "G-869EC7VPV0",
  clientId: "708522905298-aelbqpuf9q4kdr7813kpu9iauu785t18.apps.googleusercontent.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Google Auth Provider with custom client ID
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  client_id: firebaseConfig.clientId,
  prompt: "select_account"
});

export { app, analytics, auth, db, googleProvider }; 