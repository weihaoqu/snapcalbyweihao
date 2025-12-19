import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

// 初始化 Gemini 客户端 - API Key 安全存储在服务器端
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      base64Image, 
      mimeType, 
      frequentSports = [],
      analysisType = 'food',
      userWeight = 150,
      modelName = 'gemini-2.5-flash'
    } = body;

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 验证 API Key 是否配置
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 去掉 base64 前缀 (data:image/jpeg;base64,)
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const sportsContext = frequentSports.length > 0 
      ? `For the exercise suggestions, please prioritize these activities if appropriate: ${frequentSports.join(', ')}. Fill remaining slots with other common exercises.` 
      : "Provide 3 different exercise suggestions (e.g., Running, Swimming, Cycling, Walking).";
    
    const weightContext = `The user weighs ${userWeight} lbs. Use this specific weight to calculate the estimated duration required to burn the calories.`;

    let promptText = "";

    if (analysisType === 'drink') {
      promptText = `Analyze this beverage image. Identify the drink (e.g., Latte, Soda, Juice, Smoothie, Beer, Water).
      
      CRITICAL: Estimate the volume in milliliters (ml) based on the container size (cup, mug, bottle, glass). 
      
      Estimate calories and nutrients (sugar is very important for drinks). 
      If it's plain water, calories/sugar/macros are 0. 
      If it's a sugary drink (soda, juice), sugar should be high.
      If it's coffee/tea without milk/sugar, calories are near 0.
      
      Provide a short description (e.g., "Medium Iced Latte").
      Set 'quantityUnit' to 'ml' and 'itemCount' to the estimated volume (e.g. 350).
      
      ${sportsContext} ${weightContext}`;
    } else {
      promptText = `Analyze this image of food or drink. Identify the main dish or items. Estimate the total calories, macronutrients (protein, carbs, fat), and detailed nutrients (sugar, fiber, sodium, potassium, cholesterol) for the visible portion. 
      
      CRITICAL: Estimate the water content in milliliters (ml). For drinks (tea, coffee, juice), this should be high. For solid foods (watermelon, soup, oatmeal), estimate the water contained. For dry foods, it will be low.

      If the food is distinct and countable (e.g., 2 slices of pizza, 3 cookies, 1 chocolate bar), specifically identify the 'itemCount' seen in the image and the 'quantityUnit' (e.g., 'slice', 'cookie', 'bar'). If it's a single dish or amorphous (e.g., bowl of soup, plate of pasta), set 'itemCount' to 1 and 'quantityUnit' to 'serving' or 'bowl'.

      Provide a short, appetizing description. Be realistic with portion sizes. 
      
      ${sportsContext} 
      ${weightContext} 
      
      If the image is not food, set the foodName to 'Unknown' and values to 0.`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
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
            water: {
              type: Type.INTEGER,
              description: "Estimated water content in milliliters (ml).",
            },
            exerciseSuggestions: {
              type: Type.ARRAY,
              description: "3 suggestions for exercises to burn off these calories based on user weight.",
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
          required: ["foodName", "calories", "protein", "carbs", "fat", "sugar", "fiber", "sodium", "potassium", "cholesterol", "water", "description", "exerciseSuggestions"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(text);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error analyzing food with Gemini:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
