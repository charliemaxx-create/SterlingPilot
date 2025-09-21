import { AppSettings } from '../types';
import { SUPPORTED_CURRENCIES } from '../constants';

export const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
};

export const formatCurrency = (amount: number, currencyCode: string): string => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    settings: AppSettings
): number => {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    // Direct rate
    const directRate = settings.exchangeRates.find(
        r => r.from === fromCurrency && r.to === toCurrency
    );
    if (directRate) {
        return amount * directRate.rate;
    }

    // Inverse rate
    const inverseRate = settings.exchangeRates.find(
        r => r.from === toCurrency && r.to === fromCurrency
    );
    if (inverseRate) {
        return amount / inverseRate.rate;
    }

    // Chained rate through base currency
    if (fromCurrency !== settings.baseCurrency && toCurrency !== settings.baseCurrency) {
        const amountInBase = convertCurrency(amount, fromCurrency, settings.baseCurrency, settings);
        return convertCurrency(amountInBase, settings.baseCurrency, toCurrency, settings);
    }
    
    console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}. Returning original amount.`);
    return amount; // or throw an error, depending on desired behavior
};