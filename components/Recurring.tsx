import React, { useState, useMemo } from 'react';
import { RecurringTransaction, Account, AppSettings, Category, Frequency, TransactionType } from '../types';
import { formatCurrency } from '../utils/currency';
import AddRecurringTransactionModal from './AddRecurringTransactionModal';

interface RecurringProps {
    recurringTransactions: RecurringTransaction[];
    accounts: Account[];
    categories: Category[];
    addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => void;
    updateRecurringTransaction: (transaction: RecurringTransaction) => void;
    deleteRecurringTransaction: (id: string) => void;
    settings: AppSettings;
    allTags: string[];
    addTag: (tag: string) => void;
}

const RecurringRow: React.FC<{ 
    transaction: RecurringTransaction; 
    account: Account | undefined; 
    categoryName: string; 
    nextOccurrence: string;
    onEdit: () => void; 
    onDelete: () => void; 
}> = ({ transaction, account, categoryName, nextOccurrence, onEdit, onDelete }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const amountColor = isIncome ? 'text-green-500' : 'text-red-500';
    const currencyCode = account ? account.currency : 'USD';

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700">
            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                <div className="font-medium">{transaction.description}</div>
                <div className="lg:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {account?.name || 'Unknown'} &bull; {categoryName}
                </div>
                 <div className="lg:hidden text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    {transaction.frequency} from {new Date(transaction.startDate).toLocaleDateString()}
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{account?.name || 'Unknown'}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{categoryName}</td>
            <td className={`py-3 px-4 text-sm font-semibold text-right ${amountColor}`}>{formatCurrency(transaction.amount, currencyCode)}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 capitalize hidden lg:table-cell">{transaction.frequency}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{new Date(transaction.startDate).toLocaleDateString()}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-right sm:text-left">{nextOccurrence}</td>
            <td className="py-3 px-4 text-right">
                <div className="flex justify-end space-x-3">
                    <button onClick={onEdit} className="text-gray-400 hover:text-primary-500" aria-label="Edit recurring transaction">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={onDelete} className="text-gray-400 hover:text-red-500" aria-label="Delete recurring transaction">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
};

const Recurring: React.FC<RecurringProps> = ({ recurringTransactions, accounts, categories, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, settings, allTags, addTag }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | undefined>(undefined);

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const handleSave = (data: Omit<RecurringTransaction, 'id'>[]) => {
        if (editingTransaction) {
            // When editing, we only update the single transaction. Split editing is not supported in this iteration.
            updateRecurringTransaction({ ...editingTransaction, ...data[0] });
        } else {
            data.forEach(t => addRecurringTransaction(t));
        }
        setIsModalOpen(false);
        setEditingTransaction(undefined);
    };
    
    const handleDelete = (transaction: RecurringTransaction) => {
        if (window.confirm(`Are you sure you want to delete the recurring transaction "${transaction.description}"? This action cannot be undone.`)) {
            deleteRecurringTransaction(transaction.id);
        }
    };

    const openEditModal = (transaction: RecurringTransaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingTransaction(undefined);
        setIsModalOpen(true);
    };
    
    const calculateNextOccurrence = (rt: RecurringTransaction): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

        let nextDate = new Date(rt.startDate);
        // Adjust for timezone offset from UTC date string to avoid date shifts
        nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
        nextDate.setHours(0, 0, 0, 0); // Normalize start date to midnight

        if (nextDate >= today) {
            return nextDate.toLocaleDateString();
        }
        
        // Loop forward from start date until we pass today
        while (nextDate < today) {
            switch (rt.frequency) {
                case Frequency.DAILY:
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case Frequency.WEEKLY:
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case Frequency.MONTHLY:
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
            }
        }
        return nextDate.toLocaleDateString();
    };


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Recurring Transactions</h1>
                <button
                    onClick={openAddModal}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700"
                >
                    + Add New Recurring
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Description</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Account</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Category</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Amount</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Frequency</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">Start Date</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right sm:text-left">Next</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recurringTransactions.map(t => (
                                <RecurringRow 
                                    key={t.id} 
                                    transaction={t} 
                                    account={accountMap.get(t.accountId)}
                                    categoryName={categoryMap.get(t.categoryId) || 'Unknown'}
                                    nextOccurrence={calculateNextOccurrence(t)}
                                    onEdit={() => openEditModal(t)} 
                                    onDelete={() => handleDelete(t)} 
                                />
                            ))}
                            {recurringTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No recurring transactions set up yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>

            {isModalOpen && (
                <AddRecurringTransactionModal
                    accounts={accounts}
                    categories={categories}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    transactionToEdit={editingTransaction}
                    settings={settings}
                    allTags={allTags}
                    addTag={addTag}
                />
            )}
        </div>
    );
};

export default Recurring;