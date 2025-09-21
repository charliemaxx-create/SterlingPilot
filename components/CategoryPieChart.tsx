import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCurrencySymbol } from '../utils/currency';

interface ChartData {
    name: string;
    value: number;
    // Fix: Add index signature to allow recharts to add its own properties.
    [key: string]: any;
}
interface CategoryPieChartProps {
  data: Record<string, number>;
  currencyCode: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#00E396'];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, currencyCode }) => {
  const chartData: ChartData[] = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>No expense data to display yet. Add some expenses!</p>
        </div>
    );
  }
  
  const currencySymbol = getCurrencySymbol(currencyCode);

  return (
    <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    // Fix: Ensure 'percent' is treated as a number before multiplication.
                    label={({ name, percent }) => `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;