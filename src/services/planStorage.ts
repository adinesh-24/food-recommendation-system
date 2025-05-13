import { DietPlan, UserPlans } from "@/types";

const STORAGE_KEY = "user_meal_plans";

export const savePlan = (plan: DietPlan) => {
  const userEmail = localStorage.getItem("userEmail");
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
  if (existingPlanIndex >= 0) {
    userPlans.plans[existingPlanIndex] = plan;
  } else {
    userPlans.plans.push(plan);
  }
  
  // Save back to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));
};

export const getUserPlans = (): DietPlan[] => {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) return [];
  
  const existingPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as UserPlans[];
  const userPlans = existingPlans.find(p => p.email === userEmail);
  
  return userPlans?.plans || [];
};

export const deletePlan = (planId: string) => {
  const userEmail = localStorage.getItem("userEmail");
  if (!userEmail) return;
  
  const existingPlans = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as UserPlans[];
  const userPlans = existingPlans.find(p => p.email === userEmail);
  
  if (userPlans) {
    userPlans.plans = userPlans.plans.filter(p => p.planId !== planId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));
  }
}; 