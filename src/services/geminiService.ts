import { UserData, DietPlan, MealPlan } from "@/types";
import { getApiConfig, incrementApiUsage } from "@/config/api";

// Cache for storing API responses
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds

// Helper function to generate cache key
const generateCacheKey = (prompt: string, model: string) => {
  return `${model}-${prompt.slice(0, 100)}`; // Use first 100 chars of prompt for key
};

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for exponential backoff
const getRetryDelay = (retryCount: number) => {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY
  );
  return delay + Math.random() * 1000; // Add jitter
};

// This is the main function that will be called from the UI
export async function generateMealPlan(userData: UserData): Promise<DietPlan> {
  console.log("Generating meal plan with user data:", userData);
  
  try {
    const response = await callGeminiAPI(userData);
    console.log("Gemini API response:", response);
    return processGeminiResponse(response, userData);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Instead of throwing an error, create a fallback plan
    return createFallbackDietPlan(userData);
  }
}

// Process the response from Gemini API
function processGeminiResponse(response: any, userData: UserData): DietPlan {
  try {
    if (!response || !response.candidates || !response.candidates[0]) {
      console.error("Invalid response structure:", response);
      throw new Error("Invalid response from Gemini API");
    }

    // Extract the content from the response
    const content = response.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response content:", content);
    
    // Check if the response is incomplete (cutoff)
    if (content.includes("levels. Include a source of healthy fats in each meal") && 
        content.includes("Explore the diverse regional cuisines of India")) {
      console.warn("Detected incomplete response from Gemini API");
      // Create a fallback response with default data
      return createFallbackDietPlan(userData);
    }
    
    // Remove markdown code block syntax if present and any leading/trailing whitespace
    let cleanContent = content.replace(/```json\n|\n```/g, '').trim();
    
    // Try to extract valid JSON if the response contains mixed text and JSON
    const jsonMatch = cleanContent.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      cleanContent = jsonMatch[1].trim();
    }
    
    console.log("Cleaned content:", cleanContent);
    
    // Parse the JSON from the text content
    let parsedData;
    try {
      parsedData = JSON.parse(cleanContent);
      console.log("Parsed data:", parsedData);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", e);
      console.log("Raw response:", content);
      console.log("Attempting to fix malformed JSON...");
      
      // Try to fix common JSON format issues
      try {
        // Remove any trailing commas before closing brackets or braces
        const fixedJson = cleanContent.replace(/,(\s*[\]}])/g, '$1');
        parsedData = JSON.parse(fixedJson);
        console.log("Successfully parsed fixed JSON:", parsedData);
      } catch (e2) {
        console.error("Failed to fix and parse JSON:", e2);
        // If still can't parse, use fallback
        return createFallbackDietPlan(userData);
      }
    }
    
    // Validate the parsed data structure
    if (!parsedData.mealPlans || !Array.isArray(parsedData.mealPlans)) {
      console.error("Invalid meal plans data:", parsedData);
      console.log("Attempting to construct valid meal plans from partial data...");
      
      // Try to construct a valid mealPlans array if the data is in an unexpected format
      if (parsedData.meals || parsedData.day || parsedData.nutritionInfo) {
        // If the response directly contains a single meal plan instead of an array
        parsedData = { 
          mealPlans: [parsedData],
          recommendations: parsedData.recommendations || []
        };
      } else {
        // If we can't construct anything valid, use fallback
        return createFallbackDietPlan(userData);
      }
    }
    
    // Ensure each meal plan has the proper structure
    parsedData.mealPlans = parsedData.mealPlans.map((plan: any, index: number) => {
      // Ensure proper day number
      if (!plan.day) plan.day = index + 1;
      
      // Ensure meals object exists
      if (!plan.meals) plan.meals = {};
      
      // Ensure standard meal types exist
      if (!plan.meals.breakfast) plan.meals.breakfast = "Balanced Indian breakfast";
      if (!plan.meals.lunch) plan.meals.lunch = "Nutritious Indian lunch thali";
      if (!plan.meals.dinner) plan.meals.dinner = "Light and healthy Indian dinner";
      
      // Ensure snacks is an array
      if (!plan.meals.snacks || !Array.isArray(plan.meals.snacks)) {
        plan.meals.snacks = ["Healthy evening snack"];
      }
      
      // Ensure nutrition info exists and matches user requirements if specified
      if (!plan.nutritionInfo) {
        plan.nutritionInfo = {
          calories: 2000,
          protein: 75,
          carbs: 225,
          fat: 60
        };
      }
      
      // Override nutrition values with user-specified values if provided
      if (userData.useNutritionInput) {
        console.log(`Enforcing user-specified nutrition values for day ${plan.day}`);
        
        if (userData.calories !== undefined) {
          plan.nutritionInfo.calories = userData.calories;
        }
        
        if (userData.protein !== undefined) {
          plan.nutritionInfo.protein = userData.protein;
        }
        
        if (userData.carbs !== undefined) {
          plan.nutritionInfo.carbs = userData.carbs;
        }
        
        if (userData.fat !== undefined) {
          plan.nutritionInfo.fat = userData.fat;
        }
        
        if (userData.fiber !== undefined) {
          plan.nutritionInfo.fiber = userData.fiber;
        }
        
        console.log(`Updated nutrition values for day ${plan.day}:`, plan.nutritionInfo);
      }
      
      return plan;
    });
    
    // Transform the parsed data into our DietPlan format
    const dietPlan: DietPlan = {
      planId: `plan-${Date.now()}`,
      userData: userData,
      mealPlans: parsedData.mealPlans || [],
      recommendations: parsedData.recommendations || [
        "Stay hydrated by drinking 8-10 glasses of water daily",
        "Include a variety of colorful vegetables in your diet",
        "Try to maintain consistent meal timings for better digestion",
        "Consider including fermented foods like yogurt for gut health"
      ],
      createdAt: new Date(),
      userId: userData.email || 'anonymous'
    };
    
    return dietPlan;
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return createFallbackDietPlan(userData);
  }
}

