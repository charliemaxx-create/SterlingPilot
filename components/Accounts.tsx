import React, { useState, useMemo } from 'react';
import { Account, Transaction, TransactionType, AppSettings, AccountType, SavingsGoal, GoalContribution } from '../types';
import { formatCurrency, convertCurrency } from '../utils/currency';
import AddAccountModal from './AddAccountModal';

interface AccountsProps {
    accounts: Account[];
    transactions: Transaction[];
    addAccount: (account: Omit<Account, 'id'>) => void;
    updateAccount: (account: Account) => void;
    deleteAccount: (id: string) => void;
    settings: AppSettings;
    goals: SavingsGoal[];
    contributions: GoalContribution[];
}

const AccountCard: React.FC<{ 
    account: Account; 
    balance: number;
    allocatedForGoals: number;
    linkedGoals: SavingsGoal[];
    goalProgress: Map<string, number>;
    onEdit: () => void; 
    onDelete: () => void; 
}> = ({ account, balance, allocatedForGoals, linkedGoals, goalProgress, onEdit, onDelete }) => {
    const availableBalance = balance - allocatedForGoals;
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-700">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">{account.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{account.type} ({account.currency})</p>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={onEdit} className="text-gray-400 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                        <button onClick={onDelete} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
                 <div className="mt-4 space-y-2">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
                        <p className={`text-lg sm:text-xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{formatCurrency(balance, account.currency)}</p>
                    </div>
                    {allocatedForGoals > 0 && (
                        <div>
                             <p className="text-sm text-gray-500 dark:text-gray-400"> - Allocated to Goals</p>
                            <p className="text-base sm:text-lg font-semibold text-yellow-600 dark:text-yellow-400">{formatCurrency(allocatedForGoals, account.currency)}</p>
                        </div>
                    )}
                    <div>
                         <p className="text-sm font-bold text-primary-600 dark:text-primary-400"> = Available Balance</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-primary-300">{formatCurrency(availableBalance, account.currency)}</p>
                    </div>
                 </div>
            </div>
            {linkedGoals.length > 0 && (
                <div className="mt-6 border-t dark:border-gray-700 pt-4">
                     <h4 className="text-sm font-semibold mb-2">Linked Goals</h4>
                     <ul className="space-y-1 text-xs">
                        {linkedGoals.map(goal => (
                            <li key={goal.id} className="flex justify-between">
                                <span>{goal.name}</span>
                                <span className="font-mono">{formatCurrency(goalProgress.get(goal.id) || 0, goal.currency)}</span>
                            </li>
                        ))}
                     </ul>
                </div>
            )}
        </div>
    );
};

const Accounts: React.FC<AccountsProps> = ({ accounts, transactions, addAccount, updateAccount, deleteAccount, settings, goals, contributions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'tile' | 'list'>(settings.defaultAccountView || 'tile');
    const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

    const toggleExpanded = (accountId: string) => {
        setExpandedAccounts(prev => ({...prev, [accountId]: !prev[accountId]}));
    };

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

    const goalProgress = useMemo(() => {
        const progress = new Map<string, number>();
        goals.forEach(g => progress.set(g.id, 0));
        contributions.forEach(c => {
            if (progress.has(c.goalId)) {
                progress.set(c.goalId, (progress.get(c.goalId) || 0) + c.amount);
            }
        });
        return progress;
    }, [goals, contributions]);

    const goalsByAccountId = useMemo(() => {
        const grouped = new Map<string, SavingsGoal[]>();
        goals.forEach(goal => {
            if (goal.accountId) {
                if (!grouped.has(goal.accountId)) {
                    grouped.set(goal.accountId, []);
                }
                grouped.get(goal.accountId)!.push(goal);
            }
        });
        return grouped;
    }, [goals]);

    const groupedAccounts = useMemo(() => {
        const groups: Record<string, Account[]> = {};
        accounts.forEach(account => {
            if (!groups[account.type]) {
                groups[account.type] = [];
            }
            groups[account.type].push(account);
        });
        const orderedGroups: { type: AccountType; accounts: Account[] }[] = [];
        for (const type of Object.values(AccountType)) {
            if (groups[type]) {
                orderedGroups.push({ type, accounts: groups[type] });
            }
        }
        return orderedGroups;
    }, [accounts]);

    const handleSave = (data: Omit<Account, 'id'>) => {
        if (editingAccount) {
            updateAccount({ ...editingAccount, ...data });
        } else {
            addAccount(data);
        }
        setIsModalOpen(false);
        setEditingAccount(undefined);
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingAccount(undefined);
        setIsModalOpen(true);
    };

    const renderContent = () => {
        if (accounts.length === 0) {
             return (
                 <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">You haven't added any accounts yet.</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click 'Add New Account' to get started!</p>
                </div>
            )
        }

        if (viewMode === 'list') {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="py-3 px-2 sm:px-4 w-12"></th>
                                <th className="py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Account</th>
                                <th className="py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase hidden sm:table-cell">Type</th>
                                <th className="py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden md:table-cell">Total Balance</th>
                                <th className="py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Available Balance</th>
                                <th className="py-3 px-2 sm:px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedAccounts.map(({ type, accounts: accsInGroup }) => {
                                return (
                                    <React.Fragment key={type}>
                                        <tr className="bg-gray-100 dark:bg-gray-900/50">
                                            <th colSpan={6} className="py-2 px-2 sm:px-4 text-left text-sm font-semibold text-gray-800 dark:text-gray-200">{type}</th>
                                        </tr>
                                        {accsInGroup.map(account => {
                                            const balance = accountBalances.get(account.id) || 0;
                                            const linkedGoals = goalsByAccountId.get(account.id) || [];
                                            const allocatedForGoals = linkedGoals.reduce((sum, goal) => {
                                                const goalAmount = goalProgress.get(goal.id) || 0;
                                                return sum + convertCurrency(goalAmount, goal.currency, account.currency, settings);
                                            }, 0);
                                            const availableBalance = balance - allocatedForGoals;
                                            const isExpanded = !!expandedAccounts[account.id];

                                            return (
                                                <React.Fragment key={account.id}>
                                                    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="py-3 px-2 sm:px-4 text-center">
                                                            {linkedGoals.length > 0 && (
                                                                <button onClick={() => toggleExpanded(account.id)} className="text-gray-400 hover:text-primary-500">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-2 sm:px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{account.name}</td>
                                                        <td className="py-3 px-2 sm:px-4 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">{account.type}</td>
                                                        <td className={`py-3 px-2 sm:px-4 text-sm font-semibold text-right hidden md:table-cell ${balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500'}`}>{formatCurrency(balance, account.currency)}</td>
                                                        <td className="py-3 px-2 sm:px-4 text-sm font-bold text-right text-primary-700 dark:text-primary-300">{formatCurrency(availableBalance, account.currency)}</td>
                                                        <td className="py-3 px-2 sm:px-4 text-right">
                                                            <div className="flex justify-end space-x-3">
                                                                <button onClick={() => openEditModal(account)} className="text-gray-400 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                                                                <button onClick={() => deleteAccount(account.id)} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && linkedGoals.length > 0 && (
                                                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                            <td></td>
                                                            <td colSpan={5} className="p-4">
                                                                <h4 className="text-sm font-semibold mb-2">Funds Allocated to Goals: {formatCurrency(allocatedForGoals, account.currency)}</h4>
                                                                <ul className="space-y-1 text-xs pl-4 list-disc">
                                                                    {linkedGoals.map(goal => (
                                                                        <li key={goal.id} className="flex justify-between">
                                                                            <span>{goal.name}</span>
                                                                            <span className="font-mono">{formatCurrency(goalProgress.get(goal.id) || 0, goal.currency)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )
        }

        return (
            <div className="space-y-6">
                {groupedAccounts.map(({ type, accounts: accsInGroup }) => (
                     <div key={type} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl shadow-sm p-4 border dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{type}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accsInGroup.map(account => {
                                const balance = accountBalances.get(account.id) || 0;
                                const linkedGoals = goalsByAccountId.get(account.id) || [];
                                const allocatedForGoals = linkedGoals.reduce((sum, goal) => {
                                    const goalAmount = goalProgress.get(goal.id) || 0;
                                    return sum + convertCurrency(goalAmount, goal.currency, account.currency, settings);
                                }, 0);

                                return (
                                    <AccountCard
                                        key={account.id}
                                        account={account}
                                        balance={balance}
                                        allocatedForGoals={allocatedForGoals}
                                        linkedGoals={linkedGoals}
                                        goalProgress={goalProgress}
                                        onEdit={() => openEditModal(account)}
                                        onDelete={() => deleteAccount(account.id)}
                                    />
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Manage Accounts</h1>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setViewMode('tile')} 
                        className={`p-2 rounded-md transition-colors ${viewMode === 'tile' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        aria-label="Tile View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        aria-label="List View"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        onClick={openAddModal}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700"
                    >
                        + Add New Account
                    </button>
                </div>
            </div>

            {renderContent()}

            {isModalOpen && (
                <AddAccountModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    accountToEdit={editingAccount}
                    settings={settings}
                />
            )}
        </div>
    );
};

export default Accounts;