import React, { useState, useEffect } from 'react';
import { analyzeFoodImage } from './services/gemini';
import { CalorieCard, MacroCard } from './components/MacroCharts';
import { CameraInput } from './components/CameraInput';
import { AppView, FoodAnalysisResult, FoodLogItem, ExerciseLogItem, DailyGoals, GoalType } from './types';
import { Plus, ChevronLeft, ChevronRight, Check, Loader2, Utensils, ArrowRight, Sparkles, AlertTriangle, AlertOctagon, Settings, X, Sliders, Flame, Timer, Bike, Waves, Footprints, Dumbbell, Lightbulb, Activity, Mountain, Trophy, Wind, Swords, Target, TrendingDown, TrendingUp, Minus, Scale, PieChart, Zap, Calendar, Trash2, Hash, Camera, Upload, Edit2, Save, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';

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

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LAUNCH);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogItem[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
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
  const [settingError, setSettingError] = useState<string>('');

  // Exercise Modal State
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('Running');
  const [exerciseDuration, setExerciseDuration] = useState<number>(30);
  const [exerciseCalories, setExerciseCalories] = useState<string>('');
  
  // Quick Add Modal State
  const [quickAddModal, setQuickAddModal] = useState<{ isOpen: boolean, meal: typeof QUICK_MEALS[0] | null }>({ isOpen: false, meal: null });
  const [quickAddQuantity, setQuickAddQuantity] = useState<number>(1);

  // Edit States
  const [editingFoodLog, setEditingFoodLog] = useState<FoodLogItem | null>(null);
  const [editingExerciseLog, setEditingExerciseLog] = useState<ExerciseLogItem | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'food' | 'exercise', id: string } | null>(null);
  
  // Install Prompt State
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

      // Check if running in standalone mode (installed)
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
          setIsStandalone(true);
      }
    } catch (e) {
      console.error("Failed to load data from storage", e);
    }
  }, []);

  // Persistence Effects - Wrapped in try/catch to prevent crashes if storage is full
  useEffect(() => {
    try {
      localStorage.setItem('snapcalorie_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn("Storage full: Could not save food logs", e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('snapcalorie_exercise_logs', JSON.stringify(exerciseLogs));
    } catch (e) {
      console.warn("Storage full: Could not save exercise logs", e);
    }
  }, [exerciseLogs]);

  useEffect(() => {
    if (weight) localStorage.setItem('snapcalorie_weight', weight.toString());
  }, [weight]);

  useEffect(() => {
    localStorage.setItem('snapcalorie_sports', JSON.stringify(frequentSports));
  }, [frequentSports]);

  useEffect(() => {
    localStorage.setItem('snapcalorie_goal_type', goalType);
    localStorage.setItem('snapcalorie_target_lbs', targetLbs.toString());
    localStorage.setItem('snapcalorie_target_months', targetMonths.toString());
  }, [goalType, targetLbs, targetMonths]);

  useEffect(() => {
    localStorage.setItem('snapcalorie_burn_goal', burnGoal.toString());
  }, [burnGoal]);

  useEffect(() => {
    localStorage.setItem('snapcalorie_coach_name', coachName);
  }, [coachName]);

  useEffect(() => {
    try {
      localStorage.setItem('snapcalorie_coach_image', coachImage);
    } catch(e) {
      console.warn("Storage full: Could not save coach image", e);
    }
  }, [coachImage]);

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

    return {
      ...DEFAULT_GOALS,
      calories: targetCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
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
  }), { ...currentGoals, calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, potassium: 0, cholesterol: 0 });

  const totalCaloriesBurned = dailyExercises.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const effectiveCalorieGoal = currentGoals.calories + totalCaloriesBurned;

  const dailyAlerts: string[] = [];
  (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach(key => {
     const goal = key === 'calories' ? effectiveCalorieGoal : currentGoals[key];
     if (dailyTotals[key] > goal * 2) {
        dailyAlerts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}`);
     }
  });

  const getSmartInsights = () => {
    const caloriePct = dailyTotals.calories / (effectiveCalorieGoal || 1);
    const proteinPct = dailyTotals.protein / (currentGoals.protein || 1);
    const carbsPct = dailyTotals.carbs / (currentGoals.carbs || 1);
    const fatPct = dailyTotals.fat / (currentGoals.fat || 1);
    
    const caloriesRemaining = effectiveCalorieGoal - dailyTotals.calories;
    const proteinRemaining = Math.max(0, currentGoals.protein - dailyTotals.protein);

    let workout = { title: "Stay Active", desc: "Movement is medicine. Keep it up!", icon: <Activity className="text-indigo-500" size={20} /> };
    let food = { title: "Balance Macros", desc: "Try to hit your nutrient targets for the day.", icon: <Utensils className="text-blue-500" size={20} /> };

    if (goalType === GoalType.LOSE_WEIGHT) {
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
      const result = await analyzeFoodImage(base64Data, mimeType, frequentSports);
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
          exerciseSuggestions: []
    };
    setLogs(prev => [newLog, ...prev]);
    setQuickAddModal({ isOpen: false, meal: null });
  };

  // Exercise Logic
  const calculateBurnedCalories = (sportId: string, minutes: number) => {
      const sport = AVAILABLE_SPORTS.find(s => s.id === sportId);
      if (!sport || !weight) return 0;
      const weightKg = weight * 0.453592;
      return Math.round((sport.met * 3.5 * weightKg) / 200 * minutes);
  }

  useEffect(() => {
     if (isExerciseModalOpen && weight) {
         const autoCalc = calculateBurnedCalories(selectedExerciseId, exerciseDuration);
         setExerciseCalories(autoCalc.toString());
     }
  }, [selectedExerciseId, exerciseDuration, isExerciseModalOpen, weight]);

  const addExerciseLog = () => {
      const burn = parseInt(exerciseCalories) || 0;
      if (burn <= 0) return;
      const newExercise: ExerciseLogItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          activityId: selectedExerciseId,
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

      setIsSettingsOpen(false);
  };

  const getExerciseIcon = (activity: string) => {
      const lower = activity.toLowerCase();
      if (lower.includes('run')) return <Footprints className="text-emerald-500" />;
      if (lower.includes('jog')) return <Wind className="text-emerald-400" />;
      if (lower.includes('hik') || lower.includes('mountain')) return <Mountain className="text-stone-500" />;
      if (lower.includes('cycl') || lower.includes('bik')) return <Bike className="text-blue-500" />;
      if (lower.includes('swim') || lower.includes('water')) return <Waves className="text-cyan-500" />;
      if (lower.includes('walk')) return <Footprints className="text-amber-500" />;
      if (lower.includes('yoga') || lower.includes('pilates')) return <Sparkles className="text-purple-500" />;
      if (lower.includes('hiit')) return <Flame className="text-orange-500" />;
      if (lower.includes('box') || lower.includes('fight') || lower.includes('combat')) return <Swords className="text-red-500" />;
      if (lower.includes('basketball') || lower.includes('tennis') || lower.includes('pickleball') || lower.includes('badminton') || lower.includes('table tennis') || lower.includes('ping pong') || lower.includes('volleyball') || lower.includes('baseball') || lower.includes('sport')) return <Trophy className="text-yellow-500" />;
      return <Dumbbell className="text-indigo-500" />;
  }

  // View: Launch Screen
  const renderLaunchScreen = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-indigo-600 text-white overflow-hidden pb-safe">
        <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl animate-pulse mix-blend-screen" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md px-8">
            <div className="relative group mb-12">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 blur-xl transition duration-1000 animate-tilt"></div>
              <div className="relative w-40 h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl shadow-black/20 transform transition hover:scale-105 duration-500 overflow-hidden">
                  <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-contain p-2" />
              </div>
              <div className="absolute -right-3 -top-3 bg-yellow-400 text-yellow-900 p-2.5 rounded-full shadow-lg animate-bounce border-2 border-indigo-600">
                  <Sparkles size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight text-center drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-br from-white to-indigo-100">
                SnapCalorie
            </h1>
            
            <p className="text-indigo-100 text-lg md:text-xl mb-12 text-center font-light leading-relaxed max-w-xs mx-auto">
                <span className="font-semibold text-white">Coach {coachName}</span> is ready to help you hit your goals.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                  onClick={() => setView(AppView.DASHBOARD)}
                  className="group relative w-full bg-white text-indigo-600 px-8 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-3 overflow-hidden transition-all hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">Get Started</span>
                  <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isStandalone && (
                <button 
                   onClick={() => setShowInstallHelp(true)}
                   className="flex items-center justify-center gap-2 text-indigo-200 hover:text-white transition py-2 rounded-xl"
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
  const renderDashboard = () => (
    <div className="pb-10">
      <header className="mb-6 bg-white p-4 -mx-6 -mt-8 pt-safe sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center mt-8">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm bg-indigo-50">
                 <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover" />
              </div>
              <div>
                  <h1 className="font-bold text-slate-800 leading-tight">Hi, there!</h1>
                  <p className="text-xs text-slate-500 font-medium">Coach {coachName} is watching</p>
              </div>
           </div>
           <button 
              onClick={openSettings}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 pl-3 pr-4 py-2 rounded-full transition-colors border border-indigo-100 group"
           >
              <div className="bg-white p-1 rounded-full shadow-sm">
                <Sliders size={16} className="text-indigo-600" />
              </div>
              <span className="font-bold text-sm">My Plan</span>
           </button>
        </div>
      </header>
      
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button onClick={() => navigateDate(-1)} className="p-3 hover:bg-slate-50 text-slate-500 rounded-xl transition"><ChevronLeft size={20} /></button>
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
                {isToday ? 'Today' : selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => navigateDate(1)} disabled={isToday} className={`p-3 rounded-xl transition ${isToday ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-500'}`}><ChevronRight size={20} /></button>
      </div>

      {dailyAlerts.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse">
           <div className="flex items-start gap-3">
              <AlertOctagon className="text-red-500 shrink-0 mt-1" size={20} />
              <div>
                 <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Daily Limit Exceeded</h3>
                 <p className="text-red-700 text-sm mt-1">You have exceeded 200% of your daily limit for: <span className="font-semibold">{dailyAlerts.join(", ")}</span></p>
              </div>
           </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-amber-500 fill-amber-500" />
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Quick Add</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {QUICK_MEALS.map((meal) => (
                <button 
                    key={meal.name}
                    onClick={() => initiateQuickAdd(meal)}
                    className="flex flex-col items-center bg-white p-3 rounded-2xl min-w-[100px] border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition active:scale-95 flex-shrink-0"
                >
                    <span className="text-2xl mb-1">{meal.icon}</span>
                    <span className="text-xs font-bold text-slate-700">{meal.name}</span>
                    <span className="text--[10px] text-slate-400">{meal.calories} kcal</span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <CalorieCard consumed={dailyTotals.calories} goal={effectiveCalorieGoal} />
        <button 
            onClick={() => setView(AppView.CAMERA)}
            className="w-full bg-indigo-600 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-lg group"
        >
            <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition">
                <Plus size={28} />
            </div>
            <span>Log New Meal</span>
        </button>
        <MacroCard totals={dailyTotals} goals={currentGoals} />
      </div>
      
      <div className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
              <div>
                  <h3 className="text-lg font-semibold text-slate-700">Fitness & Activity</h3>
                  <p className="text-xs text-slate-400">Burn calories to earn more food!</p>
              </div>
              <button onClick={() => setIsExerciseModalOpen(true)} className="bg-orange-50 text-orange-600 p-2 rounded-xl hover:bg-orange-100 transition"><Plus size={20} /></button>
          </div>
          <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 flex-shrink-0">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-orange-100" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * Math.min(100, (totalCaloriesBurned / burnGoal) * 100) / 100)} className="text-orange-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-xs font-bold text-slate-700">{Math.round(Math.min(100, (totalCaloriesBurned / burnGoal) * 100))}%</span>
                 </div>
              </div>
              <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                      <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Calories Burned</p>
                          <h4 className="text-2xl font-bold text-slate-800 leading-none mt-1">{totalCaloriesBurned} <span className="text-sm font-normal text-slate-400 ml-1">/ {burnGoal} kcal</span></h4>
                      </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                     <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalCaloriesBurned / burnGoal) * 100)}%` }}></div>
                  </div>
              </div>
          </div>
          {dailyExercises.length > 0 ? (
              <div className="space-y-3">
                  {dailyExercises.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl group">
                          <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-xl shadow-sm text-slate-600">{getExerciseIcon(log.activityName)}</div>
                              <div>
                                  <p className="text-sm font-semibold text-slate-700">{log.activityName}</p>
                                  <p className="text-xs text-slate-400">{log.durationMinutes} mins</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-orange-500">-{log.caloriesBurned}</span>
                             <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => openEditExercise(log, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={14} /></button>
                                <button onClick={(e) => requestDeleteExercise(log.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                             </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="text-center p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-sm text-slate-400">No exercise logged today.</p>
                  <button onClick={() => setIsExerciseModalOpen(true)} className="text-indigo-500 text-sm font-semibold mt-1">Log a workout</button>
              </div>
          )}
      </div>

      {isToday && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-indigo-50">
                    <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Coach {coachName}'s Insights</h3>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                Goal: {goalType === GoalType.LOSE_WEIGHT ? 'Lose Weight' : goalType === GoalType.GAIN_MUSCLE ? 'Gain Muscle' : 'Maintain'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                 <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">{insights.workout.icon}</div>
                    {insights.workout.title}
                 </div>
                 <p className="text-sm text-slate-500 leading-relaxed">{insights.workout.desc}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                 <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <div className="p-1.5 bg-blue-50 rounded-lg">{insights.food.icon}</div>
                    {insights.food.title}
                 </div>
                 <p className="text-sm text-slate-500 leading-relaxed">{insights.food.desc}</p>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Detailed Nutrition</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
             {[
                { label: 'Sugar', value: dailyTotals.sugar, max: currentGoals.sugar, unit: 'g', color: 'text-pink-600' },
                { label: 'Sodium', value: dailyTotals.sodium, max: currentGoals.sodium, unit: 'mg', color: 'text-cyan-600' },
                { label: 'Fiber', value: dailyTotals.fiber, max: currentGoals.fiber, unit: 'g', color: 'text-emerald-600' },
                { label: 'Cholesterol', value: dailyTotals.cholesterol, max: currentGoals.cholesterol, unit: 'mg', color: 'text-orange-600' },
                { label: 'Potassium', value: dailyTotals.potassium, max: currentGoals.potassium, unit: 'mg', color: 'text-purple-600' },
             ].map((item) => {
                 const pct = Math.round((item.value / item.max) * 100);
                 const isHigh = pct > 100;
                 return (
                    <div key={item.label} className="flex flex-col">
                        <div className="flex justify-between items-baseline mb-1">
                           <span className="text-slate-500 text-sm">{item.label}</span>
                           <span className="font-bold text-slate-800">{item.value}{item.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${isHigh ? 'bg-red-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-0.5">{pct}% DV</div>
                    </div>
                 )
             })}
          </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">{isToday ? 'Recent Meals' : 'Meals History'}</h2>
        {dailyLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4"><Utensils size={32} /></div>
                <p className="text-slate-500">No meals tracked for this day.</p>
                {isToday && <p className="text-slate-400 text-sm mt-1">Tap "Log Meal" to start.</p>}
            </div>
        ) : (
            <div className="space-y-4">
                {dailyLogs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center group">
                        {log.imageUrl ? (
                           <img src={log.imageUrl} alt={log.foodName} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-100" />
                        ) : (
                           <div className="w-20 h-20 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl flex-shrink-0">{QUICK_MEALS.find(m => m.name === log.foodName)?.icon || '🍱'}</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate">{log.foodName}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{log.description}</p>
                            <div className="flex gap-3 mt-2 text-xs font-medium">
                                <span className="text-indigo-500">{log.calories} kcal</span>
                                <span className="text-blue-500">P: {log.protein}g</span>
                                <span className="text-green-500">C: {log.carbs}g</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 pl-2 border-l border-slate-100 ml-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => openEditFood(log, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={16} /></button>
                            <button onClick={(e) => requestDeleteFood(log.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );

  // View: Analysis Result
  const renderAnalysis = () => {
      // Calculate high nutrients only if adjustedResult exists
      const highNutrients: string[] = [];
      if (adjustedResult) {
        (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach((key) => {
            // @ts-ignore
            const val = adjustedResult[key];
            if (val && typeof val === 'number' && val > (currentGoals[key] * 0.5)) {
               highNutrients.push(`${key.charAt(0).toUpperCase() + key.slice(1)} (${Math.round((val / currentGoals[key]) * 100)}%)`);
            }
        });
      }

      return (
        <div className="h-full flex flex-col">
        <div className="relative h-64 bg-slate-900">
            {currentImage && (
                <img src={currentImage} alt="Captured Food" className="w-full h-full object-cover opacity-80" />
            )}
            <button onClick={() => setView(AppView.DASHBOARD)} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition z-10 pt-safe mt-4"><ChevronLeft size={24} /></button>
            
            {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-md text-white animate-in fade-in duration-300">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-400/30 mb-6 shadow-2xl shadow-indigo-900/50 relative">
                         <div className="absolute inset-0 bg-indigo-500/20 animate-pulse"></div>
                         <img src={coachImage} alt={`Coach ${coachName}`} className="w-full h-full object-cover relative z-10" />
                    </div>
                    <Loader2 size={36} className="animate-spin mb-4 text-indigo-400" />
                    <p className="font-bold text-xl mb-1 text-center">Analyzing Food...</p>
                    <p className="text-sm text-slate-300 mb-6 text-center">Please wait while Coach {coachName} <br/> calculates the calories.</p>
                </div>
            )}
        </div>

        {!isAnalyzing && adjustedResult && (
            <div className="flex-1 bg-white -mt-6 rounded-t-3xl p-6 shadow-lg z-10 relative overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{adjustedResult.foodName}</h2>
                    <p className="text-slate-500 mb-4">{adjustedResult.description}</p>
                    
                    {/* Enhanced Portion Control */}
                    <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 mb-4 flex">
                        <button 
                            onClick={() => setInputMode('slider')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${inputMode === 'slider' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Scale size={16} />
                            Adjust Scale
                        </button>
                        <button 
                            onClick={() => setInputMode('count')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${inputMode === 'count' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Hash size={16} />
                            Item Count
                        </button>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        {inputMode === 'slider' ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-700 font-semibold text-sm">Portion Multiplier</span>
                                    <span className="text-indigo-600 font-bold bg-indigo-100 px-2 py-1 rounded-lg text-sm">
                                        {portionSize}x ({Math.round(portionSize * 100)}%)
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.25" max="2.0" step="0.25" 
                                    value={portionSize}
                                    onChange={(e) => setPortionSize(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>Small</span><span>Standard</span><span>Double</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-700 font-semibold text-sm">
                                        How many {analysisResult.quantityUnit ? analysisResult.quantityUnit + 's' : 'items'}?
                                    </span>
                                    {analysisResult.itemCount && (
                                        <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                                            Detected: {analysisResult.itemCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <button 
                                        onClick={() => setCountValue(Math.max(1, countValue - 1))}
                                        className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition"
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <div className="flex-1 text-center">
                                        <span className="text-3xl font-bold text-slate-800">{countValue}</span>
                                        <span className="block text-xs text-slate-400 font-medium uppercase mt-1">
                                            {analysisResult.quantityUnit || 'Items'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => setCountValue(countValue + 1)}
                                        className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {highNutrients.length > 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-amber-800 text-sm">High Content Warning</h4>
                            <p className="text-amber-700 text-xs mt-1">This portion contains >50% daily value for: {highNutrients.join(", ")}.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-indigo-600 text-sm font-medium mb-1">Calories</p>
                        <p className="text-3xl font-bold text-indigo-900">{adjustedResult.calories}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                            <span className="text-blue-700 text-sm font-medium">Protein</span>
                            <span className="text-blue-900 font-bold">{adjustedResult.protein}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                            <span className="text-green-700 text-sm font-medium">Carbs</span>
                            <span className="text-green-900 font-bold">{adjustedResult.carbs}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                            <span className="text-amber-700 text-sm font-medium">Fat</span>
                            <span className="text-amber-900 font-bold">{adjustedResult.fat}g</span>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-slate-700 mb-3">Nutritional Details</h3>
                <div className="space-y-3 mb-8">
                    {[
                        { label: 'Sugar', value: adjustedResult.sugar, unit: 'g', max: currentGoals.sugar },
                        { label: 'Fiber', value: adjustedResult.fiber, unit: 'g', max: currentGoals.fiber },
                        { label: 'Sodium', value: adjustedResult.sodium, unit: 'mg', max: currentGoals.sodium },
                    ].map((item) => {
                        const pct = Math.round((item.value / item.max) * 100);
                        return (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <span className="text-slate-500 text-sm">{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full">
                                        <div className={`h-1.5 rounded-full ${pct > 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                    </div>
                                    <span className="text-slate-800 font-medium w-16 text-right text-sm">{item.value}{item.unit}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {adjustedResult.exerciseSuggestions && adjustedResult.exerciseSuggestions.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="text-orange-500" size={20} />
                            <h3 className="font-semibold text-slate-700">Burn It Off</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {adjustedResult.exerciseSuggestions.map((ex, idx) => (
                                <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-2xl flex flex-col items-center text-center">
                                    <div className="p-2 bg-white rounded-full mb-2 shadow-sm">{getExerciseIcon(ex.activity)}</div>
                                    <p className="text-xs font-medium text-slate-800 line-clamp-1">{ex.activity}</p>
                                    <div className="flex items-center gap-1 mt-1 text-orange-600">
                                        <Timer size={10} />
                                        <span className="text-xs font-bold">{Math.round(ex.durationMinutes * effectiveMultiplier)}m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={confirmEntry} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                    <Check size={20} />
                    Add to Log
                </button>
                <button onClick={() => setView(AppView.CAMERA)} className="w-full mt-3 py-4 bg-white text-slate-500 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition">
                    Retake Photo
                </button>
            </div>
        )}
        </div>
      );
  }

  if (view === AppView.LAUNCH) return renderLaunchScreen();

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-slate-50 relative shadow-2xl overflow-hidden flex flex-col pb-safe">
      
      {/* Install App Instructions Modal */}
      {showInstallHelp && (
         <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-2xl font-bold text-slate-800">Install App</h3>
                   <button onClick={() => setShowInstallHelp(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition"><X size={20} /></button>
                </div>
                
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                            <Share size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">1. Tap Share</h4>
                            <p className="text-sm text-slate-500">Tap the Share icon at the bottom of your Safari browser.</p>
                        </div>
                    </div>
                    
                    <div className="w-full h-px bg-slate-100"></div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                            <PlusSquare size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">2. Add to Home Screen</h4>
                            <p className="text-sm text-slate-500">Scroll down and tap "Add to Home Screen".</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                           <span className="font-bold text-indigo-600">Note for Android:</span> Tap the <MoreVertical size={12} className="inline" /> menu and select "Install App".
                        </p>
                    </div>
                </div>

                <button onClick={() => setShowInstallHelp(false)} className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition">Got it!</button>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete this item?</h3>
              <p className="text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition">Cancel</button>
                  <button onClick={proceedWithDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition">Delete</button>
              </div>
           </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {quickAddModal.isOpen && quickAddModal.meal && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Zap className="text-amber-500" size={24} />
                          Quick Add
                      </h3>
                      <button onClick={() => setQuickAddModal({ isOpen: false, meal: null })} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                  </div>
                  
                  <div className="flex flex-col items-center mb-6">
                      <div className="text-6xl mb-4">{quickAddModal.meal.icon}</div>
                      <h4 className="text-2xl font-bold text-slate-800">{quickAddModal.meal.name}</h4>
                      <p className="text-slate-500">{quickAddModal.meal.calories} kcal / serving</p>
                  </div>

                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2 text-center">How many servings?</label>
                      <div className="flex items-center justify-center gap-4">
                          <button 
                              onClick={() => setQuickAddQuantity(Math.max(1, quickAddQuantity - 1))}
                              className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                          >
                              <Minus size={20} />
                          </button>
                          <span className="text-3xl font-bold text-slate-800 w-12 text-center">{quickAddQuantity}</span>
                          <button 
                              onClick={() => setQuickAddQuantity(quickAddQuantity + 1)}
                              className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                          >
                              <Plus size={20} />
                          </button>
                      </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-600 font-medium">Total Calories</span>
                          <span className="text-indigo-600 font-bold text-lg">{Math.round(quickAddModal.meal.calories * quickAddQuantity)} kcal</span>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-400 justify-end">
                          <span>P: {Math.round(quickAddModal.meal.protein * quickAddQuantity)}g</span>
                          <span>•</span>
                          <span>C: {Math.round(quickAddModal.meal.carbs * quickAddQuantity)}g</span>
                          <span>•</span>
                          <span>F: {Math.round(quickAddModal.meal.fat * quickAddQuantity)}g</span>
                      </div>
                  </div>

                  <button onClick={confirmQuickMeal} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition active:scale-95">Add to Log</button>
              </div>
          </div>
      )}

      {/* Exercise Add Modal */}
      {isExerciseModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Activity className="text-orange-500" size={24} />
                          Log Activity
                      </h3>
                      <button onClick={() => setIsExerciseModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Activity Type</label>
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                          {AVAILABLE_SPORTS.map(sport => (
                              <button key={sport.id} onClick={() => setSelectedExerciseId(sport.id)} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition ${selectedExerciseId === sport.id ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-100 text-slate-500'}`}>
                                  <div className={selectedExerciseId === sport.id ? 'text-orange-500' : 'text-slate-400'}>{sport.icon}</div>
                                  <span className="text-[10px] font-bold mt-1 text-center leading-tight">{sport.id}</span>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-600">Duration</label>
                          <span className="text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-lg text-sm">{exerciseDuration} min</span>
                      </div>
                      <input type="range" min="5" max="180" step="5" value={exerciseDuration} onChange={(e) => setExerciseDuration(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Calories Burned (Est.)</label>
                      <div className="relative">
                          <input type="number" value={exerciseCalories} onChange={(e) => setExerciseCalories(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-bold text-slate-800" />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400"><Flame size={16} /> kcal</div>
                      </div>
                      {!weight && <p className="text-[10px] text-orange-400 mt-1">Add weight in settings for better accuracy.</p>}
                  </div>
                  <button onClick={addExerciseLog} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition active:scale-95">Log Workout</button>
              </div>
          </div>
      )}

      {/* Edit Food Log Modal */}
      {editingFoodLog && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">Edit Meal</h3>
                 <button onClick={() => setEditingFoodLog(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
              </div>
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Food Name</label>
                    <input type="text" value={editingFoodLog.foodName} onChange={(e) => setEditingFoodLog({...editingFoodLog, foodName: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Calories</label>
                        <input type="number" value={editingFoodLog.calories} onChange={(e) => setEditingFoodLog({...editingFoodLog, calories: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Protein (g)</label>
                        <input type="number" value={editingFoodLog.protein} onChange={(e) => setEditingFoodLog({...editingFoodLog, protein: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Carbs (g)</label>
                        <input type="number" value={editingFoodLog.carbs} onChange={(e) => setEditingFoodLog({...editingFoodLog, carbs: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Fat (g)</label>
                        <input type="number" value={editingFoodLog.fat} onChange={(e) => setEditingFoodLog({...editingFoodLog, fat: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                    </div>
                 </div>
              </div>
              <button onClick={saveFoodEdit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition">Save Changes</button>
           </div>
        </div>
      )}

      {/* Edit Exercise Log Modal */}
      {editingExerciseLog && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800">Edit Workout</h3>
                 <button onClick={() => setEditingExerciseLog(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
              </div>
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Activity</label>
                    <div className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-600 flex items-center gap-2">
                       {getExerciseIcon(editingExerciseLog.activityName)}
                       {editingExerciseLog.activityName}
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Duration (mins)</label>
                    <input type="number" value={editingExerciseLog.durationMinutes} onChange={(e) => setEditingExerciseLog({...editingExerciseLog, durationMinutes: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Calories Burned</label>
                    <input type="number" value={editingExerciseLog.caloriesBurned} onChange={(e) => setEditingExerciseLog({...editingExerciseLog, caloriesBurned: parseInt(e.target.value) || 0})} className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800" />
                 </div>
              </div>
              <button onClick={saveExerciseEdit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition">Save Changes</button>
           </div>
        </div>
      )}

      {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Sliders className="text-indigo-600" size={24} /> Customize Plan</h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={20} /></button>
                  </div>
                  
                  {/* Coach Persona Section */}
                  <div className="mb-8 flex flex-col items-center border-b border-slate-100 pb-6">
                      <label className="relative group cursor-pointer mb-3">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 shadow-md">
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
                            className="text-center text-lg font-bold text-slate-800 border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none bg-transparent w-auto min-w-[100px] transition-colors"
                            placeholder="Coach Name"
                          />
                          <Edit2 size={14} className="text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Tap image to upload your pet!</p>
                  </div>

                  {settingError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex gap-2 items-center"><AlertTriangle size={16} />{settingError}</div>}
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Current Weight (lbs)</label>
                      <div className="relative">
                        <input type="number" value={tempWeight} onChange={(e) => setTempWeight(e.target.value)} placeholder="0" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-semibold text-slate-800" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">lbs</div>
                      </div>
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-3">Your Goal</label>
                      <div className="grid grid-cols-1 gap-3">
                          <button onClick={() => setTempGoalType(GoalType.LOSE_WEIGHT)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.LOSE_WEIGHT ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.LOSE_WEIGHT ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}><TrendingDown size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.LOSE_WEIGHT ? 'text-indigo-900' : 'text-slate-700'}`}>Lose Weight</div><div className="text-xs text-slate-400">Caloric deficit to burn fat</div></div>
                          </button>
                          <button onClick={() => setTempGoalType(GoalType.MAINTAIN)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.MAINTAIN ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.MAINTAIN ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}><Minus size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.MAINTAIN ? 'text-indigo-900' : 'text-slate-700'}`}>Maintain Weight</div><div className="text-xs text-slate-400">Balance intake with burn</div></div>
                          </button>
                          <button onClick={() => setTempGoalType(GoalType.GAIN_MUSCLE)} className={`flex items-center gap-3 p-4 rounded-2xl border transition ${tempGoalType === GoalType.GAIN_MUSCLE ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                             <div className={`p-2 rounded-full ${tempGoalType === GoalType.GAIN_MUSCLE ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}><TrendingUp size={20}/></div>
                             <div className="text-left"><div className={`font-semibold ${tempGoalType === GoalType.GAIN_MUSCLE ? 'text-indigo-900' : 'text-slate-700'}`}>Gain Muscle</div><div className="text-xs text-slate-400">Surplus for hypertrophy</div></div>
                          </button>
                      </div>
                  </div>
                  {tempGoalType === GoalType.LOSE_WEIGHT && (
                      <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount to Lose</label>
                                  <div className="relative">
                                    <input type="number" value={tempTargetLbs} onChange={e => setTempTargetLbs(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold" placeholder="Lbs" />
                                    <span className="absolute right-3 top-3 text-xs text-slate-400">lbs</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Timeframe</label>
                                  <div className="relative">
                                    <input type="number" value={tempTargetMonths} onChange={e => setTempTargetMonths(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold" placeholder="Months" />
                                    <span className="absolute right-3 top-3 text-xs text-slate-400">mos</span>
                                  </div>
                              </div>
                          </div>
                          <p className="text-[10px] text-indigo-400 mt-2 flex items-center gap-1"><Target size={10} /> Max recommended rate: 5 lbs/month</p>
                      </div>
                  )}
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Daily Activity Goal (kcal)</label>
                      <div className="relative">
                        <input type="number" value={tempBurnGoal} onChange={(e) => setTempBurnGoal(e.target.value)} placeholder="400" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold text-slate-800" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none"><Flame size={16} /> kcal</div>
                      </div>
                  </div>
                  <div className="mb-8">
                      <label className="block text-sm font-medium text-slate-600 mb-3">Frequent Activities</label>
                      <div className="grid grid-cols-3 gap-2">
                          {AVAILABLE_SPORTS.map((sport) => {
                              const isSelected = tempSports.includes(sport.id);
                              return (
                                  <button key={sport.id} onClick={() => toggleSport(sport.id)} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                      <div className={`mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>{sport.icon}</div>
                                      <span className="text-[10px] font-semibold">{sport.id}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition">Cancel</button>
                      <button onClick={saveSettings} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition">Save</button>
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