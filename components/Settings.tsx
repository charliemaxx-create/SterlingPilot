import React, { useState } from 'react';
import { AppSettings, ExchangeRate, Category, Transaction, Budget, Account, Theme, BudgetingStrategy, DashboardWidget, DefaultTransactionView, NavBarPosition } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';
import CategoryManager from './CategoryManager';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import CustomizeDashboardModal from './CustomizeDashboardModal';

interface SettingsProps {
    settings: AppSettings;
    updateBaseCurrency: (currencyCode: string) => void;
    updateExchangeRates: (rates: ExchangeRate[]) => void;
    updateTheme: (theme: Theme) => void;
    updateNavBarPosition: (position: NavBarPosition) => void;
    updateBudgetingStrategy: (strategy: BudgetingStrategy) => void;
    updatePayYourselfFirstSetting: (setting: { type: 'amount' | 'percentage'; value: number }) => void;
    updateDefaultTransactionView: (view: DefaultTransactionView) => void;
    updateDefaultAccountView: (view: 'tile' | 'list') => void;
    updateDefaultGoalView: (view: 'tile' | 'list') => void;
    updateDashboardWidgets: (widgets: DashboardWidget[]) => void;
    categories: Category[];
    addCategory: (category: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
    transactions: Transaction[];
    budgets: Budget[];
    accounts: Account[];
    allTags: string[];
    addTag: (tag: string) => void;
    deleteTag: (tag: string) => void;
    renameTag: (oldName: string, newName: string) => void;
}

const ThemeButton: React.FC<{
    label: string;
    value: Theme;
    currentTheme: Theme;
    onClick: (theme: Theme) => void;
    icon: JSX.Element;
}> = ({ label, value, currentTheme, onClick, icon }) => {
    const isActive = currentTheme === value;
    return (
        <button
            onClick={() => onClick(value)}
            className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-colors ${
                isActive 
                ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="font-semibold text-sm">{label}</span>
        </button>
    )
}

const PositionButton: React.FC<{
    label: string;
    value: NavBarPosition;
    currentPosition: NavBarPosition;
    onClick: (position: NavBarPosition) => void;
    icon: JSX.Element;
}> = ({ label, value, currentPosition, onClick, icon }) => {
    const isActive = currentPosition === value;
    return (
        <button
            onClick={() => onClick(value)}
            className={`w-24 h-24 p-4 rounded-lg border-2 flex flex-col items-center justify-center space-y-2 transition-colors ${
                isActive 
                ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
            {icon}
            <span className="font-semibold text-sm">{label}</span>
        </button>
    )
}

const STRATEGY_DETAILS: Record<BudgetingStrategy, { name: string, description: string }> = {
  [BudgetingStrategy.ENVELOPE]: { name: "Envelope Budgeting", description: "Allocate a spending limit for each category. Great for detailed control." },
  [BudgetingStrategy.FIFTY_THIRTY_TWENTY]: { name: "50/30/20 Rule", description: "Split your income: 50% for Needs, 30% for Wants, 20% for Savings." },
  [BudgetingStrategy.PAY_YOURSELF_FIRST]: { name: "Pay Yourself First", description: "Prioritize savings. Set aside a fixed amount first, then spend what's left." },
  [BudgetingStrategy.SIMPLE]: { name: "Simple Budget", description: "A high-level view of your income versus expenses. No complex categories." },
};

const StrategyCard: React.FC<{
    strategy: BudgetingStrategy;
    currentStrategy: BudgetingStrategy;
    onClick: (strategy: BudgetingStrategy) => void;
}> = ({ strategy, currentStrategy, onClick }) => {
    const isActive = currentStrategy === strategy;
    const details = STRATEGY_DETAILS[strategy];
    return (
        <button
            onClick={() => onClick(strategy)}
            className={`p-4 rounded-lg border-2 text-left transition-colors ${
                isActive 
                ? 'bg-primary-100 dark:bg-primary-900/50 border-primary-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
        >
            <h4 className="font-bold text-gray-800 dark:text-white">{details.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{details.description}</p>
        </button>
    );
};


const Settings: React.FC<SettingsProps> = ({ 
    settings, 
    updateBaseCurrency, 
    updateExchangeRates,
    updateTheme,
    updateNavBarPosition,
    updateBudgetingStrategy,
    updatePayYourselfFirstSetting,
    updateDefaultTransactionView,
    updateDefaultAccountView,
    updateDefaultGoalView,
    updateDashboardWidgets,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    transactions,
    budgets,
    accounts,
    allTags,
    addTag,
    deleteTag,
    renameTag
}) => {
    const [newRate, setNewRate] = useState<Omit<ExchangeRate, ''>>({ from: 'USD', to: 'EUR', rate: 0 });
    const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null);
    const [newTagInput, setNewTagInput] = useState('');

    const handleAddRate = () => {
        if (newRate.from === newRate.to || newRate.rate <= 0) {
            alert("Invalid exchange rate. 'From' and 'To' currencies cannot be the same, and rate must be positive.");
            return;
        }
        // Check for duplicate or inverse duplicate
        const exists = settings.exchangeRates.some(r => 
            (r.from === newRate.from && r.to === newRate.to) || (r.from === newRate.to && r.to === newRate.from)
        );
        if (exists) {
            alert("A rate between these two currencies already exists.");
            return;
        }

        updateExchangeRates([...settings.exchangeRates, newRate]);
        setNewRate({ from: 'USD', to: 'EUR', rate: 0 }); // Reset form
    };

    const handleDeleteRate = (index: number) => {
        const updatedRates = settings.exchangeRates.filter((_, i) => i !== index);
        updateExchangeRates(updatedRates);
    };

    const handleAddNewTag = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTag = newTagInput.trim();
        if (trimmedTag) {
            if (allTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
                alert(`Tag "${trimmedTag}" already exists.`);
            } else {
                addTag(trimmedTag);
                setNewTagInput('');
            }
        }
    };

    const handleRenameTag = (oldName: string) => {
        if (editingTag && editingTag.newName.trim()) {
            renameTag(oldName, editingTag.newName.trim());
        }
        setEditingTag(null);
    };

    const handleDeleteTag = (tagName: string) => {
        if (window.confirm(`Are you sure you want to delete the tag "${tagName}"? It will be removed from all transactions.`)) {
            deleteTag(tagName);
        }
    }

    const handleExportCSV = () => {
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const headers = ['Date', 'Description', 'Account', 'Category', 'Type', 'Amount', 'Currency', 'Tags'];
        
        const csvRows = transactions.map(t => {
            const account = accountMap.get(t.accountId);
            const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';
            const date = new Date(t.date).toISOString().split('T')[0];
            
            const description = `"${t.description.replace(/"/g, '""')}"`;
            const tags = `"${(t.tags || []).join(', ')}"`;

            return [
                date,
                description,
                account?.name || 'Unknown',
                categoryName,
                t.type,
                t.amount.toFixed(2),
                account?.currency || '',
                tags
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `sterlingpilot_transactions_${today}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const generatePrintableHTML = () => {
        const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        const transactionRows = transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => {
                const account = accountMap.get(t.accountId);
                const categoryName = categoryMap.get(t.categoryId) || 'Uncategorized';
                const date = new Date(t.date).toLocaleDateString();
                const amount = formatCurrency(t.amount, account?.currency || 'USD');
                const isIncome = t.type === 'income';
                const tagsHtml = (t.tags || []).map(tag => `<span style="background-color: #eee; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-right: 4px;">${tag}</span>`).join('');

                return `
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 8px;">${date}</td>
                        <td style="padding: 8px;">${t.description}<br/>${tagsHtml}</td>
                        <td style="padding: 8px;">${account?.name || 'Unknown'}</td>
                        <td style="padding: 8px;">${categoryName}</td>
                        <td style="padding: 8px; text-align: right; color: ${isIncome ? 'green' : 'red'};">${isIncome ? '+' : '-'}${amount}</td>
                    </tr>
                `;
            }).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>SterlingPilot - Transaction Report</title>
                <style>
                    @media print { body { -webkit-print-color-adjust: exact; } }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { text-align: left; padding: 8px; font-size: 12px; }
                    th { background-color: #f2f2f2; }
                    h1 { color: #059669; }
                </style>
            </head>
            <body>
                <h1>SterlingPilot - Transaction Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr style="border-bottom: 2px solid #333;">
                            <th style="padding: 8px;">Date</th>
                            <th style="padding: 8px;">Description</th>
                            <th style="padding: 8px;">Account</th>
                            <th style="padding: 8px;">Category</th>
                            <th style="padding: 8px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactionRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    };

     const handleExportPDF = () => {
        const htmlContent = generatePrintableHTML();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        } else {
            alert('Popup blocked! Please allow popups for this site to print the report.');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>
            
            {/* Personalization Settings */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Personalization</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard Widgets</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Organize and toggle the widgets on your dashboard.</p>
                        <button
                            onClick={() => setCustomizeModalOpen(true)}
                            className="mt-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Customize Dashboard
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="defaultAccountView" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Accounts View</label>
                            <select
                                id="defaultAccountView"
                                value={settings.defaultAccountView}
                                onChange={(e) => updateDefaultAccountView(e.target.value as 'tile' | 'list')}
                                className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="tile">Tile View</option>
                                <option value="list">List View</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="defaultGoalView" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Goals View</label>
                            <select
                                id="defaultGoalView"
                                value={settings.defaultGoalView}
                                onChange={(e) => updateDefaultGoalView(e.target.value as 'tile' | 'list')}
                                className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="tile">Tile View</option>
                                <option value="list">List View</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="defaultTxView" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Transaction Date Range</label>
                        <select
                            id="defaultTxView"
                            value={settings.defaultTransactionView}
                            onChange={(e) => updateDefaultTransactionView(e.target.value as DefaultTransactionView)}
                            className="w-full max-w-xs mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="this_year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Budgeting Strategy</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose a budgeting method that fits your style. This will change the layout and functionality of the 'Budgets' page.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(BudgetingStrategy).map(strategy => (
                        <StrategyCard key={strategy} strategy={strategy} currentStrategy={settings.budgetingStrategy} onClick={updateBudgetingStrategy} />
                    ))}
                </div>
                {settings.budgetingStrategy === BudgetingStrategy.PAY_YOURSELF_FIRST && (
                    <div className="mt-6 border-t dark:border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-2">"Pay Yourself First" Goal</h3>
                        <div className="flex items-center space-x-4 flex-wrap gap-2">
                            <select
                                value={settings.payYourselfFirstSetting.type}
                                onChange={e => updatePayYourselfFirstSetting({ ...settings.payYourselfFirstSetting, type: e.target.value as any })}
                                className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="percentage">Percentage of Income</option>
                                <option value="amount">Fixed Amount</option>
                            </select>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={settings.payYourselfFirstSetting.value}
                                    onChange={e => updatePayYourselfFirstSetting({ ...settings.payYourselfFirstSetting, value: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                    <span className="text-gray-500 sm:text-sm">{settings.payYourselfFirstSetting.type === 'amount' ? getCurrencySymbol(settings.baseCurrency) : '%'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                 <h2 className="text-xl font-semibold mb-4">Appearance</h2>
                 <div>
                    <h3 className="text-lg font-semibold mb-4">Theme</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Choose how SterlingPilot looks. Select 'System' to match your device's settings.
                    </p>
                    <div className="flex space-x-4">
                        <ThemeButton
                            label="Light"
                            value="light"
                            currentTheme={settings.theme}
                            onClick={updateTheme}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                        />
                        <ThemeButton
                            label="Dark"
                            value="dark"
                            currentTheme={settings.theme}
                            onClick={updateTheme}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                        />
                        <ThemeButton
                            label="System"
                            value="system"
                            currentTheme={settings.theme}
                            onClick={updateTheme}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                        />
                    </div>
                </div>
                <div className="mt-6 border-t dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Navigation Bar Position</h3>
                    <div className="flex flex-wrap gap-4">
                        <PositionButton label="Top" value="top" currentPosition={settings.navBarPosition} onClick={updateNavBarPosition} icon={<svg className="h-8 w-8 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z" /><path d="M3 8h18" /></svg>} />
                        <PositionButton label="Bottom" value="bottom" currentPosition={settings.navBarPosition} onClick={updateNavBarPosition} icon={<svg className="h-8 w-8 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z" /><path d="M3 16h18" /></svg>} />
                        <PositionButton label="Left" value="left" currentPosition={settings.navBarPosition} onClick={updateNavBarPosition} icon={<svg className="h-8 w-8 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z" /><path d="M8 3v18" /></svg>} />
                        <PositionButton label="Right" value="right" currentPosition={settings.navBarPosition} onClick={updateNavBarPosition} icon={<svg className="h-8 w-8 text-gray-600 dark:text-gray-300" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2z" /><path d="M16 3v18" /></svg>} />
                    </div>
                </div>
            </div>

            <CategoryManager 
                categories={categories}
                addCategory={addCategory}
                updateCategory={updateCategory}
                deleteCategory={deleteCategory}
                transactions={transactions}
                budgets={budgets}
            />
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Manage Tags</h2>
                <form onSubmit={handleAddNewTag} className="mb-6 flex gap-2 max-w-md">
                    <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="Create a new tag"
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    />
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700 text-sm transition-colors">
                        Add Tag
                    </button>
                </form>
                <div className="space-y-2 max-w-md">
                    {allTags.map(tag => (
                        <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {editingTag?.oldName === tag ? (
                                <input
                                    type="text"
                                    value={editingTag.newName}
                                    onChange={(e) => setEditingTag({ ...editingTag, newName: e.target.value })}
                                    onBlur={() => handleRenameTag(tag)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameTag(tag)}
                                    className="p-1 bg-white dark:bg-gray-600 rounded-md text-sm w-full"
                                    autoFocus
                                />
                            ) : (
                                <span className="font-medium text-sm">{tag}</span>
                            )}
                            <div className="flex space-x-3 ml-4">
                                <button onClick={() => setEditingTag({ oldName: tag, newName: tag })} className="text-gray-400 hover:text-primary-500" aria-label={`Rename tag ${tag}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handleDeleteTag(tag)} className="text-gray-400 hover:text-red-500" aria-label={`Delete tag ${tag}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Base Currency</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    This is the main currency for summary reports. All totals will be converted to this currency.
                </p>
                <select
                    value={settings.baseCurrency}
                    onChange={(e) => updateBaseCurrency(e.target.value)}
                    className="w-full max-w-xs p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                    {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                </select>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Manage Exchange Rates</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Set your own exchange rates for conversions. The app will also calculate inverse rates (e.g., EUR to USD).
                </p>
                <div className="mb-6 space-y-2">
                    {settings.exchangeRates.length > 0 ? settings.exchangeRates.map((rate, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                           <p className="font-mono text-sm">1 {rate.from} = {rate.rate} {rate.to}</p>
                           <button onClick={() => handleDeleteRate(index)} className="text-red-500 hover:text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                    )) : <p className="text-gray-500 text-center">No custom exchange rates set.</p>}
                </div>
                <div className="border-t dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold mb-3">Add New Rate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                         <div>
                            <label className="text-sm font-medium">From</label>
                            <select value={newRate.from} onChange={e => setNewRate(r => ({...r, from: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-sm font-medium">To</label>
                             <select value={newRate.to} onChange={e => setNewRate(r => ({...r, to: e.target.value}))} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                         </div>
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Rate</label>
                            <input type="number" value={newRate.rate} onChange={e => setNewRate(r => ({...r, rate: parseFloat(e.target.value) || 0}))} placeholder="e.g., 0.93" className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" step="0.0001" min="0"/>
                        </div>
                        <button onClick={handleAddRate} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 h-fit">
                            Add Rate
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Export Data</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Export your full transaction history in CSV or PDF format.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Export as CSV</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>Export as PDF</span>
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">About SterlingPilot</h2>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><span className="font-semibold text-gray-800 dark:text-gray-200">Version:</span> 1.0.0</p>
                    <p>
                        A personal finance application that helps you track your income and expenses, 
                        visualize your spending habits, and get personalized financial advice from an AI assistant.
                    </p>
                </div>
            </div>

            {isCustomizeModalOpen && (
                <CustomizeDashboardModal
                    widgets={settings.dashboardWidgets}
                    onClose={() => setCustomizeModalOpen(false)}
                    onSave={updateDashboardWidgets}
                />
            )}
        </div>
    );
};

export default Settings;