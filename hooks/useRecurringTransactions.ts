import { useState, useEffect, useCallback } from 'react';
import { RecurringTransaction, Frequency, TransactionType } from '../types';

const STORAGE_KEY = 'fintrack-ai-recurring-transactions';

export const useRecurringTransactions = () => {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecurringTransactions(JSON.parse(stored));
            } else {
                // Add some initial data for demo purposes
                const initialData: RecurringTransaction[] = [
                    { 
                        id: 'rec-1', 
                        accountId: 'acc-1',
                        description: 'Monthly Salary', 
                        amount: 5000, 
                        type: TransactionType.INCOME, 
                        categoryId: 'inc-salary', 
                        frequency: Frequency.MONTHLY,
                        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                    },
                ];
                setRecurringTransactions(initialData);
            }
        } catch (error) {
            console.error("Failed to load recurring transactions from localStorage", error);
            setRecurringTransactions([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTransactions));
        } catch (error) {
            console.error("Failed to save recurring transactions to localStorage", error);
        }
    }, [recurringTransactions]);

    const addRecurringTransaction = useCallback((transaction: Omit<RecurringTransaction, 'id'>) => {
        const newTransaction: RecurringTransaction = {
            ...transaction,
            id: new Date().getTime().toString(),
        };
        setRecurringTransactions(prev => [...prev, newTransaction]);
    }, []);
    
    const updateRecurringTransaction = useCallback((updated: RecurringTransaction) => {
        setRecurringTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    }, []);

    const deleteRecurringTransaction = useCallback((id: string) => {
        // Here you might also want to clean up related exceptions, but for now, we'll keep it simple.
        setRecurringTransactions(prev => prev.filter(t => t.id !== id));
    }, []);

    const removeTagFromAll = useCallback((tagName: string) => {
        const lowerCaseTag = tagName.toLowerCase();
        setRecurringTransactions(prev => prev.map(t => {
            if (!t.tags) return t;
            const newTags = t.tags.filter(tag => tag.toLowerCase() !== lowerCaseTag);
            return { ...t, tags: newTags.length > 0 ? newTags : undefined };
        }));
    }, []);

    const renameTagInAll = useCallback((oldName: string, newName: string) => {
        const lowerCaseOldName = oldName.toLowerCase();
        setRecurringTransactions(prev => prev.map(t => {
            if (!t.tags) return t;
            return {
                ...t,
                tags: t.tags.map(tag => tag.toLowerCase() === lowerCaseOldName ? newName : tag)
            };
        }));
    }, []);

    return { recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, removeTagFromAll, renameTagInAll };
};