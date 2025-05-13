import { collection, addDoc, getDocs, query, orderBy, limit as firestoreLimit, where, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firestore';
import { DietPlan, UserData, MealPlan } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Save a new diet plan to Firestore
export const saveDietPlan = async (dietPlan: Omit<DietPlan, 'planId' | 'createdAt'>): Promise<string> => {
  try {
    console.log("Starting saveDietPlan function...");
    
    // Create a complete diet plan with ID and timestamp
    const planId = uuidv4();
    console.log(`Generated new plan ID: ${planId}`);
    
    const completeDietPlan: DietPlan = {
      ...dietPlan,
      planId: planId,
      createdAt: new Date(),
    };
    
    console.log("Created complete diet plan object");

    // Ensure mealPlans is properly structured
    if (!completeDietPlan.mealPlans || !Array.isArray(completeDietPlan.mealPlans)) {
      console.warn("MealPlans is not an array, initializing as empty array");
      completeDietPlan.mealPlans = [];
    }

    // Log the userId to make sure it's being correctly passed
    console.log(`Saving plan for user ID: ${completeDietPlan.userId}`);

    // Convert any complex objects or dates for Firestore
    const firestoreSafePlan = {
      ...completeDietPlan,
      createdAt: serverTimestamp(),
      mealPlans: completeDietPlan.mealPlans.map(plan => ({
        ...plan,
        // Make sure any nested objects are properly serializable
        nutritionInfo: plan.nutritionInfo ? {
          calories: Number(plan.nutritionInfo.calories),
          protein: Number(plan.nutritionInfo.protein),
          carbs: Number(plan.nutritionInfo.carbs),
          fat: Number(plan.nutritionInfo.fat),
        } : null,
      }))
    };

    console.log("Prepared Firestore-safe plan object");

    // Create the collection reference
    const dietPlansCollection = collection(db, 'diet_plans');
    console.log(`Created reference to 'diet_plans' collection`);

    // Add to Firestore
    console.log("Attempting to add document to Firestore...");
    const docRef = await addDoc(dietPlansCollection, firestoreSafePlan);
    console.log(`Diet plan saved with document ID: ${docRef.id}`);
    console.log(`Diet plan saved with plan ID: ${planId}`);

    return planId;
  } catch (error) {
    console.error("Error saving diet plan: ", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    throw error;
  }
};

// Get a specific diet plan by ID
export const getDietPlanById = async (planId: string): Promise<DietPlan | null> => {
  try {
    const q = query(
      collection(db, 'diet_plans'),
      where('planId', '==', planId),
      firestoreLimit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`No diet plan found with ID: ${planId}`);
      return null;
    }
    
    const docData = querySnapshot.docs[0].data();
    console.log("Raw diet plan data from Firestore:", docData);
    
    // Ensure createdAt is a Date object
    const createdAt = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
    
    // Ensure mealPlans is properly structured
    let mealPlans = [];
    if (docData.mealPlans && Array.isArray(docData.mealPlans)) {
      mealPlans = docData.mealPlans.map((plan: any) => ({
        ...plan,
        // Ensure day is a number
        day: Number(plan.day),
        // Ensure nutritionInfo is properly structured
        nutritionInfo: plan.nutritionInfo ? {
          calories: Number(plan.nutritionInfo.calories),
          protein: Number(plan.nutritionInfo.protein),
          carbs: Number(plan.nutritionInfo.carbs),
          fat: Number(plan.nutritionInfo.fat),
        } : null,
        // Ensure meals object is properly structured
        meals: {
          breakfast: plan.meals?.breakfast || "Balanced breakfast",
          lunch: plan.meals?.lunch || "Nutritious lunch",
          dinner: plan.meals?.dinner || "Light dinner",
          snacks: Array.isArray(plan.meals?.snacks) ? plan.meals.snacks : ["Healthy snack"],
        }
      }));
    }
    
    // Create a properly structured DietPlan object
    const dietPlan: DietPlan = {
      planId: docData.planId,
      userId: docData.userId,
      userData: docData.userData || {},
      mealPlans: mealPlans,
      recommendations: Array.isArray(docData.recommendations) ? docData.recommendations : [],
      createdAt: createdAt,
    };
    
    console.log("Processed diet plan:", dietPlan);
    return dietPlan;
  } catch (error) {
    console.error("Error getting diet plan: ", error);
    throw error;
  }
};

// Get all diet plans for a specific user
export const getUserDietPlans = async (userId: string): Promise<DietPlan[]> => {
  try {
    const q = query(
      collection(db, 'diet_plans'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Retrieved ${querySnapshot.size} diet plans for user: ${userId}`);
    
    const dietPlans: DietPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      
      // Ensure createdAt is a Date object
      const createdAt = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
      
      // Ensure mealPlans is properly structured
      let mealPlans = [];
      if (docData.mealPlans && Array.isArray(docData.mealPlans)) {
        mealPlans = docData.mealPlans.map((plan: any) => ({
          ...plan,
          // Ensure day is a number
          day: Number(plan.day),
          // Ensure nutritionInfo is properly structured
          nutritionInfo: plan.nutritionInfo ? {
            calories: Number(plan.nutritionInfo.calories),
            protein: Number(plan.nutritionInfo.protein),
            carbs: Number(plan.nutritionInfo.carbs),
            fat: Number(plan.nutritionInfo.fat),
          } : null,
          // Ensure meals object is properly structured
          meals: {
            breakfast: plan.meals?.breakfast || "Balanced breakfast",
            lunch: plan.meals?.lunch || "Nutritious lunch",
            dinner: plan.meals?.dinner || "Light dinner",
            snacks: Array.isArray(plan.meals?.snacks) ? plan.meals.snacks : ["Healthy snack"],
          }
        }));
      }
      
      // Create a properly structured DietPlan object
      const dietPlan: DietPlan = {
        planId: docData.planId,
        userId: docData.userId,
        userData: docData.userData || {},
        mealPlans: mealPlans,
        recommendations: Array.isArray(docData.recommendations) ? docData.recommendations : [],
        createdAt: createdAt,
      };
      
      dietPlans.push(dietPlan);
    });
    
    return dietPlans;
  } catch (error) {
    console.error("Error getting user diet plans: ", error);
    throw error;
  }
};

// Get recent diet plans
export const getRecentDietPlans = async (limitCount = 5): Promise<DietPlan[]> => {
  try {
    const q = query(
      collection(db, 'diet_plans'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Retrieved ${querySnapshot.size} recent diet plans`);
    
    const dietPlans: DietPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      
      // Ensure createdAt is a Date object
      const createdAt = docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date();
      
      // Ensure mealPlans is properly structured
      let mealPlans = [];
      if (docData.mealPlans && Array.isArray(docData.mealPlans)) {
        mealPlans = docData.mealPlans.map((plan: any) => ({
          ...plan,
          // Ensure day is a number
          day: Number(plan.day),
          // Ensure nutritionInfo is properly structured
          nutritionInfo: plan.nutritionInfo ? {
            calories: Number(plan.nutritionInfo.calories),
            protein: Number(plan.nutritionInfo.protein),
            carbs: Number(plan.nutritionInfo.carbs),
            fat: Number(plan.nutritionInfo.fat),
          } : null,
          // Ensure meals object is properly structured
          meals: {
            breakfast: plan.meals?.breakfast || "Balanced breakfast",
            lunch: plan.meals?.lunch || "Nutritious lunch",
            dinner: plan.meals?.dinner || "Light dinner",
            snacks: Array.isArray(plan.meals?.snacks) ? plan.meals.snacks : ["Healthy snack"],
          }
        }));
      }
      
      // Create a properly structured DietPlan object
      const dietPlan: DietPlan = {
        planId: docData.planId,
        userId: docData.userId,
        userData: docData.userData || {},
        mealPlans: mealPlans,
        recommendations: Array.isArray(docData.recommendations) ? docData.recommendations : [],
        createdAt: createdAt,
      };
      
      dietPlans.push(dietPlan);
    });
    
    return dietPlans;
  } catch (error) {
    console.error("Error getting recent diet plans: ", error);
    throw error;
  }
};

// Save user data (form inputs) for future reference
export const saveUserData = async (userId: string, userData: UserData): Promise<string> => {
  try {
    const userDataWithId = {
      ...userData,
      userId,
      timestamp: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'user_data'), userDataWithId);
    console.log("User data saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving user data: ", error);
    throw error;
  }
};

// Get user's saved form data history
export const getUserDataHistory = async (userId: string): Promise<UserData[]> => {
  try {
    const q = query(
      collection(db, 'user_data'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const userDataHistory: UserData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      userDataHistory.push(data as UserData);
    });
    
    return userDataHistory;
  } catch (error) {
    console.error("Error getting user data history: ", error);
    throw error;
  }
}; 