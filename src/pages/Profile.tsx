import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import useDietPlan from "@/hooks/useDietPlan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, UtensilsCrossed, Clock, Calendar, ArrowRight, Edit, Check } from "lucide-react";
import LoadingCard from "@/components/LoadingCard";
import { formatDistanceToNow } from "date-fns";

const Profile = () => {
  const { user, userProfile, signOut } = useAuth();
  const { userPlans, loadUserPlans, isLoading } = useDietPlan();
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate("/login?redirect=profile");
      return;
    }

    // Load user's diet plans
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const unsubscribe = await loadUserPlans();
        if (typeof unsubscribe === 'function') {
          // This is a cleanup function to unsubscribe from the real-time updates
          return unsubscribe;
        }
      } catch (error) {
        console.error("Error loading plans:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your diet plans."
        });
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [user, navigate, loadUserPlans, toast]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!user) {
    return null; // User will be redirected in useEffect
  }

  const recentPlans = [...(userPlans || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-4">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
              <AvatarFallback className="text-2xl">{user.displayName ? getInitials(user.displayName) : "U"}</AvatarFallback>
            </Avatar>
            
            <div className="w-full space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <div className="flex items-center mt-1">
                  <Input id="name" value={user.displayName || "Not set"} disabled />
                  <Button size="icon" variant="ghost" className="ml-2">
                    <Edit size={16} />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || ""} disabled />
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                  <Check size={12} className="mr-1" />
                  Email verified
                </div>
              </div>
              
              <div>
                <Label>Account Created</Label>
                <p className="text-sm text-gray-600">
                  {user.metadata?.creationTime 
                    ? formatDistanceToNow(new Date(user.metadata.creationTime), { addSuffix: true }) 
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={signOut} className="w-full">
              Sign Out
            </Button>
          </CardFooter>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="recent">
            <TabsList className="mb-4">
              <TabsTrigger value="recent">
                <Clock size={16} className="mr-2" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="plans">
                <UtensilsCrossed size={16} className="mr-2" />
                Your Diet Plans
              </TabsTrigger>
              <TabsTrigger value="settings">
                <UserCircle size={16} className="mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Recent Diet Plans</CardTitle>
                  <CardDescription>Your most recently created diet plans</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPlans ? (
                    <LoadingCard />
                  ) : recentPlans.length > 0 ? (
                    <div className="space-y-4">
                      {recentPlans.map((plan) => (
                        <Card key={plan.planId} className="overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{plan.userData.dietaryPreference} Diet Plan</h3>
                                <p className="text-sm text-gray-500">
                                  {plan.userData.days} days • {plan.userData.cuisinePreference} cuisine
                                </p>
                              </div>
                              <div className="bg-nutrition-green bg-opacity-10 px-3 py-1 rounded-full text-xs font-medium text-nutrition-green">
                                <Calendar size={12} className="inline-block mr-1" />
                                {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {plan.recommendations && plan.recommendations.length > 0 
                                ? plan.recommendations[0] 
                                : "Personalized diet plan"}
                            </p>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-nutrition-green"
                              onClick={() => navigate(`/plans/${plan.planId}`)}
                            >
                              View Plan <ArrowRight size={16} className="ml-2" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No diet plans yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first diet plan.</p>
                      <div className="mt-6">
                        <Button onClick={() => navigate("/generate")}>
                          Generate Diet Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                {recentPlans.length > 0 && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate("/my-plans")}
                    >
                      View All Plans
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="plans">
              {loadingPlans ? (
                <LoadingCard />
              ) : userPlans && userPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPlans.map((plan) => (
                    <Card key={plan.planId} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{plan.userData.dietaryPreference} Diet Plan</h3>
                            <p className="text-sm text-gray-500">
                              {plan.userData.days} days • {plan.userData.cuisinePreference} cuisine
                            </p>
                          </div>
                          <div className="bg-nutrition-green bg-opacity-10 px-3 py-1 rounded-full text-xs font-medium text-nutrition-green">
                            <Calendar size={12} className="inline-block mr-1" />
                            {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {plan.recommendations && plan.recommendations.length > 0 
                            ? plan.recommendations[0] 
                            : "Personalized diet plan"}
                        </p>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-nutrition-green"
                          onClick={() => navigate(`/plans/${plan.planId}`)}
                        >
                          View Plan <ArrowRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
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
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Diet Preferences</CardTitle>
                  <CardDescription>
                    Set your default diet preferences for meal planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="dietary-preference">Default Dietary Preference</Label>
                      <select
                        id="dietary-preference"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      >
                        <option>Vegetarian</option>
                        <option>Vegan</option>
                        <option>Pescatarian</option>
                        <option>Non-vegetarian</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cuisine-preference">Cuisine Preference</Label>
                      <select
                        id="cuisine-preference"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      >
                        <option>North Indian</option>
                        <option>South Indian</option>
                        <option>Both</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="allergies">Allergies (comma separated)</Label>
                      <Input id="allergies" placeholder="e.g., peanuts, dairy, shellfish" />
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Save Preferences</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile; 