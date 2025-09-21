export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum BudgetingStrategy {
    ENVELOPE = 'envelope',
    FIFTY_THIRTY_TWENTY = '50-30-20',
    PAY_YOURSELF_FIRST = 'pay-yourself-first',
    SIMPLE = 'simple',
}

export type Rule503020 = 'needs' | 'wants' | 'savings';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parentId?: string;
  expenseBucket?: ExpenseBucket;
  rule503020?: Rule503020;
}

export enum Frequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

export enum AccountType {
    BANK = 'Bank Accounts',
    CASH = 'Cash Accounts',
    CREDIT_CARD = 'Credit Card Accounts',
    LOAN = 'Loan Accounts',
    LIABILITY = 'Liability Accounts',
    OTHER = 'Other',
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export interface ExchangeRate {
    from: string; // Currency code
    to: string; // Currency code
    rate: number;
}

export enum DashboardWidgetType {
    ACCOUNTS = 'ACCOUNTS',
    GOALS = 'GOALS',
    BUDGETS = 'BUDGETS',
    PIE_CHART = 'PIE_CHART',
    RECENT_TRANSACTIONS = 'RECENT_TRANSACTIONS',
    TOTAL_BUDGET_REMAINING = 'TOTAL_BUDGET_REMAINING',
    BALANCE = 'BALANCE',
}

export enum ExpenseBucket {
    FIXED = 'Fixed Expenses',
    FLEXIBLE = 'Flexible Spending',
    NON_MONTHLY = 'Non-Monthly Costs',
}

export interface DashboardWidget {
    id: string;
    type: DashboardWidgetType;
    isVisible: boolean;
}

export type Theme = 'light' | 'dark' | 'system';

export type NavBarPosition = 'top' | 'bottom' | 'left' | 'right';

export type DefaultTransactionView = 'this_month' | 'last_30_days' | 'this_year' | 'all';

export interface AppSettings {
    baseCurrency: string; // Currency code
    exchangeRates: ExchangeRate[];
    dashboardWidgets: DashboardWidget[];
    theme: Theme;
    navBarPosition: NavBarPosition;
    budgetingStrategy: BudgetingStrategy;
    payYourselfFirstSetting: {
        type: 'amount' | 'percentage';
        value: number;
    };
    defaultTransactionView: DefaultTransactionView;
    defaultAccountView: 'tile' | 'list';
    defaultGoalView: 'tile' | 'list';
}

export interface Account {
    id: string;
    name: string;
    type: AccountType;
    initialBalance: number;
    currency: string; // Currency code e.g. 'USD'
    interestRate?: number; // Annual Percentage Rate (APR)
    minimumPayment?: number;
    originationDate?: string; // e.g., '2022-01-15'
    originalTermMonths?: number;
    originalAmount?: number; // For loans, the original principal amount
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  date: string;
  isRecurring?: boolean;
  recurringTransactionId?: string;
  expenseBucket?: ExpenseBucket;
  splitGroupId?: string;
  tags?: string[];
}

export interface RecurringTransaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    type: TransactionType;
    categoryId: string;
    frequency: Frequency;
    startDate: string;
    expenseBucket?: ExpenseBucket;
    splitGroupId?: string;
    tags?: string[];
}

export interface TransactionException {
    recurringTransactionId: string;
    date: string; // The date of the specific instance that was deleted/skipped
}

export interface Budget {
    id:string;
    categoryId: string;
    limit: number;
    currency: string; // Currency code
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    expensesByCategoryId: Record<string, number>;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    startDate?: string;
    deadline?: string;
    currency: string; // Currency code
    accountId?: string;
}

export interface GoalContribution {
    id: string;
    goalId: string;
    amount: number; // Stored in the goal's currency
    date: string;
}

export interface DebtAccount extends Account {
    currentBalance: number;
}

export interface PayoffStepDetails {
    startingBalance: number;
    payment: number;
    interestPaid: number;
    endingBalance: number;
}

export interface MonthlyBreakdown {
    month: number;
    details: Record<string, PayoffStepDetails>; // key is accountId
    totalRemainingBalance: number;
}

export interface PayoffPlan {
    schedule: { accountId: string; payoffDate: string; totalInterest: number, totalPayment: number }[];
    totalInterestPaid: number;
    debtFreeDate: string;
    detailedSchedule: MonthlyBreakdown[];
    totalMonths: number;
}