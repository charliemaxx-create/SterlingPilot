import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Category, Account, AppSettings, ExpenseBucket } from '../types';
import { getCurrencySymbol } from '../utils/currency';

interface AddTransactionModalProps {
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onAddTransaction: (transactions: Omit<Transaction, 'id' | 'date'>[]) => void;
  settings: AppSettings;
  allTags: string[];
  addTag: (tag: string) => void;
}

interface Split {
    description: string;
    amount: string;
    categoryId: string;
    expenseBucket?: ExpenseBucket;
}

const generateCategoryOptions = (categories: Category[], type: TransactionType) => {
    return categories
        .filter(c => c.type === type)
        .map(c => <option key={c.id} value={c.id}>{c.name}</option>);
};


const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ accounts, categories, onClose, onAddTransaction, settings, allTags, addTag }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const selectedAccountCurrencySymbol = getCurrencySymbol(accountMap.get(accountId)?.currency || settings.baseCurrency);

  const firstCategoryId = useMemo(() => {
      const firstCat = categories.find(c => c.type === type);
      return firstCat?.id || '';
  }, [categories, type]);

  const [splits, setSplits] = useState<Split[]>([{
    description: '',
    amount: '',
    categoryId: firstCategoryId,
    expenseBucket: categoryMap.get(firstCategoryId)?.expenseBucket,
  }]);

  useEffect(() => {
    const defaultCategoryId = categories.find(c => c.type === type)?.id || '';
    setSplits(s => s.map(split => ({
      ...split,
      categoryId: defaultCategoryId,
      expenseBucket: categoryMap.get(defaultCategoryId)?.expenseBucket,
    })));
  }, [type, categories, categoryMap]);

  const allocatedAmount = useMemo(() => splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0), [splits]);
  const remainingAmount = useMemo(() => (parseFloat(totalAmount) || 0) - allocatedAmount, [totalAmount, allocatedAmount]);

  const handleSplitChange = (index: number, field: keyof Split, value: string | ExpenseBucket) => {
    const newSplits = [...splits];
    (newSplits[index] as any)[field] = value;

    if (field === 'categoryId' && type === TransactionType.EXPENSE) {
      const category = categoryMap.get(value as string);
      newSplits[index].expenseBucket = category?.expenseBucket;
    }

    setSplits(newSplits);
  };
  
  const handleAddSplit = () => {
    const remainingValue = remainingAmount > 0 ? remainingAmount.toFixed(2) : '';
    setSplits(prev => [...prev, {
        description: prev[0]?.description || '',
        amount: remainingValue,
        categoryId: firstCategoryId,
        expenseBucket: categoryMap.get(firstCategoryId)?.expenseBucket,
    }]);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };
  
    const handleAddTag = (tagToAdd: string) => {
        const formattedTag = tagToAdd.trim();
        if (formattedTag && !tags.some(t => t.toLowerCase() === formattedTag.toLowerCase())) {
            setTags([...tags, formattedTag]);
            addTag(formattedTag); // Add to global list
        }
        setTagInput('');
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(remainingAmount) > 0.001 || !accountId || (parseFloat(totalAmount) || 0) <= 0) {
        alert("Please ensure the total amount is fully allocated and all fields are filled.");
        return;
    }
    
    const splitGroupId = splits.length > 1 ? new Date().getTime().toString() : undefined;

    const transactions: Omit<Transaction, 'id' | 'date'>[] = splits
        .filter(s => parseFloat(s.amount) > 0)
        .map(s => {
        const selectedCategory = categoryMap.get(s.categoryId);
        return {
            accountId,
            description: s.description,
            amount: parseFloat(s.amount),
            type,
            categoryId: s.categoryId,
            expenseBucket: type === TransactionType.EXPENSE ? (s.expenseBucket || selectedCategory?.expenseBucket) : undefined,
            splitGroupId,
            tags: tags.length > 0 ? tags : undefined,
        }
    });

    if (transactions.length > 0) {
        onAddTransaction(transactions);
    } else {
        onClose();
    }
  };

  const categoryOptions = useMemo(() => generateCategoryOptions(categories, type), [categories, type]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Add New Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`p-3 rounded-lg text-center font-semibold ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Expense</button>
                <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`p-3 rounded-lg text-center font-semibold ${type === TransactionType.INCOME ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Income</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                    <select id="account" value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><span className="text-gray-500 sm:text-sm">{selectedAccountCurrencySymbol}</span></div>
                        <input type="number" id="totalAmount" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full pl-7 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" required min="0.01" step="0.01" placeholder="e.g. 125.50" />
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (optional)</label>
                <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    {tags.map(tag => (
                        <span key={tag} className="flex items-center bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 text-sm font-medium px-2 py-1 rounded-full">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 -mr-1 text-primary-600 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        id="tags"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        className="flex-grow p-1 bg-transparent focus:outline-none"
                        placeholder="Add a tag..."
                    />
                </div>
            </div>
            
            <hr className="dark:border-gray-600"/>
            
            <div className="space-y-4">
                {splits.map((split, index) => (
                    <div key={index} className="p-4 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Split {index + 1}</h4>
                            {splits.length > 1 && <button type="button" onClick={() => handleRemoveSplit(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Description</label>
                                <input type="text" value={split.description} onChange={e => handleSplitChange(index, 'description', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required placeholder="e.g. Groceries"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><span className="text-gray-500 sm:text-sm">{selectedAccountCurrencySymbol}</span></div>
                                    <input type="number" value={split.amount} onChange={e => handleSplitChange(index, 'amount', e.target.value)} className="w-full pl-7 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" required min="0.01" step="0.01"/>
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium">Category</label>
                             <select value={split.categoryId} onChange={e => handleSplitChange(index, 'categoryId', e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                 {categoryOptions}
                             </select>
                         </div>
                         {type === TransactionType.EXPENSE && (
                             <div>
                                <label className="block text-sm font-medium">Expense Bucket</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(ExpenseBucket).map(bucket => (
                                        <button type="button" key={bucket} onClick={() => handleSplitChange(index, 'expenseBucket', bucket)} className={`p-2 rounded-lg text-xs font-semibold ${split.expenseBucket === bucket ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                            {bucket}
                                        </button>
                                    ))}
                                </div>
                             </div>
                         )}
                    </div>
                ))}
            </div>

            <button type="button" onClick={handleAddSplit} className="w-full py-2 border-2 border-dashed rounded-lg text-sm font-semibold text-primary-600 border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/50">
                + Add Split
            </button>
            
            <div className={`p-3 rounded-lg text-center font-semibold ${Math.abs(remainingAmount) < 0.001 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                {remainingAmount.toFixed(2)} Remaining
            </div>
            
            <div className="flex justify-end space-x-4 pt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed" disabled={Math.abs(remainingAmount) > 0.001 || !totalAmount}>Add</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;