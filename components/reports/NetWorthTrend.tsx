import React from 'react';
import { AppSettings } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface NetWorthTrendProps {
    data: { date: string; assets: number; liabilities: number; netWorth: number }[];
    settings: AppSettings;
}

const NetWorthTrend: React.FC<NetWorthTrendProps> = ({ data, settings }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">No data available for the selected period. Please select a valid date range.</p>
            </div>
        );
    }

    const startData = data[0];
    const endData = data[data.length - 1];
    const netWorthChange = endData.netWorth - startData.netWorth;
    const isPositiveChange = netWorthChange >= 0;

    const baseCurrencySymbol = getCurrencySymbol(settings.baseCurrency);

    const CustomTooltipContent = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const date = new Date(label);
            // Adjust for timezone offset to prevent date from shifting
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border dark:border-gray-700">
                    <p className="font-bold mb-2">{date.toLocaleDateString()}</p>
                    {payload.map((pld: any) => (
                        <p key={pld.dataKey} style={{ color: pld.color }} className="text-sm">
                            {pld.name}: {formatCurrency(pld.value, settings.baseCurrency)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };


    return (
        <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-gray-500 dark:text-gray-400 font-semibold">Start Net Worth</h3>
                    <p className="text-2xl font-bold">{formatCurrency(startData.netWorth, settings.baseCurrency)}</p>
                    <p className="text-xs text-gray-400">{new Date(startData.date).toLocaleDateString()}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-gray-500 dark:text-gray-400 font-semibold">End Net Worth</h3>
                    <p className="text-2xl font-bold">{formatCurrency(endData.netWorth, settings.baseCurrency)}</p>
                    <p className="text-xs text-gray-400">{new Date(endData.date).toLocaleDateString()}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                    <h3 className="text-lg text-gray-500 dark:text-gray-400 font-semibold">Change</h3>
                    <p className={`text-2xl font-bold ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositiveChange ? '+' : ''}{formatCurrency(netWorthChange, settings.baseCurrency)}
                    </p>
                    <p className="text-xs text-gray-400">over the period</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-96">
                <h2 className="text-xl font-semibold mb-4">Net Worth Trend</h2>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                        <XAxis 
                            dataKey="date" 
                            tickFormatter={(tick) => {
                                const date = new Date(tick);
                                date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
                            minTickGap={30}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                            tickFormatter={(value) => `${baseCurrencySymbol}${Number(value) / 1000}k`}
                            tick={{ fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip content={<CustomTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="assets" name="Total Assets" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="liabilities" name="Total Liabilities" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default NetWorthTrend;
