import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  Firestore,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { app } from './firebase';

// Initialize Firestore with persistent cache
let db: Firestore;

try {
  console.log("Initializing Firestore...");
  
  // Initialize with our settings
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  
  // Enable offline persistence
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Firestore persistence enabled successfully");
    })
    .catch((err) => {
      console.error("Error enabling Firestore persistence:", err);
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
        console.warn("The current browser does not support all features required for Firestore persistence.");
      }
    });
    
  console.log("Firestore initialized successfully");
} catch (error) {
  console.error("Error initializing Firestore with persistence:", error);
  console.log("Falling back to standard Firestore initialization");
  
  // Fall back to standard initialization
  db = getFirestore(app);
}

// Export the db instance
export { db };

// Collection references
export const collections = {
  users: 'users',
  userHistory: 'user_history',
  recommendations: 'recommendations',
  dietPlans: 'diet_plans',
  userData: 'user_data'
} as const;

// Helper functions for Firestore operations
export const createDocument = async <T extends { [key: string]: any }>(
  collection: string,
  docId: string,
  data: T
) => {
  const docRef = doc(db, collection, docId);
  await setDoc(docRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef;
};

export const updateDocument = async <T extends { [key: string]: any }>(
  collection: string,
  docId: string,
  data: Partial<T>
) => {
  const docRef = doc(db, collection, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  return docRef;
};

export const getDocument = async <T>(
  collection: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collection, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

export const deleteDocument = async (
  collection: string,
  docId: string
) => {
  const docRef = doc(db, collection, docId);
  await deleteDoc(docRef);
  return true;
}; 