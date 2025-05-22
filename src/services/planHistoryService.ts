import { UserHistory, PlanHistoryEntry, DietPlan } from "@/types";
import { collections, createDocument, updateDocument, getDocument } from '@/config/firestore';
import { db } from '@/config/firebase';
import { getUserHistory } from './userService';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, Timestamp, enableNetwork, disableNetwork, enableIndexedDbPersistence } from 'firebase/firestore';

// Utility function to toggle network connectivity for testing
export const toggleFirestoreNetwork = async (enable: boolean): Promise<void> => {
  try {
    if (enable) {
      await enableNetwork(db);
      console.log('Firestore network connection enabled');
    } else {
      await disableNetwork(db);
      console.log('Firestore network connection disabled');
    }
  } catch (error) {
    console.error(`Error ${enable ? 'enabling' : 'disabling'} Firestore network:`, error);
  }
};

// Local cache keys
const CACHE_KEYS = {
  PLAN_HISTORY: 'plan_history_cache',
  ACTIVITY_SUMMARY: 'activity_summary_cache'
};

// Helper function to get cached data
const getCachedData = <T>(key: string, userId: string): T | null => {
  try {
    const cacheKey = `${key}_${userId}`;
    const cachedData = localStorage.getItem(cacheKey);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

// Helper function to set cached data
const setCachedData = <T>(key: string, userId: string, data: T): void => {
  try {
    const cacheKey = `${key}_${userId}`;
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

// Network status check
const isOnline = (): boolean => {
  return navigator.onLine;
};

// Enable offline persistence if not already enabled
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence could not be enabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not available in this browser');
    }
  });
} catch (error) {
  console.warn('Error enabling Firestore persistence:', error);
}

/**
 * Fetches all diet plans for a user directly from the 'diet_plans' collection in Firestore.
 * @param userId The user ID.
 * @returns A promise that resolves to an array of DietPlan objects.
 */
export const getDietPlansFromFirestore = async (userId: string): Promise<DietPlan[]> => {
  if (!userId) {
    console.warn('User ID is required to fetch diet plans.');
    return [];
  }

  try {
    const plansCollectionRef = collection(db, collections.dietPlans);
    const q = query(
      plansCollectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const plans: DietPlan[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure createdAt is a Date object
      // Firestore timestamps can be Timestamps or ISO strings if manually set
      let createdAtDate: Date;
      if (data.createdAt instanceof Timestamp) {
        createdAtDate = data.createdAt.toDate();
      } else if (typeof data.createdAt === 'string') {
        createdAtDate = new Date(data.createdAt);
      } else if (data.createdAt && typeof data.createdAt.seconds === 'number') { // Handle object with seconds/nanoseconds
        createdAtDate = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
      } else {
        // Fallback or error handling if createdAt is in an unexpected format
        console.warn(`Unexpected createdAt format for plan ${doc.id}:`, data.createdAt);
        createdAtDate = new Date(); // Default to now or handle as an error
      }

      plans.push({
        planId: doc.id, 
        ...(data as Omit<DietPlan, 'planId' | 'createdAt'>),
        createdAt: createdAtDate,
        userId: data.userId, 
      } as DietPlan);
    });
    console.log(`Fetched ${plans.length} diet plans from Firestore for user ${userId}`);
    return plans;
  } catch (error) {
    console.error('Error fetching diet plans from Firestore:', error);
    throw error; 
  }
};

/**
 * Adds a history entry for a plan action
 * @param userId The user ID
 * @param planId The plan ID
 * @param action The action performed on the plan
 * @param details Optional details about the action
 * @returns The updated user history
 */
