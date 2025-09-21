import React, { useMemo } from 'react';
import { Transaction, TransactionSummary, Budget, Account, SavingsGoal, GoalContribution, AppSettings, DashboardWidget, DashboardWidgetType, Category, TransactionType } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import CategoryPieChart from './CategoryPieChart';
import RecentTransactionsList from './RecentTransactionsList';
import BudgetStatus from './BudgetStatus';
import AccountSummary from './AccountSummary';
import SavingsGoalsSummary from './SavingsGoalsSummary';

interface DashboardProps {
  summary: TransactionSummary;
  budgets: Budget[];
  recentTransactions: Transaction[];
  accounts: Account[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  contributions: GoalContribution[];
  categories: Category[];
  settings: AppSettings;
  onAddTransaction: () => void;
  totalNetWorth: number;
}

const StatCard: React.FC<{ title: string; amount: number; colorClass: string, icon: JSX.Element; currencyCode: string; }> = ({ title, amount, colorClass, icon, currencyCode }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-xl shadow-md p-6 flex items-center space-x-4 transition-transform hover:scale-105 border border-gray-200 dark:border-gray-700">
        <div className={`p-3 rounded-full ${colorClass}`}>
           {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(amount, currencyCode)}
            </p>
        </div>
    </div>
);

const BalanceWidget: React.FC<{
    totalNetWorth: number;
    accountCount: number;
    settings: AppSettings;
}> = ({ totalNetWorth, accountCount, settings }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <p className={`text-3xl sm:text-5xl font-bold ${totalNetWorth >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>
                {formatCurrency(totalNetWorth, settings.baseCurrency)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Across {accountCount} accounts
            </p>
        </div>
    );
};


const TotalBudgetRemainingWidget: React.FC<{
    budgets: Budget[];
    expensesByCategoryId: Record<string, number>; // in base currency
    settings: AppSettings;
}> = ({ budgets, expensesByCategoryId, settings }) => {
    const { totalBudgeted, totalSpent } = useMemo(() => {
        let totalBudgeted = 0;
        let totalSpent = 0;

        budgets.forEach(budget => {
            const limitInBase = convertCurrency(budget.limit, budget.currency, settings.baseCurrency, settings);
            totalBudgeted += limitInBase;
            totalSpent += expensesByCategoryId[budget.categoryId] || 0;
        });

        return { totalBudgeted, totalSpent };
    }, [budgets, expensesByCategoryId, settings]);

    const remaining = totalBudgeted - totalSpent;
    const progress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : (totalSpent > 0 ? 100 : 0);

    let progressBarColor = 'bg-primary-500';
    if (progress > 100) {
        progressBarColor = 'bg-red-500';
    } else if (progress >= 90) {
        progressBarColor = 'bg-yellow-500';
    }

    if (budgets.length === 0) {
        return <div className="flex items-center justify-center h-full"><p className="text-center text-gray-500 dark:text-gray-400">No budgets set.</p></div>;
    }

    return (
        <div className="flex flex-col justify-center h-full space-y-3">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount Remaining This Month</p>
                <p className={`text-2xl sm:text-3xl font-bold ${remaining >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>
                    {formatCurrency(remaining, settings.baseCurrency)}
                </p>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                <div
                    className={`h-4 rounded-full flex items-center justify-center transition-all duration-500 ${progressBarColor}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                >
                </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatCurrency(totalSpent, settings.baseCurrency)} of {formatCurrency(totalBudgeted, settings.baseCurrency)}</span>
                <span className="font-semibold">{progress.toFixed(0)}% Used</span>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ 
    summary, 
    budgets, 
    recentTransactions, 
    accounts, 
    transactions, 
    goals, 
    contributions, 
    categories,
    settings, 
    onAddTransaction,
    totalNetWorth,
}) => {
    const { totalIncome, totalExpense } = summary;
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const expensesByCategoryName = useMemo(() => {
        const result: Record<string, number> = {};
        for (const [id, amount] of Object.entries(summary.expensesByCategoryId)) {
            const name = categoryMap.get(id) || 'Unknown';
            result[name] = (result[name] || 0) + amount;
        }
        return result;
    }, [summary.expensesByCategoryId, categoryMap]);

    const renderWidget = (widget: DashboardWidget) => {
        const componentMap = {
            [DashboardWidgetType.PIE_CHART]: {
                component: <CategoryPieChart data={expensesByCategoryName} currencyCode={settings.baseCurrency} />,
                title: `Expense Breakdown (in ${settings.baseCurrency})`,
                className: 'md:col-span-2',
            },
            [DashboardWidgetType.ACCOUNTS]: {
                component: <AccountSummary accounts={accounts} transactions={transactions} settings={settings} displayInBaseCurrency={true} />,
                title: 'Account Balances',
                className: 'md:col-span-1',
            },
            [DashboardWidgetType.GOALS]: {
                component: <SavingsGoalsSummary goals={goals} contributions={contributions} settings={settings} />,
                title: 'Savings Goals',
                className: 'md:col-span-1',
            },
            [DashboardWidgetType.RECENT_TRANSACTIONS]: {
                component: <RecentTransactionsList transactions={recentTransactions} accounts={accounts} categories={categories}/>,
                title: 'Recent Transactions',
                className: 'md:col-span-1',
            },
            [DashboardWidgetType.BUDGETS]: {
                 component: <BudgetStatus budgets={budgets} expensesByCategoryId={summary.expensesByCategoryId} categories={categories} settings={settings} />,
                 title: 'Budget Category Status',
                 className: 'md:col-span-3',
            },
            [DashboardWidgetType.TOTAL_BUDGET_REMAINING]: {
                component: <TotalBudgetRemainingWidget budgets={budgets} expensesByCategoryId={summary.expensesByCategoryId} settings={settings} />,
                title: 'Monthly Budget Summary',
                className: 'md:col-span-1',
            },
            [DashboardWidgetType.BALANCE]: {
                component: <BalanceWidget totalNetWorth={totalNetWorth} accountCount={accounts.length} settings={settings} />,
                title: 'Total Net Worth',
                className: 'md:col-span-1',
            },
        };

        const widgetDetails = componentMap[widget.type];
        if (!widgetDetails) return null;

        return (
            <div key={widget.id} className={`${widgetDetails.className} bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700`}>
                 <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{widgetDetails.title}</h2>
                 {widgetDetails.component}
            </div>
        );
    }
    
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <button
                onClick={onAddTransaction}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-colors"
            >
                + Add Transaction
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Period Income" amount={totalIncome} currencyCode={settings.baseCurrency} colorClass="bg-green-100 dark:bg-green-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>} />
            <StatCard title="Period Expenses" amount={totalExpense} currencyCode={settings.baseCurrency} colorClass="bg-red-100 dark:bg-red-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>} />
            <StatCard title="Total Net Worth" amount={totalNetWorth} currencyCode={settings.baseCurrency} colorClass="bg-blue-100 dark:bg-blue-900" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 6-3 6m18-12l-3 6 3 6" /></svg>} />
        </div>
        
        {/* Customizable Widget Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {settings.dashboardWidgets
                .filter(widget => widget.isVisible)
                .map(widget => renderWidget(widget))
            }
        </div>
    </div>
  );
};

export default Dashboard;
