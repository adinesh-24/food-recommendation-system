import { useState } from "react";
import { UserData, DietPlan } from "@/types";
import MultiStepForm from "@/components/MultiStepForm";
import DietPlanDisplay from "@/components/DietPlanDisplay";
import LoadingCard from "@/components/LoadingCard";
import { useToast } from "@/hooks/use-toast";
import { generateMealPlan } from "@/services/geminiService";
import { v4 as uuidv4 } from "uuid";
import useDietPlan from "@/hooks/useDietPlan";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createDietPlan } = useDietPlan();
  const { user } = useAuth();

  const handleFormSubmit = async (userData: UserData) => {
    setIsLoading(true);
    try {
      // Log authentication status
      console.log("Authentication status:", user ? "Logged in" : "Not logged in");
      if (user) {
        console.log("Current user:", { uid: user.uid, email: user.email });
      }

      // Add email from authenticated user if available
      if (user?.email) {
        userData.email = user.email;
        console.log("Added user email to userData:", userData.email);
      }

      // Generate meal plan using AI
      console.log("Generating meal plan with user data:", userData);
      const generatedDietPlan = await generateMealPlan(userData);
      
      if (!generatedDietPlan) {
        throw new Error("Failed to generate meal plan");
      }

      console.log("Generated diet plan successfully:", generatedDietPlan);

      // Create the diet plan object using the data from the AI
      const newPlan: Omit<DietPlan, 'planId' | 'createdAt' | 'userId'> = {
        userData,
        mealPlans: generatedDietPlan.mealPlans || [],
        recommendations: generatedDietPlan.recommendations || [
          "Stay hydrated throughout the day",
          "Try to eat meals at consistent times",
          "Include a variety of colorful vegetables in your meals",
        ],
      };

      // Save to Firestore if user is logged in
      if (user) {
        console.log("User is logged in, saving to Firestore with user ID:", user.uid);
        
        try {
          const savedPlan = await createDietPlan(userData, newPlan);
          if (savedPlan) {
            console.log("Diet plan saved to Firebase successfully:", savedPlan);
            setDietPlan(savedPlan);
          } else {
            console.error("createDietPlan returned null, using local plan instead");
            // Create a local version if Firestore save failed
            const localPlan = {
              ...newPlan,
              planId: uuidv4(),
              createdAt: new Date(),
              userId: user.uid,
            };
            setDietPlan(localPlan);
            console.log("Using local diet plan:", localPlan);
          }
        } catch (firebaseError) {
          console.error("Error saving to Firebase:", firebaseError);
          // Create a local version if Firestore save failed
          const localPlan = {
            ...newPlan,
            planId: uuidv4(),
            createdAt: new Date(),
            userId: user.uid,
          };
          setDietPlan(localPlan);
          console.log("Using local diet plan due to save error:", localPlan);
        }
      } else {
        console.log("User is not logged in, using local plan");
        // Create a local version if user is not logged in
        const localPlan = {
          ...newPlan,
          planId: uuidv4(),
          createdAt: new Date(),
          userId: "anonymous",
        };
        setDietPlan(localPlan);
        console.log("Using local diet plan (no user):", localPlan);
      }
      
      toast({
        title: "Success!",
        description: user 
          ? "Your personalized diet plan is ready and saved to your account."
          : "Your personalized diet plan is ready. Sign in to save it for later!",
      });
    } catch (error) {
      console.error("Error generating diet plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to generate your diet plan. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>TasteFlow | Personalized Diet Plans</title>
        <meta
          name="description"
          content="Get personalized diet plans based on your preferences and nutritional needs."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {!dietPlan && !isLoading && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-nutrition-green mb-4">
                Your Personalized Nutrition Journey
              </h1>
              <p className="text-xl text-gray-600">
                Get a customized diet plan based on your needs and preferences
              </p>
            </div>
            <MultiStepForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}

        {isLoading && <LoadingCard />}

        {dietPlan && !isLoading && <DietPlanDisplay dietPlan={dietPlan} />}
      </div>
    </>
  );
}
