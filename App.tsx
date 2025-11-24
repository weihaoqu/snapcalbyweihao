import React, { useState, useEffect, useRef } from 'react';
import { analyzeFoodImage } from './services/gemini';
import { CalorieCard, MacroCard } from './components/MacroCharts';
import { CameraInput } from './components/CameraInput';
import { AppView, FoodAnalysisResult, FoodLogItem, ExerciseLogItem, DailyGoals, GoalType, Theme } from './types';
import { Plus, ChevronLeft, ChevronRight, Check, Loader2, Utensils, ArrowRight, Sparkles, AlertTriangle, AlertOctagon, Settings, X, Sliders, Flame, Timer, Bike, Waves, Footprints, Dumbbell, Lightbulb, Activity, Mountain, Trophy, Wind, Swords, Target, TrendingDown, TrendingUp, Minus, Scale, PieChart, Zap, Calendar, Trash2, Hash, Camera, Upload, Edit2, Save, Share, PlusSquare, MoreVertical, Download, Droplets, GlassWater, Moon, Sun, Monitor } from 'lucide-react';

// Default Goals (Fallback if no weight is set)
const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150, // g
  carbs: 200, // g
  fat: 65, // g
  sugar: 50, // g
  fiber: 28, // g
  sodium: 2300, // mg
  potassium: 3500, // mg
  cholesterol: 300, // mg
  water: 2500, // ml
};

// Sports with MET (Metabolic Equivalent) values for calorie calculation
const AVAILABLE_SPORTS = [
  { id: 'Running', met: 9.8, icon: <Footprints size={18} /> },
  { id: 'Jogging', met: 7.0, icon: <Wind size={18} /> },
  { id: 'Cycling', met: 7.5, icon: <Bike size={18} /> },
  { id: 'Swimming', met: 8.0, icon: <Waves size={18} /> },
  { id: 'Hiking', met: 6.0, icon: <Mountain size={18} /> },
  { id: 'Weightlifting', met: 3.5, icon: <Dumbbell size={18} /> },
  { id: 'HIIT', met: 8.0, icon: <Flame size={18} /> },
  { id: 'Yoga', met: 2.5, icon: <Sparkles size={18} /> },
  { id: 'Boxing', met: 9.0, icon: <Swords size={18} /> },
  { id: 'Basketball', met: 6.5, icon: <Trophy size={18} /> },
  { id: 'Tennis', met: 7.0, icon: <Activity size={18} /> },
  { id: 'Volleyball', met: 4.0, icon: <Activity size={18} /> },
  { id: 'Baseball', met: 5.0, icon: <Trophy size={18} /> },
  { id: 'Pickleball', met: 4.5, icon: <Activity size={18} /> },
  { id: 'Badminton', met: 4.5, icon: <Activity size={18} /> },
  { id: 'Table Tennis', met: 4.0, icon: <Trophy size={18} /> },
];

const QUICK_MEALS = [
  { name: 'Oatmeal', calories: 150, protein: 5, carbs: 27, fat: 3, icon: '🥣' },
  { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, icon: '🍌' },
  { name: 'Boiled Egg', calories: 70, protein: 6, carbs: 1, fat: 5, icon: '🥚' },
  { name: 'Grilled Chicken', calories: 165, protein: 31, carbs: 0, fat: 4, icon: '🍗' },
  { name: 'Greek Yogurt', calories: 100, protein: 10, carbs: 4, fat: 0, icon: '🍦' },
  { name: 'Avocado Toast', calories: 250, protein: 6, carbs: 20, fat: 15, icon: '🥑' },
];

const DEFAULT_COACH_IMAGE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Black%20Cat.png"; 
const DEFAULT_COACH_NAME = "Oreo";
const USER_CAT_IMAGE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Black%20Cat.png";

// Theme Style Dictionary
const THEME_STYLES = {
  light: {
    bgMain: 'bg-slate-50',
    textMain: 'text-slate-900',
    textSecondary: 'text-slate-500',
    textMuted: 'text-slate-400',
    card: 'bg-white border border-slate-100 shadow-sm',
    headerBg: 'bg-white border-b border-slate-100 shadow-sm',
    buttonPrimary: 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700',
    buttonSecondary: 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50',
    inputBg: 'bg-slate-50 border-slate-200 focus:ring-indigo-500 text-slate-800',
    iconBg: 'bg-indigo-50 text-indigo-700',
    modalBg: 'bg-white',
    accentColor: 'indigo',
    waterCard: 'bg-cyan-50 border-cyan-100',
    waterText: 'text-cyan-900',
    alertHigh: 'bg-red-50 border-red-500 text-red-700',
    font: 'font-sans'
  },
  dark: {
    bgMain: 'bg-slate-900',
    textMain: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    card: 'bg-slate-800 border border-slate-700 shadow-none',
    headerBg: 'bg-slate-800 border-b border-slate-700 shadow-none',
    buttonPrimary: 'bg-indigo-500 text-white shadow-none hover:bg-indigo-600',
    buttonSecondary: 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600',
    inputBg: 'bg-slate-900 border-slate-700 focus:ring-indigo-500 text-slate-100',
    iconBg: 'bg-slate-700 text-indigo-400',
    modalBg: 'bg-slate-800',
    accentColor: 'indigo',
    waterCard: 'bg-slate-800 border-cyan-900',
    waterText: 'text-cyan-300',
    alertHigh: 'bg-red-900/20 border-red-800 text-red-300',
    font: 'font-sans'
  },
  neon: {
    bgMain: 'bg-neon-black',
    textMain: 'text-neon-green',
    textSecondary: 'text-neon-blue',
    textMuted: 'text-neon-pink/70',
    card: 'bg-neon-black border-2 border-neon-pink shadow-neon-pink',
    headerBg: 'bg-neon-black border-b-2 border-neon-green shadow-neon-green',
    buttonPrimary: 'bg-neon-pink text-black font-bold shadow-neon-pink hover:bg-neon-purple border-2 border-transparent',
    buttonSecondary: 'bg-black text-neon-blue border-2 border-neon-blue hover:bg-neon-blue hover:text-black font-bold',
    inputBg: 'bg-black border-2 border-neon-green focus:ring-neon-pink text-neon-green placeholder-neon-green/50',
    iconBg: 'bg-black border border-neon-green text-neon-green shadow-neon-green',
    modalBg: 'bg-black border-2 border-neon-blue',
    accentColor: 'neon-green',
    waterCard: 'bg-black border-2 border-neon-blue shadow-neon-blue',
    waterText: 'text-neon-blue',
    alertHigh: 'bg-black border-2 border-red-500 text-red-500 shadow-[0_0_10px_red]',
    font: 'font-retro tracking-wider'
  }
};

