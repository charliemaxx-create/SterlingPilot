import React, { useState, useEffect, useMemo } from 'react';
import { SavingsGoal, AppSettings, Account, AccountType } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';
import { getCurrencySymbol, formatCurrency } from '../utils/currency';

interface AddGoalModalProps {
    onClose: () => void;
    onSave: (data: Omit<SavingsGoal, 'id'>) => void;
    goalToEdit?: SavingsGoal;
    settings: AppSettings;
    accounts: Account[];
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onSave, goalToEdit, settings, accounts }) => {
    const availableAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.BANK || a.type === AccountType.CASH), [accounts]);
    
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [deadline, setDeadline] = useState('');
    const [currency, setCurrency] = useState(settings.baseCurrency);
    const [accountId, setAccountId] = useState(goalToEdit?.accountId || availableAccounts[0]?.id || '');

    useEffect(() => {
        if (goalToEdit) {
            setName(goalToEdit.name);
            setTargetAmount(goalToEdit.targetAmount.toString());
            setStartDate(goalToEdit.startDate ? new Date(goalToEdit.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            setDeadline(goalToEdit.deadline ? new Date(goalToEdit.deadline).toISOString().split('T')[0] : '');
            setCurrency(goalToEdit.currency);
            setAccountId(goalToEdit.accountId || '');
        }
    }, [goalToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0 || !startDate) {
            alert("Please enter a valid name, target amount, and start date.");
            return;
        }
        if (deadline && new Date(deadline) < new Date(startDate)) {
            alert("Deadline cannot be before the start date.");
            return;
        }
        onSave({ name, targetAmount: parseFloat(targetAmount), startDate, deadline: deadline || undefined, currency, accountId: accountId || undefined });
    };

    const currencySymbol = getCurrencySymbol(currency);
    
    const dailySavingsNeeded = useMemo(() => {
        if (!targetAmount || !startDate || !deadline) {
            return null;
        }
        const amount = parseFloat(targetAmount);
        const start = new Date(startDate);
        const end = new Date(deadline);

        if (amount <= 0 || end <= start) {
            return null;
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return null;

        const dailyAmount = amount / diffDays;
        return dailyAmount;
    }, [targetAmount, startDate, deadline]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {goalToEdit ? 'Edit Goal' : 'Set New Goal'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="goalName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
                        <input type="text" id="goalName" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required placeholder="e.g., New Car Fund" />
                    </div>
                    <div>
                        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link to Account (Optional)</label>
                        <select id="accountId" value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                            <option value="">No linked account</option>
                            {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                        <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                            {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount ({currencySymbol})</label>
                         <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input type="number" id="targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full pl-7 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required min="0.01" step="0.01" placeholder="e.g., 5000" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required />
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline (Optional)</label>
                            <input type="date" id="deadline" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" min={startDate} />
                        </div>
                    </div>
                     {dailySavingsNeeded !== null && (
                        <div className="p-3 text-center bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
                            Approx. <span className="font-bold">{formatCurrency(dailySavingsNeeded, currency)}</span> per day to reach this goal.
                        </div>
                    )}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Save Goal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddGoalModal;
