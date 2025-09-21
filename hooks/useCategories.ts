import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const STORAGE_KEY = 'fintrack-ai-categories';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setCategories(JSON.parse(stored));
            } else {
                setCategories(DEFAULT_CATEGORIES);
            }
        } catch (error) {
            console.error("Failed to load categories from localStorage", error);
            setCategories(DEFAULT_CATEGORIES);
        }
    }, []);

    useEffect(() => {
        try {
             if (categories.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
            }
        } catch (error) {
            console.error("Failed to save categories to localStorage", error);
        }
    }, [categories]);

    const addCategory = useCallback((category: Omit<Category, 'id'>) => {
        const newCategory: Category = {
            ...category,
            id: new Date().getTime().toString(),
        };
        setCategories(prev => [...prev, newCategory]);
    }, []);
    
    const updateCategory = useCallback((updatedCategory: Category) => {
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    }, []);

    const deleteCategory = useCallback((id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    }, []);


    return { categories, addCategory, updateCategory, deleteCategory };
};