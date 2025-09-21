import React, { useState, useMemo } from 'react';
import { Budget, AppSettings, Transaction, TransactionType, Category, Account, BudgetingStrategy, Rule503020 } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import AddBudgetModal from './AddBudgetModal';

interface BudgetsProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    addBudget: (budget: Omit<Budget, 'id'>) => void;
    updateBudget: (budget: Budget) => void;
    deleteBudget: (id: string) => void;
    settings: AppSettings;
}

const getThisMonthTransactions = (transactions: Transaction[]): Transaction[] => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= firstDay && tDate <= lastDay;
    });
};

// --- Sub-component for Envelope Budgeting ---
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    let progressBarColor = 'bg-primary-500';
    if (progress > 100) {
        progressBarColor = 'bg-red-500';
    } else if (progress >= 90) {
        progressBarColor = 'bg-yellow-500';
    }

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
    );
};

const BudgetCard: React.FC<{ budget: Budget; categoryName: string; spent: number; onEdit: () => void; onDelete: () => void; }> = ({ budget, categoryName, spent, onEdit, onDelete }) => {
    const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    const remaining = budget.limit - spent;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{categoryName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Limit: {formatCurrency(budget.limit, budget.currency)}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={onEdit} className="text-gray-400 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>
            <div className="mt-4">
                <ProgressBar progress={progress} />
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600 dark:text-gray-300">Spent: {formatCurrency(spent, budget.currency)}</span>
                     <span className={`font-semibold ${remaining < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                        {remaining >= 0 ? `${formatCurrency(remaining, budget.currency)} Remaining` : `${formatCurrency(Math.abs(remaining), budget.currency)} Over`}
                    </span>
                </div>
            </div>
        </div>
    );
};

const BudgetRow: React.FC<{ budget: Budget; categoryName: string; spent: number; onEdit: () => void; onDelete: () => void; }> = ({ budget, categoryName, spent, onEdit, onDelete }) => {
    const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    const remaining = budget.limit - spent;

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                <div className="font-semibold">{categoryName}</div>
                <div className="sm:hidden text-xs text-gray-500 mt-1">
                    Budget: {formatCurrency(budget.limit, budget.currency)}
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">{formatCurrency(budget.limit, budget.currency)}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(spent, budget.currency)}</td>
            <td className={`py-3 px-4 text-sm font-semibold text-right hidden sm:table-cell ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatCurrency(remaining, budget.currency)}
            </td>
            <td className="py-3 px-4 w-1/4 min-w-[100px] sm:min-w-[150px]">
                <ProgressBar progress={progress} />
            </td>
            <td className="py-3 px-4 text-right">
                <div className="flex justify-end space-x-3">
                    <button onClick={onEdit} className="text-gray-400 hover:text-primary-500" aria-label="Edit budget">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500" aria-label="Delete budget">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};

const EnvelopeBudgetView: React.FC<BudgetsProps> = ({ budgets, transactions, categories, accounts, addBudget, updateBudget, deleteBudget, settings }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const monthTransactions = useMemo(() => getThisMonthTransactions(transactions), [transactions]);

    const spentPerBudget = useMemo(() => {
        const spentMap = new Map<string, number>();
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));

        budgets.forEach(b => spentMap.set(b.id, 0));

        monthTransactions
            .filter(t => t.type === TransactionType.EXPENSE && budgets.some(b => b.categoryId === t.categoryId))
            .forEach(t => {
                const budget = budgets.find(b => b.categoryId === t.categoryId);
                const account = accountMap.get(t.accountId);
                if (budget && account) {
                    const spentInBudgetCurrency = convertCurrency(t.amount, account.currency, budget.currency, settings);
                    spentMap.set(budget.id, (spentMap.get(budget.id) || 0) + spentInBudgetCurrency);
                }
            });
        return spentMap;
    }, [budgets, monthTransactions, accounts, settings]);

    const handleSaveBudget = (data: Omit<Budget, 'id'>) => {
        if (editingBudget) {
            updateBudget({ ...editingBudget, ...data });
        } else {
            addBudget(data);
        }
        setIsModalOpen(false);
        setEditingBudget(undefined);
    };

    const openEditModal = (budget: Budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };
    
    const openAddModal = () => {
        setEditingBudget(undefined);
        setIsModalOpen(true);
    };

    const renderContent = () => {
        if (budgets.length === 0) {
            return (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">You haven't set any budgets yet.</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click 'Set New Budget' to get started!</p>
                </div>
            )
        }

        if (viewMode === 'list') {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Category</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden sm:table-cell">Budgeted</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Spent</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden sm:table-cell">Remaining</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Progress</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.map(budget => (
                                <BudgetRow
                                    key={budget.id}
                                    budget={budget}
                                    categoryName={categoryMap.get(budget.categoryId)?.name || 'Unknown Category'}
                                    spent={spentPerBudget.get(budget.id) || 0}
                                    onEdit={() => openEditModal(budget)}
                                    onDelete={() => deleteBudget(budget.id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => (
                    <BudgetCard
                        key={budget.id}
                        budget={budget}
                        categoryName={categoryMap.get(budget.categoryId)?.name || 'Unknown Category'}
                        spent={spentPerBudget.get(budget.id) || 0}
                        onEdit={() => openEditModal(budget)}
                        onDelete={() => deleteBudget(budget.id)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Envelope Budgets</h1>
                <div className="flex items-center space-x-2">
                     <button onClick={() => setViewMode('tile')} className={`p-2 rounded-md transition-colors ${viewMode === 'tile' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`} aria-label="Tile View"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`} aria-label="List View"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                    <button onClick={openAddModal} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700">+ Set New Budget</button>
                </div>
            </div>
            {renderContent()}
            {isModalOpen && <AddBudgetModal onClose={() => setIsModalOpen(false)} onSave={handleSaveBudget} existingBudgets={budgets} budgetToEdit={editingBudget} categories={categories} settings={settings}/>}
        </div>
    );
};

// --- Sub-component for 50/30/20 Budgeting ---
const RuleProgressCard: React.FC<{ title: string; targetPercent: number; targetAmount: number; spentAmount: number; currency: string; color: string; }> = ({ title, targetPercent, targetAmount, spentAmount, currency, color }) => {
    const progress = targetAmount > 0 ? (spentAmount / targetAmount) * 100 : (spentAmount > 0 ? 100 : 0);
    const remaining = targetAmount - spentAmount;
    const isOver = remaining < 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-baseline">
                <h3 className={`text-lg sm:text-xl font-bold ${color}`}>{title}</h3>
                <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">{targetPercent}%</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Target: {formatCurrency(targetAmount, currency)}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 mt-4 relative overflow-hidden">
                <div className={`h-5 rounded-full flex items-center justify-center transition-all duration-500 ${isOver ? 'bg-red-500' : color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(progress, 100)}%` }}>
                    <span className="text-xs font-bold text-white whitespace-nowrap px-2">{progress.toFixed(0)}%</span>
                </div>
            </div>
            <div className="flex justify-between text-sm mt-2">
                <span>Spent: {formatCurrency(spentAmount, currency)}</span>
                <span className={`font-semibold ${isOver ? 'text-red-500' : ''}`}>{isOver ? `${formatCurrency(Math.abs(remaining), currency)} Over` : `${formatCurrency(remaining, currency)} Left`}</span>
            </div>
        </div>
    );
};

const FiftyThirtyTwentyView: React.FC<BudgetsProps> = ({ transactions, categories, accounts, settings }) => {
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const monthTransactions = useMemo(() => getThisMonthTransactions(transactions), [transactions]);

    const { totalIncome, needsSpent, wantsSpent, savingsSpent } = useMemo(() => {
        let income = 0;
        const spending: Record<Rule503020, number> = { needs: 0, wants: 0, savings: 0 };

        monthTransactions.forEach(t => {
            const account = accountMap.get(t.accountId);
            if (!account) return;
            const amountInBase = convertCurrency(t.amount, account.currency, settings.baseCurrency, settings);
            
            if (t.type === TransactionType.INCOME) {
                income += amountInBase;
            } else {
                const category = categoryMap.get(t.categoryId);
                if (category?.rule503020) {
                    spending[category.rule503020] += amountInBase;
                }
            }
        });
        return { totalIncome: income, needsSpent: spending.needs, wantsSpent: spending.wants, savingsSpent: spending.savings };
    }, [monthTransactions, categoryMap, accountMap, settings]);

    return (
        <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">50/30/20 Budget</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">Total Monthly Income</p>
                <p className="text-3xl sm:text-4xl font-bold text-primary-600">{formatCurrency(totalIncome, settings.baseCurrency)}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RuleProgressCard title="Needs" targetPercent={50} targetAmount={totalIncome * 0.5} spentAmount={needsSpent} currency={settings.baseCurrency} color="text-red-500" />
                <RuleProgressCard title="Wants" targetPercent={30} targetAmount={totalIncome * 0.3} spentAmount={wantsSpent} currency={settings.baseCurrency} color="text-yellow-500" />
                <RuleProgressCard title="Savings" targetPercent={20} targetAmount={totalIncome * 0.2} spentAmount={savingsSpent} currency={settings.baseCurrency} color="text-green-500" />
            </div>
        </div>
    );
};

// --- Sub-component for Pay Yourself First ---
const PayYourselfFirstView: React.FC<BudgetsProps> = ({ transactions, categories, accounts, settings }) => {
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const monthTransactions = useMemo(() => getThisMonthTransactions(transactions), [transactions]);

    const { totalIncome, savingsSpent } = useMemo(() => {
        let income = 0;
        let savings = 0;
        monthTransactions.forEach(t => {
            const account = accountMap.get(t.accountId);
            if (!account) return;
            const amountInBase = convertCurrency(t.amount, account.currency, settings.baseCurrency, settings);
            if (t.type === TransactionType.INCOME) {
                income += amountInBase;
            } else {
                const category = categoryMap.get(t.categoryId);
                if (category?.rule503020 === 'savings') {
                    savings += amountInBase;
                }
            }
        });
        return { totalIncome: income, savingsSpent: savings };
    }, [monthTransactions, categoryMap, accountMap, settings]);

    const savingsTarget = settings.payYourselfFirstSetting.type === 'percentage'
        ? totalIncome * (settings.payYourselfFirstSetting.value / 100)
        : settings.payYourselfFirstSetting.value;
    
    const progress = savingsTarget > 0 ? (savingsSpent / savingsTarget) * 100 : 0;
    const remainingToSpend = totalIncome - savingsSpent;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Pay Yourself First</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold text-green-500">Savings Goal</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Target: {formatCurrency(savingsTarget, settings.baseCurrency)}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 mt-4 relative overflow-hidden">
                        <div className="bg-green-500 h-5 rounded-full flex items-center justify-center transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}>
                            <span className="text-xs font-bold text-white whitespace-nowrap px-2">{progress.toFixed(0)}%</span>
                        </div>
                    </div>
                     <div className="flex justify-between text-sm mt-2">
                        <span>Saved: {formatCurrency(savingsSpent, settings.baseCurrency)}</span>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center flex flex-col justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Remaining to Spend</p>
                    <p className="text-3xl sm:text-4xl font-bold text-primary-600">{formatCurrency(remainingToSpend, settings.baseCurrency)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">(Total Income - Amount Saved)</p>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component for Simple Budget ---
const SimpleBudgetView: React.FC<BudgetsProps> = ({ transactions, accounts, settings }) => {
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const monthTransactions = useMemo(() => getThisMonthTransactions(transactions), [transactions]);

    const { totalIncome, totalExpense } = useMemo(() => {
        let income = 0;
        let expense = 0;
        monthTransactions.forEach(t => {
            const account = accountMap.get(t.accountId);
            if (!account) return;
            const amountInBase = convertCurrency(t.amount, account.currency, settings.baseCurrency, settings);
            if (t.type === TransactionType.INCOME) income += amountInBase;
            else expense += amountInBase;
        });
        return { totalIncome: income, totalExpense: expense };
    }, [monthTransactions, accountMap, settings]);
    
    const net = totalIncome - totalExpense;
    const progress = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    return (
         <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Simple Budget</h1>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                 <h2 className="text-xl font-semibold mb-2">This Month's Summary</h2>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 mt-4 relative overflow-hidden">
                    <div className="bg-red-500 h-8 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                     <div className="absolute inset-0 flex items-center justify-between px-4 text-white font-bold text-sm">
                        <span>Spent: {formatCurrency(totalExpense, settings.baseCurrency)}</span>
                        <span>Income: {formatCurrency(totalIncome, settings.baseCurrency)}</span>
                    </div>
                </div>
                 <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
                        <p className="text-sm font-semibold text-green-600">Income</p>
                        <p className="text-xl sm:text-2xl font-bold">{formatCurrency(totalIncome, settings.baseCurrency)}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/50 rounded-lg">
                        <p className="text-sm font-semibold text-red-600">Expenses</p>
                        <p className="text-xl sm:text-2xl font-bold">{formatCurrency(totalExpense, settings.baseCurrency)}</p>
                    </div>
                    <div className={`text-center p-4 rounded-lg ${net >= 0 ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-red-50 dark:bg-red-900/50'}`}>
                        <p className={`text-sm font-semibold ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Net Savings</p>
                        <p className="text-xl sm:text-2xl font-bold">{formatCurrency(net, settings.baseCurrency)}</p>
                    </div>
                 </div>
            </div>
        </div>
    );
};

// --- Main Component Router ---
const Budgets: React.FC<BudgetsProps> = (props) => {
    const { settings } = props;

    const renderView = () => {
        switch (settings.budgetingStrategy) {
            case BudgetingStrategy.FIFTY_THIRTY_TWENTY:
                return <FiftyThirtyTwentyView {...props} />;
            case BudgetingStrategy.PAY_YOURSELF_FIRST:
                return <PayYourselfFirstView {...props} />;
            case BudgetingStrategy.SIMPLE:
                return <SimpleBudgetView {...props} />;
            case BudgetingStrategy.ENVELOPE:
            default:
                return <EnvelopeBudgetView {...props} />;
        }
    };
    
    return <>{renderView()}</>;
};

export default Budgets;