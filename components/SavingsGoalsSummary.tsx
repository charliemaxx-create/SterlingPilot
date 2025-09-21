import React, { useMemo } from 'react';
import { SavingsGoal, GoalContribution, AppSettings } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';

interface SavingsGoalsSummaryProps {
    goals: SavingsGoal[];
    contributions: GoalContribution[];
    settings: AppSettings;
}

const GoalProgress: React.FC<{ goal: SavingsGoal; currentAmount: number; settings: AppSettings; }> = ({ goal, currentAmount, settings }) => {
    // Convert goal amounts to base currency for consistent comparison on dashboard
    const currentInBase = convertCurrency(currentAmount, goal.currency, settings.baseCurrency, settings);
    const targetInBase = convertCurrency(goal.targetAmount, goal.currency, settings.baseCurrency, settings);
    const progress = targetInBase > 0 ? (currentInBase / targetInBase) * 100 : 0;
    
    return (
        <div>
            <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={goal.name}>{goal.name}</p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-5 rounded-full flex items-center justify-center transition-all duration-500" 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                >
                    <span className="text-xs font-bold text-white whitespace-nowrap px-2">{progress.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    )
};


const SavingsGoalsSummary: React.FC<SavingsGoalsSummaryProps> = ({ goals, contributions, settings }) => {

    const goalProgress = useMemo(() => {
        // Progress is stored in the goal's native currency
        const progress = new Map<string, number>();
        goals.forEach(g => progress.set(g.id, 0));
        contributions.forEach(c => {
            progress.set(c.goalId, (progress.get(c.goalId) || 0) + c.amount);
        });
        return progress;
    }, [goals, contributions]);


    if (goals.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No savings goals set.</p>
    }
  return (
    <div className="space-y-4">
      {goals.slice(0, 3).map(goal => (
        <GoalProgress
            key={goal.id} 
            goal={goal} 
            currentAmount={goalProgress.get(goal.id) || 0}
            settings={settings}
        />
      ))}
    </div>
  );
};

export default SavingsGoalsSummary;