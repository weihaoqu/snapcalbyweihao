import React from 'react';
import {
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { DailyGoals } from '../types';

interface CalorieCardProps {
  consumed: number;
  goal: number;
}

export const CalorieCard: React.FC<CalorieCardProps> = ({ consumed, goal }) => {
  const percentage = Math.min(100, (consumed / goal) * 100);
  
  return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-700 mb-2 w-full text-left">Calories</h3>
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
                        <Cell fill="#6366f1" />
                        <Cell fill="#f1f5f9" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">{consumed}</span>
                <span className="text-sm text-slate-400">of {goal} kcal</span>
            </div>
        </div>
        <div className="w-full mt-2">
            <div className="flex justify-between text-sm text-slate-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div 
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${percentage}%` }}
                ></div>
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
}

export const MacroCard: React.FC<MacroCardProps> = ({ totals, goals }) => {
  const macroData = [
    { name: 'Protein', value: totals.protein, fill: '#3b82f6', unit: 'g' }, 
    { name: 'Carbs', value: totals.carbs, fill: '#10b981', unit: 'g' },   
    { name: 'Fat', value: totals.fat, fill: '#f59e0b', unit: 'g' },       
  ];

  return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
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
  );
};