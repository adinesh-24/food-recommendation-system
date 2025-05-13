import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DietPlan, MealPlan } from "@/types";
import { Clock, Egg, EggFried, Salad, Carrot, Info, ChefHat, Calendar, Download, Share2, Printer, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { MealImages } from "@/components/MealImages";
import { RecipeModal } from './RecipeModal';
import { RecipeDisplay } from './RecipeDisplay';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";

interface MealPlanDisplayProps {
  dietPlan: DietPlan;
  onReset: () => void;
}

type CuisineType = 'north-indian' | 'south-indian';

const NutritionBadge = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-full ${color} bg-opacity-10 flex items-center justify-center`}>
        {label === "Calories" && <Egg className={color} size={16} />}
        {label === "Protein" && <EggFried className={color} size={16} />}
        {label === "Carbs" && <Carrot className={color} size={16} />}
        {label === "Fat" && <Salad className={color} size={16} />}
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="flex items-baseline">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="ml-1 text-sm text-gray-500">{unit}</span>
    </div>
  </motion.div>
);

const MealCard = ({ title, description, cuisine }: { title: string; description: string; cuisine: CuisineType }) => {
  const [showRecipe, setShowRecipe] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load favorite state from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteMeals');
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      setIsFavorite(favorites.includes(description));
    }
  }, [description]);

  const handleFavoriteClick = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    // Get existing favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteMeals');
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : [];

    if (newFavoriteState) {
      // Add to favorites
      favorites.push(description);
      toast.success('Meal added to favorites!');
    } else {
      // Remove from favorites
      favorites = favorites.filter((meal: string) => meal !== description);
      toast.info('Meal removed from favorites');
    }

    // Save updated favorites to localStorage
    localStorage.setItem('favoriteMeals', JSON.stringify(favorites));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all relative"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteClick}
        className="absolute top-2 right-2 z-10 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-full transition-all duration-300"
      >
        <Heart 
          size={18} 
          className={`${isFavorite ? "fill-red-500 text-red-500" : ""} transition-all duration-300`}
        />
      </Button>
      <div className="aspect-video relative overflow-hidden group">
        <MealImages mealName={description.split(',')[0]} cuisine={cuisine} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{description}</p>
        <Button
          variant="outline"
          className="w-full hover:bg-nutrition-green hover:text-white transition-colors"
          onClick={() => setShowRecipe(true)}
        >
          <ChefHat size={16} className="mr-2" />
          View Recipe
        </Button>
      </div>
      {showRecipe && (
        <RecipeModal
          isOpen={showRecipe}
          mealName={description.split(',')[0]}
          cuisine={cuisine}
          onClose={() => setShowRecipe(false)}
        />
      )}
    </motion.div>
  );
};

const MealPlanDisplay: React.FC<MealPlanDisplayProps> = ({ dietPlan, onReset }) => {
  const [activeDay, setActiveDay] = useState("1");
  const { callApi, loading } = useApi();
  const currentMealPlan = dietPlan.mealPlans.find((plan) => plan.day === parseInt(activeDay)) || dietPlan.mealPlans[0];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      const response = await callApi('/api/share', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Meal Plan',
          text: `Check out my ${dietPlan.userData.days}-day meal plan!`,
          url: window.location.href,
        }),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        await navigator.share({
          title: 'My Meal Plan',
          text: `Check out my ${dietPlan.userData.days}-day meal plan!`,
          url: window.location.href,
        });
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      toast.error(error.message || 'Failed to share meal plan. Please try again.');
    }
  };

  const handlePrevDay = () => {
    const currentIndex = dietPlan.mealPlans.findIndex(plan => plan.day === parseInt(activeDay));
    if (currentIndex > 0) {
      setActiveDay(dietPlan.mealPlans[currentIndex - 1].day.toString());
    }
  };

  const handleNextDay = () => {
    const currentIndex = dietPlan.mealPlans.findIndex(plan => plan.day === parseInt(activeDay));
    if (currentIndex < dietPlan.mealPlans.length - 1) {
      setActiveDay(dietPlan.mealPlans[currentIndex + 1].day.toString());
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Meal Plan</h2>
          <p className="text-gray-600 mt-1">Customized for your dietary needs and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer size={16} />
            Print
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 size={16} />
            Share
          </Button>
          <Button variant="outline" onClick={onReset} className="gap-2">
            <Calendar size={16} />
            New Plan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="1" className="w-full" onValueChange={setActiveDay}>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            disabled={parseInt(activeDay) === 1}
            className="rounded-full"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex-1 overflow-x-auto pb-2">
            <TabsList className="bg-gray-100 p-1">
              {dietPlan.mealPlans.map((plan) => (
                <TabsTrigger 
                  key={plan.day} 
                  value={plan.day.toString()}
                  className="data-[state=active]:bg-nutrition-green data-[state=active]:text-white"
                >
                  Day {plan.day}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={parseInt(activeDay) === dietPlan.mealPlans.length}
            className="rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {dietPlan.mealPlans.map((plan) => (
          <TabsContent key={plan.day} value={plan.day.toString()} className="mt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={plan.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-nutrition-green bg-opacity-5 rounded-xl p-6 mb-8">
                  {plan.nutritionInfo ? (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-nutrition-green" />
                        <h3 className="font-medium text-gray-900">Daily Nutrition Summary</h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <NutritionBadge 
                          label="Calories" 
                          value={plan.nutritionInfo.calories.toString()} 
                          unit="kcal" 
                          color="text-nutrition-accent"
                        />
                        <NutritionBadge 
                          label="Protein" 
                          value={plan.nutritionInfo.protein.toString()} 
                          unit="g" 
                          color="text-blue-600"
                        />
                        <NutritionBadge 
                          label="Carbs" 
                          value={plan.nutritionInfo.carbs.toString()} 
                          unit="g" 
                          color="text-amber-600"
                        />
                        <NutritionBadge 
                          label="Fat" 
                          value={plan.nutritionInfo.fat.toString()} 
                          unit="g" 
                          color="text-purple-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">Nutrition information not available</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <MealCard
                    title="Breakfast"
                    description={plan.meals.breakfast}
                    cuisine="north-indian"
                  />
                  <MealCard
                    title="Lunch"
                    description={plan.meals.lunch}
                    cuisine="south-indian"
                  />
                  <MealCard
                    title="Dinner"
                    description={plan.meals.dinner}
                    cuisine="north-indian"
                  />
                  <MealCard
                    title="Snacks"
                    description={plan.meals.snacks.join(", ")}
                    cuisine="south-indian"
                  />
                </div>

                {dietPlan.recommendations && dietPlan.recommendations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="h-5 w-5 text-nutrition-green" />
                      <h3 className="font-medium text-gray-900">Recommendations</h3>
                    </div>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      {dietPlan.recommendations.map((rec, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex items-start"
                        >
                          <span className="text-nutrition-green mr-2">•</span>
                          <span>{rec}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MealPlanDisplay;
