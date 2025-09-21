import React, { useState, useEffect, useMemo } from 'react';
import { Category, TransactionType, ExpenseBucket, Rule503020 } from '../types';

interface AddCategoryModalProps {
    onClose: () => void;
    onSave: (data: Omit<Category, 'id'>) => void;
    categoryToEdit?: Category;
    categories: Category[];
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onSave, categoryToEdit, categories }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [parentId, setParentId] = useState<string>('');
    const [expenseBucket, setExpenseBucket] = useState<ExpenseBucket | undefined>();
    const [rule503020, setRule503020] = useState<Rule503020>('wants');
    
    useEffect(() => {
        if (categoryToEdit) {
            setName(categoryToEdit.name);
            setType(categoryToEdit.type);
            setParentId(categoryToEdit.parentId || '');
            setExpenseBucket(categoryToEdit.expenseBucket);
            setRule503020(categoryToEdit.rule503020 || 'wants');
        }
    }, [categoryToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter a category name.");
            return;
        }
        onSave({ 
            name, 
            type, 
            parentId: parentId || undefined,
            expenseBucket: type === TransactionType.EXPENSE ? expenseBucket : undefined,
            rule503020: type === TransactionType.EXPENSE ? rule503020 : undefined
        });
    };

    const parentCategoryOptions = useMemo(() => {
        return categories.filter(c => c.type === type && !c.parentId && c.id !== categoryToEdit?.id);
    }, [type, categories, categoryToEdit]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {categoryToEdit ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                         <div className="grid grid-cols-2 gap-4">
                            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`p-3 rounded-lg text-center font-semibold ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Expense</button>
                            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`p-3 rounded-lg text-center font-semibold ${type === TransactionType.INCOME ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Income</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
                        <input type="text" id="categoryName" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required />
                    </div>
                    <div>
                        <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Category (Optional)</label>
                        <select
                            id="parentCategory"
                            value={parentId}
                            onChange={e => setParentId(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">None (Top-level category)</option>
                            {parentCategoryOptions.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                     {type === TransactionType.EXPENSE && (
                        <>
                            <div>
                                <label htmlFor="expenseBucket" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Expense Bucket</label>
                                <select
                                    id="expenseBucket"
                                    value={expenseBucket || ''}
                                    onChange={e => setExpenseBucket(e.target.value as ExpenseBucket)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="" disabled>Select a bucket</option>
                                    {Object.values(ExpenseBucket).map(bucket => (
                                        <option key={bucket} value={bucket}>{bucket}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="rule503020" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">50/30/20 Rule Classification</label>
                                <select
                                    id="rule503020"
                                    value={rule503020}
                                    onChange={e => setRule503020(e.target.value as Rule503020)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="needs">Needs</option>
                                    <option value="wants">Wants</option>
                                    <option value="savings">Savings</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCategoryModal;