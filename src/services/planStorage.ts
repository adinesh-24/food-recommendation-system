import { DietPlan, UserPlans } from "@/types";
import { addPlanHistoryEntry } from "./planHistoryService";

const STORAGE_KEY = "user_meal_plans";

export const savePlan = async (plan: DietPlan) => {
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");
  if (!userEmail) return;

  // Get existing plans
  const existingPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as UserPlans[];
  
  // Find user's plans
  let userPlans = existingPlans.find(p => p.email === userEmail);
  
  if (!userPlans) {
    // Create new user plans entry
    userPlans = { email: userEmail, plans: [] };
    existingPlans.push(userPlans);
  }
  
  // Add or update the plan
  const existingPlanIndex = userPlans.plans.findIndex(p => p.planId === plan.planId);
  const isUpdate = existingPlanIndex >= 0;
  
  if (isUpdate) {
    userPlans.plans[existingPlanIndex] = plan;
  } else {
    userPlans.plans.push(plan);
  }
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));
  
  // Track plan history if user is logged in
  if (userId) {
    try {
      await addPlanHistoryEntry(
        userId,
        plan.planId,
        isUpdate ? 'modified' : 'created',
        isUpdate ? 'Plan updated' : `Created ${plan.mealPlans.length}-day meal plan`
      );
    } catch (error) {
      console.error('Error tracking plan history:', error);
    }
  }
};

export const getUserPlans = (): DietPlan[] => {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) return [];
  
  const existingPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as UserPlans[];
  const userPlans = existingPlans.find(p => p.email === userEmail);
  
  return userPlans?.plans || [];
};

/**
 * Get a specific plan by ID
 * @param planId The ID of the plan to retrieve
 * @returns The plan or null if not found
 */
export const getPlanById = async (planId: string): Promise<DietPlan | null> => {
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");
  if (!userEmail) return null;
  
  const plans = getUserPlans();
  const plan = plans.find(p => p.planId === planId);
  
  // Track plan view in history if found
  if (plan && userId) {
    try {
      await addPlanHistoryEntry(userId, planId, 'viewed');
    } catch (error) {
      console.error('Error tracking plan view:', error);
    }
  }
  
  return plan || null;
};

export const deletePlan = async (planId: string) => {
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");
  if (!userEmail) return;
  
  const existingPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as UserPlans[];
  const userPlans = existingPlans.find(p => p.email === userEmail);
  
  if (userPlans) {
    userPlans.plans = userPlans.plans.filter(p => p.planId !== planId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));
    
    // Track plan deletion in history
    if (userId) {
      try {
        await addPlanHistoryEntry(userId, planId, 'deleted', 'Plan deleted');
      } catch (error) {
        console.error('Error tracking plan deletion:', error);
      }
    }
  }
};