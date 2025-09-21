import React, { useState, useMemo } from 'react';
import { Category, Transaction, Budget, TransactionType } from '../types';
import AddCategoryModal from './AddCategoryModal';

interface CategoryManagerProps {
    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    transactions: Transaction[];
    budgets: Budget[];
}

const CategoryRow: React.FC<{
    category: Category;
    level: number;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ category, level, onEdit, onDelete }) => (
    <div 
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"
        style={{ marginLeft: `${level * 20}px` }}
    >
        <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{category.name}</span>
            {category.rule503020 && (
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full capitalize">{category.rule503020}</span>
            )}
        </div>
        <div className="flex space-x-3">
            <button onClick={onEdit} className="text-gray-400 hover:text-primary-500" aria-label={`Edit category ${category.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-500" aria-label={`Delete category ${category.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </div>
);

const CategoryList: React.FC<{
    categories: Category[];
    parentId?: string;
    level: number;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
}> = ({ categories, parentId, level, onEdit, onDelete }) => {
    const items = categories.filter(c => c.parentId === parentId);
    return (
        <>
            {items.map(cat => (
                <React.Fragment key={cat.id}>
                    <CategoryRow category={cat} level={level} onEdit={() => onEdit(cat)} onDelete={() => onDelete(cat.id)} />
                    <CategoryList categories={categories} parentId={cat.id} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
                </React.Fragment>
            ))}
        </>
    );
};


const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, addCategory, updateCategory, deleteCategory, transactions, budgets }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

    const openAddModal = () => {
        setEditingCategory(undefined);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };
    
    const handleSave = (data: Omit<Category, 'id'>) => {
        if(editingCategory) {
            updateCategory({ ...editingCategory, ...data });
        } else {
            addCategory(data);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        const isUsedInTransaction = transactions.some(t => t.categoryId === id);
        if (isUsedInTransaction) {
            alert("Cannot delete this category because it is used in one or more transactions.");
            return;
        }
        const isUsedInBudget = budgets.some(b => b.categoryId === id);
        if (isUsedInBudget) {
            alert("Cannot delete this category because it is used in a budget.");
            return;
        }
        const hasChildren = categories.some(c => c.parentId === id);
        if (hasChildren) {
            alert("Cannot delete this category because it has subcategories. Please delete or re-assign the subcategories first.");
            return;
        }

        if (window.confirm("Are you sure you want to delete this category?")) {
            deleteCategory(id);
        }
    };
    
    const { incomeCategories, expenseCategories } = useMemo(() => {
        return {
            incomeCategories: categories.filter(c => c.type === TransactionType.INCOME),
            expenseCategories: categories.filter(c => c.type === TransactionType.EXPENSE),
        };
    }, [categories]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Manage Categories</h2>
                 <button
                    onClick={openAddModal}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700"
                >
                    + Add New Category
                </button>
            </div>
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Organize your finances by creating custom categories and subcategories for your income and expenses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-600">Income Categories</h3>
                    <div className="space-y-2">
                         <CategoryList
                            categories={incomeCategories}
                            level={0}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                         {incomeCategories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No income categories defined.</p>}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-600">Expense Categories</h3>
                    <div className="space-y-2">
                        <CategoryList
                            categories={expenseCategories}
                            level={0}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                         {expenseCategories.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No expense categories defined.</p>}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AddCategoryModal 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    categoryToEdit={editingCategory}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default CategoryManager;