export const addPlanHistoryEntry = async (
  userId: string, 
  planId: string, 
  action: PlanHistoryEntry['action'], 
  details?: string
): Promise<UserHistory> => {
  try {
    // Check if we're online
    const online = isOnline();
    if (!online) {
      console.warn('Cannot add history entry while offline');
      throw new Error('Failed to add history entry because the client is offline.');
    }
    
    // Get current user history
    let currentHistory = await getUserHistory(userId);
    
    // If user history doesn't exist, create a new one
    if (!currentHistory) {
      console.log('User history not found, creating new history document for user:', userId);
      const newHistory: UserHistory = {
        email: '', // Will be updated later if available
        plans: [],
        favorites: [],
        lastViewed: [],
        planHistory: []
      };
      
      // Create the new history document
      await createDocument(collections.userHistory, userId, newHistory);
      
      // Retrieve the newly created document
      currentHistory = await getUserHistory(userId);
      
      if (!currentHistory) {
        throw new Error('Failed to create user history document');
      }
    }

    // Create new history entry with current timestamp
    const now = new Date();
    const isoTimestamp = now.toISOString();
    
    const historyEntry: PlanHistoryEntry = {
      planId,
      action,
      timestamp: isoTimestamp,
      details
    };

    // Add to history in user document
    const planHistory = currentHistory.planHistory || [];
    const updatedHistory: UserHistory = {
      ...currentHistory,
      planHistory: [historyEntry, ...planHistory]
    };

    // Update in Firestore user history document
    await updateDocument(collections.userHistory, userId, updatedHistory);
    
    try {
      // Also add to dedicated planHistory collection for better querying
      // Store the timestamp as a string to avoid indexing issues
      const planHistoryRef = collection(db, 'planHistory');
      await addDoc(planHistoryRef, {
        userId,
        planId,
        action,
        timestamp: isoTimestamp, // Use string timestamp instead of serverTimestamp()
        details,
        createdAt: isoTimestamp
      });
    } catch (firestoreError) {
      console.error('Error adding to planHistory collection:', firestoreError);
      // Continue even if this fails - we already updated the user history document
    }
    
    // Update the local cache with the new history
    const cachedHistory = getCachedData<PlanHistoryEntry[]>(CACHE_KEYS.PLAN_HISTORY, userId) || [];
    cachedHistory.unshift(historyEntry); // Add to beginning of array
    setCachedData(CACHE_KEYS.PLAN_HISTORY, userId, cachedHistory);
    
    // Update the activity summary cache
    const cachedSummary = getCachedData<Record<string, number>>(CACHE_KEYS.ACTIVITY_SUMMARY, userId) || {};
    cachedSummary[action] = (cachedSummary[action] || 0) + 1;
    setCachedData(CACHE_KEYS.ACTIVITY_SUMMARY, userId, cachedSummary);
    
    return updatedHistory;
  } catch (error) {
    console.error('Error adding plan history entry:', error);
    throw error;
  }
};

/**
 * Gets plan history for a specific plan
 * @param userId The user ID
 * @param planId The plan ID
 * @returns Array of history entries for the plan
 */
export const getPlanHistory = async (userId: string, planId: string): Promise<PlanHistoryEntry[]> => {
  try {
    // Check if we're online
    const online = isOnline();
    
    // Try to get from cache first
    const cachedHistory = getCachedData<PlanHistoryEntry[]>(CACHE_KEYS.PLAN_HISTORY, userId);
    
    // If we're offline and have cached data, filter it for this plan
    if (!online && cachedHistory) {
      console.log(`Offline: Using cached history for plan ${planId}`);
      return cachedHistory.filter(entry => entry.planId === planId);
    }
    
    // If we're offline and don't have cached data, throw a specific error
    if (!online && !cachedHistory) {
      console.warn('Offline with no cached history data');
      throw new Error('Failed to get document because the client is offline.');
    }
    
    // We're online, proceed with fetching from Firestore
    const history = await getUserHistory(userId);
    if (!history || !history.planHistory) {
      // If we have cached data, use it as fallback
      if (cachedHistory) {
        return cachedHistory.filter(entry => entry.planId === planId);
      }
      return [];
    }

    const filteredHistory = history.planHistory.filter(entry => entry.planId === planId);
    return filteredHistory;
  } catch (error) {
    console.error('Error getting plan history:', error);
    
    // If we have cached data, use it as fallback
    const cachedHistory = getCachedData<PlanHistoryEntry[]>(CACHE_KEYS.PLAN_HISTORY, userId);
    if (cachedHistory) {
      return cachedHistory.filter(entry => entry.planId === planId);
    }
    
    throw error;
  }
};

/**
 * Gets all plan history for a user
 * @param userId The user ID
 * @param limitCount Optional limit on number of entries to return
 * @returns Array of all history entries
 */
