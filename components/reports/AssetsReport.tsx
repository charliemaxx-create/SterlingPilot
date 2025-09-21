import React, { useMemo } from 'react';
import { Account, AppSettings, AccountType } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';

interface AssetsReportProps {
    accounts: Account[];
    currentBalances: Map<string, number>;
    settings: AppSettings;
}

const ASSET_TYPES = [AccountType.BANK, AccountType.CASH, AccountType.OTHER];

const AssetsReport: React.FC<AssetsReportProps> = ({ accounts, currentBalances, settings }) => {

    const assetAccounts = useMemo(() => {
        return accounts
            .filter(acc => ASSET_TYPES.includes(acc.type))
            .map(acc => ({
                ...acc,
                balance: currentBalances.get(acc.id) || 0,
            }))
            .sort((a, b) => b.balance - a.balance);
    }, [accounts, currentBalances]);
    
    const totalAssetsInBase = useMemo(() => {
        return assetAccounts.reduce((sum, acc) => {
            return sum + convertCurrency(acc.balance, acc.currency, settings.baseCurrency, settings);
        }, 0);
    }, [assetAccounts, settings]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Assets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">A list of all your assets and their current values.</p>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Account Name</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Type</th>
                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Current Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assetAccounts.map(account => (
                            <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-3 px-4 font-medium">{account.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{account.type}</td>
                                <td className={`py-3 px-4 text-right font-mono font-semibold ${account.balance < 0 ? 'text-red-500' : ''}`}>
                                    {formatCurrency(account.balance, account.currency)}
                                </td>
                            </tr>
                        ))}
                         {assetAccounts.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">No asset accounts found.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 dark:bg-gray-900 font-bold">
                            <td colSpan={2} className="py-4 px-4 text-lg">Total Assets (in {settings.baseCurrency})</td>
                            <td className="py-4 px-4 text-right text-lg font-mono">{formatCurrency(totalAssetsInBase, settings.baseCurrency)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default AssetsReport;
