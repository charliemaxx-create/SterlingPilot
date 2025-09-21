import { useState, useEffect, useCallback } from 'react';
import { Budget } from '../types';

const STORAGE_KEY = 'fintrack-ai-budgets';

export const useBudgets = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);

    useEffect(() => {
        try {
            const storedBudgets = localStorage.getItem(STORAGE_KEY);
            if (storedBudgets) {
                 // Handle migration for users who have old data without currency
                const parsed = JSON.parse(storedBudgets).map((b: any) => ({
                    ...b,
                    currency: b.currency ?? 'USD'
                }));
                setBudgets(parsed);
            } else {
                // Add some initial data for demo purposes
                const initialData: Budget[] = [
                    { id: '1', categoryId: 'exp-food', limit: 500, currency: 'USD' },
                    { id: '2', categoryId: 'exp-shopping', limit: 300, currency: 'USD' },
                    { id: '3', categoryId: 'exp-transport', limit: 150, currency: 'USD' },
                    { id: '4', categoryId: 'exp-entertainment', limit: 200, currency: 'EUR' },
                ];
                setBudgets(initialData);
            }
        } catch (error) {
            console.error("Failed to load budgets from localStorage", error);
            setBudgets([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
        } catch (error) {
            console.error("Failed to save budgets to localStorage", error);
        }
    }, [budgets]);

    const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
        const newBudget: Budget = {
            ...budget,
            id: new Date().getTime().toString(),
        };
        setBudgets(prev => [...prev, newBudget]);
    }, []);
    
    const updateBudget = useCallback((updatedBudget: Budget) => {
        setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
    }, []);

    const deleteBudget = useCallback((id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    }, []);


    return { budgets, addBudget, updateBudget, deleteBudget };
};