export const getAllPlanHistory = async (userId: string, limitCount?: number): Promise<PlanHistoryEntry[]> => {
  try {
    console.log(`Fetching plan history for user: ${userId}`);
    
    // Check if we're online
    const online = isOnline();
    
    // Try to get from cache first
    const cachedHistory = getCachedData<PlanHistoryEntry[]>(CACHE_KEYS.PLAN_HISTORY, userId);
    
    // If we're offline and have cached data, return it
    if (!online && cachedHistory) {
      console.log(`Offline: Using cached history with ${cachedHistory.length} entries`);
      return limitCount ? cachedHistory.slice(0, limitCount) : cachedHistory;
    }
    
    // If we're offline and don't have cached data, throw a specific error
    if (!online && !cachedHistory) {
      console.warn('Offline with no cached history data');
      throw new Error('Failed to get document because the client is offline.');
    }
    
    // We're online, proceed with fetching from Firestore
    try {
      // First try to get from user history document
      const history = await getUserHistory(userId);
      if (history?.planHistory && history.planHistory.length > 0) {
        console.log(`Found ${history.planHistory.length} history entries in user history document`);
        
        const sortedHistory = [...history.planHistory].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Cache the results for offline use
        setCachedData(CACHE_KEYS.PLAN_HISTORY, userId, sortedHistory);
        
        return limitCount ? sortedHistory.slice(0, limitCount) : sortedHistory;
      }
      
      // If no history in user document, try to fetch from dedicated planHistory collection
      console.log('No history in user document, checking planHistory collection');
      
      // Create a reference to the planHistory collection
      const planHistoryRef = collection(db, 'planHistory');
      
      // Create a query against the collection
      const q = query(
        planHistoryRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limitCount ? limit(limitCount) : limit(100) // Default limit to avoid excessive data
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} entries in planHistory collection`);
      
      if (querySnapshot.empty) {
        // Cache empty result
        setCachedData(CACHE_KEYS.PLAN_HISTORY, userId, []);
        return [];
      }
      
      // Convert query results to PlanHistoryEntry objects
      const entries: PlanHistoryEntry[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        entries.push({
          planId: data.planId,
          action: data.action,
          timestamp: data.timestamp,
          details: data.details
        });
      });
      
      // Sort by timestamp (newest first)
      const sortedEntries = entries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Cache the results for offline use
      setCachedData(CACHE_KEYS.PLAN_HISTORY, userId, sortedEntries);
      
      return limitCount ? sortedEntries.slice(0, limitCount) : sortedEntries;
    } catch (firestoreError) {
      console.error('Error with Firestore query:', firestoreError);
      
      // If we have cached data, use it as fallback
      if (cachedHistory) {
        console.log(`Using cached history as fallback after error`);
        return limitCount ? cachedHistory.slice(0, limitCount) : cachedHistory;
      }
      
      // Return empty array as last resort
      return [];
    }
  } catch (error) {
    console.error('Error getting all plan history:', error);
    
    // If we have cached data, use it as fallback
    const cachedHistory = getCachedData<PlanHistoryEntry[]>(CACHE_KEYS.PLAN_HISTORY, userId);
    if (cachedHistory) {
      console.log(`Using cached history as fallback after error`);
      return limitCount ? cachedHistory.slice(0, limitCount) : cachedHistory;
    }
    
    throw error;
  }
};

/**
 * Gets plan activity summary (count of actions by type)
 * @param userId The user ID
 * @returns Object with counts of different actions
 */
export const getPlanActivitySummary = async (userId: string) => {
  try {
    // Check if we're online
    const online = isOnline();
    
    // Try to get from cache first
    const cachedSummary = getCachedData<Record<string, number>>(CACHE_KEYS.ACTIVITY_SUMMARY, userId);
    
    // If we're offline and have cached data, return it
    if (!online && cachedSummary) {
      console.log('Offline: Using cached activity summary');
      return cachedSummary;
    }
    
    // If we're offline and don't have cached data, return empty summary
    if (!online && !cachedSummary) {
      console.warn('Offline with no cached activity summary data');
      return {
        created: 0,
        modified: 0,
        viewed: 0,
        favorited: 0,
        unfavorited: 0,
        deleted: 0
      };
    }
    
    // We're online, proceed with fetching from Firestore
    try {
      // Try to get history entries from user history document first (no index required)
      const history = await getUserHistory(userId);
      if (history?.planHistory && history.planHistory.length > 0) {
        console.log(`Using ${history.planHistory.length} entries from user history for activity summary`);
        
        // Calculate summary from the entries in user history
        const summary = history.planHistory.reduce((summary, entry) => {
          summary[entry.action] = (summary[entry.action] || 0) + 1;
          return summary;
        }, {} as Record<PlanHistoryEntry['action'], number>);
        
        // Cache the results for offline use
        setCachedData(CACHE_KEYS.ACTIVITY_SUMMARY, userId, summary);
        
        return summary;
      }
      
      // Try to get history entries from Firestore with simple query
      const planHistoryRef = collection(db, 'planHistory');
      const q = query(
        planHistoryRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.docs.length} history entries for activity summary`);
      
      if (querySnapshot.empty) {
        const emptySummary = {
          created: 0,
          modified: 0,
          viewed: 0,
          favorited: 0,
          unfavorited: 0,
          deleted: 0
        };
        
        // Cache empty result
        setCachedData(CACHE_KEYS.ACTIVITY_SUMMARY, userId, emptySummary);
        return emptySummary;
      }
      
      // Calculate summary from the Firestore entries
      const summary = {} as Record<PlanHistoryEntry['action'], number>;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const action = data.action as PlanHistoryEntry['action'];
        summary[action] = (summary[action] || 0) + 1;
      });
      
      // Cache the results for offline use
      setCachedData(CACHE_KEYS.ACTIVITY_SUMMARY, userId, summary);
      
      return summary;
    } catch (firestoreError) {
      console.error('Error with Firestore query for activity summary:', firestoreError);
      
      // If we have cached data, use it as fallback
      if (cachedSummary) {
        console.log('Using cached activity summary as fallback after error');
        return cachedSummary;
      }
      
      // Return empty summary as last resort
      return {
        created: 0,
        modified: 0,
        viewed: 0,
        favorited: 0,
        unfavorited: 0,
        deleted: 0
      };
    }
  } catch (error) {
    console.error('Error getting plan activity summary:', error);
    
    // If we have cached data, use it as fallback
    const cachedSummary = getCachedData<Record<string, number>>(CACHE_KEYS.ACTIVITY_SUMMARY, userId);
    if (cachedSummary) {
      console.log('Using cached activity summary as fallback after error');
      return cachedSummary;
    }
    
    // Return empty summary as last resort
    return {
      created: 0,
      modified: 0,
      viewed: 0,
      favorited: 0,
      unfavorited: 0,
      deleted: 0
    };
  }
};