interface CustomSport {
    id: string;
    met: number;
}

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LAUNCH);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogItem[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'food' | 'drink'>('food'); // Track whether scanning food or drink
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Data Loading State
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>('light');

  // Portion Control State
  const [portionSize, setPortionSize] = useState<number>(1.0); // Slider value (multiplier)
  const [countValue, setCountValue] = useState<number>(1); // Count input value
  const [inputMode, setInputMode] = useState<'slider' | 'count'>('slider');
  
  // User Settings State
  const [weight, setWeight] = useState<number | null>(null);
  const [goalType, setGoalType] = useState<GoalType>(GoalType.MAINTAIN);
  const [targetLbs, setTargetLbs] = useState<number>(0); // For weight loss only
  const [targetMonths, setTargetMonths] = useState<number>(1); // For weight loss only
  const [frequentSports, setFrequentSports] = useState<string[]>([]);
  const [customSports, setCustomSports] = useState<CustomSport[]>([]); // User defined sports
  const [burnGoal, setBurnGoal] = useState<number>(400); // Daily calorie burn goal
  
  // Coach Persona State
  const [coachName, setCoachName] = useState<string>(DEFAULT_COACH_NAME);
  const [coachImage, setCoachImage] = useState<string>(DEFAULT_COACH_IMAGE);

  // Settings Modal Temporary State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempWeight, setTempWeight] = useState<string>('');
  const [tempGoalType, setTempGoalType] = useState<GoalType>(GoalType.MAINTAIN);
  const [tempTargetLbs, setTempTargetLbs] = useState<string>('');
  const [tempTargetMonths, setTempTargetMonths] = useState<string>('');
  const [tempSports, setTempSports] = useState<string[]>([]);
  const [tempBurnGoal, setTempBurnGoal] = useState<string>('');
  const [tempCoachName, setTempCoachName] = useState<string>('');
  const [tempCoachImage, setTempCoachImage] = useState<string>('');
  const [tempTheme, setTempTheme] = useState<Theme>('light');
  const [settingError, setSettingError] = useState<string>('');
  
  // Custom Sport Add State (in Settings)
  const [newCustomSportName, setNewCustomSportName] = useState('');
  const [newCustomSportIntensity, setNewCustomSportIntensity] = useState('6'); // Default moderate

  // Exercise Modal State
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('Running');
  const [exerciseDuration, setExerciseDuration] = useState<number>(30);
  const [exerciseCalories, setExerciseCalories] = useState<string>('');
  
  // Quick Add Modal State
  const [quickAddModal, setQuickAddModal] = useState<{ isOpen: boolean, meal: typeof QUICK_MEALS[0] | null }>({ isOpen: false, meal: null });
  const [quickAddQuantity, setQuickAddQuantity] = useState<number>(1);

  // Custom Water Modal State
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [customWaterAmount, setCustomWaterAmount] = useState<string>('');

  // Edit States
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLogItem | null>(null);
  const [editingExerciseLog, setEditingExerciseLog] = useState<ExerciseLogItem | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'food' | 'exercise', id: string } | null>(null);
  
  // Install Prompt State
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const t = THEME_STYLES[theme];

  // Load data from local storage on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem('snapcalorie_logs');
      if (savedLogs) setLogs(JSON.parse(savedLogs));

      const savedExerciseLogs = localStorage.getItem('snapcalorie_exercise_logs');
      if (savedExerciseLogs) setExerciseLogs(JSON.parse(savedExerciseLogs));
      
      const savedWeight = localStorage.getItem('snapcalorie_weight');
      if (savedWeight) {
        setWeight(parseFloat(savedWeight));
        setTempWeight(savedWeight);
      } else {
        setWeight(130);
      }

      const savedSports = localStorage.getItem('snapcalorie_sports');
      if (savedSports) {
        setFrequentSports(JSON.parse(savedSports));
        setTempSports(JSON.parse(savedSports));
      }
      
      const savedCustomSports = localStorage.getItem('snapcalorie_custom_sports');
      if (savedCustomSports) {
        setCustomSports(JSON.parse(savedCustomSports));
      }

      const savedGoalType = localStorage.getItem('snapcalorie_goal_type');
      if (savedGoalType) setGoalType(savedGoalType as GoalType);

      const savedTargetLbs = localStorage.getItem('snapcalorie_target_lbs');
      if (savedTargetLbs) setTargetLbs(parseFloat(savedTargetLbs));

      const savedTargetMonths = localStorage.getItem('snapcalorie_target_months');
      if (savedTargetMonths) setTargetMonths(parseFloat(savedTargetMonths));

      const savedBurnGoal = localStorage.getItem('snapcalorie_burn_goal');
      if (savedBurnGoal) setBurnGoal(parseFloat(savedBurnGoal));
      
      const savedCoachName = localStorage.getItem('snapcalorie_coach_name');
      if (savedCoachName) setCoachName(savedCoachName);
      
      const savedCoachImage = localStorage.getItem('snapcalorie_coach_image');
      if (savedCoachImage) setCoachImage(savedCoachImage);

      const savedTheme = localStorage.getItem('snapcalorie_theme');
      if (savedTheme) {
        setTheme(savedTheme as Theme);
        setTempTheme(savedTheme as Theme);
      }

      const hasLaunched = localStorage.getItem('snapcalorie_has_launched');
      if (hasLaunched === 'true') {
        setView(AppView.DASHBOARD);
      }

      // Check if running in standalone mode (installed)
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
          setIsStandalone(true);
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persistence Effects - Only run if isLoaded is true to prevent overwriting with initial empty state
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('snapcalorie_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn("Storage full: Could not save food logs", e);
    }
  }, [logs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('snapcalorie_exercise_logs', JSON.stringify(exerciseLogs));
    } catch (e) {
      console.warn("Storage full: Could not save exercise logs", e);
    }
  }, [exerciseLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (weight) localStorage.setItem('snapcalorie_weight', weight.toString());
  }, [weight, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_sports', JSON.stringify(frequentSports));
  }, [frequentSports, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_custom_sports', JSON.stringify(customSports));
  }, [customSports, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_goal_type', goalType);
    localStorage.setItem('snapcalorie_target_lbs', targetLbs.toString());
    localStorage.setItem('snapcalorie_target_months', targetMonths.toString());
  }, [goalType, targetLbs, targetMonths, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_burn_goal', burnGoal.toString());
  }, [burnGoal, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_coach_name', coachName);
  }, [coachName, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('snapcalorie_coach_image', coachImage);
    } catch(e) {
      console.warn("Storage full: Could not save coach image", e);
    }
  }, [coachImage, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('snapcalorie_theme', theme);
  }, [theme, isLoaded]);

  // --- Goal Calculation Logic ---
  const calculateGoals = (): DailyGoals => {
    if (!weight) return DEFAULT_GOALS;

    // 1. Calculate Maintenance (TDEE estimate)
    const maintenanceCalories = Math.round(weight * 15);
    
    let targetCalories = maintenanceCalories;
    let proteinMultiplier = 0.9; // Default protein
    let fatMultiplier = 0.35; // Default fat %

    // 2. Adjust based on Goal Type
    if (goalType === GoalType.LOSE_WEIGHT) {
        const totalDeficitNeeded = targetLbs * 3500;
        const days = Math.max(1, targetMonths * 30);
        const dailyDeficit = Math.round(totalDeficitNeeded / days);
        
        targetCalories = maintenanceCalories - dailyDeficit;
        targetCalories = Math.max(1200, targetCalories);

        // Higher protein to preserve muscle in deficit
        proteinMultiplier = 1.0; 
    } else if (goalType === GoalType.GAIN_MUSCLE) {
        targetCalories = maintenanceCalories + 400;
        proteinMultiplier = 1.1; 
    } 

    const calculatedProtein = Math.round(weight * proteinMultiplier);
    const calculatedFat = Math.round((targetCalories * fatMultiplier) / 9);
    const calculatedCarbs = Math.max(0, Math.round((targetCalories - (calculatedProtein * 4) - (calculatedFat * 9)) / 4));
    
    // Water calc: approx 16ml per lb or 35ml per kg
    const calculatedWater = Math.round(weight * 18);

    return {
      ...DEFAULT_GOALS,
      calories: targetCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
      water: calculatedWater
    };
  };

  const currentGoals = calculateGoals();

  // Helper to check if two dates are the same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  const dailyLogs = logs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
  const dailyExercises = exerciseLogs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
  const isToday = isSameDay(selectedDate, new Date());

  const dailyTotals = dailyLogs.reduce((acc, log) => ({
    calories: acc.calories + log.calories,
    protein: acc.protein + log.protein,
    carbs: acc.carbs + log.carbs,
    fat: acc.fat + log.fat,
    sugar: (acc.sugar || 0) + (log.sugar || 0),
    fiber: (acc.fiber || 0) + (log.fiber || 0),
    sodium: (acc.sodium || 0) + (log.sodium || 0),
    potassium: (acc.potassium || 0) + (log.potassium || 0),
    cholesterol: (acc.cholesterol || 0) + (log.cholesterol || 0),
    water: (acc.water || 0) + (log.water || 0),
  }), { ...currentGoals, calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, potassium: 0, cholesterol: 0, water: 0 });

  const totalCaloriesBurned = dailyExercises.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const effectiveCalorieGoal = currentGoals.calories + totalCaloriesBurned;

  const dailyAlerts: string[] = [];
  (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach(key => {
     if (key === 'water') return; // Don't alert for over-drinking water usually
     const goal = key === 'calories' ? effectiveCalorieGoal : currentGoals[key];
     if (dailyTotals[key] > goal * 2) {
        dailyAlerts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}`);
     }
  });

  // --- Export & Share Functions ---
  const exportCSV = () => {
    // Headers
    const foodHeader = "Date,Time,Category,Item,Description,Calories,Protein(g),Carbs(g),Fat(g),Sugar(g),Fiber(g),Sodium(mg),Water(ml)\n";
    
    // Food Rows
    const foodRows = logs.map(log => {
        const date = new Date(log.timestamp);
        const safeDesc = (log.description || '').replace(/,/g, ' '); 
        const safeName = (log.foodName || '').replace(/,/g, ' ');
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},Food,${safeName},${safeDesc},${log.calories},${log.protein},${log.carbs},${log.fat},${log.sugar},${log.fiber},${log.sodium},${log.water}`;
    }).join('\n');

    // Exercise Header
    const exerciseHeader = "\n\nDate,Time,Category,Activity,Duration(min),Calories Burned\n";
    
    // Exercise Rows
    const exerciseRows = exerciseLogs.map(log => {
        const date = new Date(log.timestamp);
        return `${date.toLocaleDateString()},${date.toLocaleTimeString()},Exercise,${log.activityName},${log.durationMinutes},${log.caloriesBurned}`;
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(foodHeader + foodRows + exerciseHeader + exerciseRows);
    
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `snapcalorie_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareProgress = async () => {
    const text = `Check out my progress on SnapCalorie! 💪\n\nToday:\n🔥 ${totalCaloriesBurned} kcal burned\n🥗 ${dailyTotals.calories} kcal consumed\n💧 ${dailyTotals.water} ml water\n\nDownload the app to track your goals!`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My SnapCalorie Stats',
                text: text,
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(text);
            alert("Progress copied to clipboard!");
        } catch (err) {
            alert("Sharing not supported on this device.");
        }
    }
  };

  const getSmartInsights = () => {
    const caloriePct = dailyTotals.calories / (effectiveCalorieGoal || 1);
    const proteinPct = dailyTotals.protein / (currentGoals.protein || 1);
    const carbsPct = dailyTotals.carbs / (currentGoals.carbs || 1);
    const fatPct = dailyTotals.fat / (currentGoals.fat || 1);
    const waterPct = dailyTotals.water / (currentGoals.water || 1);
    
    const caloriesRemaining = effectiveCalorieGoal - dailyTotals.calories;
    const proteinRemaining = Math.max(0, currentGoals.protein - dailyTotals.protein);

    let workout = { title: "Stay Active", desc: "Movement is medicine. Keep it up!", icon: <Activity className="text-indigo-500" size={20} /> };
    let food = { title: "Balance Macros", desc: "Try to hit your nutrient targets for the day.", icon: <Utensils className="text-blue-500" size={20} /> };

    // Water advice overrides if dehydration is likely
    if (waterPct < 0.2 && new Date().getHours() > 12) {
       food = { title: "Hydrate!", desc: `You're behind on water. Drink a glass now to boost metabolism.`, icon: <Droplets className="text-cyan-500" size={20} /> };
    } else if (goalType === GoalType.LOSE_WEIGHT) {
        if (caloriesRemaining < -100) {
            food = { title: "Over Calorie Limit", desc: `You're ${Math.abs(caloriesRemaining)} kcal over. Stick to water, herbal tea, and leafy greens.`, icon: <AlertTriangle className="text-red-500" size={20} /> };
        } else if (caloriesRemaining < 100 && (new Date().getHours() < 18)) {
             food = { title: "Save Calories", desc: "Running low early. Focus on high-volume, low-cal foods (cucumber, broth) to survive the night.", icon: <PieChart className="text-orange-500" size={20} /> };
        } else if (proteinPct < 0.7) {
            food = { title: "Boost Satiety", desc: "Low protein makes dieting hard. Eat egg whites or chicken breast to stay full.", icon: <Utensils className="text-blue-500" size={20} /> };
        } else if (carbsPct > 0.9) {
            food = { title: "Watch the Carbs", desc: "Carb limit reached. Swap pasta for zucchini noodles.", icon: <Minus className="text-orange-500" size={20} /> };
        } else {
             food = { title: "Smart Snacking", desc: "Doing great! Choose fiber-rich snacks to maintain deficit comfortably.", icon: <Check className="text-green-500" size={20} /> };
        }

        if (caloriesRemaining < -200) {
            workout = { title: "Damage Control", desc: `Over budget? A 30-min run can burn ~300 kcal to get back on track.`, icon: <Flame className="text-red-500" size={20} /> };
        } else if (caloriesRemaining < 100) {
             workout = { title: "Walk It Off", desc: "Close to limit. A 20-min brisk walk increases your deficit.", icon: <Footprints className="text-emerald-500" size={20} /> };
        } else {
            workout = { title: "Fat Burning Zone", desc: "Steady state cardio (Zone 2) is optimal for fat oxidation.", icon: <Activity className="text-orange-500" size={20} /> };
        }
    } else if (goalType === GoalType.GAIN_MUSCLE) {
        if (proteinPct < 0.8) {
            food = { title: "Muscle Needs Protein", desc: `You're ${Math.round(proteinRemaining)}g short. Muscles need fuel! Greek yogurt or a shake recommended.`, icon: <Dumbbell className="text-indigo-500" size={20} /> };
        } else if (caloriesRemaining > 500) {
            food = { title: "Eat to Grow", desc: "Large surplus needed. Add calorie-dense foods like peanut butter or nuts.", icon: <Plus className="text-green-500" size={20} /> };
        } else if (carbsPct < 0.6) {
             food = { title: "Fuel Your Lifts", desc: "Carbs are low. Eat oats or potatoes for glycogen.", icon: <Zap className="text-yellow-500" size={20} /> };
        } else {
             food = { title: "Perfect Fueling", desc: "Protein and calories are on point. Muscles are happy.", icon: <Check className="text-green-500" size={20} /> };
        }

        if (dailyExercises.length === 0) {
            workout = { title: "Stimulate Growth", desc: "Diet is ready. Go lift heavy! Focus on progressive overload.", icon: <Dumbbell className="text-purple-500" size={20} /> };
        } else {
            workout = { title: "Recovery Mode", desc: "Great workout. Now focus on sleep (8hrs) for gains.", icon: <Sparkles className="text-blue-400" size={20} /> };
        }
    } else {
        if (caloriesRemaining < -150) {
            food = { title: "Lighten Up", desc: "Over maintenance. Keep the next meal light.", icon: <Minus className="text-orange-500" size={20} /> };
            workout = { title: "Burn the Surplus", desc: "A quick 20-min jog will balance out the extra calories.", icon: <Flame className="text-orange-500" size={20} /> };
        } else if (fatPct > 1.0) {
             food = { title: "Watch the Fat", desc: "Fat intake is high. Switch to lean protein.", icon: <AlertTriangle className="text-yellow-500" size={20} /> };
        } else {
             food = { title: "Steady Course", desc: "Maintaining perfectly.", icon: <Check className="text-green-500" size={20} /> };
             workout = { title: "Stay Active", desc: "Consistency is key. Any 30 min activity works!", icon: <Activity className="text-emerald-500" size={20} /> };
        }
    }

    return { workout, food };
  };

  const insights = getSmartInsights();

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const startAnalysis = (type: 'food' | 'drink') => {
      setAnalysisType(type);
      setView(AppView.CAMERA);
  };

  const handleImageCapture = async (imageData: string) => {
    setCurrentImage(imageData);
    setView(AppView.ANALYSIS);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setPortionSize(1.0);
    setCountValue(1); 
    setInputMode('slider'); // Reset to default mode

    try {
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';
      // Pass the user's weight to the analysis function
      const result = await analyzeFoodImage(base64Data, mimeType, frequentSports, analysisType, weight || 130);
      setAnalysisResult(result);
      if (result.itemCount && result.itemCount > 0) {
        setCountValue(result.itemCount);
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image. Please try again.");
      setView(AppView.DASHBOARD);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Determine effective multiplier
  let effectiveMultiplier = portionSize;
  if (inputMode === 'count' && analysisResult?.itemCount && analysisResult.itemCount > 0) {
      // If user inputs "2" but image had "1", multiplier is 2.
      // If user inputs "1" but image had "2", multiplier is 0.5.
      effectiveMultiplier = countValue / analysisResult.itemCount;
  }

  // Get adjusted values based on portion size / count
  const adjustedResult = analysisResult ? {
      ...analysisResult,
      calories: Math.round(analysisResult.calories * effectiveMultiplier),
      protein: Math.round(analysisResult.protein * effectiveMultiplier),
      carbs: Math.round(analysisResult.carbs * effectiveMultiplier),
      fat: Math.round(analysisResult.fat * effectiveMultiplier),
      sugar: Math.round(analysisResult.sugar * effectiveMultiplier),
      fiber: Math.round(analysisResult.fiber * effectiveMultiplier),
      sodium: Math.round(analysisResult.sodium * effectiveMultiplier),
      potassium: Math.round(analysisResult.potassium * effectiveMultiplier),
      cholesterol: Math.round(analysisResult.cholesterol * effectiveMultiplier),
      water: Math.round(analysisResult.water * effectiveMultiplier),
  } : null;

  const confirmEntry = () => {
    if (adjustedResult && currentImage) {
      const descriptionSuffix = inputMode === 'count' 
         ? ` (${countValue} ${analysisResult?.quantityUnit || 'items'})`
         : effectiveMultiplier !== 1 ? ` (${Math.round(effectiveMultiplier * 100)}%)` : '';

      const newLog: FoodLogItem = {
        ...adjustedResult,
        foodName: adjustedResult.foodName + descriptionSuffix,
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: currentImage,
      };
      
      // Update logs state
      setLogs(prev => [newLog, ...prev]);
      
      // Transition view immediately
      setView(AppView.DASHBOARD);
      setSelectedDate(new Date());
      setCurrentImage(null);
      setAnalysisResult(null);
    }
  };

  // Quick Add Meal Logic
  const initiateQuickAdd = (meal: typeof QUICK_MEALS[0]) => {
      setQuickAddModal({ isOpen: true, meal });
      setQuickAddQuantity(1);
  };

  const confirmQuickMeal = () => {
    if (!quickAddModal.meal) return;
    const { meal } = quickAddModal;
    const multiplier = quickAddQuantity;

    const newLog: FoodLogItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          imageUrl: '',
          foodName: meal.name,
          description: `Quick add (${multiplier} serving${multiplier !== 1 ? 's' : ''})`,
          calories: Math.round(meal.calories * multiplier),
          protein: Math.round(meal.protein * multiplier),
          carbs: Math.round(meal.carbs * multiplier),
          fat: Math.round(meal.fat * multiplier),
          sugar: 0, fiber: 0, sodium: 0, potassium: 0, cholesterol: 0,
          water: 0, // Quick meals currently don't have water data in array
          exerciseSuggestions: []
    };
    setLogs(prev => [newLog, ...prev]);
    setQuickAddModal({ isOpen: false, meal: null });
  };

  // Quick Add Water Logic
  const addWaterLog = (amountMl: number, label: string) => {
    const newLog: FoodLogItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          imageUrl: '',
          foodName: label,
          description: 'Water intake',
          calories: 0,
          protein: 0, carbs: 0, fat: 0,
          sugar: 0, fiber: 0, sodium: 0, potassium: 0, cholesterol: 0,
          water: amountMl,
          exerciseSuggestions: []
    };
    setLogs(prev => [newLog, ...prev]);
  }

  const addCustomWaterLog = () => {
      const amount = parseInt(customWaterAmount);
      if (amount > 0) {
          addWaterLog(amount, `Water (${amount}ml)`);
          setIsWaterModalOpen(false);
          setCustomWaterAmount('');
      }
  }

  // Exercise Logic
  const calculateBurnedCalories = (sportId: string, minutes: number) => {
      // Check standard sports first
      const sport = AVAILABLE_SPORTS.find(s => s.id === sportId);
      
      let met = 0;
      if (sport) {
          met = sport.met;
      } else {
          // Check custom sports
          const custom = customSports.find(s => s.id === sportId);
          if (custom) {
              met = custom.met;
          }
      }

      if (!met || !weight) return 0;
      const weightKg = weight * 0.453592;
      return Math.round((met * 3.5 * weightKg) / 200 * minutes);
  }

  useEffect(() => {
     if (isExerciseModalOpen && weight) {
         // Calculate for preset OR custom sports that have a MET
         const sport = AVAILABLE_SPORTS.find(s => s.id === selectedExerciseId) || customSports.find(s => s.id === selectedExerciseId);
         if (sport) {
            const autoCalc = calculateBurnedCalories(selectedExerciseId, exerciseDuration);
            setExerciseCalories(autoCalc.toString());
         }
     }
  }, [selectedExerciseId, exerciseDuration, isExerciseModalOpen, weight, customSports]);

  const addExerciseLog = () => {
      const burn = parseInt(exerciseCalories) || 0;
      if (burn <= 0) return;
      const newExercise: ExerciseLogItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          activityId: selectedExerciseId, // Using the name input as ID
          activityName: selectedExerciseId,
          durationMinutes: exerciseDuration,
          caloriesBurned: burn
      };
      setExerciseLogs(prev => [newExercise, ...prev]);
      setIsExerciseModalOpen(false);
  };

  // Delete Handlers
  const requestDeleteFood = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteConfirm({ type: 'food', id });
  };

  const requestDeleteExercise = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteConfirm({ type: 'exercise', id });
  };

  const proceedWithDelete = () => {
      if (!deleteConfirm) return;
      if (deleteConfirm.type === 'food') {
          setLogs(prev => prev.filter(log => log.id !== deleteConfirm.id));
      } else {
          setExerciseLogs(prev => prev.filter(log => log.id !== deleteConfirm.id));
      }
      setDeleteConfirm(null);
  };

  // Edit Handlers
  const openEditFood = (log: FoodLogItem, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingFoodLog({...log});
  };

  const saveFoodEdit = () => {
      if(editingFoodLog) {
          setLogs(prev => prev.map(log => log.id === editingFoodLog.id ? editingFoodLog : log));
          setEditingFoodLog(null);
      }
  };

  const openEditExercise = (log: ExerciseLogItem, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingExerciseLog({...log});
  };

  const saveExerciseEdit = () => {
      if(editingExerciseLog) {
          setExerciseLogs(prev => prev.map(log => log.id === editingExerciseLog.id ? editingExerciseLog : log));
          setEditingExerciseLog(null);
      }
  };


  // --- Settings Handlers ---
  const openSettings = () => {
    setTempWeight(weight ? weight.toString() : '');
    setTempSports(frequentSports);
    setTempGoalType(goalType);
    setTempTargetLbs(targetLbs.toString());
    setTempTargetMonths(targetMonths.toString());
    setTempBurnGoal(burnGoal.toString());
    setTempCoachName(coachName);
    setTempCoachImage(coachImage);
    setTempTheme(theme);
    setSettingError('');
    setIsSettingsOpen(true);
  };

  const toggleSport = (sportId: string) => {
      setTempSports(prev => 
        prev.includes(sportId) 
          ? prev.filter(id => id !== sportId) 
          : [...prev, sportId]
      );
  };

  const handleCoachImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTempCoachImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleAddCustomSport = () => {
      if (!newCustomSportName.trim()) return;
      
      const newSport: CustomSport = {
          id: newCustomSportName.trim(),
          met: parseFloat(newCustomSportIntensity) || 6.0
      };
      
      setCustomSports(prev => [...prev, newSport]);
      setNewCustomSportName('');
      setNewCustomSportIntensity('6'); // reset to default
  };
  
  const handleDeleteCustomSport = (sportId: string) => {
      setCustomSports(prev => prev.filter(s => s.id !== sportId));
      // Also remove from frequent if present
      if (tempSports.includes(sportId)) {
          toggleSport(sportId);
      }
  };

  const saveSettings = () => {
      const w = parseFloat(tempWeight);
      const bg = parseFloat(tempBurnGoal);
      
      if (tempGoalType === GoalType.LOSE_WEIGHT) {
          const lbs = parseFloat(tempTargetLbs);
          const mos = parseFloat(tempTargetMonths);
          
          if (isNaN(lbs) || lbs <= 0 || isNaN(mos) || mos <= 0) {
              setSettingError("Please enter valid weight loss targets.");
              return;
          }
          if ((lbs / mos) > 5) {
              setSettingError("Unsafe goal: Max recommended loss is 5 lbs/month.");
              return;
          }
          setTargetLbs(lbs);
          setTargetMonths(mos);
      } else {
          setTargetLbs(0);
          setTargetMonths(1);
      }

      if (!isNaN(w) && w > 0) setWeight(w);
      else if (tempWeight === '') setWeight(null);

      if (!isNaN(bg) && bg > 0) setBurnGoal(bg);
      
      setGoalType(tempGoalType);
      setFrequentSports(tempSports);
      
      if (tempCoachName.trim()) setCoachName(tempCoachName);
      if (tempCoachImage) setCoachImage(tempCoachImage);
      
      setTheme(tempTheme);

      setIsSettingsOpen(false);
  };

  const getExerciseIcon = (activity: string) => {
      const lower = activity.toLowerCase();
      if (lower.includes('run')) return <Footprints className={theme === 'neon' ? 'text-neon-pink' : 'text-emerald-500'} />;
      if (lower.includes('jog')) return <Wind className={theme === 'neon' ? 'text-neon-blue' : 'text-emerald-400'} />;
      if (lower.includes('hik') || lower.includes('mountain')) return <Mountain className={theme === 'neon' ? 'text-neon-green' : 'text-stone-500'} />;
      if (lower.includes('cycl') || lower.includes('bik')) return <Bike className={theme === 'neon' ? 'text-neon-purple' : 'text-blue-500'} />;
      if (lower.includes('swim') || lower.includes('water')) return <Waves className={theme === 'neon' ? 'text-neon-blue' : 'text-cyan-500'} />;
      if (lower.includes('walk')) return <Footprints className={theme === 'neon' ? 'text-neon-yellow' : 'text-amber-500'} />;
      if (lower.includes('yoga') || lower.includes('pilates')) return <Sparkles className={theme === 'neon' ? 'text-neon-pink' : 'text-purple-500'} />;
      if (lower.includes('hiit')) return <Flame className={theme === 'neon' ? 'text-orange-500' : 'text-orange-500'} />;
      if (lower.includes('box') || lower.includes('fight') || lower.includes('combat')) return <Swords className={theme === 'neon' ? 'text-red-500' : 'text-red-500'} />;
      if (lower.includes('basketball') || lower.includes('tennis') || lower.includes('pickleball') || lower.includes('badminton') || lower.includes('table tennis') || lower.includes('ping pong') || lower.includes('volleyball') || lower.includes('baseball') || lower.includes('sport')) return <Trophy className={theme === 'neon' ? 'text-neon-yellow' : 'text-yellow-500'} />;
      return <Dumbbell className={theme === 'neon' ? 'text-indigo-500' : 'text-indigo-500'} />;
  }

  const handleGetStarted = () => {
    localStorage.setItem('snapcalorie_has_launched', 'true');
    setView(AppView.DASHBOARD);
  };

  // View: Launch Screen
  const renderLaunchScreen = () => (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden pb-safe ${theme === 'neon' ? 'bg-black text-neon-green font-retro' : 'bg-indigo-600 text-white'}`}>
        <div className="absolute inset-0 opacity-40">
            {theme === 'neon' ? (
                <>
                   <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-neon-pink/30 rounded-full blur-[100px] animate-pulse"></div>
                   <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-neon-blue/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </>
            ) : (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl animate-pulse mix-blend-screen" style={{ animationDelay: '2s' }}></div>
                </>
            )}
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md px-8">
            <div className="relative group mb-12">
              <div className={`absolute -inset-4 rounded-full opacity-30 group-hover:opacity-50 blur-xl transition duration-1000 animate-tilt ${theme === 'neon' ? 'bg-gradient-to-r from-neon-pink to-neon-blue' : 'bg-gradient-to-r from-pink-500 to-purple-600'}`}></div>
              <div className={`relative w-40 h-40 backdrop-blur-xl border rounded-full flex items-center justify-center shadow-2xl transform transition hover:scale-105 duration-500 overflow-hidden ${theme === 'neon' ? 'bg-black/30 border-neon-green shadow-neon-green/30' : 'bg-white/10 border-white/20 shadow-black/20'}`}>
                  <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-contain p-2" />
              </div>
            </div>
            
            <h1 className={`text-5xl md:text-6xl font-bold mb-4 tracking-tight text-center drop-shadow-xl ${theme === 'neon' ? 'text-neon-pink neon-glow' : 'bg-clip-text text-transparent bg-gradient-to-br from-white to-indigo-100'}`}>
                SnapCalorie
            </h1>
            
            <p className={`text-lg md:text-xl mb-12 text-center font-light leading-relaxed max-w-xs mx-auto ${theme === 'neon' ? 'text-neon-blue' : 'text-indigo-100'}`}>
                <span className={`font-semibold ${theme === 'neon' ? 'text-neon-green' : 'text-white'}`}>Coach {coachName}</span> is ready to help you hit your goals.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                  onClick={handleGetStarted}
                  className={`group relative w-full px-8 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] ${theme === 'neon' ? 'bg-neon-pink text-black shadow-neon-pink hover:bg-neon-purple' : 'bg-white text-indigo-600 shadow-2xl shadow-indigo-900/40'}`}
              >
                  <span className="relative z-10">Get Started</span>
                  <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isStandalone && (
                <button 
                   onClick={() => setShowInstallHelp(true)}
                   className={`flex items-center justify-center gap-2 transition py-2 rounded-xl ${theme === 'neon' ? 'text-neon-blue hover:text-white' : 'text-indigo-200 hover:text-white'}`}
                >
                   <Download size={18} />
                   <span className="text-sm font-medium">Install App</span>
                </button>
              )}
            </div>
        </div>
    </div>
  );

  // View: Dashboard
  const renderDashboard = () => {
    // Calculate water reminder condition
    const waterPct = dailyTotals.water / (currentGoals.water || 1);
    const currentHour = new Date().getHours();
    // Reminder if past 4PM (16:00) and less than 50% goal met
    const showWaterReminder = currentHour >= 16 && waterPct < 0.5;

    return (
    <div className="pb-10">
      <header className={`mb-6 p-4 -mx-6 -mt-8 pt-safe sticky top-0 z-20 ${t.headerBg}`}>
        <div className="flex justify-between items-center mt-8">
           <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 shadow-sm ${theme === 'neon' ? 'border-neon-green' : 'border-indigo-100 bg-indigo-50'}`}>
                 <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover" />
              </div>
              <div>
                  <h1 className={`font-bold leading-tight ${t.textMain}`}>Hi, there!</h1>
                  <p className={`text-xs font-medium ${t.textSecondary}`}>Coach {coachName} is watching</p>
              </div>
           </div>
           <button 
              onClick={openSettings}
              className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-full transition-colors group ${theme === 'neon' ? 'bg-black border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100'}`}
           >
              <div className={`p-1 rounded-full shadow-sm ${theme === 'neon' ? 'bg-black' : 'bg-white'}`}>
                <Sliders size={16} className={theme === 'neon' ? 'text-neon-blue' : 'text-indigo-600'} />
              </div>
              <span className="font-bold text-sm">My Plan</span>
           </button>
        </div>
      </header>
      
      <div className={`flex items-center justify-between p-2 rounded-2xl mb-6 ${t.card}`}>
          <button onClick={() => navigateDate(-1)} className={theme === 'neon' ? 'text-neon-pink hover:bg-neon-pink/20' : 'hover:bg-slate-50 text-slate-500'}><ChevronLeft size={20} /></button>
          <div className="flex flex-col items-center">
            <h2 className={`text-lg font-bold leading-tight ${t.textMain}`}>
                {isToday ? 'Today' : selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
            </h2>
            <p className={`text-xs font-medium ${t.textSecondary}`}>
                {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => navigateDate(1)} disabled={isToday} className={isToday ? (theme === 'neon' ? 'text-gray-800' : 'text-slate-200 cursor-not-allowed') : (theme === 'neon' ? 'text-neon-pink hover:bg-neon-pink/20' : 'hover:bg-slate-50 text-slate-500')}><ChevronRight size={20} /></button>
      </div>

      {dailyAlerts.length > 0 && (
        <div className={`mb-6 p-4 rounded-r-xl shadow-sm animate-pulse border-l-4 ${t.alertHigh}`}>
           <div className="flex items-start gap-3">
              <AlertOctagon className="shrink-0 mt-1" size={20} />
              <div>
                 <h3 className="font-bold text-sm uppercase tracking-wide">Daily Limit Exceeded</h3>
                 <p className="text-sm mt-1">You have exceeded 200% of your daily limit for: <span className="font-semibold">{dailyAlerts.join(", ")}</span></p>
              </div>
           </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className={theme === 'neon' ? 'text-neon-yellow fill-neon-yellow' : 'text-amber-500 fill-amber-500'} />
            <h3 className={`font-semibold text-sm uppercase tracking-wider ${t.textMain}`}>Quick Add</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {QUICK_MEALS.map((meal) => (
                <button 
                    key={meal.name}
                    onClick={() => initiateQuickAdd(meal)}
                    className={`flex flex-col items-center p-3 rounded-2xl min-w-[100px] transition active:scale-95 flex-shrink-0 ${t.card} hover:border-opacity-50`}
                >
                    <span className="text-2xl mb-1">{meal.icon}</span>
                    <span className={`text-xs font-bold ${t.textMain}`}>{meal.name}</span>
                    <span className={`text-[10px] ${t.textSecondary}`}>{meal.calories} kcal</span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <CalorieCard consumed={dailyTotals.calories} goal={effectiveCalorieGoal} theme={theme} />
        <button 
            onClick={() => startAnalysis('food')}
            className={`w-full p-4 rounded-3xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95 text-lg group ${t.buttonPrimary}`}
        >
            <div className={`p-2 rounded-full transition ${theme === 'neon' ? 'bg-black text-neon-pink' : 'bg-white/20 group-hover:bg-white/30'}`}>
                <Plus size={28} />
            </div>
            <span>Log New Meal</span>
        </button>
        <MacroCard totals={dailyTotals} goals={currentGoals} theme={theme} />
      </div>

      {/* Water / Hydration Section */}
      <div className={`mb-6 p-5 rounded-3xl shadow-sm relative overflow-hidden ${t.waterCard}`}>
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className={`text-lg font-semibold flex items-center gap-2 ${t.waterText}`}><Droplets size={20} className={theme === 'neon' ? 'fill-neon-blue text-neon-blue' : 'fill-cyan-500 text-cyan-500'}/> Hydration</h3>
                    <p className={`text-xs opacity-70 ${t.waterText}`}>Daily Goal: {currentGoals.water} ml</p>
                </div>
                <div className="text-right">
                    <p className={`text-2xl font-bold ${t.waterText}`}>{dailyTotals.water} <span className="text-sm font-medium opacity-70">ml</span></p>
                </div>
            </div>

            {showWaterReminder && (
                <div className={`mb-4 px-3 py-2 rounded-xl flex items-center gap-2 ${theme === 'neon' ? 'bg-black border border-neon-blue text-neon-blue shadow-[0_0_5px_cyan]' : 'bg-cyan-100/50 text-cyan-800 border border-cyan-200'}`}>
                    <AlertTriangle size={14} className="shrink-0 animate-pulse" />
                    <span className="text-xs font-bold">Drink up! You're a bit behind schedule.</span>
                </div>
            )}

            <div className={`w-full rounded-full h-4 mb-4 overflow-hidden border ${theme === 'neon' ? 'bg-black border-neon-blue' : 'bg-cyan-200 border-cyan-300'}`}>
                <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2 ${theme === 'neon' ? 'bg-neon-blue shadow-neon-blue' : 'bg-cyan-500'}`}
                    style={{ width: `${Math.min(100, (dailyTotals.water / currentGoals.water) * 100)}%` }}
                >
                    {dailyTotals.water > 100 && <span className="text-[9px] text-white font-bold opacity-80">{Math.round((dailyTotals.water / currentGoals.water) * 100)}%</span>}
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => addWaterLog(250, 'Water (Cup)')} className={`col-span-1 py-2 rounded-xl flex flex-col items-center justify-center border shadow-sm active:scale-95 transition ${t.card}`}>
                    <span className={`text-xs font-bold ${t.textMain}`}>+250</span>
                    <span className={`text-[10px] ${t.textSecondary}`}>ml</span>
                </button>
                <button onClick={() => addWaterLog(500, 'Water (Bottle)')} className={`col-span-1 py-2 rounded-xl flex flex-col items-center justify-center border shadow-sm active:scale-95 transition ${t.card}`}>
                    <span className={`text-xs font-bold ${t.textMain}`}>+500</span>
                    <span className={`text-[10px] ${t.textSecondary}`}>ml</span>
                </button>
                <button onClick={() => setIsWaterModalOpen(true)} className={`col-span-1 py-2 rounded-xl flex flex-col items-center justify-center border shadow-sm active:scale-95 transition ${t.card}`}>
                    <Edit2 size={16} className={theme === 'neon' ? 'text-neon-pink' : 'text-cyan-500 mb-1'} />
                    <span className={`text-[10px] font-bold ${t.textMain}`}>Custom</span>
                </button>
                <button onClick={() => startAnalysis('drink')} className={`col-span-1 py-2 rounded-xl flex flex-col items-center justify-center border shadow-sm active:scale-95 transition ${t.buttonPrimary}`}>
                    <Camera size={16} className="mb-1" />
                    <span className="text-[10px] font-bold">Scan</span>
                </button>
            </div>
         </div>
      </div>
      
      <div className={`mb-6 p-5 rounded-3xl ${t.card}`}>
          <div className="flex justify-between items-center mb-4">
              <div>
                  <h3 className={`text-lg font-semibold ${t.textMain}`}>Fitness & Activity</h3>
                  <p className={`text-xs ${t.textSecondary}`}>Burn calories to earn more food!</p>
              </div>
              <button onClick={() => { setSelectedExerciseId(''); setIsExerciseModalOpen(true); }} className={`p-2 rounded-xl transition ${theme === 'neon' ? 'bg-neon-pink/20 text-neon-pink hover:bg-neon-pink/40' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}><Plus size={20} /></button>
          </div>
          <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 flex-shrink-0">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className={theme === 'neon' ? 'text-gray-900' : 'text-orange-100'} />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * Math.min(100, (totalCaloriesBurned / burnGoal) * 100) / 100)} className={`${theme === 'neon' ? 'text-orange-500 shadow-[0_0_10px_orange]' : 'text-orange-500'} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className={`text-xs font-bold ${t.textMain}`}>{Math.round(Math.min(100, (totalCaloriesBurned / burnGoal) * 100))}%</span>
                 </div>
              </div>
              <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                      <div>
                          <p className={`text-xs font-medium uppercase tracking-wider ${t.textSecondary}`}>Calories Burned</p>
                          <h4 className={`text-2xl font-bold leading-none mt-1 ${t.textMain}`}>{totalCaloriesBurned} <span className={`text-sm font-normal ml-1 ${t.textSecondary}`}>/ {burnGoal} kcal</span></h4>
                      </div>
                  </div>
                  <div className={`w-full rounded-full h-2 mt-2 ${theme === 'neon' ? 'bg-gray-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
                     <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalCaloriesBurned / burnGoal) * 100)}%` }}></div>
                  </div>
              </div>
          </div>
          {dailyExercises.length > 0 ? (
              <div className="space-y-3">
                  {dailyExercises.map((log) => (
                      <div key={log.id} className={`flex items-center justify-between p-3 rounded-2xl group ${theme === 'neon' ? 'bg-black border border-gray-800' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                          <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shadow-sm ${theme === 'neon' ? 'bg-gray-900 text-gray-300' : 'bg-white text-slate-600'}`}>{getExerciseIcon(log.activityName)}</div>
                              <div>
                                  <p className={`text-sm font-semibold ${t.textMain}`}>{log.activityName}</p>
                                  <p className={`text-xs ${t.textSecondary}`}>{log.durationMinutes} mins</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-orange-500">-{log.caloriesBurned}</span>
                             <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => openEditExercise(log, e)} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'text-neon-blue hover:bg-neon-blue/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}><Edit2 size={14} /></button>
                                <button onClick={(e) => requestDeleteExercise(log.id, e)} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'text-red-500 hover:bg-red-500/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}><Trash2 size={14} /></button>
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className={`text-center p-4 border-2 border-dashed rounded-2xl ${theme === 'neon' ? 'border-gray-800' : 'border-slate-100 dark:border-slate-700'}`}>
                  <p className={`text-sm ${t.textMuted}`}>No exercise logged today.</p>
                  <button onClick={() => { setSelectedExerciseId(''); setIsExerciseModalOpen(true); }} className={`text-sm font-semibold mt-1 ${theme === 'neon' ? 'text-neon-pink' : 'text-indigo-500'}`}>Log a workout</button>
              </div>
          )}
      </div>

      {isToday && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full overflow-hidden border ${theme === 'neon' ? 'border-neon-green bg-black' : 'border-slate-200 bg-indigo-50'}`}>
                    <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover" />
                </div>
                <h3 className={`text-lg font-semibold ${t.textMain}`}>Coach {coachName}'s Insights</h3>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-md ${theme === 'neon' ? 'bg-gray-900 text-neon-blue' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                Goal: {goalType === GoalType.LOSE_WEIGHT ? 'Lose Weight' : goalType === GoalType.GAIN_MUSCLE ? 'Gain Muscle' : 'Maintain'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className={`p-4 rounded-2xl flex flex-col ${t.card}`}>
                 <div className={`flex items-center gap-2 mb-2 font-semibold ${t.textMain}`}>
                    <div className={`p-1.5 rounded-lg ${t.iconBg}`}>{insights.workout.icon}</div>
                    {insights.workout.title}
                 </div>
                 <p className={`text-sm leading-relaxed ${t.textSecondary}`}>{insights.workout.desc}</p>
             </div>
             <div className={`p-4 rounded-2xl flex flex-col ${t.card}`}>
                 <div className={`flex items-center gap-2 mb-2 font-semibold ${t.textMain}`}>
                    <div className={`p-1.5 rounded-lg ${t.iconBg}`}>{insights.food.icon}</div>
                    {insights.food.title}
                 </div>
                 <p className={`text-sm leading-relaxed ${t.textSecondary}`}>{insights.food.desc}</p>
             </div>
          </div>
        </div>
      )}

      <div className={`p-5 rounded-3xl mb-6 ${t.card}`}>
          <h3 className={`text-lg font-semibold mb-4 ${t.textMain}`}>Detailed Nutrition</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
             {[
                { label: 'Sugar', value: dailyTotals.sugar, max: currentGoals.sugar, unit: 'g', color: theme === 'neon' ? 'bg-neon-pink' : 'bg-red-500' },
                { label: 'Sodium', value: dailyTotals.sodium, max: currentGoals.sodium, unit: 'mg', color: theme === 'neon' ? 'bg-neon-blue' : 'bg-cyan-600' },
                { label: 'Fiber', value: dailyTotals.fiber, max: currentGoals.fiber, unit: 'g', color: theme === 'neon' ? 'bg-neon-green' : 'bg-emerald-600' },
                { label: 'Cholesterol', value: dailyTotals.cholesterol, max: currentGoals.cholesterol, unit: 'mg', color: theme === 'neon' ? 'bg-orange-500' : 'bg-orange-600' },
                { label: 'Potassium', value: dailyTotals.potassium, max: currentGoals.potassium, unit: 'mg', color: theme === 'neon' ? 'bg-purple-500' : 'bg-purple-600' },
             ].map((item) => {
                 const pct = Math.round((item.value / item.max) * 100);
                 const isHigh = pct > 100;
                 return (
                    <div key={item.label} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-1">
                           <span className={`text-sm ${t.textSecondary}`}>{item.label}</span>
                           <span className={`font-bold ${t.textMain}`}>{item.value}{item.unit}</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'neon' ? 'bg-gray-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
                           <div className={`h-full rounded-full ${isHigh ? (theme === 'neon' ? 'bg-red-600 shadow-[0_0_5px_red]' : 'bg-red-500') : item.color} ${theme === 'neon' ? 'shadow-[0_0_5px_currentColor]' : ''}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                        <div className={`text-right text-[10px] mt-0.5 ${t.textMuted}`}>{pct}% DV</div>
                    </div>
                 )
             })}
          </div>
      </div>

      <div className="mb-6">
        <h2 className={`text-xl font-semibold mb-4 ${t.textMain}`}>{isToday ? 'Recent Meals' : 'Meals History'}</h2>
        {dailyLogs.length === 0 ? (
            <div className={`rounded-3xl p-8 text-center ${t.card}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${t.iconBg}`}><Utensils size={32} /></div>
                <p className={t.textSecondary}>No meals tracked for this day.</p>
                {isToday && <p className={`text-sm mt-1 ${t.textMuted}`}>Tap "Log Meal" to start.</p>}
            </div>
        ) : (
            <div className="space-y-4">
                {dailyLogs.map((log) => (
                    <div key={log.id} className={`p-4 rounded-2xl flex gap-4 items-center group ${t.card}`}>
                        {log.imageUrl ? (
                           <img src={log.imageUrl} alt={log.foodName} className={`w-20 h-20 rounded-xl object-cover flex-shrink-0 ${theme === 'neon' ? 'bg-gray-900 border border-gray-800' : 'bg-slate-100'}`} />
                        ) : log.foodName.includes('Water') ? (
                           <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === 'neon' ? 'bg-black border border-neon-blue text-neon-blue' : 'bg-cyan-50 text-cyan-500'}`}><GlassWater size={32} /></div>
                        ) : (
                           <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${theme === 'neon' ? 'bg-black border border-gray-700' : 'bg-indigo-50'}`}>{QUICK_MEALS.find(m => m.name === log.foodName)?.icon || '🍱'}</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold truncate ${t.textMain}`}>{log.foodName}</h4>
                            <p className={`text-xs line-clamp-1 ${t.textSecondary}`}>{log.description}</p>
                            <div className="flex gap-3 mt-2 text-xs font-medium">
                                <span className={theme === 'neon' ? 'text-neon-pink' : 'text-indigo-500'}>{log.calories} kcal</span>
                                {log.water > 0 && <span className={theme === 'neon' ? 'text-neon-blue' : 'text-cyan-500'}>{log.water} ml</span>}
                                {!log.foodName.includes('Water') && <span className={theme === 'neon' ? 'text-neon-green' : 'text-blue-500'}>P: {log.protein}g</span>}
                            </div>
                        </div>
                        <div className={`flex flex-col gap-2 pl-2 border-l ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${theme === 'neon' ? 'border-gray-800' : 'border-slate-100'}`}>
                            <button onClick={(e) => openEditFood(log, e)} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'text-neon-blue hover:bg-neon-blue/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}><Edit2 size={16} /></button>
                            <button onClick={(e) => requestDeleteFood(log.id, e)} className={`p-1.5 rounded-lg transition ${theme === 'neon' ? 'text-red-500 hover:bg-red-500/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
  };

  // View: Analysis Result
  const renderAnalysis = () => {
      // Calculate high nutrients only if adjustedResult exists
      const highNutrients: string[] = [];
      if (adjustedResult) {
        (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach((key) => {
            // @ts-ignore
            const val = adjustedResult[key];
            if (val && typeof val === 'number' && key !== 'water' && val > (currentGoals[key] * 0.5)) {
               highNutrients.push(`${key.charAt(0).toUpperCase() + key.slice(1)} (${Math.round((val / currentGoals[key]) * 100)}%)`);
            }
        });
      }
      
      const isDrinkLog = analysisType === 'drink';

      return (
        <div className="h-full flex flex-col">
        <div className="relative h-64 bg-black">
            {currentImage && (
                <img src={currentImage} alt="Captured Food" className="w-full h-full object-cover opacity-80" />
            )}
            <button onClick={() => setView(AppView.DASHBOARD)} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition z-10 pt-safe mt-4"><ChevronLeft size={24} /></button>
            
            {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-md text-white animate-in fade-in duration-300">
                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 mb-6 relative ${theme === 'neon' ? 'border-neon-green shadow-neon-green' : 'border-indigo-400/30 shadow-indigo-900/50'}`}>
                         <div className={`absolute inset-0 animate-pulse ${theme === 'neon' ? 'bg-neon-green/20' : 'bg-indigo-500/20'}`}></div>
                         <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover relative z-10" />
                    </div>
                    <Loader2 size={36} className={`animate-spin mb-4 ${theme === 'neon' ? 'text-neon-pink' : 'text-indigo-400'}`} />
                    <p className={`font-bold text-xl mb-1 text-center ${theme === 'neon' ? 'text-neon-green font-retro' : ''}`}>Analyzing {analysisType === 'drink' ? 'Drink' : 'Food'}...</p>
                    <p className="text-sm text-slate-300 mb-6 text-center">Please wait while Coach {coachName} <br/> calculates the calories.</p>
                </div>
            )}
        </div>

        {!isAnalyzing && adjustedResult && (
            <div className={`flex-1 -mt-6 rounded-t-3xl p-6 shadow-lg z-10 relative overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 ${theme === 'neon' ? 'bg-black border-t-2 border-neon-pink' : 'bg-white dark:bg-slate-900'}`}>
                <div className={`w-16 h-1.5 rounded-full mx-auto mb-6 ${theme === 'neon' ? 'bg-gray-800' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                
                <div className="mb-6">
                    <h2 className={`text-2xl font-bold mb-1 ${t.textMain}`}>{adjustedResult.foodName}</h2>
                    <p className={`mb-4 ${t.textSecondary}`}>{adjustedResult.description}</p>
                    
                    {/* Enhanced Portion Control */}
                    <div className={`p-1.5 rounded-2xl mb-4 flex ${theme === 'neon' ? 'bg-gray-900 border border-gray-800' : 'bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                        <button 
                            onClick={() => setInputMode('slider')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${inputMode === 'slider' ? (theme === 'neon' ? 'bg-black text-neon-pink border border-neon-pink' : 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white') : (theme === 'neon' ? 'text-gray-500 hover:text-neon-pink' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700')}`}
                        >
                            <Scale size={16} />
                            Adjust Scale
                        </button>
                        <button 
                            onClick={() => setInputMode('count')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${inputMode === 'count' ? (theme === 'neon' ? 'bg-black text-neon-green border border-neon-green' : 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white') : (theme === 'neon' ? 'text-gray-500 hover:text-neon-green' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700')}`}
                        >
                            <Hash size={16} />
                            {isDrinkLog ? 'Volume (ml)' : 'Item Count'}
                        </button>
                    </div>

                    <div className={`p-4 rounded-2xl ${t.card}`}>
                        {inputMode === 'slider' ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`font-semibold text-sm ${t.textMain}`}>Portion Multiplier</span>
                                    <span className={`font-bold px-2 py-1 rounded-lg text-sm ${theme === 'neon' ? 'bg-gray-800 text-neon-pink border border-neon-pink' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'}`}>
                                        {portionSize}x ({Math.round(portionSize * 100)}%)
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.25" max="2.0" step="0.25" 
                                    value={portionSize}
                                    onChange={(e) => setPortionSize(parseFloat(e.target.value))}
                                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'neon' ? 'bg-gray-800 accent-neon-pink' : 'bg-slate-200 accent-indigo-600 dark:bg-slate-700'}`}
                                />
                                <div className={`flex justify-between text-xs mt-2 ${t.textMuted}`}>
                                    <span>Small</span><span>Standard</span><span>Double</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`font-semibold text-sm ${t.textMain}`}>
                                        {isDrinkLog ? 'How many ml?' : `How many ${analysisResult.quantityUnit ? analysisResult.quantityUnit + 's' : 'items'}?`}
                                    </span>
                                    {analysisResult.itemCount && (
                                        <span className={`text-xs px-2 py-1 rounded border ${theme === 'neon' ? 'bg-gray-900 border-gray-700 text-neon-green' : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-700 dark:border-slate-600'}`}>
                                            Detected: {analysisResult.itemCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button 
                                        onClick={() => setCountValue(Math.max(1, countValue - (isDrinkLog ? 50 : 1)))}
                                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${theme === 'neon' ? 'bg-black border-gray-700 text-neon-blue hover:border-neon-blue' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <div className="flex-1 text-center">
                                        <input 
                                            type="number" 
                                            value={countValue}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setCountValue(isNaN(val) ? 0 : val);
                                            }}
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            className={`w-full text-3xl font-bold text-center bg-transparent border-b border-transparent transition-colors p-0 focus:outline-none ${theme === 'neon' ? 'text-neon-pink hover:border-neon-pink focus:border-neon-pink' : 'text-slate-800 hover:border-slate-200 focus:border-indigo-500 dark:text-white'}`}
                                        />
                                        <span className={`block text-xs font-medium uppercase mt-1 ${t.textMuted}`}>
                                            {isDrinkLog ? 'ml' : (analysisResult.quantityUnit || 'Items')}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setCountValue(countValue + (isDrinkLog ? 50 : 1))}
                                        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${theme === 'neon' ? 'bg-black border-gray-700 text-neon-blue hover:border-neon-blue' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {isDrinkLog && adjustedResult.sugar > 25 && (
                     <div className={`mb-6 p-4 rounded-2xl flex gap-3 ${theme === 'neon' ? 'bg-black border border-red-500 shadow-[0_0_5px_red]' : 'bg-pink-50 border border-pink-200 dark:bg-pink-900/20 dark:border-pink-800'}`}>
                        <AlertTriangle className={theme === 'neon' ? 'text-red-500' : 'text-pink-500 shrink-0'} size={24} />
                        <div>
                            <h4 className={`font-bold text-sm ${theme === 'neon' ? 'text-red-500' : 'text-pink-800 dark:text-pink-300'}`}>High Sugar Warning</h4>
                            <p className={`text-xs mt-1 ${theme === 'neon' ? 'text-red-400' : 'text-pink-700 dark:text-pink-400'}`}>This drink contains {adjustedResult.sugar}g of sugar. That's high! Consider water instead.</p>
                        </div>
                    </div>
                )}

                {highNutrients.length > 0 && (
                    <div className={`mb-6 p-4 rounded-2xl flex gap-3 ${theme === 'neon' ? 'bg-black border border-yellow-500 shadow-[0_0_5px_yellow]' : 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                        <AlertTriangle className={theme === 'neon' ? 'text-yellow-500' : 'text-amber-500 shrink-0'} size={24} />
                        <div>
                            <h4 className={`font-bold text-sm ${theme === 'neon' ? 'text-yellow-500' : 'text-amber-800 dark:text-amber-300'}`}>High Content Warning</h4>
                            <p className={`text-xs mt-1 ${theme === 'neon' ? 'text-yellow-400' : 'text-amber-700 dark:text-amber-400'}`}>This portion contains >50% daily value for: {highNutrients.join(", ")}.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-pink' : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800'}`}>
                        <p className={`text-sm font-medium mb-1 ${theme === 'neon' ? 'text-neon-pink' : 'text-indigo-600 dark:text-indigo-300'}`}>Calories</p>
                        <p className={`text-3xl font-bold ${theme === 'neon' ? 'text-white' : 'text-indigo-900 dark:text-indigo-100'}`}>{adjustedResult.calories}</p>
                    </div>
                    <div className="space-y-2">
                         {isDrinkLog ? (
                             <>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-blue text-neon-blue' : 'bg-cyan-50 border-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300'}`}>
                                    <span className="text-sm font-medium">Volume</span>
                                    <span className="font-bold">{countValue}ml</span>
                                </div>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-pink text-neon-pink' : 'bg-pink-50 border-pink-100 text-pink-700 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300'}`}>
                                    <span className="text-sm font-medium">Sugar</span>
                                    <span className="font-bold">{adjustedResult.sugar}g</span>
                                </div>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-green text-neon-green' : 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'}`}>
                                    <span className="text-sm font-medium">Protein</span>
                                    <span className="font-bold">{adjustedResult.protein}g</span>
                                </div>
                             </>
                         ) : (
                             <>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-blue text-neon-blue' : 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'}`}>
                                    <span className="text-sm font-medium">Protein</span>
                                    <span className="font-bold">{adjustedResult.protein}g</span>
                                </div>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-green text-neon-green' : 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'}`}>
                                    <span className="text-sm font-medium">Carbs</span>
                                    <span className="font-bold">{adjustedResult.carbs}g</span>
                                </div>
                                <div className={`flex justify-between items-center px-3 py-2 rounded-xl border ${theme === 'neon' ? 'bg-gray-900 border-neon-purple text-neon-purple' : 'bg-cyan-50 border-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-300'}`}>
                                    <span className="text-sm font-medium">Water</span>
                                    <span className="font-bold">{adjustedResult.water}ml</span>
                                </div>
                             </>
                         )}
                    </div>
                </div>

                <h3 className={`font-semibold mb-3 ${t.textMain}`}>Nutritional Details</h3>
                <div className="space-y-3 mb-8">
                    {[
                        { label: 'Sugar', value: adjustedResult.sugar, unit: 'g', max: currentGoals.sugar },
                        { label: 'Fiber', value: adjustedResult.fiber, unit: 'g', max: currentGoals.fiber },
                        { label: 'Sodium', value: adjustedResult.sodium, unit: 'mg', max: currentGoals.sodium },
                    ].map((item) => {
                        const pct = Math.round((item.value / item.max) * 100);
                        return (
                            <div key={item.label} className={`flex items-center justify-between py-2 border-b last:border-0 ${theme === 'neon' ? 'border-gray-800' : 'border-slate-100 dark:border-slate-800'}`}>
                                <span className={`text-sm ${t.textSecondary}`}>{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-24 h-1.5 rounded-full ${theme === 'neon' ? 'bg-gray-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <div className={`h-1.5 rounded-full ${pct > 50 ? (theme === 'neon' ? 'bg-yellow-500 shadow-[0_0_5px_yellow]' : 'bg-amber-500') : (theme === 'neon' ? 'bg-neon-blue shadow-[0_0_5px_cyan]' : 'bg-slate-400')}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                    <span className={`font-medium w-16 text-right text-sm ${t.textMain}`}>{item.value}{item.unit}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {adjustedResult.exerciseSuggestions && adjustedResult.exerciseSuggestions.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="text-orange-500" size={20} />
                            <h3 className={`font-semibold ${t.textMain}`}>Burn It Off</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {adjustedResult.exerciseSuggestions.map((ex, idx) => (
                                <div key={idx} className={`p-3 rounded-2xl flex flex-col items-center text-center ${theme === 'neon' ? 'bg-gray-900 border border-gray-800' : 'bg-orange-50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                                    <div className={`p-2 rounded-full mb-2 shadow-sm ${theme === 'neon' ? 'bg-black text-neon-pink' : 'bg-white'}`}>{getExerciseIcon(ex.activity)}</div>
                                    <p className={`text-xs font-medium line-clamp-1 ${t.textMain}`}>{ex.activity}</p>
                                    <div className="flex items-center gap-1 mt-1 text-orange-600">
                                        <Timer size={10} />
                                        <span className="text-xs font-bold">{Math.round(ex.durationMinutes * effectiveMultiplier)}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={confirmEntry} className={`w-full py-4 font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98] ${t.buttonPrimary}`}>
                    <Check size={20} />
                    Add to Log
                </button>
                <button onClick={() => setView(AppView.CAMERA)} className={`w-full mt-3 py-4 font-medium rounded-2xl flex items-center justify-center gap-2 transition ${t.buttonSecondary}`}>
                    Retake Photo
                </button>
            </div>
        )}
        </div>
      );
  }

  if (view === AppView.LAUNCH) return renderLaunchScreen();

  return (
    <div className={`max-w-md mx-auto h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col pb-safe ${t.bgMain} ${t.font} ${theme === 'dark' || theme === 'neon' ? 'dark' : ''} ${theme === 'neon' ? 'neon' : ''}`}>
      
      {/* Install App Instructions Modal */}
      {showInstallHelp && (
         <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 ${t.modalBg}`}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className={`text-2xl font-bold ${t.textMain}`}>Install App</h3>
                   <button onClick={() => setShowInstallHelp(false)} className={`p-2 rounded-full transition ${theme === 'neon' ? 'bg-gray-800 text-neon-pink' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}><X size={20} /></button>
                </div>
                
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-2xl ${t.iconBg}`}>
                            <Share size={24} />
                        </div>
                        <div>
                            <h4 className={`font-bold ${t.textMain}`}>1. Tap Share</h4>
                            <p className={`text-sm ${t.textSecondary}`}>Tap the Share icon at the bottom of your Safari browser.</p>
                        </div>
                    </div>
                    
                    <div className={`w-full h-px ${theme === 'neon' ? 'bg-gray-800' : 'bg-slate-100 dark:bg-slate-700'}`}></div>

                    <div className="flex gap-4 items-start">
                        <div className={`p-3 rounded-2xl ${t.iconBg}`}>
                            <PlusSquare size={24} />
                        </div>
                        <div>
                            <h4 className={`font-bold ${t.textMain}`}>2. Add to Home Screen</h4>
                            <p className={`text-sm ${t.textSecondary}`}>Scroll down and tap "Add to Home Screen".</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border mt-4 ${t.card}`}>
                        <p className={`text-xs flex items-center gap-2 ${t.textSecondary}`}>
                           <span className={`font-bold ${theme === 'neon' ? 'text-neon-pink' : 'text-indigo-600'}`}>Note for Android:</span> Tap the <MoreVertical size={12} className="inline" /> menu and select "Install App".
                        </p>
                    </div>
                </div>

                <button onClick={() => setShowInstallHelp(false)} className={`w-full mt-8 py-4 font-bold rounded-2xl transition ${t.buttonPrimary}`}>Got it!</button>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center ${t.modalBg}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'neon' ? 'bg-gray-900 text-red-500' : 'bg-red-50 text-red-500 dark:bg-red-900/20'}`}>
                  <Trash2 size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${t.textMain}`}>Delete this item?</h3>
              <p className={`mb-6 ${t.textSecondary}`}>This action cannot be undone.</p>
              <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className={`flex-1 py-3 font-bold rounded-xl transition ${t.buttonSecondary}`}>Cancel</button>
                  <button onClick={proceedWithDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition">Delete</button>
              </div>
           </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {quickAddModal.isOpen && quickAddModal.meal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${t.modalBg}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${t.textMain}`}>
                          <Zap className={theme === 'neon' ? 'text-neon-yellow' : 'text-amber-500'} size={24} />
                          Quick Add
                      </h3>
                      <button onClick={() => setQuickAddModal({ isOpen: false, meal: null })} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
                  </div>
                  
                  <div className="flex flex-col items-center mb-6">
                      <div className="text-6xl mb-4">{quickAddModal.meal.icon}</div>
                      <h4 className={`text-2xl font-bold ${t.textMain}`}>{quickAddModal.meal.name}</h4>
                      <p className={t.textSecondary}>{quickAddModal.meal.calories} kcal / serving</p>
                  </div>

                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 text-center ${t.textSecondary}`}>How many servings?</label>
                      <div className="flex items-center justify-center gap-4">
                          <button 
                              onClick={() => setQuickAddQuantity(Math.max(1, quickAddQuantity - 1))}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${theme === 'neon' ? 'bg-gray-800 text-neon-green hover:bg-gray-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                          >
                              <Minus size={20} />
                          </button>
                          <span className={`text-3xl font-bold w-12 text-center ${t.textMain}`}>{quickAddQuantity}</span>
                          <button 
                              onClick={() => setQuickAddQuantity(quickAddQuantity + 1)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${theme === 'neon' ? 'bg-gray-800 text-neon-green hover:bg-gray-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}
                          >
                              <Plus size={20} />
                          </button>
                      </div>
                  </div>

                  <div className={`rounded-2xl p-4 mb-6 border ${t.card}`}>
                      <div className="flex justify-between items-center mb-2">
                          <span className={`font-medium ${t.textSecondary}`}>Total Calories</span>
                          <span className={`font-bold text-lg ${theme === 'neon' ? 'text-neon-pink' : 'text-indigo-600'}`}>{Math.round(quickAddModal.meal.calories * quickAddQuantity)} kcal</span>
                      </div>
                      <div className={`flex gap-2 text-xs justify-end ${t.textMuted}`}>
                          <span>P: {Math.round(quickAddModal.meal.protein * quickAddQuantity)}g</span>
                          <span>•</span>
                          <span>C: {Math.round(quickAddModal.meal.carbs * quickAddQuantity)}g</span>
                          <span>•</span>
                          <span>F: {Math.round(quickAddModal.meal.fat * quickAddQuantity)}g</span>
                      </div>
                  </div>

                  <button onClick={confirmQuickMeal} className={`w-full py-3 font-bold rounded-xl transition active:scale-95 ${t.buttonPrimary}`}>Add to Log</button>
              </div>
          </div>
      )}

      {/* Custom Water Modal */}
      {isWaterModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${t.modalBg}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${t.textMain}`}>
                          <GlassWater className={theme === 'neon' ? 'text-neon-blue' : 'text-cyan-500'} size={24} />
                          Add Water
                      </h3>
                      <button onClick={() => setIsWaterModalOpen(false)} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
                  </div>
                  
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>Amount in ml</label>
                      <div className="relative">
                          <input 
                            type="number" 
                            value={customWaterAmount} 
                            onChange={(e) => setCustomWaterAmount(e.target.value)} 
                            className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 text-lg font-bold ${t.inputBg}`} 
                            placeholder="e.g. 300"
                            autoFocus
                          />
                          <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-medium ${t.textMuted}`}>ml</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                         <button onClick={() => setCustomWaterAmount('250')} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${theme === 'neon' ? 'bg-black border-neon-blue text-neon-blue' : 'bg-slate-50 hover:bg-cyan-50 text-cyan-700 border-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-cyan-300'}`}>250ml</button>
                         <button onClick={() => setCustomWaterAmount('500')} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${theme === 'neon' ? 'bg-black border-neon-blue text-neon-blue' : 'bg-slate-50 hover:bg-cyan-50 text-cyan-700 border-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-cyan-300'}`}>500ml</button>
                         <button onClick={() => setCustomWaterAmount('750')} className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${theme === 'neon' ? 'bg-black border-neon-blue text-neon-blue' : 'bg-slate-50 hover:bg-cyan-50 text-cyan-700 border-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-cyan-300'}`}>750ml</button>
                      </div>
                  </div>

                  <button onClick={addCustomWaterLog} className={`w-full py-3 font-bold rounded-xl transition active:scale-95 ${theme === 'neon' ? 'bg-neon-blue text-black hover:bg-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-200'}`}>Add Water</button>
              </div>
          </div>
      )}

      {/* Exercise Add Modal */}
      {isExerciseModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${t.modalBg}`}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${t.textMain}`}>
                          <Activity className="text-orange-500" size={24} />
                          Log Activity
                      </h3>
                      <button onClick={() => setIsExerciseModalOpen(false)} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
                  </div>
                  
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>Activity Name</label>
                      <input 
                        type="text" 
                        value={selectedExerciseId} 
                        onChange={(e) => setSelectedExerciseId(e.target.value)}
                        placeholder="e.g. Frisbee, Gardening..."
                        className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 font-semibold mb-3 ${t.inputBg}`}
                      />

                      <label className={`block text-xs font-medium mb-2 ${t.textSecondary}`}>Quick Select</label>
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {[...AVAILABLE_SPORTS, ...customSports.map(cs => ({ id: cs.id, met: cs.met, icon: getExerciseIcon(cs.id) }))].map(sport => (
                              <button key={sport.id} onClick={() => setSelectedExerciseId(sport.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${selectedExerciseId === sport.id ? (theme === 'neon' ? 'bg-gray-800 border-neon-pink text-neon-pink' : 'bg-orange-50 border-orange-500 text-orange-700') : (theme === 'neon' ? 'bg-black border-gray-700 text-gray-400' : 'bg-white border-slate-100 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400')}`}>
                                  <div className={selectedExerciseId === sport.id ? (theme === 'neon' ? 'text-neon-pink' : 'text-orange-500') : (theme === 'neon' ? 'text-gray-500' : 'text-slate-400')}>{sport.icon}</div>
                                  <span className="text-[10px] font-bold mt-1 text-center leading-tight">{sport.id}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                          <label className={`text-sm font-medium ${t.textSecondary}`}>Duration</label>
                          <span className={`font-bold px-2 py-1 rounded-lg text-sm ${theme === 'neon' ? 'bg-gray-800 text-neon-pink' : 'text-orange-600 bg-orange-100'}`}>{exerciseDuration} min</span>
                      </div>
                      <input type="range" min="5" max="180" step="5" value={exerciseDuration} onChange={(e) => setExerciseDuration(parseInt(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme === 'neon' ? 'bg-gray-800 accent-neon-pink' : 'bg-slate-200 accent-orange-500'}`} />
                  </div>
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>Calories Burned {(AVAILABLE_SPORTS.find(s => s.id === selectedExerciseId) || customSports.find(s => s.id === selectedExerciseId)) ? '(Est.)' : '(Manual)'}</label>
                      <div className="relative">
                          <input type="number" value={exerciseCalories} onChange={(e) => setExerciseCalories(e.target.value)} className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 text-lg font-bold ${t.inputBg}`} placeholder="0" />
                          <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 ${t.textMuted}`}><Flame size={16} /> kcal</div>
                      </div>
                      {!(AVAILABLE_SPORTS.find(s => s.id === selectedExerciseId) || customSports.find(s => s.id === selectedExerciseId)) && <p className="text-[10px] text-orange-400 mt-1">Custom activity: Please enter calorie estimate.</p>}
                  </div>
                  <button onClick={addExerciseLog} className={`w-full py-3 font-bold rounded-xl transition active:scale-95 ${theme === 'neon' ? 'bg-neon-pink text-black hover:bg-neon-purple' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'}`}>Log Workout</button>
              </div>
          </div>
      )}

      {/* Edit Food Log Modal */}
      {editingFoodLog && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${t.modalBg}`}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-xl font-bold ${t.textMain}`}>Edit Meal</h3>
                 <button onClick={() => setEditingFoodLog(null)} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
              </div>
              <div className="space-y-4 mb-6">
                 <div>
                    <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Food Name</label>
                    <input type="text" value={editingFoodLog.foodName} onChange={(e) => setEditingFoodLog({...editingFoodLog, foodName: e.target.value})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Calories</label>
                        <input type="number" value={editingFoodLog.calories} onChange={(e) => setEditingFoodLog({...editingFoodLog, calories: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Water (ml)</label>
                        <input type="number" value={editingFoodLog.water} onChange={(e) => setEditingFoodLog({...editingFoodLog, water: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Protein (g)</label>
                        <input type="number" value={editingFoodLog.protein} onChange={(e) => setEditingFoodLog({...editingFoodLog, protein: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Carbs (g)</label>
                        <input type="number" value={editingFoodLog.carbs} onChange={(e) => setEditingFoodLog({...editingFoodLog, carbs: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                    </div>
                    <div>
                        <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Fat (g)</label>
                        <input type="number" value={editingFoodLog.fat} onChange={(e) => setEditingFoodLog({...editingFoodLog, fat: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                    </div>
                 </div>
              </div>
              <button onClick={saveFoodEdit} className={`w-full py-3 font-bold rounded-xl transition ${t.buttonPrimary}`}>Save Changes</button>
           </div>
        </div>
      )}

      {/* Edit Exercise Log Modal */}
      {editingExerciseLog && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 ${t.modalBg}`}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-xl font-bold ${t.textMain}`}>Edit Workout</h3>
                 <button onClick={() => setEditingExerciseLog(null)} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
              </div>
              <div className="space-y-4 mb-6">
                 <div>
                    <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Activity</label>
                    <div className={`w-full p-3 rounded-xl font-semibold flex items-center gap-2 ${t.card}`}>
                       {getExerciseIcon(editingExerciseLog.activityName)}
                       <span className={t.textMain}>{editingExerciseLog.activityName}</span>
                    </div>
                 </div>
                 <div>
                    <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Duration (mins)</label>
                    <input type="number" value={editingExerciseLog.durationMinutes} onChange={(e) => setEditingExerciseLog({...editingExerciseLog, durationMinutes: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                 </div>
                 <div>
                    <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Calories Burned</label>
                    <input type="number" value={editingExerciseLog.caloriesBurned} onChange={(e) => setEditingExerciseLog({...editingExerciseLog, caloriesBurned: parseInt(e.target.value) || 0})} className={`w-full p-3 rounded-xl border font-semibold ${t.inputBg}`} />
                 </div>
              </div>
              <button onClick={saveExerciseEdit} className={`w-full py-3 font-bold rounded-xl transition ${t.buttonPrimary}`}>Save Changes</button>
           </div>
        </div>
      )}

      {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto ${t.modalBg}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-xl font-bold flex items-center gap-2 ${t.textMain}`}><Sliders className={theme === 'neon' ? 'text-neon-pink' : 'text-indigo-600'} size={24} /> Customize Plan</h3>
                      <button onClick={() => setIsSettingsOpen(false)} className={`p-2 rounded-full ${t.textSecondary} hover:bg-gray-100 dark:hover:bg-slate-700`}><X size={20} /></button>
                  </div>
                  
                  {/* Coach Persona Section */}
                  <div className={`mb-8 flex flex-col items-center border-b pb-6 ${theme === 'neon' ? 'border-gray-800' : 'border-slate-100 dark:border-slate-700'}`}>
                      <label className="relative group cursor-pointer mb-3">
                          <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-md ${theme === 'neon' ? 'border-neon-green' : 'border-indigo-100 dark:border-slate-600'}`}>
                             <img src={tempCoachImage} alt="Coach Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                              <Camera className="text-white" size={24} />
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoachImageUpload} />
                      </label>
                      <div className="flex items-center gap-2 w-full justify-center">
                          <input 
                            type="text" 
                            value={tempCoachName} 
                            onChange={(e) => setTempCoachName(e.target.value)}
                            className={`text-center text-lg font-bold border-b-2 border-transparent hover:border-slate-200 focus:outline-none bg-transparent w-auto min-w-[100px] transition-colors ${theme === 'neon' ? 'text-neon-pink focus:border-neon-pink' : 'text-slate-800 focus:border-indigo-500 dark:text-slate-100'}`}
                            placeholder="Coach Name"
                          />
                          <Edit2 size={14} className={t.textSecondary} />
                      </div>
                      <p className={`text-xs mt-1 ${t.textMuted}`}>Tap image to upload your pet!</p>
                  </div>

                  {settingError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex gap-2 items-center"><AlertTriangle size={16} />{settingError}</div>}
                  
                  {/* Theme Selector */}
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-3 ${t.textSecondary}`}>App Theme</label>
                      <div className="grid grid-cols-3 gap-2">
                          <button 
                             onClick={() => setTempTheme('light')} 
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${tempTheme === 'light' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                          >
                             <Monitor size={20} />
                             <span className="text-xs font-bold">Light</span>
                          </button>
                          <button 
                             onClick={() => setTempTheme('dark')} 
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${tempTheme === 'dark' ? 'bg-slate-700 border-indigo-400 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                          >
                             <Moon size={20} />
                             <span className="text-xs font-bold">Dark</span>
                          </button>
                          <button 
                             onClick={() => setTempTheme('neon')} 
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${tempTheme === 'neon' ? 'bg-black border-neon-pink text-neon-pink shadow-[0_0_5px_rgba(255,0,255,0.5)]' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                          >
                             <Zap size={20} />
                             <span className="text-xs font-bold">Neon</span>
                          </button>
                      </div>
                  </div>

                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${t.textSecondary}`}>Current Weight (lbs)</label>
                      <div className="relative">
                        <input type="number" value={tempWeight} onChange={(e) => setTempWeight(e.target.value)} placeholder="0" className={`w-full p-4 rounded-2xl focus:outline-none focus:ring-2 text-lg font-semibold ${t.inputBg}`} />
                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${t.textMuted}`}>lbs</div>
                      </div>
                  </div>
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-3 ${t.textSecondary}`}>Your Goal</label>
                      <div className="grid grid-cols-1 gap-3">
                          <button onClick={() => setTempGoalType(GoalType.LOSE_WEIGHT)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.LOSE_WEIGHT ? (theme === 'neon' ? 'border-neon-green bg-gray-900 ring-1 ring-neon-green' : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-900/30') : (theme === 'neon' ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700')}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.LOSE_WEIGHT ? (theme === 'neon' ? 'bg-black text-neon-green' : 'bg-indigo-200 text-indigo-700') : (theme === 'neon' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-600')}`}><TrendingDown size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.LOSE_WEIGHT ? (theme === 'neon' ? 'text-neon-green' : 'text-indigo-900 dark:text-indigo-100') : t.textMain}`}>Lose Weight</div><div className={`text-xs ${t.textMuted}`}>Caloric deficit to burn fat</div></div>
                          </button>
                          <button onClick={() => setTempGoalType(GoalType.MAINTAIN)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.MAINTAIN ? (theme === 'neon' ? 'border-neon-blue bg-gray-900 ring-1 ring-neon-blue' : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-900/30') : (theme === 'neon' ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700')}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.MAINTAIN ? (theme === 'neon' ? 'bg-black text-neon-blue' : 'bg-indigo-200 text-indigo-700') : (theme === 'neon' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-600')}`}><Minus size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.MAINTAIN ? (theme === 'neon' ? 'text-neon-blue' : 'text-indigo-900 dark:text-indigo-100') : t.textMain}`}>Maintain Weight</div><div className={`text-xs ${t.textMuted}`}>Balance intake with burn</div></div>
                          </button>
                          <button onClick={() => setTempGoalType(GoalType.GAIN_MUSCLE)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.GAIN_MUSCLE ? (theme === 'neon' ? 'border-neon-pink bg-gray-900 ring-1 ring-neon-pink' : 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 dark:bg-indigo-900/30') : (theme === 'neon' ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700')}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.GAIN_MUSCLE ? (theme === 'neon' ? 'bg-black text-neon-pink' : 'bg-indigo-200 text-indigo-700') : (theme === 'neon' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-600')}`}><TrendingUp size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.GAIN_MUSCLE ? (theme === 'neon' ? 'text-neon-pink' : 'text-indigo-900 dark:text-indigo-100') : t.textMain}`}>Gain Muscle</div><div className={`text-xs ${t.textMuted}`}>Surplus for hypertrophy</div></div>
                          </button>
                      </div>
                  </div>
                  {tempGoalType === GoalType.LOSE_WEIGHT && (
                      <div className={`mb-6 p-4 rounded-2xl border animate-in slide-in-from-top-2 ${theme === 'neon' ? 'bg-gray-900 border-neon-green' : 'bg-indigo-50/50 border-indigo-100 dark:bg-slate-700 dark:border-slate-600'}`}>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Amount to Lose</label>
                                  <div className="relative">
                                    <input type="number" value={tempTargetLbs} onChange={e => setTempTargetLbs(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-semibold ${t.inputBg}`} placeholder="Lbs" />
                                    <span className={`absolute right-3 top-3 text-xs ${t.textMuted}`}>lbs</span>
                                  </div>
                              </div>
                              <div>
                                  <label className={`block text-xs font-medium mb-1 ${t.textSecondary}`}>Timeframe</label>
                                  <div className="relative">
                                    <input type="number" value={tempTargetMonths} onChange={e => setTempTargetMonths(e.target.value)} className={`w-full p-3 rounded-xl border text-sm font-semibold ${t.inputBg}`} placeholder="Months" />
                                    <span className={`absolute right-3 top-3 text-xs ${t.textMuted}`}>mos</span>
                                  </div>
                              </div>
                          </div>
                          <p className="text-[10px] mt-2 flex items-center gap-1 text-indigo-400"><Target size={10} /> Max recommended rate: 5 lbs/month</p>
                      </div>
                  )}
                  
                  {/* Custom Activities Section */}
                  <div className="mb-6">
                      <label className={`block text-sm font-medium mb-3 ${t.textSecondary}`}>Manage Custom Activities</label>
                      <div className="flex flex-col gap-3 mb-3">
                          <input 
                              type="text" 
                              value={newCustomSportName} 
                              onChange={(e) => setNewCustomSportName(e.target.value)}
                              placeholder="Activity Name (e.g. Skiing)"
                              className={`w-full p-3 rounded-xl border text-sm ${t.inputBg}`}
                          />
                          <div className="flex gap-2">
                              <select 
                                  value={newCustomSportIntensity} 
                                  onChange={(e) => setNewCustomSportIntensity(e.target.value)}
                                  className={`flex-1 p-3 rounded-xl border text-sm bg-transparent ${t.textMain} ${theme === 'neon' ? 'border-neon-green' : 'border-slate-200 dark:border-slate-700'}`}
                              >
                                  <option value="3">Light (MET ~3)</option>
                                  <option value="6">Moderate (MET ~6)</option>
                                  <option value="9">Vigorous (MET ~9)</option>
                              </select>
                              <button 
                                  onClick={handleAddCustomSport} 
                                  className={`px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${theme === 'neon' ? 'bg-neon-green text-black hover:bg-neon-green/80' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                                  disabled={!newCustomSportName.trim()}
                              >
                                  <Plus size={18} />
                                  <span>Add</span>
                              </button>
                          </div>
                      </div>
                      
                      {customSports.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                              {customSports.map((sport) => (
                                  <div key={sport.id} className={`flex items-center justify-between p-2 rounded-lg border ${theme === 'neon' ? 'bg-gray-900 border-gray-700' : 'bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                                      <span className={`text-xs font-semibold truncate flex-1 ${t.textMain}`}>{sport.id}</span>
                                      <button onClick={() => handleDeleteCustomSport(sport.id)} className={`p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}><Trash2 size={12} /></button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="mb-8">
                      <label className={`block text-sm font-medium mb-3 ${t.textSecondary}`}>Frequent Activities</label>
                      <div className="grid grid-cols-3 gap-2">
                          {AVAILABLE_SPORTS.map((sport) => {
                              const isSelected = tempSports.includes(sport.id);
                              return (
                                  <button key={sport.id} onClick={() => toggleSport(sport.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected ? (theme === 'neon' ? 'bg-gray-800 border-neon-pink text-neon-pink' : 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300') : (theme === 'neon' ? 'bg-black border-gray-700 text-gray-500' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400')}`}>
                                      <div className={`mb-1 ${isSelected ? (theme === 'neon' ? 'text-neon-pink' : 'text-indigo-600') : (theme === 'neon' ? 'text-gray-500' : 'text-slate-400')}`}>{sport.icon}</div>
                                      <span className="text-[10px] font-semibold">{sport.id}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  
                  {/* Data & Sharing Section */}
                  <div className="mb-8">
                      <label className={`block text-sm font-medium mb-3 ${t.textSecondary}`}>Data & Sharing</label>
                      <div className="flex gap-3">
                          <button onClick={exportCSV} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition ${theme === 'neon' ? 'bg-black border-neon-blue text-neon-blue hover:bg-gray-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}>
                              <Download size={18} />
                              <span className="text-sm font-bold">Export CSV</span>
                          </button>
                          <button onClick={shareProgress} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition ${theme === 'neon' ? 'bg-black border-neon-pink text-neon-pink hover:bg-gray-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}>
                              <Share size={18} />
                              <span className="text-sm font-bold">Share</span>
                          </button>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setIsSettingsOpen(false)} className={`flex-1 py-3 font-semibold rounded-xl transition ${t.buttonSecondary}`}>Cancel</button>
                      <button onClick={saveSettings} className={`flex-1 py-3 font-semibold rounded-xl transition ${t.buttonPrimary}`}>Save</button>
                  </div>
              </div>
          </div>
      )}

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 pt-8 pb-6 h-full">
             {view === AppView.DASHBOARD && renderDashboard()}
             {view === AppView.ANALYSIS && renderAnalysis()}
        </div>
      </main>

      {view === AppView.CAMERA && (
        <CameraInput onCapture={handleImageCapture} onClose={() => setView(AppView.DASHBOARD)} />
      )}
    </div>
  );
};

export default App;