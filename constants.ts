import { Category, Currency, TransactionType, ExpenseBucket } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
    // Expenses
    { id: 'exp-food', name: 'Food', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FLEXIBLE, rule503020: 'wants' },
    { id: 'exp-transport', name: 'Transport', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FLEXIBLE, rule503020: 'wants' },
    { id: 'exp-housing', name: 'Housing', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FIXED, rule503020: 'needs' },
    { id: 'exp-utilities', name: 'Utilities', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FIXED, rule503020: 'needs' },
    { id: 'exp-entertainment', name: 'Entertainment', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FLEXIBLE, rule503020: 'wants' },
    { id: 'exp-health', name: 'Health', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FLEXIBLE, rule503020: 'wants' },
    { id: 'exp-shopping', name: 'Shopping', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.FLEXIBLE, rule503020: 'wants' },
    { id: 'exp-savings-goals', name: 'Savings Goals', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.NON_MONTHLY, rule503020: 'savings' },
    { id: 'exp-other', name: 'Other', type: TransactionType.EXPENSE, expenseBucket: ExpenseBucket.NON_MONTHLY, rule503020: 'wants' },
    
    // Incomes
    { id: 'inc-salary', name: 'Salary', type: TransactionType.INCOME },
    { id: 'inc-business', name: 'Business', type: TransactionType.INCOME },
    { id: 'inc-investments', name: 'Investments', type: TransactionType.INCOME },
    { id: 'inc-gift', name: 'Gift', type: TransactionType.INCOME },
    { id: 'inc-other', name: 'Other', type: TransactionType.INCOME },
];


export const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'USD', name: 'United States Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'Ksh' },
];