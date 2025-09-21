import React, { useMemo } from 'react';
import { Account, Transaction, TransactionType, AppSettings, AccountType } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';

interface AccountSummaryProps {
    accounts: Account[];
    transactions: Transaction[];
    settings: AppSettings;
    displayInBaseCurrency: boolean;
}

const AccountIcon: React.FC<{ type: AccountType }> = ({ type }) => {
    const iconMap: Record<AccountType, JSX.Element> = {
        [AccountType.BANK]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        [AccountType.CASH]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        [AccountType.CREDIT_CARD]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
        [AccountType.LOAN]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        [AccountType.LIABILITY]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        [AccountType.OTHER]: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };
    return <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">{iconMap[type] || iconMap[AccountType.OTHER]}</div>;
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts, transactions, settings, displayInBaseCurrency }) => {

    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, acc.initialBalance || 0));

        transactions.forEach(t => {
            const currentBalance = balances.get(t.accountId) || 0;
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            balances.set(t.accountId, currentBalance + amount);
        });
        return balances;
    }, [accounts, transactions]);

    const bankAccounts = useMemo(() => {
        return accounts.filter(acc => acc.type === AccountType.BANK);
    }, [accounts]);

    if (bankAccounts.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No bank accounts found.</p>
    }

    return (
        <div className="space-y-2">
            {bankAccounts.map(account => {
                const balance = accountBalances.get(account.id) || 0;
                const displayBalance = displayInBaseCurrency 
                    ? convertCurrency(balance, account.currency, settings.baseCurrency, settings)
                    : balance;
                const displayCurrency = displayInBaseCurrency ? settings.baseCurrency : account.currency;
                
                return (
                    <div key={account.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <AccountIcon type={account.type} />
                        <div className="flex-grow">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{account.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{account.type}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-sm ${displayBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                               {formatCurrency(displayBalance, displayCurrency)}
                            </p>
                            {displayInBaseCurrency && account.currency !== settings.baseCurrency && 
                                <p className="text-xs text-gray-400">{formatCurrency(balance, account.currency)}</p>
                            }
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AccountSummary;