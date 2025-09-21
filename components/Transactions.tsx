import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Account, Category, AppSettings, DefaultTransactionView } from '../types';
import { formatCurrency } from '../utils/currency';

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onDeleteTransaction: (transaction: Transaction) => void;
  onAddTransaction: () => void;
  settings: AppSettings;
  allTags: string[];
}

const TransactionRow: React.FC<{ transaction: Transaction; account: Account | undefined; categoryName: string; onDelete: (transaction: Transaction) => void }> = ({ transaction, account, categoryName, onDelete }) => {
    const isIncome = transaction.type === TransactionType.INCOME;
    const amountColor = isIncome ? 'text-green-500' : 'text-red-500';
    const amountPrefix = isIncome ? '+' : '-';
    const currencyCode = account ? account.currency : 'USD';

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 hidden sm:table-cell">{new Date(transaction.date).toLocaleDateString()}</td>
            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">
                <div className="font-medium">{transaction.description}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:hidden">
                    {new Date(transaction.date).toLocaleDateString()}
                </div>
                <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{account?.name || 'Unknown'}</span> &bull; <span>{categoryName}</span>
                </div>
                 {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {transaction.tags.map(tag => (
                            <span key={tag} className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                    </div>
                )}
            </td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{account?.name || 'Unknown'}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{categoryName}</td>
            <td className={`py-3 px-4 text-sm font-semibold text-right ${amountColor}`}>
                {amountPrefix} {formatCurrency(transaction.amount, currencyCode)}
            </td>
            <td className="py-3 px-4 text-right">
                <button
                    onClick={() => onDelete(transaction)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Delete transaction"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    );
};


const Transactions: React.FC<TransactionsProps> = ({ transactions, accounts, categories, onDeleteTransaction, onAddTransaction, settings, allTags }) => {
    const getInitialDateRange = (defaultView: DefaultTransactionView) => {
        const today = new Date();
        switch (defaultView) {
            case 'last_30_days': {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - 30);
                return { 
                    startDate: startDate.toISOString().split('T')[0], 
                    endDate: endDate.toISOString().split('T')[0] 
                };
            }
            case 'this_year': {
                const firstDay = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                const lastDay = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                return { startDate: firstDay, endDate: lastDay };
            }
            case 'all': {
                return { startDate: '', endDate: '' };
            }
            case 'this_month':
            default: {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                return { startDate: firstDay, endDate: lastDay };
            }
        }
    };

    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState(getInitialDateRange(settings.defaultTransactionView).startDate);
    const [endDate, setEndDate] = useState(getInitialDateRange(settings.defaultTransactionView).endDate);

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const filteredTransactions = useMemo(() => {
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const dateMatch = (!start || transactionDate >= start) && (!end || transactionDate <= end);
            if (!dateMatch) return false;

            const typeMatch = typeFilter === 'all' || t.type === typeFilter;
            const accountMatch = accountFilter === 'all' || t.accountId === accountFilter;
            const tagMatch = tagFilter.length === 0 || (t.tags && t.tags.some(tag => tagFilter.includes(tag)));
            
            const categoryName = categoryMap.get(t.categoryId)?.toLowerCase() || '';
            const searchInput = searchQuery.toLowerCase();
            const searchMatch = searchQuery === '' || 
                t.description.toLowerCase().includes(searchInput) ||
                categoryName.includes(searchInput) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchInput)));
            
            return typeMatch && accountMatch && searchMatch && tagMatch;
        });
    }, [transactions, typeFilter, accountFilter, tagFilter, searchQuery, startDate, endDate, categoryMap]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">All Transactions</h1>
            <button
                onClick={onAddTransaction}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-colors order-first sm:order-last"
            >
                + Add Transaction
            </button>
        </div>

        {/* Filters Section */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                    <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white dark:bg-gray-700 rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                    <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white dark:bg-gray-700 rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500" />
                </div>
                 <div className="lg:col-span-1">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input 
                            id="search"
                            type="text"
                            placeholder="Description, category, tag..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 rounded-md pl-10 pr-4 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                 </div>
                 <div>
                    <label htmlFor="accountFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
                    <select 
                        id="accountFilter"
                        value={accountFilter} 
                        onChange={e => setAccountFilter(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                    </select>
                 </div>
                 <div>
                    <label htmlFor="tagFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Ctrl+Click for multi)</label>
                    <select
                        id="tagFilter"
                        multiple
                        value={tagFilter}
                        onChange={e => setTagFilter(Array.from(e.target.selectedOptions, option => option.value))}
                        className="w-full bg-white dark:bg-gray-700 rounded-md px-3 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 h-24"
                    >
                        {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                    </select>
                </div>
                 <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                     <div className="flex space-x-2">
                        <button onClick={() => setTypeFilter('all')} className={`flex-1 py-2 text-sm font-medium rounded-md ${typeFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'}`}>All</button>
                        <button onClick={() => setTypeFilter('income')} className={`flex-1 py-2 text-sm font-medium rounded-md ${typeFilter === 'income' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'}`}>Income</button>
                        <button onClick={() => setTypeFilter('expense')} className={`flex-1 py-2 text-sm font-medium rounded-md ${typeFilter === 'expense' ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'}`}>Expenses</button>
                    </div>
                 </div>
            </div>
        </div>


      <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Account</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Amount</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right"></th>
                </tr>
            </thead>
            <tbody>
                {filteredTransactions.map(transaction => (
                    <TransactionRow 
                        key={transaction.id} 
                        transaction={transaction} 
                        account={accountMap.get(transaction.accountId)}
                        categoryName={categoryMap.get(transaction.categoryId) || 'Uncategorized'}
                        onDelete={onDeleteTransaction} 
                    />
                ))}
                 {filteredTransactions.length === 0 && (
                    <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">No transactions found for the selected filters.</td>
                    </tr>
                 )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;