
export interface MacroData {
  name: string;
  value: number;
  fill: string;
  unit: string;
}

export interface ExerciseSuggestion {
  activity: string;
  durationMinutes: number;
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
  water: number;   // ml (milliliters)
  quantityUnit?: string; // e.g. "slice", "piece", "bar", "bowl"
  itemCount?: number;    // e.g. 2 (if the image contains 2 slices)
  exerciseSuggestions: ExerciseSuggestion[];
  confidenceScore?: number;
}

export interface FoodLogItem extends FoodAnalysisResult {
  id: string;
  timestamp: number;
  imageUrl: string;
}

export interface ExerciseLogItem {
  id: string;
  timestamp: number;
  activityId: string;
  activityName: string;
  durationMinutes: number;
  caloriesBurned: number;
}

export enum AppView {
  LAUNCH = 'LAUNCH',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
}

export enum GoalType {
  MAINTAIN = 'MAINTAIN',
  LOSE_WEIGHT = 'LOSE_WEIGHT',
  GAIN_MUSCLE = 'GAIN_MUSCLE',
}

export type Theme = 'light' | 'dark' | 'neon';

export type ModelName = 'gemini-2.5-flash' | 'gemini-3-flash-preview';

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
  water: number;   // ml
}
