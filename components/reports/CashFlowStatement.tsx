import React, { useMemo } from 'react';
import { Transaction, Category, AppSettings, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CashFlowStatementProps {
    transactions: Transaction[]; // Expects amounts in base currency
    categories: Category[];
    settings: AppSettings;
}

const ReportRow: React.FC<{ label: string; amount: number; isSubItem?: boolean; currency: string }> = ({ label, amount, isSubItem = false, currency }) => (
    <div className={`flex justify-between py-2 border-b dark:border-gray-700 ${isSubItem ? 'pl-6' : ''}`}>
        <span className={isSubItem ? 'text-gray-600 dark:text-gray-300' : 'font-semibold'}>{label}</span>
        <span className={`font-mono ${isSubItem ? '' : 'font-semibold'}`}>{formatCurrency(amount, currency)}</span>
    </div>
);

const ReportSection: React.FC<{ title: string; data: Record<string, number>; total: number; currency: string; titleColor: string }> = ({ title, data, total, currency, titleColor }) => (
    <div className="mb-6">
        <h3 className={`text-lg font-bold mb-2 ${titleColor}`}>{title}</h3>
        <div className="space-y-1">
            {Object.entries(data)
                .sort(([, a], [, b]) => b - a)
                .map(([name, amount]) => (
                    <ReportRow key={name} label={name} amount={amount} currency={currency} isSubItem />
            ))}
        </div>
        <div className="mt-2 pt-2 border-t-2 dark:border-gray-600">
             <ReportRow label={`Total ${title}`} amount={total} currency={currency} />
        </div>
    </div>
);


const CashFlowStatement: React.FC<CashFlowStatementProps> = ({ transactions, categories, settings }) => {
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const { incomeByCategory, expenseByCategory, totalIncome, totalExpense, netCashFlow } = useMemo(() => {
        const income: Record<string, number> = {};
        const expense: Record<string, number> = {};
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';
            if (t.type === TransactionType.INCOME) {
                income[categoryName] = (income[categoryName] || 0) + t.amount;
                totalIncome += t.amount;
            } else {
                expense[categoryName] = (expense[categoryName] || 0) + t.amount;
                totalExpense += t.amount;
            }
        });
        
        return {
            incomeByCategory: income,
            expenseByCategory: expense,
            totalIncome,
            totalExpense,
            netCashFlow: totalIncome - totalExpense
        };
    }, [transactions, categoryMap]);
    
    const baseCurrency = settings.baseCurrency;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Personal Cash Flow Statement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This statement shows your cash inflows and outflows over the selected period.</p>
            
            <div className="space-y-8">
                <ReportSection 
                    title="Cash Inflows (Income)"
                    data={incomeByCategory}
                    total={totalIncome}
                    currency={baseCurrency}
                    titleColor="text-green-600 dark:text-green-400"
                />
                
                <ReportSection 
                    title="Cash Outflows (Expenses)"
                    data={expenseByCategory}
                    total={totalExpense}
                    currency={baseCurrency}
                    titleColor="text-red-600 dark:text-red-400"
                />

                <div className="mt-6 pt-4 border-t-4 dark:border-gray-600">
                     <div className={`flex justify-between py-2 text-xl font-bold ${netCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span>Net Cash Flow</span>
                        <span className="font-mono">{formatCurrency(netCashFlow, baseCurrency)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right">Total Inflows - Total Outflows</p>
                </div>
            </div>
        </div>
    );
};

export default CashFlowStatement;