// Helper function to create a fallback diet plan when Gemini fails
function createFallbackDietPlan(userData: UserData): DietPlan {
  console.log("Creating fallback diet plan");
  
  // Generate meal plans based on dietary preference and cuisine
  const fallbackMealPlans: MealPlan[] = [];
  
  // Create a meal plan for each day
  for (let day = 1; day <= userData.days; day++) {
    const isSouthIndian = userData.cuisinePreference === 'south-indian' || 
                         (userData.cuisinePreference === 'both' && day % 2 === 0);
    
    const mealPlan: MealPlan = {
      day,
      meals: {
        breakfast: isSouthIndian ? 
          "Idli Sambar with coconut chutney and a side of fresh fruits" : 
          "Aloo Paratha with curd and pickle, served with a glass of lassi",
        lunch: isSouthIndian ? 
          "Rice with Sambar, Rasam, Avial, and Papad. Served with buttermilk" : 
          "Roti with Dal Makhani, Mix Vegetable Sabzi, Raita, and Salad",
        dinner: isSouthIndian ? 
          "Dosa with Vegetable Korma and Tomato Chutney" : 
          "Jeera Rice with Vegetable Kadhai and Cucumber Raita",
        snacks: isSouthIndian ? 
          ["Medu Vada with Sambar", "Mysore Pak with herbal tea"] : 
          ["Masala Chai with Samosa", "Roasted Makhana"]
      },
      nutritionInfo: {
        // Use user-specified values if provided, otherwise use reasonable defaults
        calories: userData.useNutritionInput && userData.calories !== undefined
          ? userData.calories
          : Math.round(1800 + (Math.random() * 400)),
        protein: userData.useNutritionInput && userData.protein !== undefined
          ? userData.protein
          : Math.round(65 + (Math.random() * 20)),
        carbs: userData.useNutritionInput && userData.carbs !== undefined
          ? userData.carbs
          : Math.round(220 + (Math.random() * 30)),
        fat: userData.useNutritionInput && userData.fat !== undefined
          ? userData.fat
          : Math.round(55 + (Math.random() * 15))
      }
    };
    
    // Round nutrition values to whole numbers (only necessary for random values)
    if (!userData.useNutritionInput) {
      mealPlan.nutritionInfo!.calories = Math.round(mealPlan.nutritionInfo!.calories);
      mealPlan.nutritionInfo!.protein = Math.round(mealPlan.nutritionInfo!.protein);
      mealPlan.nutritionInfo!.carbs = Math.round(mealPlan.nutritionInfo!.carbs);
      mealPlan.nutritionInfo!.fat = Math.round(mealPlan.nutritionInfo!.fat);
    }
    
    fallbackMealPlans.push(mealPlan);
  }
  
  return {
    planId: `fallback-plan-${Date.now()}`,
    userData: userData,
    mealPlans: fallbackMealPlans,
    recommendations: [
      "Stay hydrated by drinking 8-10 glasses of water daily",
      "Include a variety of colorful vegetables in your diet",
      "Try to maintain consistent meal timings for better digestion",
      "Consider including fermented foods like yogurt for gut health",
      "For vegetarian diets, ensure adequate protein from legumes, dairy, and nuts"
    ],
    createdAt: new Date(),
    userId: userData.email || 'anonymous'
  };
}

