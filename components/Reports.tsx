import React, { useState, useMemo } from 'react';
import { Transaction, Account, TransactionType, Category, AccountType, AppSettings, Budget } from '../types';
import OverviewReport from './reports/OverviewReport';
import CashFlowStatement from './reports/CashFlowStatement';
import BalanceSheet from './reports/BalanceSheet';
import AssetsReport from './reports/AssetsReport';
import LiabilitiesReport from './reports/LiabilitiesReport';
import ChartOfAccounts from './reports/ChartOfAccounts';
import NetWorthTrend from './reports/NetWorthTrend';
import IncomeVsExpenseTrend from './reports/IncomeVsExpenseTrend';
import BudgetReport from './reports/BudgetReport';
import { convertCurrency, formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

interface ReportsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  settings: AppSettings;
  budgets: Budget[];
}

type ReportType = 'overview' | 'periodsummary' | 'cashflow' | 'balancesheet' | 'assets' | 'liabilities' | 'chartofaccounts' | 'networthtrend' | 'incomevsexpensetrend' | 'budget';

const TabButton: React.FC<{ label: string; reportType: ReportType; activeReport: ReportType; onClick: (type: ReportType) => void; }> = ({ label, reportType, activeReport, onClick }) => {
    const isActive = activeReport === reportType;
    return (
        <button
            onClick={() => onClick(reportType)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
            {label}
        </button>
    );
};

const ASSET_TYPES = [AccountType.BANK, AccountType.CASH, AccountType.OTHER];
const LIABILITY_TYPES = [AccountType.CREDIT_CARD, AccountType.LOAN, AccountType.LIABILITY];

const Reports: React.FC<ReportsProps> = ({ transactions, accounts, categories, settings, budgets }) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [activeReport, setActiveReport] = useState<ReportType>('overview');
    
    // State for filters
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);
    const [asOfDate, setAsOfDate] = useState(today.toISOString().split('T')[0]);
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [accountFilter, setAccountFilter] = useState<string>('all');

    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

    // Memoized calculation for transactions within the date range
    const filteredTransactions = useMemo(() => {
        const reportsUsingFilters = ['overview', 'cashflow', 'periodsummary', 'chartofaccounts', 'incomevsexpensetrend', 'networthtrend', 'budget'];
        const useTransactionalFilters = reportsUsingFilters.includes(activeReport);

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            const dateMatch = transactionDate >= start && transactionDate <= end;
            if (!dateMatch) return false;

            const typeMatch = !useTransactionalFilters || typeFilter === 'all' || t.type === typeFilter;
            const accountMatch = !useTransactionalFilters || accountFilter === 'all' || t.accountId === accountFilter;

            return typeMatch && accountMatch;
        });
    }, [transactions, startDate, endDate, typeFilter, accountFilter, activeReport]);
    
    const transactionsInBaseCurrency = useMemo(() => {
        return filteredTransactions.map(t => {
            const account = accountMap.get(t.accountId);
            if (!account) return { ...t, amount: 0 };
            const amountInBase = convertCurrency(t.amount, account.currency, settings.baseCurrency, settings);
            return { ...t, amount: amountInBase };
        });
    }, [filteredTransactions, accountMap, settings]);

    // Memoized calculation for current account balances
    const currentAccountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, acc.initialBalance || 0));
        transactions.forEach(t => {
            const currentBalance = balances.get(t.accountId) || 0;
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            balances.set(t.accountId, currentBalance + amount);
        });
        return balances;
    }, [accounts, transactions]);

    // Memoized calculation for account balances as of a specific date
    const balancesAsOfDate = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, acc.initialBalance || 0));

        const end = new Date(asOfDate);
        end.setHours(23, 59, 59, 999);

        transactions
            .filter(t => new Date(t.date) <= end)
            .forEach(t => {
                const currentBalance = balances.get(t.accountId) || 0;
                const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
                balances.set(t.accountId, currentBalance + amount);
            });
        return balances;
    }, [accounts, transactions, asOfDate]);

    const netWorthTrendData = useMemo(() => {
        if (activeReport !== 'networthtrend' || !startDate || !endDate) return [];
    
        const start = new Date(startDate);
        start.setDate(start.getDate() - 1);
        start.setHours(23, 59, 59, 999);
    
        const periodStartBalances = new Map<string, number>();
        accounts.forEach(acc => periodStartBalances.set(acc.id, acc.initialBalance || 0));
    
        transactions
            .filter(t => new Date(t.date) <= start)
            .forEach(t => {
                const currentBalance = periodStartBalances.get(t.accountId) || 0;
                const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
                periodStartBalances.set(t.accountId, currentBalance + amount);
            });
    
        const trendData: { date: string; assets: number; liabilities: number; netWorth: number }[] = [];
        const loopStart = new Date(startDate);
        const loopEnd = new Date(endDate);
    
        const transactionsByDate = new Map<string, Transaction[]>();
        transactions.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            if (!transactionsByDate.has(dateStr)) {
                transactionsByDate.set(dateStr, []);
            }
            transactionsByDate.get(dateStr)!.push(t);
        });
    
        const dailyBalances = new Map(periodStartBalances);
    
        for (let d = loopStart; d <= loopEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            
            const dayTransactions = transactionsByDate.get(dateStr) || [];
            dayTransactions.forEach(t => {
                const currentBalance = dailyBalances.get(t.accountId) || 0;
                const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
                dailyBalances.set(t.accountId, currentBalance + amount);
            });
    
            let currentAssets = 0;
            let currentLiabilities = 0;
            
            accounts.forEach(acc => {
                const balance = dailyBalances.get(acc.id) || 0;
                const balanceInBase = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                
                if (ASSET_TYPES.includes(acc.type)) {
                    currentAssets += balanceInBase;
                } else if (LIABILITY_TYPES.includes(acc.type)) {
                    currentLiabilities += Math.abs(balanceInBase);
                }
            });
    
            trendData.push({
                date: dateStr,
                assets: currentAssets,
                liabilities: currentLiabilities,
                netWorth: currentAssets - currentLiabilities,
            });
        }
    
        return trendData;
    }, [accounts, transactions, settings, startDate, endDate, activeReport]);

    const incomeVsExpenseTrendData = useMemo(() => {
        if (activeReport !== 'incomevsexpensetrend') return [];
    
        const monthlyData = new Map<string, { income: number; expense: number; budget: number }>();
    
        // Helper to get YYYY-MM from a date
        const getYearMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
        // Populate months from date range to ensure all months are present, even with no transactions
        const start = new Date(startDate);
        const end = new Date(endDate);
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
            monthlyData.set(getYearMonth(current), { income: 0, expense: 0, budget: 0 });
            current.setMonth(current.getMonth() + 1);
        }
        
        // Process transactions
        transactionsInBaseCurrency.forEach(t => {
            const yearMonth = getYearMonth(new Date(t.date));
            const month = monthlyData.get(yearMonth);
            if (month) {
                if (t.type === TransactionType.INCOME) {
                    month.income += t.amount;
                } else {
                    month.expense += t.amount;
                }
            }
        });
    
        // Calculate total monthly budget limit in base currency
        const totalMonthlyBudgetLimitInBase = budgets.reduce((total, budget) => {
            const limitInBase = convertCurrency(budget.limit, budget.currency, settings.baseCurrency, settings);
            return total + limitInBase;
        }, 0);
    
        // Populate budget for each month in the map
        for (const [, data] of monthlyData.entries()) {
            data.budget = totalMonthlyBudgetLimitInBase;
        }
    
        return Array.from(monthlyData.entries())
            .map(([date, values]) => ({ date, ...values }))
            .sort((a, b) => a.date.localeCompare(b.date));

    }, [transactionsInBaseCurrency, budgets, settings, activeReport, startDate, endDate]);

    // Memoized data for visualizations
    const cashFlowChartData = useMemo(() => {
        const { totalIncome, totalExpense } = transactionsInBaseCurrency.reduce((acc, t) => {
            if (t.type === TransactionType.INCOME) acc.totalIncome += t.amount;
            else acc.totalExpense += t.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        return [
            { name: 'Income', value: totalIncome },
            { name: 'Expense', value: totalExpense },
        ];
    }, [transactionsInBaseCurrency]);

    const periodSummaryChartData = useMemo(() => {
        const { totalIncome, totalExpense } = transactionsInBaseCurrency.reduce((acc, t) => {
            if (t.type === TransactionType.INCOME) acc.totalIncome += t.amount;
            else acc.totalExpense += t.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });

        const durationInDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1;
        
        const totalBudgetedExpense = budgets.reduce((total, budget) => {
            const limitInBase = convertCurrency(budget.limit, budget.currency, settings.baseCurrency, settings);
            // Use 30.44 as the average number of days in a month for scaling
            const dailyBudget = limitInBase / 30.44; 
            return total + (dailyBudget * durationInDays);
        }, 0);

        return [
            { name: 'Income', 'Actual': totalIncome },
            { name: 'Expense', 'Actual': totalExpense, 'Budget': totalBudgetedExpense },
        ];
    }, [transactionsInBaseCurrency, budgets, settings, startDate, endDate]);

    const assetsChartData = useMemo(() => {
        return accounts
            .filter(acc => ASSET_TYPES.includes(acc.type))
            .map(acc => {
                const balance = currentAccountBalances.get(acc.id) || 0;
                const value = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                return { name: acc.name, value };
            })
            .filter(item => item.value > 0);
    }, [accounts, currentAccountBalances, settings]);

    const liabilitiesChartData = useMemo(() => {
        return accounts
            .filter(acc => LIABILITY_TYPES.includes(acc.type))
            .map(acc => {
                const balance = Math.abs(currentAccountBalances.get(acc.id) || 0);
                const value = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                return { name: acc.name, value };
            })
            .filter(item => item.value > 0);
    }, [accounts, currentAccountBalances, settings]);

    const balanceSheetChartData = useMemo(() => {
        const assets = accounts
            .filter(acc => ASSET_TYPES.includes(acc.type))
            .map(acc => {
                const balance = balancesAsOfDate.get(acc.id) || 0;
                const value = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                return { name: acc.name, value };
            })
            .filter(item => item.value > 0);
            
        const liabilities = accounts
            .filter(acc => LIABILITY_TYPES.includes(acc.type))
            .map(acc => {
                const balance = Math.abs(balancesAsOfDate.get(acc.id) || 0);
                const value = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                return { name: acc.name, value };
            })
            .filter(item => item.value > 0);

        return { assets, liabilities };
    }, [accounts, balancesAsOfDate, settings]);
    
    const renderFilters = () => {
        const showDateRange = ['overview', 'cashflow', 'periodsummary', 'chartofaccounts', 'networthtrend', 'incomevsexpensetrend', 'budget'].includes(activeReport);
        const showAsOfDate = ['balancesheet'].includes(activeReport);
        const showTransactionalFilters = ['overview', 'cashflow', 'periodsummary'].includes(activeReport);

        if (!showDateRange && !showAsOfDate) {
            return null; // No filters for Assets/Liabilities reports
        }

        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {showDateRange && (
                        <>
                            <div>
                                <label className="text-sm font-medium">Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium">End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                        </>
                    )}
                    {showAsOfDate && (
                         <div>
                            <label className="text-sm font-medium">As of Date</label>
                            <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    )}
                    {showTransactionalFilters && (
                        <>
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="all">All Types</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Account</label>
                                <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="all">All Accounts</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const renderVisualSummary = () => {
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
        const baseCurrencySymbol = getCurrencySymbol(settings.baseCurrency);

        switch(activeReport) {
            case 'periodsummary':
                return (
                     <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={periodSummaryChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `${baseCurrencySymbol}${Number(value) / 1000}k`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                <Legend />
                                 <Bar dataKey="Actual" name="Actual">
                                    {periodSummaryChartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.name === 'Income' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                                <Bar dataKey="Budget" name="Budget" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'cashflow':
                return (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `${baseCurrencySymbol}${Number(value) / 1000}k`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                <Bar dataKey="value" name="Amount">
                                    {cashFlowChartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.name === 'Income' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            
            case 'balancesheet':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">
                        <div>
                            <h4 className="text-center font-semibold mb-2">Asset Composition</h4>
                            {balanceSheetChartData.assets.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={balanceSheetChartData.assets} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                             {balanceSheetChartData.assets.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="flex items-center justify-center h-full text-gray-500">No asset data</div>}
                        </div>
                         <div>
                            <h4 className="text-center font-semibold mb-2">Liability Composition</h4>
                            {balanceSheetChartData.liabilities.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={balanceSheetChartData.liabilities} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                             {balanceSheetChartData.liabilities.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="flex items-center justify-center h-full text-gray-500">No liability data</div>}
                        </div>
                    </div>
                );
                
            case 'assets':
                 return (
                    <div className="h-80">
                         {assetsChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie data={assetsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                        {assetsChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : <div className="flex items-center justify-center h-full text-gray-500">No asset data</div>}
                    </div>
                );
    
            case 'liabilities':
                 return (
                    <div className="h-80">
                        {liabilitiesChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie data={liabilitiesChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                        {liabilitiesChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-gray-500">No liability data</div>}
                    </div>
                );
                
            default:
                return null;
        }
    }
    
    const renderReport = () => {
        switch(activeReport) {
            case 'overview':
                return <OverviewReport
                    transactionsInBaseCurrency={transactionsInBaseCurrency}
                    settings={settings}
                    accountMap={accountMap}
                    categoryMap={categoryMap}
                    typeFilter={typeFilter}
                    startDate={startDate}
                    endDate={endDate}
                />;
            case 'periodsummary':
                return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Transactions Detail</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                 <thead>
                                     <tr className="border-b dark:border-gray-700">
                                        <th className="py-2 px-4">Date</th>
                                        <th className="py-2 px-4">Description</th>
                                        <th className="py-2 px-4">Account</th>
                                        <th className="py-2 px-4">Category</th>
                                        <th className="py-2 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactionsInBaseCurrency.map(t => (
                                        <tr key={t.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-2 px-4">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="py-2 px-4">{t.description}</td>
                                            <td className="py-2 px-4">{accountMap.get(t.accountId)?.name || 'Unknown'}</td>
                                            <td className="py-2 px-4">{categoryMap.get(t.categoryId)?.name || 'Uncategorized'}</td>
                                            <td className={`py-2 px-4 text-right font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, settings.baseCurrency)}
                                            </td>
                                        </tr>
                                    ))}
                                    {transactionsInBaseCurrency.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-gray-500">No transactions match the current filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'cashflow':
                 return <CashFlowStatement 
                    transactions={transactionsInBaseCurrency}
                    categories={categories}
                    settings={settings}
                 />;
            case 'balancesheet':
                return <BalanceSheet 
                    accounts={accounts}
                    accountBalances={balancesAsOfDate}
                    settings={settings}
                    asOfDate={asOfDate}
                />;
            case 'assets':
                return <AssetsReport 
                    accounts={accounts}
                    currentBalances={currentAccountBalances}
                    settings={settings}
                />
            case 'liabilities':
                 return <LiabilitiesReport 
                    accounts={accounts}
                    currentBalances={currentAccountBalances}
                    settings={settings}
                />;
            case 'chartofaccounts':
                return <ChartOfAccounts 
                    accounts={accounts} 
                    filteredTransactions={filteredTransactions}
                    currentAccountBalances={currentAccountBalances}
                    categories={categories}
                    settings={settings} 
                />;
            case 'networthtrend':
                return <NetWorthTrend data={netWorthTrendData} settings={settings} />;
            case 'incomevsexpensetrend':
                return <IncomeVsExpenseTrend data={incomeVsExpenseTrendData} settings={settings} />;
            case 'budget':
                return <BudgetReport
                    budgets={budgets}
                    filteredTransactions={filteredTransactions}
                    categories={categories}
                    accounts={accounts}
                    settings={settings}
                    startDate={startDate}
                    endDate={endDate}
                />;
            default:
                return null;
        }
    }

    const showVisualSummary = ['cashflow', 'balancesheet', 'assets', 'liabilities', 'periodsummary'].includes(activeReport);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reports</h1>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <TabButton label="Overview" reportType="overview" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Period Summary" reportType="periodsummary" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Income vs Expense Trend" reportType="incomevsexpensetrend" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Net Worth Trend" reportType="networthtrend" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Cash Flow" reportType="cashflow" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Balance Sheet" reportType="balancesheet" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Assets" reportType="assets" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Liabilities" reportType="liabilities" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Chart of Accounts" reportType="chartofaccounts" activeReport={activeReport} onClick={setActiveReport} />
                    <TabButton label="Budget" reportType="budget" activeReport={activeReport} onClick={setActiveReport} />
                </nav>
            </div>
            
            {renderFilters()}
            
            {showVisualSummary && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Visual Summary</h2>
                    {renderVisualSummary()}
                </div>
            )}

            <div className="mt-8">
                {renderReport()}
            </div>
        </div>
    );
};

export default Reports;