/**
 * Tracks when a plan is created
 */
export const trackPlanCreated = async (userId: string, plan: DietPlan): Promise<void> => {
  await addPlanHistoryEntry(userId, plan.planId, 'created', 
    `Created ${plan.mealPlans.length}-day meal plan`);
};

/**
 * Tracks when a plan is modified
 */
export const trackPlanModified = async (userId: string, planId: string, details?: string): Promise<void> => {
  await addPlanHistoryEntry(userId, planId, 'modified', details);
};

/**
 * Tracks when a plan is viewed
 */
export const trackPlanViewed = async (userId: string, planId: string): Promise<void> => {
  await addPlanHistoryEntry(userId, planId, 'viewed');
};

/**
 * Tracks when a plan is favorited
 */
export const trackPlanFavorited = async (userId: string, planId: string): Promise<void> => {
  await addPlanHistoryEntry(userId, planId, 'favorited');
};

/**
 * Tracks when a plan is unfavorited
 */
export const trackPlanUnfavorited = async (userId: string, planId: string): Promise<void> => {
  await addPlanHistoryEntry(userId, planId, 'unfavorited');
};

/**
 * Tracks when a plan is deleted
 */
export const trackPlanDeleted = async (userId: string, planId: string): Promise<void> => {
  await addPlanHistoryEntry(userId, planId, 'deleted');
};