// Call the Gemini API with user data
async function callGeminiAPI(userData: UserData) {
  const apiConfig = getApiConfig();

  const getDietarySpecificPrompt = (userData: UserData) => {
    let basePrompt = `Generate a personalized meal plan for ${userData.days} days based on the following information:
      - Age: ${userData.age}
      - Height: ${userData.height} cm
      - Weight: ${userData.weight} kg
      - Dietary preference: ${userData.dietaryPreference}
      - Cuisine preference: ${userData.cuisinePreference}
      - Allergies: ${userData.allergies.join(", ") || "None"}`;

    // Add nutrition information if the user has specified it
    if (userData.useNutritionInput) {
      basePrompt += `\n\n⚠️ CRITICAL INSTRUCTION - EXACT NUTRITION VALUES REQUIRED ⚠️
      
The user has specified the following EXACT nutrition targets:`;
      
      if (userData.calories !== undefined) {
        basePrompt += `\n- Total Calories: EXACTLY ${userData.calories} kcal per day (MANDATORY)`;
      }
      
      if (userData.protein !== undefined) {
        basePrompt += `\n- Protein: EXACTLY ${userData.protein} grams per day (MANDATORY)`;
      }
      
      if (userData.carbs !== undefined) {
        basePrompt += `\n- Carbohydrates: EXACTLY ${userData.carbs} grams per day (MANDATORY)`;
      }
      
      if (userData.fat !== undefined) {
        basePrompt += `\n- Fat: EXACTLY ${userData.fat} grams per day (MANDATORY)`;
      }
      
      if (userData.fiber !== undefined) {
        basePrompt += `\n- Fiber: EXACTLY ${userData.fiber} grams per day (MANDATORY)`;
      }
      
      basePrompt += `\n\nTHIS IS THE MOST IMPORTANT REQUIREMENT: Each day's nutrition values MUST MATCH THESE EXACT VALUES. 

INSTRUCTIONS FOR MEAL PLAN CREATION WITH EXACT NUTRITION VALUES:
1. Calculate the nutritional content of each meal and snack precisely
2. Balance the meals throughout the day to achieve the exact daily targets
3. Adjust portion sizes of ingredients to match the nutrition requirements
4. Double-check that all values match exactly before finalizing each day's plan
5. DO NOT deviate from these values - not even by 1 gram or 1 calorie

The user's health goals depend on receiving exactly these nutrition values - this is non-negotiable.`;
    }

    const cuisineSpecificPrompt = (() => {
      switch (userData.cuisinePreference) {
        case 'north-indian':
          return `
          Focus on traditional North Indian dishes like:
          - Breakfast: Paratha, Poha, Chole Bhature, Aloo Puri
          - Lunch: Roti, Dal Makhani, Paneer Butter Masala, Rajma Chawal
          - Dinner: Chana Masala, Jeera Rice, Kadhi Pakora
          - Snacks: Samosa, Pakora, Chaat`;
        
        case 'south-indian':
          return `
          Focus on traditional South Indian dishes like:
          - Breakfast: Idli, Dosa, Upma, Pongal
          - Lunch: Rice, Sambar, Rasam, Avial, Thoran
          - Dinner: Appam, Stew, Puttu, Kadala Curry
          - Snacks: Medu Vada, Bonda, Murukku`;
        
        case 'both':
          return `
          Include a mix of both North and South Indian dishes:
          - North Indian: Roti, Dal Makhani, Paneer dishes, Paratha
          - South Indian: Idli, Dosa, Sambar, Rasam
          - Common dishes: Rice varieties, Vegetable curries, Raita
          - Snacks: Mix of North and South Indian snacks`;
        
        default:
          return '';
      }
    })();

    return basePrompt + cuisineSpecificPrompt;
  };

  const prompt = getDietarySpecificPrompt(userData) + `
    
    STRICT REQUIREMENTS:
    1. ALL meals MUST be authentic Indian dishes only
    2. NO meal repetition within the entire plan
    3. Include a diverse mix of dishes from different Indian regions
    ${userData.useNutritionInput ? "4. EXACT NUTRITION VALUES as specified by the user - this overrides all other considerations" : ""}
    
    MEAL-SPECIFIC REQUIREMENTS:
    
    Breakfast Options (include items like):
    - South Indian: Idli, Dosa, Uttapam, Upma, Medu Vada
    - North Indian: Paratha, Poha, Chole Bhature
    - West Indian: Dhokla, Thepla
    - East Indian: Luchi-Aloor Dom, Puri-Sabzi
    
    Lunch Thali Requirements:
    - Main: Roti/Rice varieties (eg: Phulka, Jeera Rice)
    - Dal varieties (eg: Dal Tadka, Sambar, Dal Makhani)
    - Sabzi/Curry (eg: Palak Paneer, Baingan Bharta)
    - Side dishes (eg: Raita, Pickle, Papad)
    
    Dinner Requirements (lighter but nutritious):
    - Light curries with roti/rice
    - Mixed vegetable dishes
    - Healthy protein options
    - Regional specialties in lighter versions
    
    Traditional Indian Snacks:
    - Steamed options: Dhokla, Idli
    - Chaats: Bhel Puri, Sev Puri, Dahi Puri
    - Fried items (in moderation): Samosa, Pakora
    - Healthy options: Sprouts Chaat, Makhana
    
    For each day, provide detailed descriptions of breakfast, lunch thali components, dinner, and snacks.
    Include estimated nutrition info (calories, protein, carbs, fat) for each day.
    Add recommendations focusing on balanced Indian diet principles and the user's profile.
    
    IMPORTANT: Your response MUST be a valid JSON object with the following structure. Do not include any text before or after the JSON:
    {
      "mealPlans": [
        {
          "day": 1,
          "meals": {
            "breakfast": "Detailed description of Indian breakfast with main and side items",
            "lunch": "Complete thali description listing all components (roti/rice, dal, sabzi, sides)",
            "dinner": "Light Indian dinner description with all components",
            "snacks": ["Morning Indian snack", "Evening Indian snack"]
          },
          "nutritionInfo": {
            "calories": ${userData.useNutritionInput && userData.calories !== undefined ? userData.calories : 2000},
            "protein": ${userData.useNutritionInput && userData.protein !== undefined ? userData.protein : 75},
            "carbs": ${userData.useNutritionInput && userData.carbs !== undefined ? userData.carbs : 225},
            "fat": ${userData.useNutritionInput && userData.fat !== undefined ? userData.fat : 60}
            ${userData.useNutritionInput && userData.fiber !== undefined ? `,"fiber": ${userData.fiber}` : ""}
          }
        }
      ],
      "recommendations": [
        "Recommendation about Indian diet principles",
        "Recommendation about meal timings and combinations",
        "Recommendation about incorporating regional varieties"
      ]
    }

    MOST IMPORTANT: Return ONLY valid JSON that exactly matches this structure. No text explanations before or after the JSON.`;

  console.log("Sending request to Gemini API with prompt:", prompt);

  // Check cache first
  const cacheKey = generateCacheKey(prompt, apiConfig.model);
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    console.log("Using cached response");
    return cachedResponse.data;
  }

  let retryCount = 0;
  let lastError: Error | null = null;
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Log the retry attempt
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES}`);
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.key}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            ...apiConfig.parameters,
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 8192,
          },
        }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Gemini API error response:", errorData);
        
        // Log response status and headers for debugging
        console.error(`API Response Status: ${response.status} ${response.statusText}`);
        console.error("API Response Headers:", Object.fromEntries(response.headers.entries()));
        
        // For certain error codes, don't retry
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(`API returned ${response.status}: ${JSON.stringify(errorData)}`);
        }
        
        // For server errors or rate limits, retry
        throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error("Unexpected API response structure:", data);
        throw new Error("Invalid response structure from Gemini API");
      }

      // Look for completion signals in the response
      const isCompleteResponse = checkResponseCompleteness(data);
      if (!isCompleteResponse) {
        console.warn("Possibly incomplete response detected. Content may be cut off.");
      }

      // Log usage metrics if available
      if (data.usageMetadata) {
        console.log("API usage metrics:", data.usageMetadata);
      }

      // Store the successful response in cache
      responseCache.set(cacheKey, {
        data: data,
        timestamp: Date.now(),
      });
      
      // Increment API usage counter
      await incrementApiUsage();

      return data;
    } catch (error) {
      console.error(`Error on attempt ${retryCount + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Increment retry counter
      retryCount++;
      
      // If we haven't reached max retries yet, wait before retrying
      if (retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        console.log(`Waiting ${delay}ms before retry ${retryCount + 1}...`);
        await sleep(delay);
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  console.error(`Failed after ${MAX_RETRIES} attempts`);
  if (lastError) {
    throw lastError;
  } else {
    throw new Error("Failed to get response from Gemini API after multiple attempts");
  }
}

// Helper function to check if a response appears complete
function checkResponseCompleteness(response: any): boolean {
  if (!response.candidates || !response.candidates[0]) return false;
  
  const content = response.candidates[0].content?.parts?.[0]?.text;
  if (!content) return false;
  
  // Check if the response ends properly with a closing bracket
  // and doesn't contain typical truncation markers
  const hasProperEnding = content.trim().endsWith('}');
  const hasTruncationMarkers = content.includes('...');
  const hasUnmatchedBrackets = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
  
  return hasProperEnding && !hasTruncationMarkers && !hasUnmatchedBrackets;
}

export async function getRecipe(mealName: string, cuisine?: 'north-indian' | 'south-indian'): Promise<string> {
  const apiConfig = getApiConfig();

  const prompt = `Generate a detailed recipe for ${mealName}${cuisine ? ` in ${cuisine} style` : ''}. Include:
1. Ingredients list with quantities
2. Step-by-step cooking instructions
3. Cooking time and difficulty level
4. Tips for best results
5. Nutritional information (calories, protein, carbs, fat)
6. Video Tutorial Links (include 2-3 YouTube video links for this recipe)

Format the response in a clear, easy-to-read way. For video links, format them as:
VIDEO TUTORIALS:
1. [Video Title] - [YouTube URL]
2. [Video Title] - [YouTube URL]
3. [Video Title] - [YouTube URL]`;

  // Check cache first
  const cacheKey = generateCacheKey(prompt, apiConfig.model);
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    console.log("Using cached recipe response");
    return cachedResponse.data.candidates[0].content.parts[0].text;
  }

  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiConfig.model}:generateContent?key=${apiConfig.key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            ...apiConfig.parameters,
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error response:', errorData);
        
        if (response.status === 429) {
          const retryInfo = errorData.error.details.find(d => d['@type']?.includes('RetryInfo'));
          const retryDelay = retryInfo?.retryDelay || '60s';
          
          if (retryCount < MAX_RETRIES - 1) {
            const delay = getRetryDelay(retryCount);
            console.log(`Rate limited. Retrying in ${delay}ms...`);
            await sleep(delay);
            retryCount++;
            continue;
          }
        }
        
        throw new Error(`Failed to generate recipe: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response structure from Gemini API');
      }

      // Estimate token count and increment usage
      const tokenCount = Math.ceil((JSON.stringify(prompt).length + JSON.stringify(data).length) / 4);
      incrementApiUsage(tokenCount);

      // Cache the successful response
      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (retryCount < MAX_RETRIES - 1) {
        const delay = getRetryDelay(retryCount);
        console.log(`Error occurred. Retrying in ${delay}ms...`);
        await sleep(delay);
        retryCount++;
        continue;
      }
      throw error;
    }
  }

  throw new Error("Maximum retry attempts reached. Please try again later.");
}
