import React, { useMemo } from 'react';
import { Budget, Transaction, Category, AppSettings, TransactionType, Account } from '../../types';
import { convertCurrency, formatCurrency } from '../../utils/currency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BudgetReportProps {
    budgets: Budget[];
    filteredTransactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    settings: AppSettings;
    startDate: string;
    endDate: string;
}

const StatCard: React.FC<{ title: string; amount: number; currency: string; color: string }> = ({ title, amount, currency, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
        <h3 className={`text-lg ${color} font-semibold`}>{title}</h3>
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
    </div>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    let progressBarColor = 'bg-primary-500';
    if (progress > 100) {
        progressBarColor = 'bg-red-500';
    } else if (progress >= 90) {
        progressBarColor = 'bg-yellow-500';
    }
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div className={`${progressBarColor} h-4 rounded-full text-center text-white text-xs font-bold leading-none`} style={{ width: `${Math.min(progress, 100)}%` }}>
                 {progress > 10 && `${progress.toFixed(0)}%`}
            </div>
        </div>
    );
};

const BudgetReport: React.FC<BudgetReportProps> = ({ budgets, filteredTransactions, categories, accounts, settings, startDate, endDate }) => {

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

    const budgetPerformanceData = useMemo(() => {
        // Calculate duration for scaling monthly budgets
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationInDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1);
        const avgDaysInMonth = 30.44;

        // Calculate spending per category in base currency
        const spentByCategory = new Map<string, number>();
        filteredTransactions.forEach(t => {
            if (t.type === TransactionType.EXPENSE) {
                const account = accountMap.get(t.accountId);
                const amountInBase = convertCurrency(t.amount, account?.currency || settings.baseCurrency, settings.baseCurrency, settings);
                spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) || 0) + amountInBase);
            }
        });

        // Map over budgets to create performance data
        return budgets.map(budget => {
            const categoryName = categoryMap.get(budget.categoryId) || 'Uncategorized';
            const monthlyLimitInBase = convertCurrency(budget.limit, budget.currency, settings.baseCurrency, settings);
            const scaledBudget = (monthlyLimitInBase / avgDaysInMonth) * durationInDays;
            const spent = spentByCategory.get(budget.categoryId) || 0;
            const remaining = scaledBudget - spent;
            const progress = scaledBudget > 0 ? (spent / scaledBudget) * 100 : (spent > 0 ? 100 : 0);

            return {
                categoryName,
                budget: scaledBudget,
                spent,
                remaining,
                progress,
            };
        });
    }, [budgets, filteredTransactions, categories, accounts, settings, startDate, endDate]);

    const summary = useMemo(() => {
        return budgetPerformanceData.reduce((acc, data) => {
            acc.totalBudgeted += data.budget;
            acc.totalSpent += data.spent;
            return acc;
        }, { totalBudgeted: 0, totalSpent: 0 });
    }, [budgetPerformanceData]);
    
    const totalRemaining = summary.totalBudgeted - summary.totalSpent;

    const chartData = useMemo(() => {
        return budgetPerformanceData
            .filter(d => d.budget > 0 || d.spent > 0)
            .map(d => ({
                name: d.categoryName,
                Budgeted: d.budget,
                Spent: d.spent
            }));
    }, [budgetPerformanceData]);


    if (budgets.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">No budgets have been set. Go to the 'Budgets' page to create some.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            {/* Summary Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Budgeted" amount={summary.totalBudgeted} currency={settings.baseCurrency} color="text-blue-500" />
                <StatCard title="Total Spent" amount={summary.totalSpent} currency={settings.baseCurrency} color="text-yellow-500" />
                <StatCard 
                    title={totalRemaining >= 0 ? 'Remaining' : 'Overspent'} 
                    amount={Math.abs(totalRemaining)} 
                    currency={settings.baseCurrency} 
                    color={totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'} 
                />
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                <h2 className="text-xl font-semibold mb-4">Budget vs. Spent</h2>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value, settings.baseCurrency).replace(/(\.\d*)/g, "")} />
                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                        <Legend />
                        <Bar dataKey="Budgeted" fill="#3b82f6" />
                        <Bar dataKey="Spent">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.Spent > entry.Budgeted ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
             {/* Detailed Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Detailed Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Category</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Budgeted</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Spent</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Remaining</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase w-1/4">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgetPerformanceData.map((data, index) => (
                                <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-3 px-4 font-medium">{data.categoryName}</td>
                                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(data.budget, settings.baseCurrency)}</td>
                                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(data.spent, settings.baseCurrency)}</td>
                                    <td className={`py-3 px-4 text-right font-mono font-semibold ${data.remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(data.remaining, settings.baseCurrency)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <ProgressBar progress={data.progress} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default BudgetReport;
