import { useState, useEffect, useCallback } from 'react';
import { SavingsGoal, GoalContribution } from '../types';

const GOALS_STORAGE_KEY = 'fintrack-ai-savings-goals';
const CONTRIBUTIONS_STORAGE_KEY = 'fintrack-ai-goal-contributions';

const initialGoals: SavingsGoal[] = [
    { id: 'goal-1', name: 'Vacation to Hawaii', targetAmount: 4000, startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(), deadline: new Date(new Date().getFullYear() + 1, 5, 1).toISOString(), currency: 'USD', accountId: 'acc-3' },
    { id: 'goal-2', name: 'New Laptop', targetAmount: 1500, startDate: new Date(new Date().getFullYear(), 2, 1).toISOString(), currency: 'USD', accountId: 'acc-3' },
    { id: 'goal-3', name: 'London Trip', targetAmount: 3000, startDate: new Date(new Date().getFullYear(), 1, 1).toISOString(), currency: 'GBP', accountId: 'acc-1' },
];

const initialContributions: GoalContribution[] = [
    { id: 'contrib-1', goalId: 'goal-1', amount: 250, date: new Date().toISOString() },
    { id: 'contrib-2', goalId: 'goal-1', amount: 150, date: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'contrib-3', goalId: 'goal-2', amount: 500, date: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: 'contrib-4', goalId: 'goal-3', amount: 500, date: new Date(Date.now() - 86400000 * 15).toISOString() },
];

export const useSavingsGoals = () => {
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [contributions, setContributions] = useState<GoalContribution[]>([]);

    useEffect(() => {
        try {
            const storedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
            if (storedGoals) {
                const parsed = JSON.parse(storedGoals).map((g: any) => ({ ...g, currency: g.currency ?? 'USD' }));
                setGoals(parsed);
            } else {
                setGoals(initialGoals);
            }
            
            const storedContributions = localStorage.getItem(CONTRIBUTIONS_STORAGE_KEY);
            setContributions(storedContributions ? JSON.parse(storedContributions) : initialContributions);
        } catch (error) {
            console.error("Failed to load savings goals data from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
        } catch (error) {
            console.error("Failed to save goals to localStorage", error);
        }
    }, [goals]);

    useEffect(() => {
        try {
            localStorage.setItem(CONTRIBUTIONS_STORAGE_KEY, JSON.stringify(contributions));
        } catch (error) {
            console.error("Failed to save contributions to localStorage", error);
        }
    }, [contributions]);

    const addGoal = useCallback((goal: Omit<SavingsGoal, 'id'>) => {
        const newGoal: SavingsGoal = { ...goal, id: new Date().getTime().toString() };
        setGoals(prev => [newGoal, ...prev]);
    }, []);

    const updateGoal = useCallback((updatedGoal: SavingsGoal) => {
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    }, []);

    const deleteGoal = useCallback((id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
        // Also delete associated contributions
        setContributions(prev => prev.filter(c => c.goalId !== id));
    }, []);

    const addContribution = useCallback((contribution: Omit<GoalContribution, 'id' | 'date'>) => {
        const newContribution: GoalContribution = {
            ...contribution,
            id: new Date().getTime().toString(),
            date: new Date().toISOString(),
        };
        setContributions(prev => [newContribution, ...prev]);
    }, []);

    return { goals, contributions, addGoal, updateGoal, deleteGoal, addContribution };
};
