import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

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

// Initialize Google Auth Provider with custom client ID
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  client_id: firebaseConfig.clientId,
  prompt: "select_account"
});

// Initialize Firestore with offline persistence
let db;

try {
  // Initialize with persistent cache for offline support
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
  
  console.log("Firestore initialized with persistent cache");
} catch (error) {
  console.error("Error initializing Firestore with persistence:", error);
  // Fallback to standard initialization
  db = getFirestore(app);
  console.log("Fallback: Standard Firestore initialization");
}

// Enable offline persistence
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore offline persistence enabled successfully");
    })
    .catch((error) => {
      if (error.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (error.code === 'unimplemented') {
        console.warn("The current browser does not support all features required for Firestore persistence.");
      } else {
        console.error("Error enabling Firestore persistence:", error);
      }
    });
} catch (error) {
  console.warn("Error setting up Firestore persistence:", error);
}

// Network status monitoring
const networkStatus = {
  isOnline: navigator.onLine,
  listeners: new Set<(online: boolean) => void>()
};

// Set up network status listeners
window.addEventListener('online', () => {
  console.log('App is online');
  networkStatus.isOnline = true;
  networkStatus.listeners.forEach(listener => listener(true));
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  networkStatus.isOnline = false;
  networkStatus.listeners.forEach(listener => listener(false));
});

// Export network status utilities
export const onNetworkStatusChange = (callback: (online: boolean) => void) => {
  networkStatus.listeners.add(callback);
  // Immediately call with current status
  callback(networkStatus.isOnline);
  
  // Return function to remove listener
  return () => {
    networkStatus.listeners.delete(callback);
  };
};

export { app, analytics, auth, db, googleProvider }; 