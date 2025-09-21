import { useState, useEffect, useCallback } from 'react';
import { AppSettings, ExchangeRate, DashboardWidget, DashboardWidgetType, Theme, BudgetingStrategy, DefaultTransactionView, NavBarPosition } from '../types';

const STORAGE_KEY = 'fintrack-ai-settings';

const defaultWidgets: DashboardWidget[] = [
    { id: '1', type: DashboardWidgetType.PIE_CHART, isVisible: true },
    { id: '2', type: DashboardWidgetType.ACCOUNTS, isVisible: true },
    { id: '3', type: DashboardWidgetType.GOALS, isVisible: true },
    { id: '4', type: DashboardWidgetType.RECENT_TRANSACTIONS, isVisible: true },
    { id: '5', type: DashboardWidgetType.BUDGETS, isVisible: true },
    { id: '6', type: DashboardWidgetType.TOTAL_BUDGET_REMAINING, isVisible: true },
    { id: '7', type: DashboardWidgetType.BALANCE, isVisible: true },
];

const initialSettings: AppSettings = {
    baseCurrency: 'USD',
    exchangeRates: [
        { from: 'USD', to: 'EUR', rate: 0.93 },
        { from: 'USD', to: 'GBP', rate: 0.80 },
    ],
    dashboardWidgets: defaultWidgets,
    theme: 'system',
    navBarPosition: 'left',
    budgetingStrategy: BudgetingStrategy.ENVELOPE,
    payYourselfFirstSetting: { type: 'percentage', value: 10 },
    defaultTransactionView: 'this_month',
    defaultAccountView: 'tile',
    defaultGoalView: 'tile',
};

const WIDGET_MIGRATIONS: { type: DashboardWidgetType }[] = [
    { type: DashboardWidgetType.TOTAL_BUDGET_REMAINING },
    { type: DashboardWidgetType.BALANCE },
];

export const useSettings = () => {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsedSettings = JSON.parse(stored);
                // Migration: if old settings object doesn't have properties, add them.
                if (!parsedSettings.dashboardWidgets) {
                    parsedSettings.dashboardWidgets = defaultWidgets;
                } else {
                    // Migration for new widgets
                    WIDGET_MIGRATIONS.forEach(migration => {
                         const hasWidget = parsedSettings.dashboardWidgets.some((w: DashboardWidget) => w.type === migration.type);
                         if (!hasWidget) {
                            const maxId = parsedSettings.dashboardWidgets.reduce((max: number, w: DashboardWidget) => Math.max(max, parseInt(w.id)), 0);
                            parsedSettings.dashboardWidgets.push({
                                id: (maxId + 1).toString(),
                                type: migration.type,
                                isVisible: true,
                            });
                         }
                    });
                }
                if (!parsedSettings.theme) {
                    parsedSettings.theme = 'system';
                }
                if (!parsedSettings.navBarPosition) {
                    parsedSettings.navBarPosition = 'left';
                }
                if (!parsedSettings.budgetingStrategy) {
                    parsedSettings.budgetingStrategy = BudgetingStrategy.ENVELOPE;
                }
                if (!parsedSettings.payYourselfFirstSetting) {
                    parsedSettings.payYourselfFirstSetting = { type: 'percentage', value: 10 };
                }
                if (!parsedSettings.defaultTransactionView) {
                    parsedSettings.defaultTransactionView = 'this_month';
                }
                if (!parsedSettings.defaultAccountView) {
                    parsedSettings.defaultAccountView = 'tile';
                }
                if (!parsedSettings.defaultGoalView) {
                    parsedSettings.defaultGoalView = 'tile';
                }
                setSettings(parsedSettings);
            } else {
                setSettings(initialSettings);
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
            setSettings(initialSettings);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    const updateBaseCurrency = useCallback((newBaseCurrency: string) => {
        setSettings(prev => ({ ...prev, baseCurrency: newBaseCurrency }));
    }, []);

    const updateExchangeRates = useCallback((newRates: ExchangeRate[]) => {
        setSettings(prev => ({ ...prev, exchangeRates: newRates }));
    }, []);
    
    const updateDashboardWidgets = useCallback((newWidgets: DashboardWidget[]) => {
        setSettings(prev => ({ ...prev, dashboardWidgets: newWidgets }));
    }, []);

    const updateTheme = useCallback((newTheme: Theme) => {
        setSettings(prev => ({ ...prev, theme: newTheme }));
    }, []);

    const updateNavBarPosition = useCallback((position: NavBarPosition) => {
        setSettings(prev => ({...prev, navBarPosition: position}));
    }, []);

    const updateBudgetingStrategy = useCallback((strategy: BudgetingStrategy) => {
        setSettings(prev => ({ ...prev, budgetingStrategy: strategy }));
    }, []);

    const updatePayYourselfFirstSetting = useCallback((setting: { type: 'amount' | 'percentage', value: number }) => {
        setSettings(prev => ({ ...prev, payYourselfFirstSetting: setting }));
    }, []);

    const updateDefaultTransactionView = useCallback((view: DefaultTransactionView) => {
        setSettings(prev => ({ ...prev, defaultTransactionView: view }));
    }, []);

    const updateDefaultAccountView = useCallback((view: 'tile' | 'list') => {
        setSettings(prev => ({ ...prev, defaultAccountView: view }));
    }, []);

    const updateDefaultGoalView = useCallback((view: 'tile' | 'list') => {
        setSettings(prev => ({ ...prev, defaultGoalView: view }));
    }, []);

    return { settings, updateBaseCurrency, updateExchangeRates, updateDashboardWidgets, updateTheme, updateNavBarPosition, updateBudgetingStrategy, updatePayYourselfFirstSetting, updateDefaultTransactionView, updateDefaultAccountView, updateDefaultGoalView };
};
