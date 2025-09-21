import React from 'react';
import { AppSettings } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
    date: string;
    income: number;
    expense: number;
    budget: number;
}

interface IncomeVsExpenseTrendProps {
    data: TrendData[];
    settings: AppSettings;
}

const Stat: React.FC<{ title: string; amount: number; currency: string; color: string }> = ({ title, amount, currency, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
        <h3 className={`text-lg ${color} font-semibold`}>{title}</h3>
        <p className="text-2xl font-bold">{formatCurrency(amount, currency)}</p>
    </div>
);

const IncomeVsExpenseTrend: React.FC<IncomeVsExpenseTrendProps> = ({ data, settings }) => {
    if (!data || data.length < 2) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">Not enough data to display a trend. Please select a wider date range with transactions in at least two different months.</p>
            </div>
        );
    }
    
    const { totalIncome, totalExpense } = data.reduce((acc, month) => {
        acc.totalIncome += month.income;
        acc.totalExpense += month.expense;
        return acc;
    }, { totalIncome: 0, totalExpense: 0 });

    const finalNetChange = totalIncome - totalExpense;
    const baseCurrencySymbol = getCurrencySymbol(settings.baseCurrency);

    return (
        <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Stat title="Total Income" amount={totalIncome} currency={settings.baseCurrency} color="text-green-500" />
                <Stat title="Total Expenses" amount={totalExpense} currency={settings.baseCurrency} color="text-red-500" />
                <Stat title="Net Savings" amount={finalNetChange} currency={settings.baseCurrency} color={finalNetChange >= 0 ? 'text-blue-500' : 'text-red-500'} />
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => new Date(tick + '-02').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })} // Add day to prevent timezone issues
                            minTickGap={20}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            tickFormatter={(value) => `${baseCurrencySymbol}${Number(value) / 1000}k`}
                            tick={{ fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip formatter={(value: number) => formatCurrency(value, settings.baseCurrency)} />
                        <Legend />
                        <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        {data.some(d => d.budget > 0) && (
                            <Line type="monotone" dataKey="budget" name="Budgeted Expenses" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default IncomeVsExpenseTrend;