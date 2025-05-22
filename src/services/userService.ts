import { UserProfile, UserHistory, DietPlan, PlanHistoryEntry } from "@/types";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { collections, createDocument, updateDocument, getDocument } from '@/config/firestore';

export const createUserProfile = async (userId: string, email: string, name?: string) => {
  const profile: UserProfile = {
    email,
    name,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  
  await createDocument(collections.users, userId, profile);
  return profile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    return await getDocument<UserProfile>(collections.users, userId);
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    await updateDocument(collections.users, userId, updates);
    return await getDocument<UserProfile>(collections.users, userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const addPlanToHistory = async (userId: string, plan: DietPlan) => {
  try {
    const currentHistory = await getDocument<UserHistory>(collections.userHistory, userId) || {
      email: plan.userData.email,
      plans: [],
      favorites: [],
      lastViewed: [],
      planHistory: []
    };

    // Create history entry for plan creation
    const historyEntry: PlanHistoryEntry = {
      planId: plan.planId,
      action: 'created',
      timestamp: new Date().toISOString(),
      details: `Created ${plan.mealPlans.length}-day meal plan`
    };

    const updatedHistory: UserHistory = {
      email: plan.userData.email,
      plans: [...currentHistory.plans, plan],
      favorites: currentHistory.favorites,
      lastViewed: [plan.planId, ...currentHistory.lastViewed].slice(0, 10),
      planHistory: [...(currentHistory.planHistory || []), historyEntry]
    };

    await createDocument(collections.userHistory, userId, updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error('Error adding plan to history:', error);
    throw error;
  }
};

export const getUserHistory = async (userId: string): Promise<UserHistory | null> => {
  try {
    return await getDocument<UserHistory>(collections.userHistory, userId);
  } catch (error) {
    console.error('Error getting user history:', error);
    throw error;
  }
};

export const toggleFavoritePlan = async (userId: string, planId: string) => {
  try {
    const history = await getDocument<UserHistory>(collections.userHistory, userId);
    if (!history) {
      throw new Error('User history not found');
    }

    const isFavorite = history.favorites.includes(planId);
    const updatedFavorites = isFavorite
      ? history.favorites.filter(id => id !== planId)
      : [...history.favorites, planId];

    // Create history entry for favorite action
    const historyEntry: PlanHistoryEntry = {
      planId,
      action: isFavorite ? 'unfavorited' : 'favorited',
      timestamp: new Date().toISOString()
    };

    const updatedHistory: UserHistory = {
      ...history,
      favorites: updatedFavorites,
      planHistory: [...(history.planHistory || []), historyEntry]
    };

    await updateDocument(collections.userHistory, userId, updatedHistory);
    return updatedHistory;
  } catch (error) {
    console.error('Error toggling favorite plan:', error);
    throw error;
  }
};

export const getFavoritePlans = async (userId: string): Promise<DietPlan[]> => {
  try {
    const history = await getUserHistory(userId);
    if (!history) return [];

    return history.plans.filter(plan => history.favorites.includes(plan.planId));
  } catch (error) {
    console.error('Error getting favorite plans:', error);
    throw error;
  }
};

export const getRecentPlans = async (userId: string, limit = 5): Promise<DietPlan[]> => {
  try {
    const history = await getUserHistory(userId);
    if (!history) return [];

    // Add view history entry for the first plan (most recent)
    if (history.lastViewed.length > 0) {
      const mostRecentPlanId = history.lastViewed[0];
      // Create history entry for plan view
      const historyEntry: PlanHistoryEntry = {
        planId: mostRecentPlanId,
        action: 'viewed',
        timestamp: new Date().toISOString()
      };

      // Update history with view record
      const updatedHistory: UserHistory = {
        ...history,
        planHistory: [...(history.planHistory || []), historyEntry]
      };
      await updateDocument(collections.userHistory, userId, updatedHistory);
    }

    return history.plans
      .filter(plan => history.lastViewed.includes(plan.planId))
      .sort((a, b) => {
        const aIndex = history.lastViewed.indexOf(a.planId);
        const bIndex = history.lastViewed.indexOf(b.planId);
        return aIndex - bIndex;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent plans:', error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    await createUserProfile(user.uid, email);

    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login
    await updateUserProfile(user.uid, {
      lastLogin: new Date().toISOString()
    });

    return user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const checkEmailVerification = async (user: User): Promise<boolean> => {
  try {
    // Reload user to get latest email verification status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    throw error;
  }
};

/**
 * Get plan history for a user
 * @param userId User ID to get history for
 * @param limit Optional limit on number of entries to return
 * @returns Array of plan history entries sorted by timestamp (newest first)
 */
export const getPlanHistory = async (userId: string, limit?: number): Promise<PlanHistoryEntry[]> => {
  try {
    const history = await getUserHistory(userId);
    if (!history || !history.planHistory) return [];

    const sortedHistory = [...history.planHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return limit ? sortedHistory.slice(0, limit) : sortedHistory;
  } catch (error) {
    console.error('Error getting plan history:', error);
    throw error;
  }
};

/**
 * Get plan history for a specific plan
 * @param userId User ID
 * @param planId Plan ID to get history for
 * @returns Array of history entries for the plan
 */
export const getPlanHistoryByPlanId = async (userId: string, planId: string): Promise<PlanHistoryEntry[]> => {
  try {
    const history = await getUserHistory(userId);
    if (!history || !history.planHistory) return [];

    return history.planHistory
      .filter(entry => entry.planId === planId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error getting plan history by plan ID:', error);
    throw error;
  }
};