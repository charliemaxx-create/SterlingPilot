import React, { useState, useEffect } from 'react';
import { Account, AccountType, AppSettings } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';
import { getCurrencySymbol } from '../utils/currency';

interface AddAccountModalProps {
    onClose: () => void;
    onSave: (data: Omit<Account, 'id'>) => void;
    accountToEdit?: Account;
    settings: AppSettings;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, onSave, accountToEdit, settings }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.BANK);
    const [initialBalance, setInitialBalance] = useState('0');
    const [currency, setCurrency] = useState(settings.baseCurrency);
    const [interestRate, setInterestRate] = useState('');
    const [minimumPayment, setMinimumPayment] = useState('');
    const [originationDate, setOriginationDate] = useState('');
    const [originalTermMonths, setOriginalTermMonths] = useState('');
    const [originalAmount, setOriginalAmount] = useState('');

    useEffect(() => {
        if (accountToEdit) {
            setName(accountToEdit.name);
            setType(accountToEdit.type);
            setInitialBalance(accountToEdit.initialBalance.toString());
            setCurrency(accountToEdit.currency);
            setInterestRate(accountToEdit.interestRate?.toString() || '');
            setMinimumPayment(accountToEdit.minimumPayment?.toString() || '');
            setOriginationDate(accountToEdit.originationDate || '');
            setOriginalTermMonths(accountToEdit.originalTermMonths?.toString() || '');
            setOriginalAmount(accountToEdit.originalAmount?.toString() || '');
        }
    }, [accountToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("Please enter an account name.");
            return;
        }
        onSave({ 
            name, 
            type, 
            initialBalance: parseFloat(initialBalance) || 0, 
            currency,
            interestRate: parseFloat(interestRate) || undefined,
            minimumPayment: parseFloat(minimumPayment) || undefined,
            originationDate: originationDate || undefined,
            originalTermMonths: parseInt(originalTermMonths, 10) || undefined,
            originalAmount: parseFloat(originalAmount) > 0 ? parseFloat(originalAmount) : undefined,
        });
    };
    
    const currencySymbol = getCurrencySymbol(currency);
    const isDebtAccount = type === AccountType.CREDIT_CARD || type === AccountType.LOAN;
    const isLoanAccount = type === AccountType.LOAN || type === AccountType.LIABILITY;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {accountToEdit ? 'Edit Account' : 'Add New Account'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
                            <input
                                type="text"
                                id="accountName"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                                required
                                placeholder="e.g., Main Checking"
                            />
                        </div>
                        <div>
                             <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                            <select
                                id="accountType"
                                value={type}
                                onChange={e => setType(e.target.value as AccountType)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                            <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                                {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Balance ({currencySymbol})</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input
                                type="number"
                                id="initialBalance"
                                value={initialBalance}
                                onChange={e => setInitialBalance(e.target.value)}
                                className="w-full pl-7 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                                step="0.01"
                                placeholder="e.g., 1500 or -500 for loans"
                            />
                        </div>
                    </div>
                   
                    {isDebtAccount && (
                        <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-700 pt-4">
                            <div>
                                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (APR %)</label>
                                <input type="number" id="interestRate" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" min="0" step="0.01" placeholder="e.g., 19.99" />
                            </div>
                            <div>
                                <label htmlFor="minimumPayment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min. Monthly Pmt ({currencySymbol})</label>
                                <input type="number" id="minimumPayment" value={minimumPayment} onChange={e => setMinimumPayment(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" min="0" step="0.01" placeholder="e.g., 25" />
                            </div>
                        </div>
                    )}

                     {isLoanAccount && (
                        <div className="space-y-4 border-t dark:border-gray-700 pt-4">
                            <div>
                                <label htmlFor="originalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Loan Amount ({currencySymbol})</label>
                                <input type="number" id="originalAmount" value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" min="0" step="0.01" placeholder="e.g., 20000" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="originationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origination Date</label>
                                    <input type="date" id="originationDate" value={originationDate} onChange={e => setOriginationDate(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="originalTermMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Term (months)</label>
                                    <input type="number" id="originalTermMonths" value={originalTermMonths} onChange={e => setOriginalTermMonths(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500" min="0" step="1" placeholder="e.g., 60" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;