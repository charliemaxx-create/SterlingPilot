import React, { useState, useMemo } from 'react';
import { SavingsGoal, GoalContribution, Account, Transaction, TransactionType, AppSettings } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import AddGoalModal from './AddGoalModal';
import AddContributionModal from './AddContributionModal';

interface GoalsProps {
    goals: SavingsGoal[];
    contributions: GoalContribution[];
    accounts: Account[];
    addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
    updateGoal: (goal: SavingsGoal) => void;
    deleteGoal: (id: string) => void;
    addContribution: (contribution: Omit<GoalContribution, 'id' | 'date'>) => void;
    addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
    settings: AppSettings;
}

const GoalCard: React.FC<{
    goal: SavingsGoal;
    currentAmount: number;
    accountName?: string;
    onEdit: () => void;
    onDelete: () => void;
    onAddFunds: () => void;
}> = ({ goal, currentAmount, accountName, onEdit, onDelete, onAddFunds }) => {
    const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
    
    const remainingAmount = goal.targetAmount - currentAmount;
    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    const dailyPace = daysLeft !== null && daysLeft > 0 && remainingAmount > 0 ? remainingAmount / daysLeft : null;

    const getStartDate = () => {
        if (!goal.startDate) return 'N/A';
        const date = new Date(goal.startDate);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{goal.name}</h3>
                    {accountName && <p className="text-xs text-gray-500 dark:text-gray-400">In: {accountName}</p>}
                </div>
                <div className="flex space-x-2">
                    <button onClick={onEdit} className="text-gray-400 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>
             <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                 <span>Started: {getStartDate()}</span>
                 {goal.deadline && (
                    <span className={daysLeft !== null && daysLeft < 0 ? 'text-red-500 font-semibold' : ''}>
                        {daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                    </span>
                 )}
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div className="bg-primary-500 h-4 rounded-full text-center text-white text-xs font-bold" style={{ width: `${Math.min(progress, 100)}%` }}>
                        {progress.toFixed(0)}%
                    </div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600 dark:text-gray-300">{formatCurrency(currentAmount, goal.currency)}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(goal.targetAmount, goal.currency)}</span>
                </div>
            </div>
            {dailyPace !== null && (
                 <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pace to stay on track</p>
                    <p className="font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(dailyPace, goal.currency)} / day</p>
                </div>
            )}
            <div className="mt-auto pt-4">
                 <button onClick={onAddFunds} className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700">
                    + Add Funds
                </button>
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
    );
};

const GoalRow: React.FC<{
    goal: SavingsGoal;
    currentAmount: number;
    accountName?: string;
    onEdit: () => void;
    onDelete: () => void;
    onAddFunds: () => void;
}> = ({ goal, currentAmount, accountName, onEdit, onDelete, onAddFunds }) => {
    const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;
    const remaining = goal.targetAmount - currentAmount;
    
    const getFormattedDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString();
    };

    const deadlineString = getFormattedDate(goal.deadline);

    const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                <div className="font-semibold">{goal.name}</div>
                <div className="sm:hidden text-xs text-gray-500 mt-1">
                    Target: {formatCurrency(goal.targetAmount, goal.currency)}
                </div>
                 <div className="md:hidden text-xs text-gray-500 mt-1">
                    Account: {accountName || 'N/A'}
                </div>
                <div className="lg:hidden text-xs text-gray-500 mt-1">
                    Deadline: {deadlineString} {daysLeft !== null && `(${daysLeft} days left)`}
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{accountName || 'N/A'}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right hidden sm:table-cell">{formatCurrency(goal.targetAmount, goal.currency)}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right">{formatCurrency(currentAmount, goal.currency)}</td>
            <td className={`py-3 px-4 text-sm font-semibold text-right hidden sm:table-cell ${remaining <= 0 ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatCurrency(remaining, goal.currency)}
            </td>
            <td className="py-3 px-4 w-1/4 min-w-[150px]">
                <ProgressBar progress={progress} />
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                <div>{deadlineString}</div>
                {daysLeft !== null && daysLeft >= 0 && <div className="text-xs text-gray-400">({daysLeft} days left)</div>}
                {daysLeft !== null && daysLeft < 0 && <div className="text-xs text-red-500 font-semibold">(Deadline passed)</div>}
            </td>
            <td className="py-3 px-4 text-right">
                <div className="flex justify-end space-x-3">
                    <button onClick={onAddFunds} className="text-gray-400 hover:text-green-500" aria-label="Add funds">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={onEdit} className="text-gray-400 hover:text-primary-500" aria-label="Edit goal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500" aria-label="Delete goal">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Goals: React.FC<GoalsProps> = ({ goals, contributions, accounts, addGoal, updateGoal, deleteGoal, addContribution, addTransaction, settings }) => {
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [isContribModalOpen, setContribModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);
    const [contributingToGoal, setContributingToGoal] = useState<SavingsGoal | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'tile' | 'list'>(settings.defaultGoalView || 'tile');

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

    const goalProgress = useMemo(() => {
        const progress = new Map<string, number>();
        goals.forEach(g => progress.set(g.id, 0));
        contributions.forEach(c => {
            progress.set(c.goalId, (progress.get(c.goalId) || 0) + c.amount);
        });
        return progress;
    }, [goals, contributions]);

    const handleSaveGoal = (data: Omit<SavingsGoal, 'id'>) => {
        if (editingGoal) {
            updateGoal({ ...editingGoal, ...data });
        } else {
            addGoal(data);
        }
        setGoalModalOpen(false);
        setEditingGoal(undefined);
    };
    
    const handleSaveContribution = (data: { amount: number, sourceAccountId: string }) => {
        if (!contributingToGoal) return;

        const sourceAccount = accounts.find(a => a.id === data.sourceAccountId);
        if (!sourceAccount) {
            alert("Source account not found!");
            return;
        }

        // 1. Convert contribution amount to the goal's currency
        const amountInGoalCurrency = convertCurrency(data.amount, sourceAccount.currency, contributingToGoal.currency, settings);
        
        // 2. Add the contribution record
        addContribution({
            goalId: contributingToGoal.id,
            amount: amountInGoalCurrency
        });

        // 3. Create a corresponding expense transaction in the source account's currency
        addTransaction({
            accountId: data.sourceAccountId,
            description: `Contribution to: ${contributingToGoal.name}`,
            amount: data.amount,
            type: TransactionType.EXPENSE,
            categoryId: 'exp-savings-goals', // Use the static ID for Savings Goals
        });

        setContribModalOpen(false);
        setContributingToGoal(undefined);
    };

    const openEditModal = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setGoalModalOpen(true);
    };

    const openAddModal = () => {
        setEditingGoal(undefined);
        setGoalModalOpen(true);
    };
    
    const openContribModal = (goal: SavingsGoal) => {
        setContributingToGoal(goal);
        setContribModalOpen(true);
    }

    const renderContent = () => {
        if (goals.length === 0) {
            return (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">You haven't set any savings goals yet.</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click 'Set New Goal' to get started!</p>
                </div>
            );
        }

        if (viewMode === 'list') {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Goal</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden md:table-cell">Linked Account</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden sm:table-cell">Target</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Saved</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden sm:table-cell">Remaining</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Progress</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Deadline</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goals.map(goal => (
                                <GoalRow
                                    key={goal.id}
                                    goal={goal}
                                    currentAmount={goalProgress.get(goal.id) || 0}
                                    accountName={goal.accountId ? accountMap.get(goal.accountId) : undefined}
                                    onEdit={() => openEditModal(goal)}
                                    onDelete={() => deleteGoal(goal.id)}
                                    onAddFunds={() => openContribModal(goal)}
                                />
                            ))}
                              {goals.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center py-10 text-gray-500 dark:text-gray-400">No savings goals set up yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => (
                    <GoalCard
                        key={goal.id}
                        goal={goal}
                        currentAmount={goalProgress.get(goal.id) || 0}
                        accountName={goal.accountId ? accountMap.get(goal.accountId) : undefined}
                        onEdit={() => openEditModal(goal)}
                        onDelete={() => deleteGoal(goal.id)}
                        onAddFunds={() => openContribModal(goal)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Savings Goals</h1>
                <div className="flex items-center space-x-2">
                     <button 
                        onClick={() => setViewMode('tile')} 
                        className={`p-2 rounded-md transition-colors ${viewMode === 'tile' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        aria-label="Tile View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        aria-label="List View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700"
                    >
                        + Set New Goal
                    </button>
                </div>
            </div>

            {renderContent()}

            {isGoalModalOpen && (
                <AddGoalModal
                    onClose={() => setGoalModalOpen(false)}
                    onSave={handleSaveGoal}
                    goalToEdit={editingGoal}
                    settings={settings}
                    accounts={accounts}
                />
            )}
            {isContribModalOpen && contributingToGoal && (
                <AddContributionModal
                    onClose={() => setContribModalOpen(false)}
                    onSave={handleSaveContribution}
                    accounts={accounts}
                    goal={contributingToGoal}
                    settings={settings}
                />
            )}
        </div>
    );
};

export default Goals;