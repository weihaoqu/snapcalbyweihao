import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { DailyGoals, FoodLogItem } from '../types';

interface MacroSummaryProps {
  logs: FoodLogItem[];
  goals: DailyGoals;
}

export const MacroSummary: React.FC<MacroSummaryProps> = ({ logs, goals }) => {
  const totalCalories = logs.reduce((acc, item) => acc + item.calories, 0);
  const totalProtein = logs.reduce((acc, item) => acc + item.protein, 0);
  const totalCarbs = logs.reduce((acc, item) => acc + item.carbs, 0);
  const totalFat = logs.reduce((acc, item) => acc + item.fat, 0);

  // Data for the main calorie gauge
  const caloriePercentage = Math.min(100, (totalCalories / goals.calories) * 100);
  
  const calorieData = [
    { name: 'Remaining', value: goals.calories - totalCalories, fill: '#e2e8f0' },
    { name: 'Consumed', value: totalCalories, fill: '#6366f1' },
  ];

  // Data for macros (Pie Chart breakdown)
  const macroData = [
    { name: 'Protein', value: totalProtein, fill: '#3b82f6', unit: 'g' }, // Blue
    { name: 'Carbs', value: totalCarbs, fill: '#10b981', unit: 'g' },    // Green
    { name: 'Fat', value: totalFat, fill: '#f59e0b', unit: 'g' },        // Amber
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Calorie Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-700 mb-2 w-full text-left">Calories</h3>
        <div className="h-48 w-full relative flex justify-center items-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={[{ value: totalCalories }, { value: Math.max(0, goals.calories - totalCalories) }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill="#6366f1" />
                        <Cell fill="#f1f5f9" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{totalCalories}</span>
                <span className="text-sm text-slate-400">of {goals.calories} kcal</span>
            </div>
        </div>
        <div className="w-full mt-2">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(caloriePercentage)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${caloriePercentage}%` }}
                ></div>
            </div>
        </div>
      </div>

      {/* Macros Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Macronutrients</h3>
        <div className="flex-1 flex flex-col justify-center space-y-6">
            {macroData.map((macro) => {
                 const goalValue = macro.name === 'Protein' ? goals.protein : macro.name === 'Carbs' ? goals.carbs : goals.fat;
                 const percent = Math.min(100, (macro.value / goalValue) * 100);
                 
                 return (
                    <div key={macro.name}>
                        <div className="flex justify-between text-sm font-medium mb-1">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: macro.fill }}></span>
                                {macro.name}
                            </span>
                            <span className="text-slate-600">{macro.value}g <span className="text-slate-400 text-xs">/ {goalValue}g</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                                className="h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${percent}%`, backgroundColor: macro.fill }}
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