import React, { useState, useEffect, useMemo } from 'react';
import { Budget, Category, AppSettings, TransactionType } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';
import { getCurrencySymbol } from '../utils/currency';

interface AddBudgetModalProps {
    onClose: () => void;
    onSave: (data: { categoryId: string, limit: number, currency: string }) => void;
    existingBudgets: Budget[];
    budgetToEdit?: Budget;
    categories: Category[];
    settings: AppSettings;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ onClose, onSave, existingBudgets, budgetToEdit, categories, settings }) => {
    const expenseCategories = useMemo(() => categories.filter(c => c.type === TransactionType.EXPENSE), [categories]);
    const [categoryId, setCategoryId] = useState<string>(budgetToEdit?.categoryId || expenseCategories[0]?.id || '');
    const [limit, setLimit] = useState('');
    const [currency, setCurrency] = useState(settings.baseCurrency);

    useEffect(() => {
        if (budgetToEdit) {
            setCategoryId(budgetToEdit.categoryId);
            setLimit(budgetToEdit.limit.toString());
            setCurrency(budgetToEdit.currency);
        }
    }, [budgetToEdit]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !limit || parseFloat(limit) <= 0) {
            alert("Please select a category and enter a valid limit.");
            return;
        }
        onSave({ categoryId, limit: parseFloat(limit), currency });
    };

    const availableCategories = expenseCategories.filter(cat => 
        !existingBudgets.some(b => b.categoryId === cat.id) || (budgetToEdit && budgetToEdit.categoryId === cat.id)
    );
    
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {budgetToEdit ? 'Edit Budget' : 'Set New Budget'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select 
                            id="category" 
                            value={categoryId} 
                            onChange={e => setCategoryId(e.target.value)} 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                            disabled={!!budgetToEdit}
                        >
                            {budgetToEdit && <option value={budgetToEdit.categoryId}>{categories.find(c => c.id === budgetToEdit.categoryId)?.name}</option>}
                            {availableCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                         {availableCategories.length === 0 && !budgetToEdit && <p className="text-xs text-yellow-500 mt-1">All categories have budgets.</p>}
                    </div>
                     <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                        <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                            {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Limit ({currencySymbol})</label>
                         <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input 
                                type="number" 
                                id="limit" value={limit} 
                                onChange={e => setLimit(e.target.value)} 
                                className="w-full pl-7 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" 
                                required 
                                min="0.01" 
                                step="0.01"
                                placeholder="e.g., 500"
                             />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBudgetModal;