import { getApiConfig } from "@/config/api";

export async function getRecipeDetails(dishName: string) {
  const apiConfig = getApiConfig();

  const prompt = `Generate a detailed recipe for the Indian dish "${dishName}". 
  Provide the information in JSON format with the following structure:
  {
    "ingredients": [
      "detailed list of ingredients with quantities"
    ],
    "steps": [
      "step by step cooking instructions"
    ],
    "cookingTime": "total time including prep",
    "servings": number of servings,
    "difficulty": "Easy/Medium/Hard"
  }

  Make sure to:
  1. Include precise measurements for ingredients
  2. Break down steps into clear, manageable instructions
  3. Include any special tips or techniques
  4. Mention cooking temperatures where applicable
  5. Note any alternative ingredients or methods`;

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
      console.error("Gemini API error response:", errorData);
      throw new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response structure from Gemini API");
    }

    const content = data.candidates[0].content.parts[0].text;
    const cleanContent = content.replace(/```json\n|\n```/g, "").trim();
    const recipeDetails = JSON.parse(cleanContent);

    return recipeDetails;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get recipe details: ${error.message}`);
    }
    throw new Error("Failed to get recipe details");
  }
} 