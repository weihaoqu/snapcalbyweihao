import React, { useState, useEffect, useCallback } from 'react';
import { analyzeFoodImage } from './services/gemini';
import { MacroSummary } from './components/MacroCharts';
import { CameraInput } from './components/CameraInput';
import { AppView, FoodAnalysisResult, FoodLogItem, DailyGoals } from './types';
import { Plus, Camera, ChevronLeft, Check, Loader2, Utensils } from 'lucide-react';

// Default Goals
const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

const App: React.FC = () => {
  // State
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [logs, setLogs] = useState<FoodLogItem[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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
      setCurrentImage(null);
      setAnalysisResult(null);
    }
  };

  // View: Dashboard
  const renderDashboard = () => (
    <div className="pb-24">
      <header className="mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Today</h1>
            <p className="text-slate-500 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
            SC
        </div>
      </header>

      <MacroSummary logs={logs} goals={DEFAULT_GOALS} />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Meals</h2>
        {logs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils size={32} />
                </div>
                <p className="text-slate-500">No meals tracked today yet.</p>
                <p className="text-slate-400 text-sm mt-1">Tap the + button to start.</p>
            </div>
        ) : (
            <div className="space-y-4">
                {logs.map((log) => (
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
      <main className="h-full overflow-y-auto px-6 pt-8 scrollbar-hide">
        {view === AppView.DASHBOARD && renderDashboard()}
        {view === AppView.ANALYSIS && renderAnalysis()}
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