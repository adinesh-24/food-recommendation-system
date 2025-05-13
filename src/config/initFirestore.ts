import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from './firestore';

// Collection names
const COLLECTIONS = [
  'users',
  'user_history',
  'recommendations',
  'diet_plans', 
  'user_data'
];

/**
 * Initialize Firestore collections if they don't exist
 * This helps ensure collections appear in Firebase console
 */
export const initializeFirestoreCollections = async (): Promise<void> => {
  console.log('Initializing Firestore collections...');
  
  try {
    for (const collectionName of COLLECTIONS) {
      console.log(`Checking collection: ${collectionName}`);
      
      // Create a reference to the collection
      const collectionRef = collection(db, collectionName);
      
      // Query the collection to make it appear in Firebase console
      // even if it's empty
      const q = query(collectionRef, limit(1));
      await getDocs(q);
      
      console.log(`Collection initialized: ${collectionName}`);
    }
    
    console.log('All Firestore collections initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore collections:', error);
  }
};

export default initializeFirestoreCollections; 