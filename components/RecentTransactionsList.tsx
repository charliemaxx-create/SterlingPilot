import React, { useMemo } from 'react';
import { Transaction, TransactionType, Account, Category } from '../types';
import { formatCurrency } from '../utils/currency';

interface RecentTransactionsListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({ transactions, accounts, categories }) => {
    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    if (transactions.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No recent transactions.</p>
    }

  return (
    <ul className="space-y-2">
      {transactions.map(t => {
        const isIncome = t.type === TransactionType.INCOME;
        const account = accountMap.get(t.accountId);
        const currencyCode = account ? account.currency : 'USD';
        const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';

        return (
          <li key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    {isIncome ? 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                    }
                </div>
                <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{t.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{categoryName} &bull; {account?.name}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-base ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount, currencyCode)}
                </p>
                <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default RecentTransactionsList;
