import { useState, useEffect, useCallback } from 'react';
import { Account, AccountType } from '../types';

const STORAGE_KEY = 'fintrack-ai-accounts';

const initialData: Account[] = [
    { id: 'acc-1', name: 'Main Checking', type: AccountType.BANK, initialBalance: 1250.75, currency: 'USD' },
    { id: 'acc-2', name: 'Visa Credit Card', type: AccountType.CREDIT_CARD, initialBalance: -430.20, currency: 'USD', interestRate: 19.99, minimumPayment: 25 },
    { id: 'acc-3', name: 'Savings Account', type: AccountType.BANK, initialBalance: 5800.00, currency: 'USD' },
    { id: 'acc-4', name: 'European Trip Fund', type: AccountType.BANK, initialBalance: 2500.00, currency: 'EUR' },
    { id: 'acc-5', name: 'Car Loan', type: AccountType.LOAN, initialBalance: -15000, currency: 'USD', interestRate: 4.5, minimumPayment: 350, originationDate: '2022-08-01', originalTermMonths: 60 },
];

export const useAccounts = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // Handle migration for users who have old data with previous AccountType values
                const parsedAccounts = JSON.parse(stored).map((acc: any) => {
                    let newType = acc.type;
                    switch(acc.type) {
                        case 'Checking':
                        case 'Savings':
                            newType = AccountType.BANK;
                            break;
                        case 'Cash':
                            newType = AccountType.CASH;
                            break;
                        case 'Credit Card':
                            newType = AccountType.CREDIT_CARD;
                            break;
                        case 'Loan':
                            newType = AccountType.LOAN;
                            break;
                    }
                    return {
                        ...acc,
                        type: newType,
                        initialBalance: acc.initialBalance ?? 0,
                        currency: acc.currency ?? 'USD',
                    };
                });
                setAccounts(parsedAccounts);
            } else {
                setAccounts(initialData);
            }
        } catch (error) {
            console.error("Failed to load accounts from localStorage", error);
            setAccounts(initialData);
        }
    }, []);

    useEffect(() => {
        try {
            if (accounts.length > 0) {
                 localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
            }
        } catch (error) {
            console.error("Failed to save accounts to localStorage", error);
        }
    }, [accounts]);

    const addAccount = useCallback((account: Omit<Account, 'id'>) => {
        const newAccount: Account = {
            ...account,
            id: new Date().getTime().toString(),
        };
        setAccounts(prev => [...prev, newAccount]);
    }, []);

    const updateAccount = useCallback((updatedAccount: Account) => {
        setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    }, []);

    const deleteAccount = useCallback((id: string) => {
        // Note: This doesn't handle deleting associated transactions. For this app's scope, we'll assume this is okay.
        // A more robust app might prevent deletion if transactions exist or reassign them.
        if (accounts.length <= 1) {
            alert("You cannot delete your only account.");
            return;
        }
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    }, [accounts.length]);


    return { accounts, addAccount, updateAccount, deleteAccount };
};