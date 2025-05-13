import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import useDietPlan from "@/hooks/useDietPlan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Calendar, ArrowRight } from "lucide-react";
import LoadingCard from "@/components/LoadingCard";
import { formatDistanceToNow } from "date-fns";

const MyPlans = () => {
  const { user } = useAuth();
  const { userPlans, loadUserPlans, isLoading } = useDietPlan();
  const [loadingPlans, setLoadingPlans] = useState(true);
  const plansLoadedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const navigate = useNavigate();

  // Single effect to handle authentication and loading plans
  useEffect(() => {
    // If user is not logged in, redirect and clean up
    if (!user) {
      plansLoadedRef.current = false;
      navigate("/login?redirect=my-plans");
      return;
    }

    // Only load plans if they haven't been loaded yet
    if (!plansLoadedRef.current) {
      const loadPlans = async () => {
        setLoadingPlans(true);
        try {
          const unsubscribe = await loadUserPlans();
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribeRef.current = unsubscribe;
          }
          plansLoadedRef.current = true;
        } catch (error) {
          console.error("Error loading plans:", error);
        } finally {
          setLoadingPlans(false);
        }
      };

      loadPlans();
    } else {
      setLoadingPlans(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log("Cleaning up Firestore listener");
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, navigate, loadUserPlans]);

  // Update loading state based on isLoading changes
  useEffect(() => {
    if (!isLoading && plansLoadedRef.current) {
      setLoadingPlans(false);
    }
  }, [isLoading]);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Diet Plans</h1>

      {loadingPlans || isLoading ? (
        <LoadingCard />
      ) : userPlans && userPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPlans.map((plan) => (
            <Card key={plan.planId} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.userData.dietaryPreference} Diet Plan</CardTitle>
                  <div className="bg-nutrition-green bg-opacity-10 px-3 py-1 rounded-full text-xs font-medium text-nutrition-green">
                    <Calendar size={12} className="inline-block mr-1" />
                    {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <CardDescription>
                  {plan.userData.days} days • {plan.userData.cuisinePreference} cuisine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {plan.recommendations && plan.recommendations.length > 0 
                    ? plan.recommendations[0] 
                    : "Personalized diet plan"}
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50 justify-end pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-nutrition-green"
                  onClick={() => navigate(`/plans/${plan.planId}`)}
                >
                  View Plan <ArrowRight size={16} className="ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default MyPlans; 