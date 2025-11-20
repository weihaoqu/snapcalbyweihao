import React, { useState, useEffect } from 'react';
import { analyzeFoodImage } from './services/gemini';
import { MacroSummary } from './components/MacroCharts';
import { CameraInput } from './components/CameraInput';
import { AppView, FoodAnalysisResult, FoodLogItem, DailyGoals } from './types';
import { Plus, ChevronLeft, ChevronRight, Check, Loader2, Utensils, Calendar, ArrowRight, Sparkles } from 'lucide-react';

// Default Goals
const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.LAUNCH);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Load logs from local storage on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('snapcalorie_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save logs to local storage when updated
  useEffect(() => {
    localStorage.setItem('snapcalorie_logs', JSON.stringify(logs));
  }, [logs]);

  // Helper to check if two dates are the same calendar day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  // Filter logs for the selected date
  const dailyLogs = logs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
  const isToday = isSameDay(selectedDate, new Date());

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

  // View: Launch Screen
  const renderLaunchScreen = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center z-10 text-center max-w-sm mx-auto">
            <div className="relative">
              <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-900/20 mb-8 rotate-6 transform transition hover:rotate-0 duration-500 ease-out">
                  <span className="text-indigo-600 font-bold text-5xl tracking-tighter">SC</span>
              </div>
              <div className="absolute -right-4 -top-4 bg-yellow-400 text-yellow-900 p-2 rounded-full shadow-lg animate-bounce">
                  <Sparkles size={20} />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold mb-3 tracking-tight drop-shadow-md">SnapCalorie</h1>
            <p className="text-indigo-100 text-lg mb-12 leading-relaxed font-light opacity-90">
                Your personal AI nutritionist. <br/>
                <span className="font-medium">Snap. Track. Thrive.</span>
            </p>

            <button 
                onClick={() => setView(AppView.DASHBOARD)}
                className="group bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-900/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all duration-300"
            >
                Get Started
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        <div className="absolute bottom-8 text-indigo-200/60 text-xs font-medium">
            Powered by Gemini 2.5 Flash
        </div>
    </div>
  );

  // View: Dashboard
  const renderDashboard = () => (
    <div className="pb-24">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                 SC
              </div>
              <span className="font-bold text-slate-700 tracking-tight text-lg">SnapCalorie</span>
           </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-2">
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
      </header>

      <MacroSummary logs={dailyLogs} goals={DEFAULT_GOALS} />

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
                {isToday && <p className="text-slate-400 text-sm mt-1">Tap the + button to start.</p>}
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
  const renderAnalysis = () => (
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

            <div className="grid grid-cols-2 gap-4 mb-8">
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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl overflow-hidden">
      
      {/* Main Content Area */}
      <main className="h-full overflow-y-auto scrollbar-hide">
        {view === AppView.LAUNCH && renderLaunchScreen()}
        
        {view !== AppView.LAUNCH && (
            <div className="px-6 pt-8 h-full">
                 {view === AppView.DASHBOARD && renderDashboard()}
                 {view === AppView.ANALYSIS && renderAnalysis()}
            </div>
        )}
      </main>

      {/* Sticky Action Button (Dashboard Only) */}
      {view === AppView.DASHBOARD && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <button 
                onClick={() => setView(AppView.CAMERA)}
                className="pointer-events-auto bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl shadow-indigo-300 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 active:scale-95 group"
            >
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </div>
      )}

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