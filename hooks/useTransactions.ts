import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, TransactionSummary, RecurringTransaction, TransactionException, Frequency, Account, AppSettings } from '../types';
import { convertCurrency } from '../utils/currency';

const MANUAL_TRANSACTIONS_KEY = 'fintrack-ai-transactions';
const TRANSACTION_EXCEPTIONS_KEY = 'fintrack-ai-transaction-exceptions';

// Helper to generate transaction instances from a recurring rule
const generateTransactions = (recurring: RecurringTransaction, exceptions: TransactionException[]): Transaction[] => {
    const generated: Transaction[] = [];
    const today = new Date();
    let currentDate = new Date(recurring.startDate);

    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const exceptionExists = exceptions.some(ex => 
            ex.recurringTransactionId === recurring.id && ex.date === dateStr
        );

        if (!exceptionExists) {
            generated.push({
                ...recurring,
                id: `rec-${recurring.id}-${dateStr}`,
                date: currentDate.toISOString(),
                isRecurring: true,
                recurringTransactionId: recurring.id,
                tags: recurring.tags,
            });
        }

        switch (recurring.frequency) {
            case Frequency.DAILY:
                currentDate.setDate(currentDate.getDate() + 1);
                break;
            case Frequency.WEEKLY:
                currentDate.setDate(currentDate.getDate() + 7);
                break;
            case Frequency.MONTHLY:
                currentDate.setMonth(currentDate.getMonth() + 1);
                break;
        }
    }
    return generated;
};


export const useTransactions = (recurringTransactions: RecurringTransaction[], accounts: Account[], settings: AppSettings) => {
    const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
    const [exceptions, setExceptions] = useState<TransactionException[]>([]);

    // Load manual transactions and exceptions from localStorage
    useEffect(() => {
        try {
            const storedManual = localStorage.getItem(MANUAL_TRANSACTIONS_KEY);
            setManualTransactions(storedManual ? JSON.parse(storedManual) : []);

            const storedExceptions = localStorage.getItem(TRANSACTION_EXCEPTIONS_KEY);
            setExceptions(storedExceptions ? JSON.parse(storedExceptions) : []);
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);
    
    // Save manual transactions and exceptions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(MANUAL_TRANSACTIONS_KEY, JSON.stringify(manualTransactions));
            localStorage.setItem(TRANSACTION_EXCEPTIONS_KEY, JSON.stringify(exceptions));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }, [manualTransactions, exceptions]);

    const transactions = useMemo(() => {
        const generated = recurringTransactions.flatMap(rt => generateTransactions(rt, exceptions));
        const combined = [...manualTransactions, ...generated];
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [manualTransactions, recurringTransactions, exceptions]);

    const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'date'>) => {
        const newTransaction: Transaction = {
            ...transaction,
            id: new Date().getTime().toString(),
            date: new Date().toISOString(),
        };
        setManualTransactions(prev => [newTransaction, ...prev]);
    }, []);

    const deleteTransaction = useCallback((transactionToDelete: Transaction) => {
        if (transactionToDelete.isRecurring && transactionToDelete.recurringTransactionId) {
            // It's a recurring transaction instance, so create an exception
            const newException: TransactionException = {
                recurringTransactionId: transactionToDelete.recurringTransactionId,
                date: new Date(transactionToDelete.date).toISOString().split('T')[0],
            };
            setExceptions(prev => [...prev, newException]);
        } else {
            // It's a manual transaction, so delete it directly
            setManualTransactions(prev => prev.filter(t => t.id !== transactionToDelete.id));
        }
    }, []);

    const getSummary = useCallback((): TransactionSummary => {
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
        const summary: TransactionSummary = {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            expensesByCategoryId: {},
        };

        return transactions.reduce((acc, t) => {
            const account = accountMap.get(t.accountId);
            if (!account) return acc;

            const amountInBaseCurrency = convertCurrency(t.amount, account.currency, settings.baseCurrency, settings);

            if (t.type === TransactionType.INCOME) {
                acc.totalIncome += amountInBaseCurrency;
            } else {
                acc.totalExpense += amountInBaseCurrency;
                const categoryId = t.categoryId;
                acc.expensesByCategoryId[categoryId] = (acc.expensesByCategoryId[categoryId] || 0) + amountInBaseCurrency;
            }
            acc.balance = acc.totalIncome - acc.totalExpense;
            return acc;
        }, summary);
    }, [transactions, accounts, settings]);

    const removeTagFromAll = useCallback((tagName: string) => {
        const lowerCaseTag = tagName.toLowerCase();
        setManualTransactions(prev => prev.map(t => {
            if (!t.tags) return t;
            const newTags = t.tags.filter(tag => tag.toLowerCase() !== lowerCaseTag);
            return { ...t, tags: newTags.length > 0 ? newTags : undefined };
        }));
    }, []);

    const renameTagInAll = useCallback((oldName: string, newName: string) => {
        const lowerCaseOldName = oldName.toLowerCase();
        setManualTransactions(prev => prev.map(t => {
            if (!t.tags) return t;
            return {
                ...t,
                tags: t.tags.map(tag => tag.toLowerCase() === lowerCaseOldName ? newName : tag)
            };
        }));
    }, []);

    return { transactions, addTransaction, deleteTransaction, getSummary, removeTagFromAll, renameTagInAll };
};