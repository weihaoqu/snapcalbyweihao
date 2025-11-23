import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysisResult } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image to extract nutritional information.
 * @param base64Image The base64 encoded string of the image (without data:image/... prefix)
 * @param mimeType The mime type of the image (e.g., 'image/jpeg')
 * @param frequentSports Optional list of user's preferred sports to prioritize in suggestions
 */
export const analyzeFoodImage = async (base64Image: string, mimeType: string, frequentSports: string[] = []): Promise<FoodAnalysisResult> => {
  try {
    const sportsContext = frequentSports.length > 0 
      ? `For the exercise suggestions, please prioritize these activities if appropriate: ${frequentSports.join(', ')}. Fill remaining slots with other common exercises.` 
      : "Provide 3 different exercise suggestions (e.g., Running, Swimming, Cycling, Walking).";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image of food. Identify the main dish or items. Estimate the total calories, macronutrients (protein, carbs, fat), and detailed nutrients (sugar, fiber, sodium, potassium, cholesterol) for the visible portion. 
            
            If the food is distinct and countable (e.g., 2 slices of pizza, 3 cookies, 1 chocolate bar), specifically identify the 'itemCount' seen in the image and the 'quantityUnit' (e.g., 'slice', 'cookie', 'bar'). If it's a single dish or amorphous (e.g., bowl of soup, plate of pasta), set 'itemCount' to 1 and 'quantityUnit' to 'serving' or 'bowl'.

            Provide a short, appetizing description. Be realistic with portion sizes. ${sportsContext} Provide the estimated duration in minutes required for an average adult to burn these specific calories. If the image is not food, set the foodName to 'Unknown' and values to 0.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: {
              type: Type.STRING,
              description: "The common name of the dish or food item.",
            },
            description: {
              type: Type.STRING,
              description: "A brief description of the food and estimated portion size.",
            },
            quantityUnit: {
              type: Type.STRING,
              description: "The unit of the food if countable (e.g. 'slice', 'piece', 'bar', 'cup'). Default 'serving'.",
            },
            itemCount: {
              type: Type.INTEGER,
              description: "The number of these units visible in the image. Default 1.",
            },
            calories: {
              type: Type.INTEGER,
              description: "Total estimated calories for the entire image.",
            },
            protein: {
              type: Type.INTEGER,
              description: "Estimated protein in grams.",
            },
            carbs: {
              type: Type.INTEGER,
              description: "Estimated carbohydrates in grams.",
            },
            fat: {
              type: Type.INTEGER,
              description: "Estimated fat in grams.",
            },
            sugar: {
              type: Type.INTEGER,
              description: "Estimated sugar in grams.",
            },
            fiber: {
              type: Type.INTEGER,
              description: "Estimated dietary fiber in grams.",
            },
            sodium: {
              type: Type.INTEGER,
              description: "Estimated sodium in milligrams.",
            },
            potassium: {
              type: Type.INTEGER,
              description: "Estimated potassium in milligrams.",
            },
            cholesterol: {
              type: Type.INTEGER,
              description: "Estimated cholesterol in milligrams.",
            },
            exerciseSuggestions: {
              type: Type.ARRAY,
              description: "3 suggestions for exercises to burn off these calories.",
              items: {
                type: Type.OBJECT,
                properties: {
                  activity: { type: Type.STRING, description: "Name of the activity, e.g. 'Running (6mph)'" },
                  durationMinutes: { type: Type.INTEGER, description: "Duration in minutes required to burn the calories." }
                },
                required: ["activity", "durationMinutes"]
              }
            }
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "sugar", "fiber", "sodium", "potassium", "cholesterol", "description", "exerciseSuggestions"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(text) as FoodAnalysisResult;
    return result;
  } catch (error) {
    console.error("Error analyzing food with Gemini:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};