import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysisResult } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image to extract nutritional information.
 * @param base64Image The base64 encoded string of the image (without data:image/... prefix)
 * @param mimeType The mime type of the image (e.g., 'image/jpeg')
 */
export const analyzeFoodImage = async (base64Image: string, mimeType: string): Promise<FoodAnalysisResult> => {
  try {
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
            text: "Analyze this image of food. Identify the main dish or items. Estimate the total calories, macronutrients (protein, carbs, fat), and detailed nutrients (sugar, fiber, sodium, potassium, cholesterol) for the visible portion. Provide a short, appetizing description. Be realistic with portion sizes. If the image is not food, set the foodName to 'Unknown' and values to 0.",
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
            calories: {
              type: Type.INTEGER,
              description: "Total estimated calories.",
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
          },
          required: ["foodName", "calories", "protein", "carbs", "fat", "sugar", "fiber", "sodium", "potassium", "cholesterol", "description"],
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
    // Return a safe fallback if analysis fails effectively
    throw new Error("Failed to analyze image. Please try again.");
  }
};