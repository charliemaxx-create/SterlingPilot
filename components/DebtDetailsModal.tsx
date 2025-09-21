import React from 'react';
import { DebtAccount, PayoffPlan } from '../types';
import { formatCurrency } from '../utils/currency';

interface DebtDetailsModalProps {
    debt: DebtAccount;
    fullPlan: PayoffPlan;
    onClose: () => void;
}

const Stat: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-800 dark:text-white">{value}</p>
    </div>
);

const DebtDetailsModal: React.FC<DebtDetailsModalProps> = ({ debt, fullPlan, onClose }) => {
    const debtSummary = fullPlan.schedule.find(s => s.accountId === debt.id);

    const debtSchedule = fullPlan.detailedSchedule
        .map(month => ({
            month: month.month,
            details: month.details[debt.id]
        }))
        .filter(item => item.details && item.details.startingBalance > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Details for <span className="text-primary-600">{debt.name}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Summary Section */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Stat label="Current Balance" value={formatCurrency(Math.abs(debt.currentBalance), debt.currency)} />
                            <Stat label="APR" value={`${debt.interestRate?.toFixed(2) || 'N/A'}%`} />
                            <Stat label="Projected Payoff" value={debtSummary?.payoffDate || 'N/A'} />
                            <Stat label="Total Interest" value={formatCurrency(debtSummary?.totalInterest || 0, debt.currency)} />
                        </div>
                    </div>

                    {/* Amortization Schedule */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Month-by-Month Breakdown</h3>
                        <div className="overflow-x-auto border dark:border-gray-700 rounded-lg max-h-[40vh]">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Month</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Start Balance</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Payment</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Interest Paid</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Principal Paid</th>
                                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">End Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {debtSchedule.map(item => {
                                        const { details, month } = item;
                                        if (!details) return null;
                                        const principalPaid = details.payment - details.interestPaid;

                                        return (
                                            <tr key={month} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                                <td className="py-3 px-4 font-semibold text-center">{month}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-right">{formatCurrency(details.startingBalance, debt.currency)}</td>
                                                <td className={`py-3 px-4 font-mono text-sm text-right font-bold ${details.payment > (debt.minimumPayment || 0) ? 'text-green-500' : ''}`}>{formatCurrency(details.payment, debt.currency)}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-right text-red-500">{formatCurrency(details.interestPaid, debt.currency)}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-right">{formatCurrency(principalPaid, debt.currency)}</td>
                                                <td className="py-3 px-4 font-mono text-sm text-right font-semibold">{formatCurrency(details.endingBalance, debt.currency)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebtDetailsModal;
