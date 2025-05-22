import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DietPlan, MealPlan } from "@/types";
import { 
  Clock, Egg, EggFried, Salad, Carrot, Info, ChefHat, Calendar, 
  Download, Share2, Printer, ChevronLeft, ChevronRight, Heart,
  Timer, Users, UtensilsCrossed, Bookmark, Star, Check, AlertTriangle, 
  Flame, BarChart, X, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { trackPlanCreated } from "@/services/planHistoryService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs as RecipeTabs, TabsContent as RecipeTabsContent, TabsList as RecipeTabsList, TabsTrigger as RecipeTabsTrigger } from "@/components/ui/tabs";

interface DietPlanDisplayProps {
  dietPlan: DietPlan;
}

type CuisineType = 'north-indian' | 'south-indian' | 'both';

const NutritionBadge = ({ label, value, unit, color, bgColor }: { label: string; value: string; unit: string; color: string; bgColor: string }) => (
  <div className={`${bgColor} rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 rounded-full ${color} bg-opacity-10 flex items-center justify-center`}>
        {label === "Calories" && <Egg className={color} size={16} />}
        {label === "Protein" && <EggFried className={color} size={16} />}
        {label === "Carbs" && <Carrot className={color} size={16} />}
        {label === "Fat" && <Salad className={color} size={16} />}
        {label === "Fiber" && <Flame className={color} size={16} />}
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
    <div className="flex items-baseline">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="ml-1 text-sm text-gray-500">{unit}</span>
    </div>
  </div>
);

const MealCard = ({ title, description, cuisine }: { title: string; description: string; cuisine: CuisineType }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [activeRecipeTab, setActiveRecipeTab] = useState("ingredients");
  const { toast } = useToast();

  const handleFavoriteClick = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    if (newFavoriteState) {
      toast({
        title: "Added to favorites",
        description: "Meal added to your favorites",
      });
    } else {
      toast({
        title: "Removed from favorites",
        description: "Meal removed from your favorites",
      });
    }
  };

  // Extract main dish from description
  const extractMainDish = () => {
    try {
      // Try to parse complex dish descriptions
      // Common patterns: "Dish with ingredients" or "Dish: ingredients"
      const colonPattern = description.split(':')[0].trim();
      if (colonPattern && colonPattern.length > 3 && colonPattern.length < 40) {
        return colonPattern;
      }
      
      // Look for "with" as a separator for the main dish
      const withParts = description.split(' with ');
      if (withParts.length > 1 && withParts[0].length < 40) {
        return withParts[0].trim();
      }
      
      // Otherwise get first parts of the description
      const firstFewWords = description.split(' ').slice(0, 4).join(' ');
      
      // Remove common cooking methods and articles
      return firstFewWords
        .replace(/served|topped|garnished|and|the|a |an /gi, '')
        .trim();
    } catch (e) {
      // Fallback
      return description.split(' ').slice(0, 3).join(' ');
    }
  };

  // Detect nutrition keywords
  const detectNutritionKeywords = () => {
    const lowerDesc = description.toLowerCase();
    const keywords = [];
    
    if (lowerDesc.includes('protein') || lowerDesc.includes('lean') || 
        lowerDesc.includes('paneer') || lowerDesc.includes('chicken') || 
        lowerDesc.includes('fish') || lowerDesc.includes('lentil') || 
        lowerDesc.includes('dal')) {
      keywords.push('High Protein');
    }
    
    if (lowerDesc.includes('fiber') || lowerDesc.includes('whole grain') || 
        lowerDesc.includes('green vegetable') || lowerDesc.includes('leafy')) {
      keywords.push('Fiber Rich');
    }
    
    if (lowerDesc.includes('low calorie') || lowerDesc.includes('low-calorie') || 
        lowerDesc.includes('light') || lowerDesc.includes('diet')) {
      keywords.push('Low Calorie');
    }
    
    return keywords.slice(0, 2); // Return max two keywords
  };
  
  // Generate appropriate image URL based on meal content and cuisine
  const getMealImage = () => {
    // Simple, direct image URLs that will work reliably
    const dishName = extractMainDish().toLowerCase();
    
    // Breakfast specific images
    if (title.toLowerCase().includes('breakfast')) {
      if (dishName.includes('paratha')) 
        return "https://images.unsplash.com/photo-1565085363577-93ccd01e6df3?w=600&auto=format&fit=crop";
      if (dishName.includes('idli')) 
        return "https://images.unsplash.com/photo-1630383249896-383d9973a0ee?w=600&auto=format&fit=crop";
      return "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop";
    }
    
    // Lunch specific images
    if (title.toLowerCase().includes('lunch')) {
      if (dishName.includes('rice')) 
        return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop";
      if (dishName.includes('curry')) 
        return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop";
      return "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop";
    }
    
    // Dinner specific images
    if (title.toLowerCase().includes('dinner')) {
      if (dishName.includes('roti')) 
        return "https://images.unsplash.com/photo-1565085363577-93ccd01e6df3?w=600&auto=format&fit=crop";
      if (dishName.includes('curry')) 
        return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop";
      return "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop";
    }
    
    // Snack specific images
    if (title.toLowerCase().includes('snack')) {
      if (dishName.includes('fruit')) 
        return "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=600&auto=format&fit=crop";
      return "https://images.unsplash.com/photo-1590080876283-c194f127d8d9?w=600&auto=format&fit=crop";
    }
    
    // Fallback images by cuisine
    if (cuisine === 'north-indian') 
      return "https://images.unsplash.com/photo-1589778655488-a217163a46e9?w=600&auto=format&fit=crop";
    if (cuisine === 'south-indian')
      return "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop";
    
    // Default fallback
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop";
  };

  const dishName = extractMainDish();
  const nutritionKeywords = detectNutritionKeywords();

  // Generate specific cooking times based on meal type and dish complexity
  const generateCookingData = () => {
    const mealType = title.toLowerCase();
    const complexity = description.length > 100 ? 'complex' : 'simple';
    
    // Base times
    let prepTime = 15;
    let cookTime = 25;
    let servings = 4;
    let calories = 320;
    let difficulty = 'Medium';
    
    // Adjust for meal type
    if (mealType.includes('breakfast')) {
      prepTime = complexity === 'complex' ? 15 : 10;
      cookTime = complexity === 'complex' ? 20 : 15;
      calories = 280;
      difficulty = 'Easy';
    } else if (mealType.includes('lunch')) {
      prepTime = complexity === 'complex' ? 20 : 15;
      cookTime = complexity === 'complex' ? 30 : 25;
      calories = 350;
      difficulty = 'Medium';
    } else if (mealType.includes('dinner')) {
      prepTime = complexity === 'complex' ? 25 : 20;
      cookTime = complexity === 'complex' ? 35 : 30;
      calories = 400;
      difficulty = 'Medium';
    } else if (mealType.includes('snack')) {
      prepTime = complexity === 'complex' ? 10 : 5;
      cookTime = complexity === 'complex' ? 15 : 10;
      calories = 180;
      servings = 2;
      difficulty = 'Easy';
    }
    
    const nutrition = {
      calories,
      protein: Math.floor(calories * 0.15),
      carbs: Math.floor(calories * 0.5),
      fat: Math.floor(calories * 0.35),
      fiber: Math.floor(calories * 0.05)
    };
    
    return {
      prepTime,
      cookTime,
      totalTime: prepTime + cookTime,
      servings,
      difficulty,
      nutrition
    };
  };

  // Generate recipe data
  const generateRecipeData = () => {
    const mealType = title.toLowerCase();
    
    // Adjust recipe parameters based on meal type
    let prepTime = 15;
    let cookTime = 25;
    let servings = 4;
    let calories = 320;
    
    if (mealType.includes('breakfast')) {
      prepTime = 10;
      cookTime = 15;
      calories = 280;
    } else if (mealType.includes('lunch')) {
      prepTime = 15;
      cookTime = 25;
      calories = 350;
    } else if (mealType.includes('dinner')) {
      prepTime = 20;
      cookTime = 30;
      calories = 400;
    } else if (mealType.includes('snack')) {
      prepTime = 5;
      cookTime = 10;
      calories = 180;
      servings = 2;
    }
    
    // Generate cuisine-appropriate ingredients
    const ingredients = [];
    const commonBaseIngredients = [
      "Salt to taste", 
      "2 tablespoons oil", 
      "Fresh coriander for garnish"
    ];
    
    // Cuisine-specific ingredient bases
    const cuisineIngredients = {
      'north-indian': [
        "1 teaspoon cumin seeds",
        "1 teaspoon garam masala",
        "1 teaspoon turmeric powder",
        "1 teaspoon red chili powder",
        "1 onion, finely chopped",
        "2 tomatoes, chopped",
        "1 teaspoon ginger-garlic paste"
      ],
      'south-indian': [
        "1 teaspoon mustard seeds",
        "1 teaspoon urad dal",
        "2-3 curry leaves",
        "1 teaspoon sambar powder",
        "1/2 cup coconut milk",
        "1/2 teaspoon turmeric powder",
        "2-3 green chilies, chopped"
      ],
      'both': [
        "1 teaspoon cumin seeds",
        "1 teaspoon turmeric powder",
        "1 onion, finely chopped",
        "1 teaspoon chili powder",
        "1 teaspoon ginger-garlic paste"
      ]
    };
    
    // Add cuisine-specific ingredients
    const cuisineType = cuisine in cuisineIngredients ? cuisine : 'both';
    const selectedIngredients = cuisineIngredients[cuisineType];
    
    // Add main ingredient based on dish name
    ingredients.push(`2 cups ${dishName.toLowerCase()}`);
    
    // Add 3-5 cuisine-specific ingredients
    for (let i = 0; i < 5; i++) {
      if (Math.random() > 0.3 && selectedIngredients[i]) {
        ingredients.push(selectedIngredients[i]);
      }
    }
    
    // Add common base ingredients
    ingredients.push(...commonBaseIngredients);
    
    // Generate instructions based on cuisine
    let instructions = [];
    if (cuisineType === 'north-indian') {
      instructions = [
        "Heat oil in a pan and add cumin seeds.",
        "Add chopped onions and sauté until golden brown.",
        "Add ginger-garlic paste and sauté for 1 minute.",
        "Add chopped tomatoes and cook until soft.",
        "Add turmeric powder, red chili powder, and salt.",
        `Add ${dishName.toLowerCase()} and mix well.`,
        "Cook covered on medium heat for 15-20 minutes.",
        "Garnish with fresh coriander and serve hot."
      ];
    } else if (cuisineType === 'south-indian') {
      instructions = [
        "Heat oil in a pan and add mustard seeds, let them splutter.",
        "Add urad dal and curry leaves, sauté for 30 seconds.",
        "Add chopped onions and green chilies, sauté until translucent.",
        "Add turmeric powder and sambar powder, mix well.",
        `Add ${dishName.toLowerCase()} and salt, mix thoroughly.`,
        "Pour coconut milk and bring to a gentle simmer.",
        "Cook covered on low heat for 10-15 minutes.",
        "Garnish with fresh coriander and serve hot with rice."
      ];
    } else {
      instructions = [
        "Heat oil in a pan over medium heat.",
        "Add spices and aromatic ingredients, sauté for 1 minute.",
        "Add chopped vegetables and mix well.",
        `Add ${dishName.toLowerCase()} and all remaining ingredients.`,
        "Adjust seasoning according to taste.",
        "Cook until everything is well combined and cooked through.",
        "Garnish with fresh herbs before serving."
      ];
    }
    
    return {
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      calories
    };
  };

  const cookingData = generateCookingData();
  const recipe = generateRecipeData();

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all relative">
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
          <img 
            src={getMealImage()} 
            alt={`${dishName} - ${cuisine} cuisine`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex flex-wrap gap-1 mb-2">
              {nutritionKeywords.map((keyword, i) => (
                <span key={i} className="text-xs bg-nutrition-green/70 text-white px-2 py-0.5 rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-1">
            <h4 className="font-medium text-gray-900">{dishName}</h4>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{description}</p>
          <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-4">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{recipe.prepTime + recipe.cookTime} min</span>
            </div>
            <div className="flex items-center">
              <Users size={14} className="mr-1" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center">
              <Egg size={14} className="mr-1" />
              <span>{recipe.calories} cal</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full hover:bg-nutrition-green hover:text-white transition-colors"
            onClick={() => setRecipeOpen(true)}
          >
            <ChefHat size={16} className="mr-2" />
            View Recipe
          </Button>
        </div>
      </div>

      {/* Enhanced Recipe Dialog */}
      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <div className="relative h-64">
            <img 
              src={getMealImage()} 
              alt={`${dishName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <DialogClose className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors">
              <X size={18} />
            </DialogClose>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex flex-wrap gap-1 mb-2">
                {nutritionKeywords.map((keyword, i) => (
                  <span key={i} className="text-xs bg-nutrition-green/80 text-white px-2 py-0.5 rounded-full">
                    {keyword}
                  </span>
                ))}
                <span className="text-xs bg-gray-700/80 text-white px-2 py-0.5 rounded-full flex items-center">
                  <Flame size={10} className="mr-1" />
                  {cookingData.difficulty}
                </span>
              </div>
              <DialogTitle className="text-3xl font-bold text-white m-0 p-0">{dishName}</DialogTitle>
              <p className="text-white/80 text-sm mt-1">{cuisine} cuisine • {title}</p>
              <div className="flex items-center mt-3 gap-4">
                <div className="flex items-center text-white/90 text-sm">
                  <Clock size={14} className="mr-1" />
                  {cookingData.totalTime} min total
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <Users size={14} className="mr-1" />
                  {cookingData.servings} servings
                </div>
                <div className="flex items-center text-white/90 text-sm">
                  <Star size={14} className="mr-1 text-yellow-400" />
                  <Star size={14} className="mr-1 text-yellow-400" />
                  <Star size={14} className="mr-1 text-yellow-400" />
                  <Star size={14} className="mr-1 text-yellow-400" />
                  <Star size={14} className="mr-1 text-white/40" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <RecipeTabs defaultValue="ingredients" value={activeRecipeTab} onValueChange={setActiveRecipeTab} className="w-full">
              <RecipeTabsList className="w-full grid grid-cols-3 mb-6">
                <RecipeTabsTrigger value="ingredients" className="text-center">
                  <UtensilsCrossed size={16} className="mr-2" />
                  Ingredients
                </RecipeTabsTrigger>
                <RecipeTabsTrigger value="instructions" className="text-center">
                  <ChefHat size={16} className="mr-2" />
                  Instructions
                </RecipeTabsTrigger>
                <RecipeTabsTrigger value="nutrition" className="text-center">
                  <BarChart size={16} className="mr-2" />
                  Nutrition
                </RecipeTabsTrigger>
              </RecipeTabsList>
              
              <RecipeTabsContent value="ingredients" className="p-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Ingredients</h3>
                    <ul className="space-y-3">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-5 h-5 rounded-full bg-nutrition-green/10 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-nutrition-green"></div>
                          </div>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Kitchen Equipment</h3>
                    <ul className="space-y-3">
                      {[
                        "Large saucepan or kadai",
                        "Wooden spoon",
                        "Measuring cups and spoons",
                        "Cutting board",
                        "Sharp knife",
                        "Serving dishes"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <Check size={12} className="text-gray-500" />
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-8 bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <div className="flex items-start">
                        <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-amber-800">Allergy Information</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            This recipe may contain common allergens. Adjust ingredients as needed for dietary restrictions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </RecipeTabsContent>
              
              <RecipeTabsContent value="instructions" className="p-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <h3 className="text-lg font-medium mb-4 text-gray-800">Cooking Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-3">
                    <ol className="space-y-6">
                      {recipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex">
                          <div className="mr-4 flex-shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-nutrition-green text-white font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-700">{instruction}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    
                    <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-2">Chef's Tips</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start text-sm text-blue-700">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                            <Star size={12} className="text-blue-500" />
                          </div>
                          <span>For extra flavor, add a pinch of garam masala at the end of cooking.</span>
                        </li>
                        <li className="flex items-start text-sm text-blue-700">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                            <Star size={12} className="text-blue-500" />
                          </div>
                          <span>Let the dish rest for 5 minutes before serving to allow flavors to meld.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-3">Preparation Time</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white p-3 rounded-md text-center">
                          <p className="text-xl font-bold text-nutrition-green">{recipe.prepTime}</p>
                          <p className="text-xs text-gray-500">Prep (min)</p>
                        </div>
                        <div className="bg-white p-3 rounded-md text-center">
                          <p className="text-xl font-bold text-nutrition-green">{recipe.cookTime}</p>
                          <p className="text-xs text-gray-500">Cook (min)</p>
                        </div>
                        <div className="bg-white p-3 rounded-md text-center">
                          <p className="text-xl font-bold text-nutrition-green">{recipe.prepTime + recipe.cookTime}</p>
                          <p className="text-xs text-gray-500">Total (min)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="aspect-video relative rounded-lg overflow-hidden">
                      <img 
                        src={getMealImage()} 
                        alt={`${dishName} prepared`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </RecipeTabsContent>
              
              <RecipeTabsContent value="nutrition" className="p-2 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Nutrition Facts</h3>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-bold text-xl">Nutrition Facts</h4>
                        <p className="text-sm text-gray-500">Per serving</p>
                      </div>
                      
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <p className="font-bold">Calories</p>
                          <p className="font-bold">{recipe.calories}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">Total Fat</p>
                          <p>{cookingData.nutrition.fat}g</p>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mb-3">
                          <div className="bg-yellow-500 h-1" style={{width: `${(cookingData.nutrition.fat/78)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">Protein</p>
                          <p>{cookingData.nutrition.protein}g</p>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mb-3">
                          <div className="bg-purple-500 h-1" style={{width: `${(cookingData.nutrition.protein/50)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">Carbohydrates</p>
                          <p>{cookingData.nutrition.carbs}g</p>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mb-3">
                          <div className="bg-green-500 h-1" style={{width: `${(cookingData.nutrition.carbs/275)*100}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium">Fiber</p>
                          <p>{cookingData.nutrition.fiber}g</p>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mb-3">
                          <div className="bg-blue-500 h-1" style={{width: `${(cookingData.nutrition.fiber/28)*100}%`}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-gray-800">Dietary Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                        <Check size={16} className="text-nutrition-green mr-2" />
                        <span className="text-gray-700">Vegetarian</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                        <Check size={16} className="text-nutrition-green mr-2" />
                        <span className="text-gray-700">Low Sodium</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                        <Check size={16} className="text-nutrition-green mr-2" />
                        <span className="text-gray-700">High Fiber</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                        <Check size={16} className="text-nutrition-green mr-2" />
                        <span className="text-gray-700">Gluten Free</span>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4 text-gray-800">Health Benefits</h3>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <Flame size={14} className="text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Good for Heart Health</p>
                            <p className="text-sm text-gray-600">Low in saturated fats and rich in heart-healthy nutrients.</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <Egg size={14} className="text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Protein Rich</p>
                            <p className="text-sm text-gray-600">Excellent source of plant-based protein for muscle health.</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </RecipeTabsContent>
            </RecipeTabs>
            
            <div className="flex justify-between mt-8">
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print Recipe
              </Button>
              <Button className="bg-nutrition-green hover:bg-nutrition-green/90 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Save Recipe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const CheckIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const DietPlanDisplay = ({ dietPlan }: DietPlanDisplayProps) => {
  const [activeDay, setActiveDay] = useState("1");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFavoriteClick = () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    if (newFavoriteState) {
      toast({
        title: "Added to favorites",
        description: "Meal added to your favorites",
      });
    } else {
      toast({
        title: "Removed from favorites",
        description: "Meal removed from your favorites",
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save this plan to your history.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      await trackPlanCreated(user.uid, dietPlan);
      setIsSaved(true);
      toast({
        title: "Plan saved",
        description: "This meal plan has been saved to your history.",
      });
      
      // Navigate to plan history page after saving
      window.location.href = "/plan-history";
    } catch (error) {
      console.error('Error saving plan to history:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save plan to history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print initiated",
      description: "Your diet plan is being sent to your printer.",
    });
  };
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Diet Plan',
          text: `Check out my ${dietPlan.userData.days}-day diet plan!`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Diet plan link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to share diet plan",
      });
    }
  };

  const handlePrevDay = () => {
    if (!mealPlans.length) return;
    
    const currentIndex = mealPlans.findIndex(plan => plan.day === parseInt(activeDay));
    if (currentIndex > 0) {
      setActiveDay(mealPlans[currentIndex - 1].day.toString());
    }
  };

  const handleNextDay = () => {
    if (!mealPlans.length) return;
    
    const currentIndex = mealPlans.findIndex(plan => plan.day === parseInt(activeDay));
    if (currentIndex < mealPlans.length - 1) {
      setActiveDay(mealPlans[currentIndex + 1].day.toString());
    }
  };

  // Ensure mealPlans is an array
  const mealPlans = Array.isArray(dietPlan.mealPlans) ? dietPlan.mealPlans : [];
  
  // Find the current meal plan based on activeDay
  const currentMealPlan = mealPlans.length > 0 
    ? mealPlans.find(plan => plan.day === parseInt(activeDay)) || mealPlans[0]
    : null;

  // If no meal plans are available, show a message
  if (mealPlans.length === 0) {
    return (
      <div className="w-full">
        <Card className="p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Diet Plan Available</h2>
            <p className="text-gray-600 mb-6">There seems to be an issue with the diet plan data.</p>
            <Button onClick={() => window.location.reload()} className="gap-2">
              <Calendar size={16} />
              Create New Plan
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Your Personalized Diet Plan</h2>
          <p className="text-gray-600 mt-1">Customized for your dietary needs and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleSave} 
            disabled={isSaving || isSaved}
            title={isSaved ? "Plan saved to history" : "Save plan to history"}
            className={isSaved ? "bg-green-50 border-green-200 text-green-600" : ""}
          >
            {isSaving ? (
              <span className="animate-spin">⏳</span>
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrint} title="Print plan">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} title="Share plan">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <Calendar size={16} />
            New Plan
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/plan-history"} 
            className="gap-2"
          >
            <Clock size={16} />
            View History
          </Button>
        </div>
      </div>

      {/* Gemini AI Banner */}
      <div className="relative w-full h-52 mb-8 rounded-xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop"
          alt="Healthy food banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center">
          <div className="px-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-8 h-8 rounded-full bg-nutrition-green p-1.5">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-white font-semibold">Powered by AI</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {dietPlan.userData.dietaryPreference} Diet Plan
            </h2>
            <p className="text-white/80">
              {dietPlan.userData.cuisinePreference} cuisine • {dietPlan.userData.days} days
            </p>
          </div>
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
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="flex items-center mb-2 px-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-nutrition-green mr-2"></div>
                <span className="text-xs text-gray-500">Gemini AI Generated Days</span>
              </div>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
                <TabsList className="bg-white p-1 border border-gray-100 flex-nowrap" style={{ minWidth: 'max-content' }}>
                  {mealPlans.map((plan) => (
                    <TabsTrigger 
                      key={plan.day} 
                      value={plan.day.toString()}
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-nutrition-green data-[state=active]:text-white"
                    >
                      Day {plan.day}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={parseInt(activeDay) === mealPlans.length}
            className="rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {mealPlans.map((plan) => (
          <TabsContent key={plan.day} value={plan.day.toString()} className="mt-0">
            <div className="bg-white rounded-xl p-6 mb-8 border border-gray-100 shadow-sm">
              {plan.nutritionInfo ? (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-nutrition-green p-2 rounded-full">
                      <Info size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-xl text-gray-900">Daily Nutrition Summary</h3>
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                          <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
                          <path d="M16 8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M12 16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Analyzed by Gemini AI
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <NutritionBadge
                      label="Calories"
                      value={plan.nutritionInfo.calories.toString()}
                      unit="kcal"
                      color="text-amber-500"
                      bgColor="bg-amber-50"
                    />
                    <NutritionBadge
                      label="Protein"
                      value={plan.nutritionInfo.protein.toString()}
                      unit="g"
                      color="text-purple-500"
                      bgColor="bg-purple-50"
                    />
                    <NutritionBadge
                      label="Carbs"
                      value={plan.nutritionInfo.carbs.toString()}
                      unit="g"
                      color="text-green-500"
                      bgColor="bg-green-50"
                    />
                    <NutritionBadge
                      label="Fat"
                      value={plan.nutritionInfo.fat.toString()}
                      unit="g"
                      color="text-yellow-500"
                      bgColor="bg-yellow-50"
                    />
                    {plan.nutritionInfo.fiber !== undefined && (
                      <div className={plan.nutritionInfo.fiber ? "col-span-full sm:col-span-2 sm:col-start-2" : "hidden"}>
                        <NutritionBadge
                          label="Fiber"
                          value={plan.nutritionInfo.fiber.toString()}
                          unit="g"
                          color="text-blue-500"
                          bgColor="bg-blue-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Nutrition information not available</p>
                </div>
              )}
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-2 mb-6" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="col-span-full">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Breakfast</h3>
                </div>
                <MealCard
                  title="Breakfast"
                  description={plan.meals.breakfast}
                  cuisine={dietPlan.userData.cuisinePreference as CuisineType}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="col-span-full">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Lunch</h3>
                </div>
                <MealCard
                  title="Lunch"
                  description={plan.meals.lunch}
                  cuisine={dietPlan.userData.cuisinePreference as CuisineType}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="col-span-full">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Dinner</h3>
                </div>
                <MealCard
                  title="Dinner"
                  description={plan.meals.dinner}
                  cuisine={dietPlan.userData.cuisinePreference as CuisineType}
                />
              </div>

            {plan.meals.snacks && plan.meals.snacks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="col-span-full">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Snacks</h3>
                </div>
                {plan.meals.snacks.map((snack, index) => (
                  <MealCard
                    key={index}
                    title={`Snack ${index + 1}`}
                    description={snack}
                    cuisine={dietPlan.userData.cuisinePreference as CuisineType}
                  />
                ))}
              </div>
            )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {dietPlan.recommendations && dietPlan.recommendations.length > 0 && (
        <Card className="mt-8 overflow-hidden">
          <div className="relative h-20 bg-gradient-to-r from-purple-600 via-violet-500 to-nutrition-green">
            <div className="absolute inset-0 opacity-20">
              <img 
                src="https://source.unsplash.com/random/800x100/?ai,pattern,circuit,technology" 
                alt="AI pattern"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 flex items-center px-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.09 9.00001C9.3251 8.33167 9.78915 7.76811 10.4 7.40914C11.0108 7.05016 11.7289 6.91894 12.4272 7.03872C13.1255 7.15849 13.7588 7.52153 14.2151 8.06353C14.6713 8.60554 14.9211 9.29153 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Gemini AI Recommendations</h3>
              </div>
            </div>
          </div>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dietPlan.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="rounded-full bg-gradient-to-br from-purple-500 to-nutrition-green p-2 mt-0.5 flex-shrink-0">
                    <CheckIcon size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-gray-700">{recommendation}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-xs text-gray-400 flex items-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                          <path d="M12 16V12L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        AI generated
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DietPlanDisplay; 