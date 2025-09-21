import React, { useState, useMemo } from 'react';
import { Account, SavingsGoal, AppSettings } from '../types';
import { getCurrencySymbol, convertCurrency } from '../utils/currency';

interface AddContributionModalProps {
    onClose: () => void;
    onSave: (data: { amount: number, sourceAccountId: string }) => void;
    accounts: Account[];
    goal: SavingsGoal;
    settings: AppSettings;
}

const AddContributionModal: React.FC<AddContributionModalProps> = ({ onClose, onSave, accounts, goal, settings }) => {
    const [amount, setAmount] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState<string>(accounts[0]?.id || '');
    
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const selectedAccount = accountMap.get(sourceAccountId);
    const currencySymbol = getCurrencySymbol(selectedAccount?.currency || 'USD');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0 || !sourceAccountId) {
            alert("Please enter a valid amount and select a source account.");
            return;
        }
        onSave({ amount: parseFloat(amount), sourceAccountId });
    };

    const convertedAmount = useMemo(() => {
        if (!amount || !selectedAccount || selectedAccount.currency === goal.currency) {
            return null;
        }
        const converted = convertCurrency(parseFloat(amount), selectedAccount.currency, goal.currency, settings);
        return converted;
    }, [amount, selectedAccount, goal.currency, settings]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add Funds to "{goal.name}" ({goal.currency})</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="sourceAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Account</label>
                        <select id="sourceAccount" value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required>
                            <option value="" disabled>Select an account</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-7 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required min="0.01" step="0.01" placeholder="e.g., 100" />
                        </div>
                         {convertedAmount !== null && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Approx. {getCurrencySymbol(goal.currency)}{convertedAmount.toFixed(2)}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Contribute</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContributionModal;