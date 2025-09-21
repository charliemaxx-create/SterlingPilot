import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Advisor from './components/Advisor';
import Budgets from './components/Budgets';
import Recurring from './components/Recurring';
import Accounts from './components/Accounts';
import Goals from './components/Goals';
import Reports from './components/Reports';
import Settings from './components/Settings';
import DebtPlanner from './components/DebtPlanner';
import { useTransactions } from './hooks/useTransactions';
import { useBudgets } from './hooks/useBudgets';
import { useRecurringTransactions } from './hooks/useRecurringTransactions';
import { useAccounts } from './hooks/useAccounts';
import { useSavingsGoals } from './hooks/useSavingsGoals';
import { useSettings } from './hooks/useSettings';
import { useCategories } from './hooks/useCategories';
import { useTags } from './hooks/useTags';
import { Transaction, NavBarPosition, TransactionType } from './types';
import AddTransactionModal from './components/AddTransactionModal';
import { convertCurrency } from './utils/currency';

type View = 'dashboard' | 'transactions' | 'advisor' | 'budgets' | 'recurring' | 'accounts' | 'goals' | 'reports' | 'settings' | 'debt';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const { settings, updateBaseCurrency, updateExchangeRates, updateDashboardWidgets, updateTheme, updateNavBarPosition, updateBudgetingStrategy, updatePayYourselfFirstSetting, updateDefaultTransactionView, updateDefaultAccountView, updateDefaultGoalView } = useSettings();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { tags: allTags, addTag: addTagToGlobalList, deleteTag: deleteTagFromGlobalList, renameTag: renameTagInGlobalList } = useTags();
  const { recurringTransactions, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction, removeTagFromAll: removeTagFromRecurring, renameTagInAll: renameTagInRecurring } = useRecurringTransactions();
  const { transactions, addTransaction, deleteTransaction, getSummary, removeTagFromAll: removeTagFromManual, renameTagInAll: renameTagInManual } = useTransactions(recurringTransactions, accounts, settings);
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { goals, contributions, addGoal, updateGoal, deleteGoal, addContribution } = useSavingsGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const applyTheme = () => {
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (settings.theme === 'system') {
            applyTheme();
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [settings.theme]);

  const handleAddTransaction = (transactions: Omit<Transaction, 'id' | 'date'>[]) => {
    transactions.forEach(transaction => {
      addTransaction(transaction);
      transaction.tags?.forEach(tag => addTagToGlobalList(tag));
    });
    setIsModalOpen(false);
  };

  const handleDeleteTag = (tagName: string) => {
    deleteTagFromGlobalList(tagName);
    removeTagFromManual(tagName);
    removeTagFromRecurring(tagName);
  };

  const handleRenameTag = (oldName: string, newName: string) => {
    renameTagInGlobalList(oldName, newName);
    renameTagInManual(oldName, newName);
    renameTagInRecurring(oldName, newName);
  };

  const summary = getSummary();
  
  const totalNetWorth = useMemo(() => {
    const balances = new Map<string, number>();
    accounts.forEach(acc => balances.set(acc.id, acc.initialBalance || 0));

    transactions.forEach(t => {
        const currentBalance = balances.get(t.accountId) || 0;
        const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
        balances.set(t.accountId, currentBalance + amount);
    });

    let total = 0;
    accounts.forEach(acc => {
        const balance = balances.get(acc.id) || 0;
        total += convertCurrency(balance, acc.currency, settings.baseCurrency, settings);
    });

    return total;
}, [accounts, transactions, settings]);


  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
            summary={summary} 
            budgets={budgets} 
            recentTransactions={transactions.slice(0, 5)} 
            accounts={accounts} 
            transactions={transactions}
            goals={goals}
            contributions={contributions}
            categories={categories}
            onAddTransaction={() => setIsModalOpen(true)}
            settings={settings}
            totalNetWorth={totalNetWorth}
        />;
      case 'transactions':
        return <Transactions 
            transactions={transactions} 
            accounts={accounts}
            categories={categories}
            onDeleteTransaction={deleteTransaction} 
            onAddTransaction={() => setIsModalOpen(true)}
            settings={settings}
            allTags={allTags}
        />;
      case 'accounts':
        return <Accounts 
            accounts={accounts} 
            transactions={transactions}
            addAccount={addAccount}
            updateAccount={updateAccount}
            deleteAccount={deleteAccount}
            settings={settings}
            goals={goals}
            contributions={contributions}
        />;
      case 'goals':
        return <Goals 
          goals={goals}
          contributions={contributions}
          accounts={accounts}
          addGoal={addGoal}
          updateGoal={updateGoal}
          deleteGoal={deleteGoal}
          addContribution={addContribution}
          addTransaction={addTransaction}
          settings={settings}
        />;
      case 'debt':
        return <DebtPlanner
            accounts={accounts}
            transactions={transactions}
            settings={settings}
            addAccount={addAccount}
        />;
      case 'reports':
        return <Reports transactions={transactions} accounts={accounts} categories={categories} settings={settings} budgets={budgets}/>;
      case 'advisor':
        return <Advisor transactions={transactions} accounts={accounts} categories={categories} settings={settings}/>;
      case 'budgets':
        return <Budgets 
          budgets={budgets} 
          transactions={transactions}
          categories={categories}
          accounts={accounts}
          addBudget={addBudget} 
          updateBudget={updateBudget} 
          deleteBudget={deleteBudget}
          settings={settings}
        />;
      case 'recurring':
        return <Recurring 
            recurringTransactions={recurringTransactions} 
            accounts={accounts}
            categories={categories}
            addRecurringTransaction={addRecurringTransaction} 
            updateRecurringTransaction={updateRecurringTransaction} 
            deleteRecurringTransaction={deleteRecurringTransaction}
            settings={settings}
            allTags={allTags}
            addTag={addTagToGlobalList}
        />;
      case 'settings':
        return <Settings 
          settings={settings}
          updateBaseCurrency={updateBaseCurrency}
          updateExchangeRates={updateExchangeRates}
          updateTheme={updateTheme}
          updateNavBarPosition={updateNavBarPosition}
          updateBudgetingStrategy={updateBudgetingStrategy}
          updatePayYourselfFirstSetting={updatePayYourselfFirstSetting}
          updateDefaultTransactionView={updateDefaultTransactionView}
          updateDefaultAccountView={updateDefaultAccountView}
          updateDefaultGoalView={updateDefaultGoalView}
          updateDashboardWidgets={updateDashboardWidgets}
          categories={categories}
          addCategory={addCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          transactions={transactions}
          budgets={budgets}
          accounts={accounts}
          allTags={allTags}
          addTag={addTagToGlobalList}
          deleteTag={handleDeleteTag}
          renameTag={handleRenameTag}
        />;
      default:
        return <Dashboard 
            summary={summary} 
            budgets={budgets} 
            recentTransactions={transactions.slice(0, 5)} 
            accounts={accounts}
            transactions={transactions}
            goals={goals}
            contributions={contributions}
            categories={categories}
            onAddTransaction={() => setIsModalOpen(true)}
            settings={settings}
            totalNetWorth={totalNetWorth}
        />;
    }
  };

  const getLayoutClasses = (position: NavBarPosition) => {
    const baseClasses = "min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans";
    switch (position) {
        case 'top':
            return `${baseClasses} flex flex-col`;
        case 'bottom':
            return `${baseClasses} flex flex-col-reverse`;
        case 'left':
            return `${baseClasses} flex flex-row`;
        case 'right':
        default:
            return `${baseClasses} flex flex-row-reverse`;
    }
  }

  return (
    <div className={getLayoutClasses(settings.navBarPosition)}>
        <Header currentView={currentView} setCurrentView={setCurrentView} navBarPosition={settings.navBarPosition} />
        <main className="flex-1 overflow-y-auto">
            <div className="p-2 sm:p-4 lg:p-8 max-w-7xl mx-auto w-full">
                {renderView()}
            </div>
        </main>
        {isModalOpen && (
            <AddTransactionModal
            accounts={accounts}
            categories={categories}
            onClose={() => setIsModalOpen(false)}
            onAddTransaction={handleAddTransaction}
            settings={settings}
            allTags={allTags}
            addTag={addTagToGlobalList}
            />
        )}
    </div>
  );
};

export default App;