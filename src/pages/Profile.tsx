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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, UtensilsCrossed, Clock, Calendar, ArrowRight, Edit, Check } from "lucide-react";
import LoadingCard from "@/components/LoadingCard";
import { formatDistanceToNow } from "date-fns";
import { updateUserProfile } from "../services/userService";
import { UserProfile as UserProfileType } from "@/types";

const Profile = () => {
  const { user, userProfile, signOut, setUserProfile } = useAuth();
  const { userPlans, loadUserPlans, isLoading } = useDietPlan();
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [defaultDietaryPreference, setDefaultDietaryPreference] = useState('');
  const [defaultCuisinePreference, setDefaultCuisinePreference] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [selectedHealthIssues, setSelectedHealthIssues] = useState<string[]>([]);
  const [otherHealthIssueText, setOtherHealthIssueText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDefaultDietaryPreference(userProfile.defaultDietaryPreference || '');
      setDefaultCuisinePreference(userProfile.defaultCuisinePreference || '');
      setAllergiesInput((userProfile.defaultAllergies || []).join(', '));
      
      const currentHealthIssues = userProfile.healthIssues || [];
      setSelectedHealthIssues(currentHealthIssues.filter(issue => !issue.startsWith('Other: ')));
      const otherIssue = currentHealthIssues.find(issue => issue.startsWith('Other: '));
      if (otherIssue) {
        setSelectedHealthIssues(prev => [...prev, 'Other']);
        setOtherHealthIssueText(otherIssue.replace('Other: ', ''));
      }
    }
  }, [userProfile]);

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

  const handleHealthIssueChange = (issue: string, checked: boolean) => {
    if (checked) {
      if (issue === 'None') {
        setSelectedHealthIssues(['None']);
        setOtherHealthIssueText(''); // Clear other text if None is selected
      } else {
        // If 'None' was selected, remove it. Add the new issue.
        setSelectedHealthIssues(prev => [...prev.filter(i => i !== 'None'), issue]);
      }
    } else {
      // If unchecking an issue
      setSelectedHealthIssues(prev => prev.filter((i) => i !== issue));
      if (issue === 'Other') {
        setOtherHealthIssueText(''); // Clear other text if 'Other' is unchecked
      }
    }
  };

  const handleSavePreferences = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save preferences.",
      });
      return;
    }
    setIsSaving(true);
    try {
      const processedAllergies = allergiesInput.split(',').map((a) => a.trim()).filter(a => a !== '');
      
      let finalHealthIssues: string[] = [];
      if (selectedHealthIssues.includes('None')) {
        finalHealthIssues = ['None'];
      } else {
        finalHealthIssues = selectedHealthIssues.filter(issue => issue !== 'Other'); // Start with non-Other issues
        if (selectedHealthIssues.includes('Other') && otherHealthIssueText.trim() !== '') {
          finalHealthIssues.push(`Other: ${otherHealthIssueText.trim()}`);
        }
      }
      if (finalHealthIssues.length === 0 && !selectedHealthIssues.includes('None')) {
        // If no specific issues are selected, and 'None' isn't explicitly chosen,
        // it's good practice to store an empty array or a default like 'None' if that's the app logic.
        // For now, let's store an empty array if nothing is actively selected over 'None'.
      } else if (finalHealthIssues.length > 1 && finalHealthIssues.includes('None')){
        //This case should ideally not happen due to the logic in handleHealthIssueChange
        //but as a safeguard, if 'None' is present with others, prioritize 'None'.
        finalHealthIssues = ['None'];
      }

      const userProfileUpdateData: Partial<UserProfileType> = {
        defaultDietaryPreference: defaultDietaryPreference || null, // Store null if empty
        defaultCuisinePreference: defaultCuisinePreference || null, // Store null if empty
        defaultAllergies: processedAllergies,
        healthIssues: finalHealthIssues,
      };

      // console.log("Saving data:", userProfileUpdateData); // For debugging

      const updatedProfile = await updateUserProfile(user.uid, userProfileUpdateData);
      
      if (updatedProfile) {
        setUserProfile(updatedProfile); // Update local auth context state
        toast({
          title: "Preferences Saved",
          description: "Your preferences have been successfully saved.",
        });
      } else {
        // This case might happen if updateUserProfile doesn't return the updated profile
        // or if there's an issue not caught by the try-catch block (less likely with await)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save preferences. Profile data might be inconsistent.",
        });
      }

    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        variant: "destructive",
        title: "Error Saving Preferences",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  <form className="space-y-6"> 
                    <div>
                      <Label htmlFor="dietary-preference">Default Dietary Preference</Label>
                      <select
                        id="dietary-preference"
                        value={defaultDietaryPreference} 
                        onChange={(e) => setDefaultDietaryPreference(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      >
                        <option value="">Select...</option>
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Pescatarian">Pescatarian</option>
                        <option value="Non-vegetarian">Non-vegetarian</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cuisine-preference">Cuisine Preference</Label>
                      <select
                        id="cuisine-preference"
                        value={defaultCuisinePreference} 
                        onChange={(e) => setDefaultCuisinePreference(e.target.value)} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                      >
                        <option value="">Select...</option>
                        <option value="North Indian">North Indian</option>
                        <option value="South Indian">South Indian</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="allergies">Allergies (comma separated)</Label>
                      <Input 
                        id="allergies" 
                        placeholder="e.g., peanuts, dairy, shellfish" 
                        value={allergiesInput} 
                        onChange={(e) => setAllergiesInput(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Health Issues</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="health-heart"
                          checked={selectedHealthIssues.includes('Heart Problem')}
                          onCheckedChange={(checked) => handleHealthIssueChange('Heart Problem', !!checked)}
                        />
                        <Label htmlFor="health-heart" className="font-normal">Heart Problem</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="health-none"
                          checked={selectedHealthIssues.includes('None')}
                          onCheckedChange={(checked) => handleHealthIssueChange('None', !!checked)}
                        />
                        <Label htmlFor="health-none" className="font-normal">None</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="health-other"
                          checked={selectedHealthIssues.includes('Other')}
                          onCheckedChange={(checked) => handleHealthIssueChange('Other', !!checked)}
                        />
                        <Label htmlFor="health-other" className="font-normal">Other</Label>
                      </div>
                      {selectedHealthIssues.includes('Other') && (
                        <Input 
                          id="health-other-text"
                          placeholder="Please specify other health issue"
                          value={otherHealthIssueText}
                          onChange={(e) => setOtherHealthIssueText(e.target.value)}
                          className="mt-1"
                        />
                      )}
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleSavePreferences} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
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