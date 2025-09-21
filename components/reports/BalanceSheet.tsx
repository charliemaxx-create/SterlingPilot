import React, { useMemo } from 'react';
import { Account, AppSettings, AccountType } from '../../types';
import { formatCurrency, convertCurrency } from '../../utils/currency';

interface BalanceSheetProps {
    accounts: Account[];
    accountBalances: Map<string, number>;
    settings: AppSettings;
    asOfDate: string;
}

const ASSET_TYPES = [AccountType.BANK, AccountType.CASH, AccountType.OTHER];
const LIABILITY_TYPES = [AccountType.CREDIT_CARD, AccountType.LOAN, AccountType.LIABILITY];

const ReportRow: React.FC<{ label: string; amount: number; isSubItem?: boolean; currency: string }> = ({ label, amount, isSubItem = false, currency }) => (
    <div className={`flex justify-between py-2 border-b dark:border-gray-700 ${isSubItem ? 'pl-6' : ''}`}>
        <span className={isSubItem ? 'text-gray-600 dark:text-gray-300' : 'font-semibold'}>{label}</span>
        <span className={`font-mono ${isSubItem ? '' : 'font-semibold'}`}>{formatCurrency(amount, currency)}</span>
    </div>
);

const BalanceSheet: React.FC<BalanceSheetProps> = ({ accounts, accountBalances, settings, asOfDate }) => {
    
    const { assets, liabilities, totalAssets, totalLiabilities, netWorth } = useMemo(() => {
        let totalAssets = 0;
        let totalLiabilities = 0;

        const assets = accounts
            .filter(acc => ASSET_TYPES.includes(acc.type))
            .map(acc => {
                const balance = accountBalances.get(acc.id) || 0;
                const balanceInBase = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                totalAssets += balanceInBase;
                return { name: acc.name, balance: balanceInBase };
            });

        const liabilities = accounts
            .filter(acc => LIABILITY_TYPES.includes(acc.type))
            .map(acc => {
                const balance = Math.abs(accountBalances.get(acc.id) || 0); // Liabilities are negative, show as positive
                const balanceInBase = convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
                totalLiabilities += balanceInBase;
                return { name: acc.name, balance: balanceInBase };
            });

        return {
            assets,
            liabilities,
            totalAssets,
            totalLiabilities,
            netWorth: totalAssets - totalLiabilities,
        };

    }, [accounts, accountBalances, settings]);
    
    const baseCurrency = settings.baseCurrency;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Personal Balance Sheet</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                A snapshot of your financial position as of <span className="font-semibold">{new Date(asOfDate).toLocaleDateString()}</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets Column */}
                <div>
                    <h3 className="text-lg font-bold mb-2 text-green-600 dark:text-green-400">Assets</h3>
                     <div className="space-y-1">
                        {assets.map((asset) => (
                            <ReportRow key={asset.name} label={asset.name} amount={asset.balance} currency={baseCurrency} isSubItem />
                        ))}
                     </div>
                     <div className="mt-2 pt-2 border-t-2 dark:border-gray-600">
                        <ReportRow label="Total Assets" amount={totalAssets} currency={baseCurrency} />
                     </div>
                </div>

                {/* Liabilities Column */}
                <div>
                    <h3 className="text-lg font-bold mb-2 text-red-600 dark:text-red-400">Liabilities</h3>
                    <div className="space-y-1">
                        {liabilities.map((lia) => (
                            <ReportRow key={lia.name} label={lia.name} amount={lia.balance} currency={baseCurrency} isSubItem />
                        ))}
                     </div>
                     <div className="mt-2 pt-2 border-t-2 dark:border-gray-600">
                        <ReportRow label="Total Liabilities" amount={totalLiabilities} currency={baseCurrency} />
                     </div>
                </div>
            </div>

            {/* Net Worth */}
             <div className="mt-8 pt-4 border-t-4 dark:border-gray-600">
                <div className={`flex justify-between py-2 text-xl font-bold`}>
                    <span>Net Worth</span>
                    <span className="font-mono">{formatCurrency(netWorth, baseCurrency)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">Total Assets - Total Liabilities</p>
            </div>
        </div>
    );
};

export default BalanceSheet;
