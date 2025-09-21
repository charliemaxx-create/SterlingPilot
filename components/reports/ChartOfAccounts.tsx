import React, { useMemo } from 'react';
import { Account, AppSettings, AccountType, Transaction, Category, TransactionType } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';

interface ChartOfAccountsProps {
    accounts: Account[];
    filteredTransactions: Transaction[];
    currentAccountBalances: Map<string, number>;
    categories: Category[];
    settings: AppSettings;
}

const ASSET_TYPES = [AccountType.BANK, AccountType.CASH, AccountType.OTHER];
const LIABILITY_TYPES = [AccountType.CREDIT_CARD, AccountType.LOAN, AccountType.LIABILITY];

const StatCard: React.FC<{ title: string; amount: number; currency: string; color: string }> = ({ title, amount, currency, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
        <h3 className={`text-lg ${color} font-semibold`}>{title}</h3>
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
    </div>
);

const ActivityRow: React.FC<{ label: string; amount: number; currency: string }> = ({ label, amount, currency }) => (
    <div className="flex justify-between py-2 border-b dark:border-gray-700 last:border-b-0">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-mono font-semibold">{formatCurrency(amount, currency)}</span>
    </div>
);

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ accounts, filteredTransactions, currentAccountBalances, categories, settings }) => {

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const financialPosition = useMemo(() => {
        let totalAssets = 0;
        let totalLiabilities = 0;

        accounts.forEach(acc => {
            const balance = currentAccountBalances.get(acc.id) || 0;
            const balanceInBase = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
            
            if (ASSET_TYPES.includes(acc.type)) {
                totalAssets += balanceInBase;
            } else if (LIABILITY_TYPES.includes(acc.type)) {
                totalLiabilities += Math.abs(balanceInBase);
            }
        });

        return {
            totalAssets,
            totalLiabilities,
            netWorth: totalAssets - totalLiabilities,
        };
    }, [accounts, currentAccountBalances, settings]);

    const periodActivity = useMemo(() => {
        const incomeByCategory: Record<string, number> = {};
        const expenseByCategory: Record<string, number> = {};
        let totalIncome = 0;
        let totalExpense = 0;

        filteredTransactions.forEach(t => {
            const amountInBase = convertCurrency(t.amount, accounts.find(a => a.id === t.accountId)?.currency || settings.baseCurrency, settings.baseCurrency, settings);
            const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';

            if (t.type === TransactionType.INCOME) {
                incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + amountInBase;
                totalIncome += amountInBase;
            } else {
                expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + amountInBase;
                totalExpense += amountInBase;
            }
        });

        return {
            incomeByCategory: Object.entries(incomeByCategory).sort(([, a], [, b]) => b - a),
            expenseByCategory: Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a),
            totalIncome,
            totalExpense,
        };
    }, [filteredTransactions, accounts, categories, settings]);

    const groupedAccounts = useMemo(() => {
        const groups: Record<string, Account[]> = {};
        accounts.forEach(account => {
            if (!groups[account.type]) {
                groups[account.type] = [];
            }
            groups[account.type].push(account);
        });

        const orderedGroups: { type: AccountType; accounts: Account[] }[] = [];
        for (const type of Object.values(AccountType)) {
            if (groups[type]) {
                orderedGroups.push({ type, accounts: groups[type] });
            }
        }
        return orderedGroups;
    }, [accounts]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Financial Summary</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-6">
                    Current financial position and activity for the selected period, displayed in your base currency ({settings.baseCurrency}).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Assets" amount={financialPosition.totalAssets} currency={settings.baseCurrency} color="text-green-500" />
                    <StatCard title="Total Liabilities" amount={financialPosition.totalLiabilities} currency={settings.baseCurrency} color="text-red-500" />
                    <StatCard title="Net Worth" amount={financialPosition.netWorth} currency={settings.baseCurrency} color={financialPosition.netWorth >= 0 ? 'text-blue-500' : 'text-red-500'} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-green-600 dark:text-green-400">Income</h3>
                    <div className="space-y-1">
                        {periodActivity.incomeByCategory.map(([name, amount]) => (
                            <ActivityRow key={name} label={name} amount={amount} currency={settings.baseCurrency} />
                        ))}
                        {periodActivity.incomeByCategory.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No income in this period.</p>}
                    </div>
                    <div className="mt-2 pt-2 border-t-2 dark:border-gray-600 flex justify-between font-bold text-lg">
                        <span>Total Income</span>
                        <span>{formatCurrency(periodActivity.totalIncome, settings.baseCurrency)}</span>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold mb-2 text-red-600 dark:text-red-400">Expenses</h3>
                     <div className="space-y-1">
                        {periodActivity.expenseByCategory.map(([name, amount]) => (
                            <ActivityRow key={name} label={name} amount={amount} currency={settings.baseCurrency} />
                        ))}
                         {periodActivity.expenseByCategory.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No expenses in this period.</p>}
                    </div>
                    <div className="mt-2 pt-2 border-t-2 dark:border-gray-600 flex justify-between font-bold text-lg">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(periodActivity.totalExpense, settings.baseCurrency)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">List of Accounts</h2>
                <div className="space-y-8">
                    {groupedAccounts.map(({ type, accounts: accs }) => (
                        <div key={type}>
                            <h3 className="text-lg font-semibold mb-3 border-b pb-2 dark:border-gray-700">{type}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Account Name</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-center">Currency</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Initial Balance</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">APR (%)</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Min. Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accs.map(account => (
                                            <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                <td className="py-3 px-3 font-medium">{account.name}</td>
                                                <td className="py-3 px-3 text-center">{account.currency}</td>
                                                <td className="py-3 px-3 text-right font-mono">{formatCurrency(account.initialBalance, account.currency)}</td>
                                                <td className="py-3 px-3 text-right">{account.interestRate ? account.interestRate.toFixed(2) : 'N/A'}</td>
                                                <td className="py-3 px-3 text-right">{account.minimumPayment ? formatCurrency(account.minimumPayment, account.currency) : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChartOfAccounts;