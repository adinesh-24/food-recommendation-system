import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAllPlanHistory, getPlanActivitySummary, getDietPlansFromFirestore } from '@/services/planHistoryService';
import { getUserHistory } from '@/services/userService';
import { getDietPlanById } from '@/services/dietPlanService'; 
import { PlanHistoryEntry, DietPlan, MealPlan } from '@/types'; 
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'; 
import { CalendarIcon, WifiOff, RefreshCw, AlertCircle, Eye, ArchiveIcon, Info, Utensils, Leaf, Fish, Drumstick } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const PlanHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<PlanHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PlanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [activitySummary, setActivitySummary] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<DietPlan | null>(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const navigate = useNavigate();

  // Check network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(null);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user ID available, cannot fetch history');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setRetrying(false);
      console.log('Fetching plan history for user:', user.uid);
      
      const historyData = await getAllPlanHistory(user.uid);
      console.log(`Fetched ${historyData.length} history entries from user_plan_history`);

      const firestorePlansData = await getDietPlansFromFirestore(user.uid);
      console.log(`Fetched ${firestorePlansData.length} diet plans from diet_plans collection`);

      const planIdsToFetchDetails = new Set<string>();
      historyData.forEach(entry => {
        if (entry.action !== 'created' && entry.action !== 'retrieved_plan' && entry.planId) {
          planIdsToFetchDetails.add(entry.planId);
        }
      });

      const planDetailsMap = new Map<string, DietPlan | null>();
      if (planIdsToFetchDetails.size > 0) {
        console.log('Fetching details for plan IDs:', Array.from(planIdsToFetchDetails));
        const fetchPromises = Array.from(planIdsToFetchDetails).map(pid => 
          getDietPlanById(pid).then(plan => ({ planId: pid, plan }))
        );
        const fetchedPlansResults = await Promise.all(fetchPromises);
        fetchedPlansResults.forEach(result => {
          if (result.plan) {
            planDetailsMap.set(result.planId, result.plan);
          }
        });
        console.log('Fetched plan details map:', planDetailsMap);
      }

      const enhancedHistoryData = historyData.map(entry => {
        if (entry.planId && planDetailsMap.has(entry.planId)) {
          const plan = planDetailsMap.get(entry.planId);
          if (plan) {
            const planTitle = plan.userData?.dietaryPreference 
              ? `${plan.userData.dietaryPreference} Diet Plan` 
              : `Plan (${plan.planId.substring(0,4)}...)`;
            const actionText = entry.action.charAt(0).toUpperCase() + entry.action.slice(1);
            return {
              ...entry,
              details: `${actionText}: ${planTitle}`,
              planTitle: planTitle 
            };
          }
        }
        return entry;
      });

      const retrievedPlanEntries: PlanHistoryEntry[] = firestorePlansData.map(plan => ({
        planId: plan.planId,
        action: 'retrieved_plan',
        timestamp: plan.createdAt instanceof Date ? plan.createdAt.toISOString() : new Date(plan.createdAt).toISOString(),
        details: `${plan.userData?.dietaryPreference ? plan.userData.dietaryPreference + ' Diet Plan' : 'Diet Plan'} (Created: ${format(new Date(plan.createdAt), 'MMM d, yyyy')})`,
        planTitle: `${plan.userData?.dietaryPreference ? plan.userData.dietaryPreference + ' Diet Plan' : 'Diet Plan'}` 
      }));
      
      const combinedHistory = [...enhancedHistoryData, ...retrievedPlanEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Fetch activity summary
      const summary = await getPlanActivitySummary(user.uid);
      console.log('Activity summary:', summary);
      
      setHistory(combinedHistory);
      setFilteredHistory(combinedHistory);
      setActivitySummary(summary);
    } catch (err: any) {
      console.error('Error fetching plan history:', err);
      
      // Check if it's an offline error
      if (err?.message?.includes('client is offline') || !navigator.onLine) {
        setIsOffline(true);
      } else {
        setError('Failed to load plan history. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [user?.uid]);

  // Retry loading data when coming back online
  useEffect(() => {
    if (navigator.onLine && isOffline) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        fetchHistory();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOffline, fetchHistory]);

  // Initial data loading
  useEffect(() => {
    if (user?.uid) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user?.uid, fetchHistory]);

  const handleRetry = () => {
    setRetrying(true);
    fetchHistory();
  };

  useEffect(() => {
    // Apply filters
    let filtered = [...history];
    
    // Filter by date if selected
    if (selectedDate) {
      const targetDate = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter(entry => format(new Date(entry.timestamp), 'yyyy-MM-dd') === targetDate);
    }

    // Filter by action type if selected
    if (filterAction) {
      filtered = filtered.filter(entry => entry.action === filterAction);
    }

    // Filter out 'viewed' and 'modified' actions
    filtered = filtered.filter(entry => entry.action !== 'viewed' && entry.action !== 'modified');

    setFilteredHistory(filtered);
  }, [history, selectedDate, filterAction]);

  const handleResetFilters = () => {
    setSelectedDate(undefined);
    setFilterAction(null);
    setFilteredHistory(history);
  };

  const getActionColor = (action: PlanHistoryEntry['action']) => {
    switch (action) {
      case 'created':
        return 'bg-green-500';
      case 'deleted':
        return 'bg-red-700';
      case 'retrieved_plan':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getActionIcon = (action: PlanHistoryEntry['action']) => {
    switch (action) {
      case 'created':
        return '✨';
      case 'deleted':
        return <AlertCircle className="h-6 w-6" />;
      case 'retrieved_plan':
        return <ArchiveIcon className="h-6 w-6" />;
      default:
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  const handleViewDetails = async (planId: string) => {
    if (!planId) return;
    setIsModalOpen(true);
    setIsLoadingModal(true);
    setSelectedPlanDetails(null);
    try {
      const plan = await getDietPlanById(planId);
      if (plan) {
        setSelectedPlanDetails(plan);
      } else {
        console.error(`Plan with ID ${planId} not found for modal.`);
        // Optionally set an error state for the modal here
      }
    } catch (error) {
      console.error(`Error fetching plan ${planId} for modal:`, error);
      // Optionally set an error state for the modal here
    } finally {
      setIsLoadingModal(false);
    }
  };

  const getDietIcon = (preference?: string) => {
    if (!preference) return <Utensils className="h-4 w-4 text-gray-500" />;
    switch (preference.toLowerCase()) {
      case 'vegetarian':
        return <Leaf className="h-4 w-4 text-green-500" />;
      case 'vegan':
        return <Leaf className="h-4 w-4 text-green-600" />;
      case 'pescatarian':
        return <Fish className="h-4 w-4 text-blue-500" />;
      case 'non-vegetarian':
        return <Drumstick className="h-4 w-4 text-red-500" />;
      default:
        return <Utensils className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Plan History</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Plan History</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Plan History</h1>
      
      {/* Activity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{activitySummary.created || 0}</p>
            <p className="text-sm text-gray-500">meal plans</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter your plan history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-sm font-medium mb-2">Date</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Action Type</p>
              <Tabs 
                value={filterAction || "all"} 
                onValueChange={(value) => setFilterAction(value === "all" ? null : value)}
                className="w-[400px]"
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="created">Created</TabsTrigger>
                  <TabsTrigger value="deleted">Deleted</TabsTrigger>
                  <TabsTrigger value="retrieved_plan">Retrieved Plan</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              className="mt-6"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Timeline</span>
            {!loading && !isOffline && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRetry} 
                disabled={retrying}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {filteredHistory.length} {filteredHistory.length === 1 ? 'activity' : 'activities'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOffline && (
            <Alert className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>You are offline</AlertTitle>
              <AlertDescription>
                Some data may be unavailable while you're offline. We'll automatically update when you're back online.
                {history.length > 0 && (
                  <p className="mt-2 text-sm">Showing cached data from your last session.</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {error && !isOffline && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry} 
                  className="mt-2"
                  disabled={retrying}
                >
                  {retrying ? 'Retrying...' : 'Retry'}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No activities found with the current filters.
            </p>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              {filteredHistory.map((entry, index) => (
                <div key={index} className="flex items-start mb-6 pb-6 border-b border-gray-100 last:border-0">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-full ${getActionColor(entry.action)} text-white mr-4 flex-shrink-0`}>
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
                        </Badge>
                        <p className="text-md font-medium text-gray-800">
                          {entry.action === 'created' && entry.details 
                            ? entry.details 
                            : (entry.action === 'created' && !entry.details)
                            ? `Created: Plan (${entry.planId.substring(0,4)}...)` 
                            : entry.details
                          }
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {(entry.action === 'created' || entry.action === 'retrieved_plan' || entry.planId) && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(entry.planId!)} 
                          className="flex items-center"
                        >
                          <Info className="h-4 w-4 mr-1" /> View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedPlanDetails?.userData?.dietaryPreference 
                ? `${selectedPlanDetails.userData.dietaryPreference} Diet Plan Details` 
                : selectedPlanDetails?.planId 
                ? `Plan Details (${selectedPlanDetails.planId.substring(0,8)}...)`
                : 'Plan Details'}
            </DialogTitle>
            {selectedPlanDetails?.createdAt && (
              <DialogDescription>
                Created on: {format(new Date(selectedPlanDetails.createdAt), 'MMMM d, yyyy')}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="flex-grow pr-2 max-h-[70vh]" style={{ scrollbarWidth: 'thin' }}>
            {isLoadingModal && (
              <div className="flex justify-center items-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-nutrition-green" />
              </div>
            )}
            {!isLoadingModal && selectedPlanDetails && (
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold text-md mb-2">Plan Overview:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Days:</strong> {selectedPlanDetails.userData?.days || 'N/A'}</p>
                    <p><strong>Cuisine:</strong> {selectedPlanDetails.userData?.cuisinePreference || 'N/A'}</p>
                    <p className="col-span-2"><strong>Health Goals:</strong> {selectedPlanDetails.userData?.healthGoals?.join(', ') || 'N/A'}</p>
                    <p className="col-span-2"><strong>Allergies:</strong> {selectedPlanDetails.userData?.allergies?.join(', ') || 'None'}</p>
                  </div>
                </div>

                {selectedPlanDetails.mealPlans && selectedPlanDetails.mealPlans.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Daily Meal Plans:</h4>
                    <Tabs defaultValue={selectedPlanDetails.mealPlans.length > 0 ? `day-0` : undefined} className="w-full">
                      <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-2" style={{ scrollbarWidth: 'thin' }}>
                        <TabsList className="flex w-max">
                          {selectedPlanDetails.mealPlans.map((dailyPlan, index) => (
                            <TabsTrigger key={`day-tab-${index}`} value={`day-${index}`}>
                              Day {dailyPlan.day}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      {selectedPlanDetails.mealPlans.map((dailyPlan, index) => (
                        <TabsContent key={`day-content-${index}`} value={`day-${index}`} className="max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                          <Card className="mb-3">
                            <CardHeader className="pb-2 pt-4">
                              <CardTitle className="text-md flex items-center">
                                {getDietIcon(selectedPlanDetails.userData?.dietaryPreference)} 
                                <span className="ml-2">Day {dailyPlan.day} Meals</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-4">
                              <div className="p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-nutrition-green mb-1">Breakfast</p>
                                <p>{dailyPlan.meals.breakfast}</p>
                              </div>
                              <div className="p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-nutrition-green mb-1">Lunch</p>
                                <p>{dailyPlan.meals.lunch}</p>
                              </div>
                              <div className="p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                                <p className="font-medium text-nutrition-green mb-1">Dinner</p>
                                <p>{dailyPlan.meals.dinner}</p>
                              </div>
                              {dailyPlan.meals.snacks && dailyPlan.meals.snacks.length > 0 && (
                                <div className="p-2 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                                  <p className="font-medium text-nutrition-green mb-1">Snacks</p>
                                  <p>{dailyPlan.meals.snacks.join(', ')}</p>
                                </div>
                              )}
                              {dailyPlan.notes && (
                                <p className="mt-2 text-xs text-muted-foreground"><em>Notes: {dailyPlan.notes}</em></p>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}

                {selectedPlanDetails.recommendations && selectedPlanDetails.recommendations.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-semibold text-md mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-gray-700">
                      {selectedPlanDetails.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!isLoadingModal && !selectedPlanDetails && (
              <div className="text-center py-8">
                <p className="text-gray-600">Could not load plan details.</p>
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanHistoryPage;
