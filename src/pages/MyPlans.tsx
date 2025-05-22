import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import useDietPlan from "@/hooks/useDietPlan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Calendar, ArrowRight } from "lucide-react";
import LoadingCard from "@/components/LoadingCard";
import { formatDistanceToNow } from "date-fns";
import DietPlanDisplay from "@/components/DietPlanDisplay"; // Import DietPlanDisplay

const MyPlans = () => {
  const { planId: planIdFromUrl } = useParams<{ planId?: string }>();
  const { user } = useAuth();
  const {
    userPlans,
    loadUserPlans,
    isLoading,
    currentPlan,
    loadPlanById,
  } = useDietPlan();
  
  const navigate = useNavigate();
  const plansListLoadedRef = useRef(false); // To track if the list of plans has been loaded
  const unsubscribeUserPlansRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=my-plans");
      return;
    }

    if (planIdFromUrl) {
      // Viewing a single plan
      loadPlanById(planIdFromUrl);
      plansListLoadedRef.current = false; // Reset list loaded status
      if (unsubscribeUserPlansRef.current) {
        unsubscribeUserPlansRef.current();
        unsubscribeUserPlansRef.current = null;
      }
    } else {
      // Viewing the list of plans
      // Check if loadUserPlans is a function before calling
      if (typeof loadUserPlans === 'function' && !plansListLoadedRef.current) {
        const setupSubscription = async () => {
          const unsubscribe = await loadUserPlans();
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribeUserPlansRef.current = unsubscribe;
          }
          plansListLoadedRef.current = true;
        };
        setupSubscription();
      }
    }

    // Cleanup for the user plans list subscription
    return () => {
      if (unsubscribeUserPlansRef.current) {
        unsubscribeUserPlansRef.current();
        unsubscribeUserPlansRef.current = null;
      }
    };
  }, [user, planIdFromUrl, loadPlanById, loadUserPlans, navigate]);

  if (isLoading) {
    return <LoadingCard />;
  }

  if (planIdFromUrl) {
    if (currentPlan) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Meal Plan Details</h1>
            <Button variant="outline" onClick={() => navigate('/my-plans')}>Back to My Plans</Button>
          </div>
          <DietPlanDisplay dietPlan={currentPlan} />
        </div>
      );
    } else {
      // Plan ID in URL, but plan not found (and not loading)
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <UtensilsCrossed className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold mb-4">Plan Not Found</h1>
          <p className="text-gray-600 mb-6">The meal plan you are looking for does not exist or could not be loaded.</p>
          <Button onClick={() => navigate('/my-plans')}>Back to My Plans</Button>
        </div>
      );
    }
  }

  // Display list of plans if no planIdFromUrl
  if (userPlans && userPlans.length > 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Diet Plans</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPlans.map((plan) => (
            <Card key={plan.planId} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.userData.dietaryPreference} Diet Plan</CardTitle>
                  <div className="bg-nutrition-green bg-opacity-10 px-3 py-1 rounded-full text-xs font-medium text-nutrition-green whitespace-nowrap">
                    <Calendar size={12} className="inline-block mr-1" />
                    {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <CardDescription>
                  {plan.userData.days} days • {plan.userData.cuisinePreference} cuisine
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {plan.recommendations && plan.recommendations.length > 0 
                    ? plan.recommendations[0] 
                    : "Personalized diet plan to achieve your health goals."}
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50 justify-end pt-4 mt-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-nutrition-green hover:text-nutrition-darkgreen"
                  onClick={() => navigate(`/plan/${plan.planId}`)} // Corrected navigation path
                >
                  View Plan <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // No plans and no specific planIdFromUrl
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Diet Plans</h1>
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No diet plans yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first diet plan.</p>
          <div className="mt-6">
            <Button onClick={() => navigate("/generate")}>
              Generate Diet Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPlans;