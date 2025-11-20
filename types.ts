export interface MacroData {
  name: string;
  value: number;
  fill: string;
  unit: string;
}

export interface FoodAnalysisResult {
  foodName: string;
  description: string;
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  sugar: number;   // grams
  fiber: number;   // grams
  sodium: number;  // mg
  potassium: number; // mg
  cholesterol: number; // mg
  confidenceScore?: number;
}

export interface FoodLogItem extends FoodAnalysisResult {
  id: string;
  timestamp: number;
  imageUrl: string;
}

export enum AppView {
  LAUNCH = 'LAUNCH',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;   // grams
  fiber: number;   // grams
  sodium: number;  // mg
  potassium: number; // mg
  cholesterol: number; // mg
}