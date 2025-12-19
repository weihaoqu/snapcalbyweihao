import React from 'react';
import {
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { DailyGoals, Theme } from '../types';

interface CalorieCardProps {
  consumed: number;
  goal: number;
  theme: Theme;
  coachImage?: string;
}

export const CalorieCard: React.FC<CalorieCardProps> = ({ consumed, goal, theme, coachImage }) => {
  const percentage = Math.min(100, (consumed / goal) * 100);
  
  // Determine Oreo's mood based on calorie intake
  // Too low (< 70%) or too high (> 110%) = angry, otherwise happy
  const isTooLow = percentage < 70;
  const isTooHigh = percentage > 110;
  const isAngry = isTooLow || isTooHigh;
  const displayImage = isAngry ? '/oreo_angry.png' : '/oreo_happy.png';
  
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark';

  const emptyColor = isNeon ? '#111' : isDark ? '#334155' : '#f1f5f9';
  const fillColor = isNeon ? '#FF00FF' : isDark ? '#6366f1' : '#6366f1';
  const textColor = isNeon ? 'text-neon-pink' : isDark ? 'text-slate-100' : 'text-slate-800';
  const subTextColor = isNeon ? 'text-neon-green' : isDark ? 'text-slate-400' : 'text-slate-400';
  const titleColor = isNeon ? 'text-neon-blue' : isDark ? 'text-slate-300' : 'text-slate-700';
  
  // Neon styles
  const containerClass = isNeon 
    ? "bg-black p-6 rounded-3xl border-2 border-neon-pink shadow-neon-pink flex flex-col items-center relative overflow-hidden font-retro tracking-wider"
    : isDark 
      ? "bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 flex flex-col items-center relative overflow-hidden"
      : "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden";

  return (
      <div className={containerClass}>
        {/* Background Image with Oreo */}
        {coachImage && (
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `url(${displayImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: isAngry ? 'grayscale(20%)' : 'none'
            }}
          />
        )}
        
        {/* Content with higher z-index */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-2">
            <h3 className={`text-lg font-semibold ${titleColor}`}>Calories</h3>
            {coachImage && (
              <div className={`w-10 h-10 rounded-full overflow-hidden border-2 shadow-sm transition-all ${
                isAngry 
                  ? (isNeon ? 'border-red-500 shadow-red-500/50 animate-pulse' : isDark ? 'border-red-500' : 'border-red-400') 
                  : (isNeon ? 'border-neon-green shadow-neon-green/50' : isDark ? 'border-green-500' : 'border-green-400')
              }`}>
                <img src={displayImage} alt="Coach Oreo" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div className="h-48 w-full relative flex justify-center items-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={[{ value: consumed }, { value: Math.max(0, goal - consumed) }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                      >
                          <Cell fill={fillColor} />
                          <Cell fill={emptyColor} />
                      </Pie>
                  </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-3xl font-bold ${textColor}`}>{consumed}</span>
                  <span className={`text-sm ${subTextColor}`}>of {goal} kcal</span>
              </div>
          </div>
          <div className="w-full mt-2">
              <div className={`flex justify-between text-sm mb-1 ${subTextColor}`}>
                  <span>Progress</span>
                  <span>{Math.round(percentage)}%</span>
              </div>
            <div className={`w-full rounded-full h-2.5 ${isNeon ? 'bg-gray-900 border border-neon-blue/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${isNeon ? 'bg-neon-blue shadow-neon-blue' : 'bg-indigo-500'}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
          </div>
        </div>
      </div>
  );
};

interface MacroCardProps {
  totals: {
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: DailyGoals;
  theme: Theme;
}

export const MacroCard: React.FC<MacroCardProps> = ({ totals, goals, theme }) => {
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark';

  const macroData = [
    { name: 'Protein', value: totals.protein, fill: isNeon ? '#39FF14' : '#3b82f6', unit: 'g' }, 
    { name: 'Carbs', value: totals.carbs, fill: isNeon ? '#00FFFF' : '#10b981', unit: 'g' },   
    { name: 'Fat', value: totals.fat, fill: isNeon ? '#FFFF00' : '#f59e0b', unit: 'g' },       
  ];
  
  const containerClass = isNeon 
    ? "bg-black p-6 rounded-3xl border-2 border-neon-blue shadow-neon-blue flex flex-col h-full font-retro tracking-wider relative overflow-hidden"
    : isDark
      ? "bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-700 flex flex-col h-full relative overflow-hidden"
      : "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden";

  const titleColor = isNeon ? 'text-neon-pink' : isDark ? 'text-slate-300' : 'text-slate-700';
  const textColor = isNeon ? 'text-neon-blue' : isDark ? 'text-slate-300' : 'text-slate-700'; // Value color

  return (
      <div className={containerClass}>
        {/* Background Image with Oreo Eating */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'url(/oreo_eat.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Content with higher z-index */}
        <div className="relative z-10 w-full h-full flex flex-col">
          <h3 className={`text-lg font-semibold mb-4 ${titleColor}`}>Macronutrients</h3>
        <div className="flex-1 flex flex-col justify-center space-y-6">
            {macroData.map((macro) => {
                 const goalValue = macro.name === 'Protein' ? goals.protein : macro.name === 'Carbs' ? goals.carbs : goals.fat;
                 const percent = Math.min(100, (macro.value / goalValue) * 100);
                 const displayPercent = Math.round((macro.value / goalValue) * 100);
                 
                 return (
                    <div key={macro.name}>
                        <div className="flex justify-between items-end mb-1">
                            <span className={`flex items-center gap-2 text-sm font-medium ${isNeon ? 'text-white' : isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                <span className={`w-2 h-2 rounded-full ${isNeon ? 'animate-pulse' : ''}`} style={{ backgroundColor: macro.fill }}></span>
                                {macro.name}
                            </span>
                            <div className="text-right">
                                <div className={`text-sm font-medium ${textColor}`}>
                                    {macro.value}g <span className={isNeon ? 'text-gray-500' : 'text-slate-400 text-xs'}>/ {goalValue}g</span>
                                </div>
                                <div className={`text-[10px] ${isNeon ? 'text-neon-green' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {displayPercent}% of goal
                                </div>
                            </div>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isNeon ? 'bg-gray-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <div 
                                className={`h-2 rounded-full transition-all duration-500 ease-out ${isNeon ? 'shadow-[0_0_5px_currentColor]' : ''}`}
                                style={{ width: `${percent}%`, backgroundColor: macro.fill, color: macro.fill }}
                            ></div>
                        </div>
                    </div>
                 )
            })}
        </div>
        </div>
      </div>
  );
};