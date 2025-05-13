import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { saveDietPlan, getUserDietPlans, getRecentDietPlans, getDietPlanById, saveUserData } from '@/services/dietPlanService';
import { DietPlan, UserData } from '@/types';
import { db } from '@/config/firestore';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

export const useDietPlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const [currentPlan, setCurrentPlan] = useState<DietPlan | null>(null);
  const [userPlans, setUserPlans] = useState<DietPlan[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      console.log('App is online');
      toast({
        title: "You're back online",
        description: "Your changes will now be saved to the cloud.",
        duration: 3000,
      });
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      console.log('App is offline');
      toast({
        title: "You're offline",
        description: "Changes will be saved locally and synced when you reconnect.",
        duration: 3000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Save user form data and the resulting diet plan
  const createDietPlan = async (userData: UserData, dietPlan: Omit<DietPlan, 'planId' | 'createdAt' | 'userId'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your diet plan.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      console.log("Saving diet plan for user:", user.uid);
      
      // First save the user input data
      await saveUserData(user.uid, userData);
      console.log("User data saved successfully");
      
      // Then save the complete diet plan
      const planToSave = {
        ...dietPlan,
        userId: user.uid,
        userData: {
          ...userData,
          email: user.email || undefined,
        },
      };
      
      console.log("Saving diet plan:", planToSave);
      const planId = await saveDietPlan(planToSave);
      console.log("Diet plan saved with ID:", planId);
      
      // Get the saved plan
      const savedPlan = await getDietPlanById(planId);
      console.log("Retrieved saved plan:", savedPlan);
      
      if (savedPlan) {
        setCurrentPlan(savedPlan);
        
        toast({
          title: "Diet plan saved",
          description: "Your diet plan has been saved to your account.",
        });
        
        return savedPlan;
      } else {
        throw new Error("Failed to retrieve saved plan");
      }
    } catch (error) {
      console.error("Error creating diet plan:", error);
      
      if (connectionStatus === 'offline') {
        toast({
          title: "Offline mode",
          description: "Your plan will be saved when you're back online.",
        });
        
        // Return a local version of the plan for offline use
        const localPlan: DietPlan = {
          ...dietPlan,
          planId: `local-${Date.now()}`,
          createdAt: new Date(),
          userId: user.uid,
        };
        
        return localPlan;
      } else {
        toast({
          title: "Error saving diet plan",
          description: "There was an error saving your diet plan. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's diet plans from Firestore with real-time updates
  const loadUserPlans = async () => {
    if (!user) {
      setUserPlans([]);
      return () => {}; // Return empty function for cleanup when no user
    }

    setIsLoading(true);
    try {
      // Modified query that doesn't require a composite index:
      const q = query(
        collection(db, 'diet_plans'),
        where('userId', '==', user.uid)
      );
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const plans: DietPlan[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          plans.push({
            ...data,
            planId: doc.id, // Ensure planId is set correctly
            createdAt: data.createdAt?.toDate() || new Date(),
          } as DietPlan);
        });
        
        // Sort the plans client-side instead of using Firestore's orderBy
        plans.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log(`Loaded ${plans.length} plans for user ${user.uid}`);
        setUserPlans(plans);
        setIsLoading(false);
      }, (error) => {
        console.error("Error loading user plans:", error);
        setIsLoading(false);
        toast({
          title: "Error loading plans",
          description: error.message || "There was an error loading your diet plans.",
          variant: "destructive",
        });
      });
      
      // Return unsubscribe function for cleanup
      return unsubscribe;
    } catch (error: any) {
      console.error("Error setting up plans listener:", error);
      setIsLoading(false);
      toast({
        title: "Error loading plans",
        description: error.message || "There was an error loading your diet plans.",
        variant: "destructive",
      });
      return () => {}; // Return empty function for cleanup on error
    }
  };

  // Load a specific diet plan by ID
  const loadPlanById = async (planId: string) => {
    setIsLoading(true);
    try {
      console.log("Loading diet plan with ID:", planId);
      const plan = await getDietPlanById(planId);
      console.log("Retrieved plan:", plan);
      
      if (plan) {
        setCurrentPlan(plan);
        return plan;
      } else {
        throw new Error(`Diet plan with ID ${planId} not found`);
      }
    } catch (error) {
      console.error("Error loading diet plan:", error);
      toast({
        title: "Error loading plan",
        description: "There was an error loading the diet plan.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load recent diet plans (could be used for public gallery/showcase)
  const loadRecentPlans = async (limit = 5) => {
    setIsLoading(true);
    try {
      return await getRecentDietPlans(limit);
    } catch (error) {
      console.error("Error loading recent plans:", error);
      toast({
        title: "Error loading plans",
        description: "There was an error loading recent diet plans.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    connectionStatus,
    currentPlan,
    userPlans,
    createDietPlan,
    loadUserPlans,
    loadPlanById,
    loadRecentPlans,
  };
};

export default useDietPlan; 