import React, { useMemo } from 'react';
import { Budget, Category, AppSettings } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';

interface BudgetStatusProps {
    budgets: Budget[];
    expensesByCategoryId: Record<string, number>; // Note: This is in base currency
    categories: Category[];
    settings: AppSettings;
}

const BudgetProgress: React.FC<{ budget: Budget; categoryName: string; spentInBase: number; settings: AppSettings }> = ({ budget, categoryName, spentInBase, settings }) => {
    const limitInBase = convertCurrency(budget.limit, budget.currency, settings.baseCurrency, settings);
    const progress = limitInBase > 0 ? (spentInBase / limitInBase) * 100 : 0;

    let progressBarColor = 'bg-primary-500';
    if (progress > 100) {
        progressBarColor = 'bg-red-500';
    } else if (progress >= 90) {
        progressBarColor = 'bg-yellow-500';
    }

    return (
        <div>
            <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{categoryName}</p>
                <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                   <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(spentInBase, settings.baseCurrency)}</span> / {formatCurrency(limitInBase, settings.baseCurrency)}
                </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 relative overflow-hidden">
                <div 
                    className={`h-5 rounded-full flex items-center justify-center transition-all duration-500 ${progressBarColor}`} 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                >
                    <span className="text-xs font-bold text-white whitespace-nowrap px-2">{progress.toFixed(0)}%</span>
                </div>
            </div>
            {progress > 100 && (
                <p className="text-xs text-right text-red-500 font-semibold mt-1">
                    {formatCurrency(spentInBase - limitInBase, settings.baseCurrency)} over budget
                </p>
            )}
        </div>
    )
};


const BudgetStatus: React.FC<BudgetStatusProps> = ({ budgets, expensesByCategoryId, categories, settings }) => {
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    
    const topLevelBudgets = useMemo(() => {
        return budgets.filter(budget => {
            const category = categoryMap.get(budget.categoryId);
            return category && !category.parentId;
        });
    }, [budgets, categoryMap]);

    if (topLevelBudgets.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No budgets set for top-level categories.</p>
    }

    return (
        <div className="space-y-4">
            {topLevelBudgets.map(budget => (
                <BudgetProgress 
                    key={budget.id} 
                    budget={budget} 
                    categoryName={categoryMap.get(budget.categoryId)?.name || 'Unknown'}
                    spentInBase={expensesByCategoryId[budget.categoryId] || 0}
                    settings={settings}
                />
            ))}
        </div>
    );
};

export default BudgetStatus;