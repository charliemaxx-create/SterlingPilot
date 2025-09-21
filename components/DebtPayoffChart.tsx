import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PayoffPlan, DebtAccount } from '../types';
import { getCurrencySymbol } from '../utils/currency';

interface DebtPayoffChartProps {
    plan: PayoffPlan;
    accounts: DebtAccount[];
    baseCurrency: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#00E396'];

const CustomTooltip: React.FC<any> = ({ active, payload, label, currencySymbol }) => {
    if (active && payload && payload.length) {
        let total = 0;
        const items = payload.map((pld: any) => {
            total += pld.value;
            return {
                name: pld.name,
                value: pld.value,
                color: pld.fill,
            }
        });

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700">
                <p className="font-bold mb-2">{label}</p>
                <ul className="space-y-1">
                    {items.map(item => (
                         <li key={item.name} style={{ color: item.color }}>
                            <span className="font-semibold">{item.name}:</span> {currencySymbol}{(item.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </li>
                    ))}
                </ul>
                <p className="font-bold mt-2 pt-2 border-t dark:border-gray-700">
                    Total: {currencySymbol}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
        );
    }
    return null;
};


const DebtPayoffChart: React.FC<DebtPayoffChartProps> = ({ plan, accounts, baseCurrency }) => {
    const currencySymbol = getCurrencySymbol(baseCurrency);

    const chartData = useMemo(() => {
        const today = new Date();
        return plan.detailedSchedule.map(monthlyData => {
            const date = new Date(today.getFullYear(), today.getMonth() + monthlyData.month -1, today.getDate());
            
            const dataPoint: { [key: string]: any } = {
                name: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
                month: monthlyData.month,
            };

            accounts.forEach(acc => {
                dataPoint[acc.id] = monthlyData.details[acc.id]?.endingBalance || 0;
            });
            return dataPoint;
        });
    }, [plan, accounts]);
    
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={chartData}
                margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 0,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis 
                    tickFormatter={(value) => `${currencySymbol}${Number(value) / 1000}k`}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
                <Legend />
                {accounts.map((acc, index) => (
                    <Area
                        key={acc.id}
                        type="monotone"
                        dataKey={acc.id}
                        stackId="1"
                        name={acc.name}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.8}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default DebtPayoffChart;