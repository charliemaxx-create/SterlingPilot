import React, { useMemo } from 'react';
import { Account, AppSettings, AccountType } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';

interface LiabilitiesReportProps {
    accounts: Account[];
    currentBalances: Map<string, number>;
    settings: AppSettings;
}

const LIABILITY_TYPES = [AccountType.CREDIT_CARD, AccountType.LOAN, AccountType.LIABILITY];

const LiabilitiesReport: React.FC<LiabilitiesReportProps> = ({ accounts, currentBalances, settings }) => {

    const liabilityAccounts = useMemo(() => {
        return accounts
            .filter(acc => LIABILITY_TYPES.includes(acc.type))
            .map(acc => ({
                ...acc,
                balance: currentBalances.get(acc.id) || 0,
            }))
            .sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0)); // Sort by highest interest rate
    }, [accounts, currentBalances]);
    
    const totalLiabilitiesInBase = useMemo(() => {
        return liabilityAccounts.reduce((sum, acc) => {
            return sum + convertCurrency(Math.abs(acc.balance), acc.currency, settings.baseCurrency, settings);
        }, 0);
    }, [liabilityAccounts, settings]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Liabilities</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A list of all your debts and their current balances.</p>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Account Name</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Type</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">APR</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Min. Payment</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Current Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {liabilityAccounts.map(account => (
                            <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4 font-medium">{account.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{account.type}</td>
                                <td className="py-3 px-4 text-right text-sm">{account.interestRate ? `${account.interestRate.toFixed(2)}%` : 'N/A'}</td>
                                <td className="py-3 px-4 text-right text-sm">{account.minimumPayment ? formatCurrency(account.minimumPayment, account.currency) : 'N/A'}</td>
                                <td className={`py-3 px-4 text-right font-mono font-semibold`}>
                                    {formatCurrency(account.balance, account.currency)}
                                </td>
                            </tr>
                        ))}
                         {liabilityAccounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">No liability accounts found.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                            <td colSpan={4} className="py-4 px-4 text-lg">Total Liabilities (in {settings.baseCurrency})</td>
                            <td className="py-4 px-4 text-right text-lg font-mono">{formatCurrency(totalLiabilitiesInBase, settings.baseCurrency)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default LiabilitiesReport;
