import React, { useState, useEffect } from 'react';
import { analyzeFoodImage } from './services/gemini';
import { CalorieCard, MacroCard } from './components/MacroCharts';
import { CameraInput } from './components/CameraInput';
import { AppView, FoodAnalysisResult, FoodLogItem, DailyGoals } from './types';
import { Plus, ChevronLeft, ChevronRight, Check, Loader2, Utensils, ArrowRight, Sparkles, AlertTriangle, AlertOctagon, Settings, X, Scale } from 'lucide-react';

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

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LAUNCH);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // User Settings State
  const [weight, setWeight] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempWeight, setTempWeight] = useState<string>('');

  // Load data from local storage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('snapcalorie_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    const savedWeight = localStorage.getItem('snapcalorie_weight');
    if (savedWeight) {
      setWeight(parseFloat(savedWeight));
      setTempWeight(savedWeight);
    }
  }, []);

  // Save logs to local storage when updated
  useEffect(() => {
    localStorage.setItem('snapcalorie_logs', JSON.stringify(logs));
  }, [logs]);

  // Save weight to local storage
  useEffect(() => {
    if (weight) {
      localStorage.setItem('snapcalorie_weight', weight.toString());
    }
  }, [weight]);

  // Calculate Goals based on Weight or Defaults
  const calculateGoals = (): DailyGoals => {
    if (!weight) return DEFAULT_GOALS;

    // Simple Maintenance Estimation (Mifflin-St Jeor approximation for moderate activity)
    // Base: Weight (lbs) * 15
    const calculatedCalories = Math.round(weight * 15);
    
    // Protein: ~0.9g per lb of body weight (good for active individuals/maintenance)
    const calculatedProtein = Math.round(weight * 0.9);
    
    // Fat: ~0.4g per lb (approx 25-30% of cals)
    const calculatedFat = Math.round(weight * 0.4);
    
    // Carbs: Remaining calories / 4
    // (Total Cals - (Protein*4) - (Fat*9)) / 4
    const remainingCals = calculatedCalories - (calculatedProtein * 4) - (calculatedFat * 9);
    const calculatedCarbs = Math.max(0, Math.round(remainingCals / 4));

    return {
      ...DEFAULT_GOALS,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fat: calculatedFat,
      // Micros usually stay consistent with FDA recommendations regardless of weight
    };
  };

  const currentGoals = calculateGoals();

  // Helper to check if two dates are the same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Filter logs for the selected date
  const dailyLogs = logs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
  const isToday = isSameDay(selectedDate, new Date());

  // Calculate daily totals
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

  // Identify Daily Alerts (> 200%)
  const dailyAlerts: string[] = [];
  (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach(key => {
     if (dailyTotals[key] > currentGoals[key] * 2) {
        dailyAlerts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}`);
     }
  });

  // Navigation handler
  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Handler: Process captured image
  const handleImageCapture = async (imageData: string) => {
    setCurrentImage(imageData);
    setView(AppView.ANALYSIS);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Extract base64 data (remove header)
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.match(/:(.*?);/)?.[1] || 'image/jpeg';

      const result = await analyzeFoodImage(base64Data, mimeType);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image. Please try again.");
      setView(AppView.DASHBOARD);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Add validated analysis to log
  const confirmEntry = () => {
    if (analysisResult && currentImage) {
      const newLog: FoodLogItem = {
        ...analysisResult,
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUrl: currentImage,
      };
      setLogs(prev => [newLog, ...prev]);
      setView(AppView.DASHBOARD);
      setSelectedDate(new Date()); // Reset to today to see the new entry
      setCurrentImage(null);
      setAnalysisResult(null);
    }
  };

  // Handler: Save Weight
  const saveSettings = () => {
      const w = parseFloat(tempWeight);
      if (!isNaN(w) && w > 0) {
          setWeight(w);
      } else if (tempWeight === '') {
          setWeight(null);
      }
      setIsSettingsOpen(false);
  };

  // View: Launch Screen (Full Page)
  const renderLaunchScreen = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-indigo-600 text-white overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500 rounded-full blur-3xl animate-pulse mix-blend-screen" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-3xl animate-pulse mix-blend-screen" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-md px-8">
            <div className="relative group mb-12">
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-50 blur-xl transition duration-1000 animate-tilt"></div>
              <div className="relative w-32 h-32 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 transform transition hover:scale-105 duration-500">
                  <span className="text-white font-bold text-5xl tracking-tighter drop-shadow-lg">SC</span>
              </div>
              <div className="absolute -right-3 -top-3 bg-yellow-400 text-yellow-900 p-2.5 rounded-full shadow-lg animate-bounce border-2 border-indigo-600">
                  <Sparkles size={24} strokeWidth={2.5} />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight text-center drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-br from-white to-indigo-100">
                SnapCalorie
            </h1>
            
            <p className="text-indigo-100 text-lg md:text-xl mb-12 text-center font-light leading-relaxed max-w-xs mx-auto">
                The smartest way to track your nutrition. <br />
                <span className="font-medium text-white">Just snap a photo.</span>
            </p>

            <button 
                onClick={() => setView(AppView.DASHBOARD)}
                className="group relative w-full max-w-xs bg-white text-indigo-600 px-8 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-3 overflow-hidden transition-all hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Get Started</span>
                <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        <div className="relative z-10 pb-8 pt-4 w-full text-center">
             <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/10 backdrop-blur-md border border-white/10 text-indigo-100/80 text-xs font-medium">
                <Sparkles size={12} className="text-yellow-300" />
                Powered by Gemini AI
             </div>
        </div>
    </div>
  );

  // View: Dashboard
  const renderDashboard = () => (
    <div className="pb-10">
      <header className="mb-6 bg-white p-4 -mx-6 -mt-8 pt-8 sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="flex justify-between items-center">
           <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                 SC
              </div>
              <span className="font-bold text-slate-700 tracking-tight text-lg hidden xs:inline-block">SnapCalorie</span>
           </div>

           {/* Top Right Actions */}
           <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 pl-3 pr-4 py-2 rounded-full transition-colors border border-indigo-100 group"
           >
              <div className="bg-white p-1 rounded-full shadow-sm">
                <Scale size={16} className="text-indigo-600" />
              </div>
              <span className="font-bold text-sm">{weight ? `${weight} lbs` : 'Log Weight'}</span>
           </button>
        </div>
      </header>
      
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button 
            onClick={() => navigateDate(-1)} 
            className="p-3 hover:bg-slate-50 text-slate-500 rounded-xl transition"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
                {isToday ? 'Today' : selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
                {selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </p>
          </div>

          <button 
            onClick={() => navigateDate(1)}
            disabled={isToday}
            className={`p-3 rounded-xl transition ${isToday ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50 text-slate-500'}`}
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
      </div>

      {/* Daily Total Alerts (>200%) */}
      {dailyAlerts.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm animate-pulse">
           <div className="flex items-start gap-3">
              <AlertOctagon className="text-red-500 shrink-0 mt-1" size={20} />
              <div>
                 <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Daily Limit Exceeded</h3>
                 <p className="text-red-700 text-sm mt-1">
                    You have exceeded 200% of your daily limit for: <br/>
                    <span className="font-semibold">{dailyAlerts.join(", ")}</span>
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Charts Section with Interleaved Log Button */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* 1. Calorie Card (Progress) */}
        <CalorieCard consumed={dailyTotals.calories} goal={currentGoals.calories} />

        {/* 2. Log Meal Button (Prominent) */}
        <button 
            onClick={() => setView(AppView.CAMERA)}
            className="w-full bg-indigo-600 text-white p-4 rounded-3xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-lg group"
        >
            <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition">
                <Plus size={28} />
            </div>
            <span>Log New Meal</span>
        </button>

        {/* 3. Macro Card */}
        <MacroCard totals={dailyTotals} goals={currentGoals} />
      </div>

      {/* Detailed Nutrient Summary */}
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
                           <span className={`font-bold ${isHigh ? 'text-red-500' : 'text-slate-800'}`}>{item.value}{item.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${isHigh ? 'bg-red-500' : 'bg-slate-400'}`} 
                             style={{ width: `${Math.min(pct, 100)}%` }}
                           ></div>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 mt-0.5">{pct}% DV</div>
                    </div>
                 )
             })}
          </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {isToday ? 'Recent Meals' : 'Meals History'}
        </h2>
        {dailyLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils size={32} />
                </div>
                <p className="text-slate-500">No meals tracked for this day.</p>
                {isToday && <p className="text-slate-400 text-sm mt-1">Tap "Log Meal" to start.</p>}
            </div>
        ) : (
            <div className="space-y-4">
                {dailyLogs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
                        <img src={log.imageUrl} alt={log.foodName} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-100" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 truncate">{log.foodName}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{log.description}</p>
                            <div className="flex gap-3 mt-2 text-xs font-medium">
                                <span className="text-indigo-500">{log.calories} kcal</span>
                                <span className="text-blue-500">P: {log.protein}g</span>
                                <span className="text-green-500">C: {log.carbs}g</span>
                                <span className="text-amber-500">F: {log.fat}g</span>
                            </div>
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
      if (!analysisResult) return null;

      // Check for nutrients > 50% of daily goal
      const highNutrients: string[] = [];
      (Object.keys(currentGoals) as Array<keyof DailyGoals>).forEach((key) => {
          // @ts-ignore - Dynamic access
          const val = analysisResult[key];
          if (val && typeof val === 'number' && val > (currentGoals[key] * 0.5)) {
             highNutrients.push(`${key.charAt(0).toUpperCase() + key.slice(1)} (${Math.round((val / currentGoals[key]) * 100)}%)`);
          }
      });

      return (
        <div className="h-full flex flex-col">
        <div className="relative h-64 bg-slate-900">
            {currentImage && (
                <img src={currentImage} alt="Captured Food" className="w-full h-full object-cover opacity-80" />
            )}
            <button 
                onClick={() => setView(AppView.DASHBOARD)} 
                className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition z-10"
            >
                <ChevronLeft size={24} />
            </button>
            
            {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm text-white">
                    <Loader2 size={48} className="animate-spin mb-4 text-indigo-400" />
                    <p className="font-medium text-lg">Analyzing Image...</p>
                    <p className="text-sm text-white/70">Identifying ingredients & macros</p>
                </div>
            )}
        </div>

        {!isAnalyzing && analysisResult && (
            <div className="flex-1 bg-white -mt-6 rounded-t-3xl p-6 shadow-lg z-10 relative overflow-y-auto">
                <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{analysisResult.foodName}</h2>
                    <p className="text-slate-500">{analysisResult.description}</p>
                </div>

                {/* Alert for single food high nutrient */}
                {highNutrients.length > 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-amber-800 text-sm">High Content Warning</h4>
                            <p className="text-amber-700 text-xs mt-1">
                                This item contains more than 50% of your daily value for: {highNutrients.join(", ")}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Macro Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                        <p className="text-indigo-600 text-sm font-medium mb-1">Calories</p>
                        <p className="text-3xl font-bold text-indigo-900">{analysisResult.calories}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                            <span className="text-blue-700 text-sm font-medium">Protein</span>
                            <span className="text-blue-900 font-bold">{analysisResult.protein}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                            <span className="text-green-700 text-sm font-medium">Carbs</span>
                            <span className="text-green-900 font-bold">{analysisResult.carbs}g</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                            <span className="text-amber-700 text-sm font-medium">Fat</span>
                            <span className="text-amber-900 font-bold">{analysisResult.fat}g</span>
                        </div>
                    </div>
                </div>

                {/* Micro Grid */}
                <h3 className="font-semibold text-slate-700 mb-3">Nutritional Details</h3>
                <div className="space-y-3 mb-8">
                    {[
                        { label: 'Sugar', value: analysisResult.sugar, unit: 'g', max: currentGoals.sugar },
                        { label: 'Fiber', value: analysisResult.fiber, unit: 'g', max: currentGoals.fiber },
                        { label: 'Sodium', value: analysisResult.sodium, unit: 'mg', max: currentGoals.sodium },
                        { label: 'Potassium', value: analysisResult.potassium, unit: 'mg', max: currentGoals.potassium },
                        { label: 'Cholesterol', value: analysisResult.cholesterol, unit: 'mg', max: currentGoals.cholesterol },
                    ].map((item) => {
                        const pct = Math.round((item.value / item.max) * 100);
                        return (
                            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <span className="text-slate-500 text-sm">{item.label}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-slate-100 h-1.5 rounded-full">
                                        <div 
                                            className={`h-1.5 rounded-full ${pct > 50 ? 'bg-amber-500' : 'bg-slate-400'}`} 
                                            style={{ width: `${Math.min(pct, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-slate-800 font-medium w-16 text-right text-sm">{item.value}{item.unit}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <button 
                    onClick={confirmEntry}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                    <Check size={20} />
                    Add to Log
                </button>
                <button 
                    onClick={() => setView(AppView.CAMERA)}
                    className="w-full mt-3 py-4 bg-white text-slate-500 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition"
                >
                    Retake Photo
                </button>
            </div>
        )}
        </div>
      );
  }

  // If on launch screen, render full page without standard layout wrapper
  if (view === AppView.LAUNCH) {
    return renderLaunchScreen();
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl overflow-hidden flex flex-col">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Settings className="text-indigo-600" size={24} />
                          Settings
                      </h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-600 mb-2">Current Weight (lbs)</label>
                      <div className="relative">
                        <input 
                            type="number" 
                            value={tempWeight}
                            onChange={(e) => setTempWeight(e.target.value)}
                            placeholder="Enter weight in lbs"
                            className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-semibold text-slate-800"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">lbs</div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 ml-1">
                          Your calorie and macro targets will be automatically adjusted based on this weight.
                      </p>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={saveSettings}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition"
                      >
                          Save
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 pt-8 pb-6 h-full">
             {view === AppView.DASHBOARD && renderDashboard()}
             {view === AppView.ANALYSIS && renderAnalysis()}
        </div>
      </main>

      {/* Camera Modal */}
      {view === AppView.CAMERA && (
        <CameraInput 
            onCapture={handleImageCapture} 
            onClose={() => setView(AppView.DASHBOARD)} 
        />
      )}
    </div>
  );
};

export default App;