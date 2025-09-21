import React, { useMemo } from 'react';
import { Transaction, Account, TransactionType, Category, ExpenseBucket, AppSettings } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OverviewReportProps {
    transactionsInBaseCurrency: Transaction[];
    settings: AppSettings;
    accountMap: Map<string, Account>;
    categoryMap: Map<string, Category>;
    typeFilter: 'all' | 'income' | 'expense';
    startDate: string;
    endDate: string;
}

const getExpenseBucket = (transaction: Transaction, category: Category | undefined): ExpenseBucket | null => {
    if (transaction.type !== TransactionType.EXPENSE) return null;
    if (transaction.expenseBucket) return transaction.expenseBucket;
    if (category?.expenseBucket) return category.expenseBucket;
    return ExpenseBucket.FLEXIBLE;
};

const BUCKET_COLORS = ['#FF8042', '#0088FE', '#00C49F'];

const OverviewReport: React.FC<OverviewReportProps> = ({ 
    transactionsInBaseCurrency,
    settings,
    accountMap,
    categoryMap,
    typeFilter,
    startDate,
    endDate
 }) => {

    const summary = useMemo(() => {
        return transactionsInBaseCurrency.reduce((acc, t) => {
            if (t.type === TransactionType.INCOME) {
                acc.totalIncome += t.amount;
            } else {
                acc.totalExpense += t.amount;
            }
            acc.net = acc.totalIncome - acc.totalExpense;
            return acc;
        }, { totalIncome: 0, totalExpense: 0, net: 0 });
    }, [transactionsInBaseCurrency]);

    const categoryChartData = useMemo(() => {
        const dataMap = new Map<string, number>();
        
        transactionsInBaseCurrency.forEach(t => {
            if (typeFilter === 'all' || t.type === typeFilter) {
                 const categoryName = categoryMap.get(t.categoryId)?.name || 'Uncategorized';
                 dataMap.set(categoryName, (dataMap.get(categoryName) || 0) + t.amount);
            }
        });

        return Array.from(dataMap.entries())
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a,b) => b.value - a.value);

    }, [transactionsInBaseCurrency, typeFilter, categoryMap]);
    
    const trendData = useMemo(() => {
        const dataByDate = new Map<string, { date: string; income: number; expense: number }>();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) return [];

        let currentDate = new Date(start);
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dataByDate.set(dateStr, { date: dateStr, income: 0, expense: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        transactionsInBaseCurrency.forEach(t => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            const dayData = dataByDate.get(dateStr);
            if (dayData) {
                if (t.type === TransactionType.INCOME) {
                    dayData.income += t.amount;
                } else {
                    dayData.expense += t.amount;
                }
            }
        });

        return Array.from(dataByDate.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactionsInBaseCurrency, startDate, endDate]);

    const bucketChartData = useMemo(() => {
        const bucketTotals: Record<string, number> = {
            [ExpenseBucket.FIXED]: 0,
            [ExpenseBucket.FLEXIBLE]: 0,
            [ExpenseBucket.NON_MONTHLY]: 0,
        };
    
        transactionsInBaseCurrency.forEach(t => {
            const category = categoryMap.get(t.categoryId);
            const bucket = getExpenseBucket(t, category);
            if (bucket) {
                bucketTotals[bucket] += t.amount;
            }
        });
    
        return Object.entries(bucketTotals)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0);
    
    }, [transactionsInBaseCurrency, categoryMap]);
    
    const baseCurrencySymbol = getCurrencySymbol(settings.baseCurrency);

    return (
         <div className="space-y-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4">All amounts shown in base currency ({settings.baseCurrency})</p>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-green-500 font-semibold">Total Income</h3>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalIncome, settings.baseCurrency)}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-red-500 font-semibold">Total Expense</h3>
                    <p className="text-2xl font-bold">{formatCurrency(summary.totalExpense, settings.baseCurrency)}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-blue-500 font-semibold">Net Result</h3>
                    <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>{formatCurrency(summary.net, settings.baseCurrency)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
                 {/* Trend Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                    <h2 className="text-xl font-semibold mb-4">Trends Over Time</h2>
                    {trendData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    minTickGap={20}
                                />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${baseCurrencySymbol}${value.toFixed(2)}`} />
                                <Legend />
                                {typeFilter !== 'income' && <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />}
                                {typeFilter !== 'expense' && <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Not enough data for a trend line. Select a wider date range.</div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Breakdown Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                        <h2 className="text-xl font-semibold mb-4">Breakdown by Category</h2>
                        {categoryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                                    <Tooltip formatter={(value: number) => `${baseCurrencySymbol}${value.toFixed(2)}`} />
                                    <Bar dataKey="value" fill={typeFilter === 'income' ? '#10b981' : '#ef4444'} name={typeFilter === 'income' ? 'Income' : 'Expenses'}/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No data for selected filters.</div>
                        )}
                    </div>
                     {/* Expense Bucket Chart */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                        <h2 className="text-xl font-semibold mb-4">Expense Buckets</h2>
                        {bucketChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={bucketChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#8884d8"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {bucketChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={BUCKET_COLORS[index % BUCKET_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${baseCurrencySymbol}${value.toFixed(2)}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">No expense data for selected filters.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Filtered Transactions</h2>
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
        </div>
    )
};

export default OverviewReport;
