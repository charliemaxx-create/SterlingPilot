import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fintrack-ai-tags';

export const useTags = () => {
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setTags(JSON.parse(stored));
            } else {
                setTags(['monthly-bill', 'groceries', 'one-time', 'utilities']);
            }
        } catch (error) {
            console.error("Failed to load tags from localStorage", error);
            setTags([]);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
        } catch (error) {
            console.error("Failed to save tags to localStorage", error);
        }
    }, [tags]);

    const addTag = useCallback((tag: string) => {
        const formattedTag = tag.trim();
        if (formattedTag && !tags.some(t => t.toLowerCase() === formattedTag.toLowerCase())) {
            setTags(prev => [...prev, formattedTag].sort());
        }
    }, [tags]);

    const deleteTag = useCallback((tagToDelete: string) => {
        setTags(prev => prev.filter(t => t.toLowerCase() !== tagToDelete.toLowerCase()));
    }, []);

    const renameTag = useCallback((oldName: string, newName: string) => {
        const trimmedNewName = newName.trim();
        if (!trimmedNewName || tags.some(t => t.toLowerCase() === trimmedNewName.toLowerCase() && t.toLowerCase() !== oldName.toLowerCase())) {
            // New name is empty or already exists (and it's not just a capitalization change), so don't rename.
            return;
        }
        setTags(prev => prev.map(t => t.toLowerCase() === oldName.toLowerCase() ? trimmedNewName : t).sort());
    }, [tags]);

    return { tags, addTag, deleteTag, renameTag };
};
