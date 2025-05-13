export interface UserData {
  age: number;
  height: number; // in cm
  weight: number; // in kg
  dietaryPreference: string;
  cuisinePreference: string;
  allergies: string[];
  days: number;
  email?: string;
  // Optional nutrition information
  useNutritionInput?: boolean; // Flag to indicate if using custom nutrition inputs
  calories?: number;
  protein?: number; // in grams
  fat?: number; // in grams
  carbs?: number; // in grams
  fiber?: number; // in grams
}

export interface MealPlan {
  day: number;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
}

export interface DietPlan {
  planId: string;
  userData: UserData;
  mealPlans: MealPlan[];
  recommendations?: string[];
  createdAt: Date;
  userId: string;
}

export interface UserPlans {
  email: string;
  plans: DietPlan[];
}

export interface UserProfile {
  email: string;
  name?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface UserHistory {
  email: string;
  plans: DietPlan[];
  favorites: string[]; // Array of planIds
  lastViewed: string[];
}

export interface UnsplashImage {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}
