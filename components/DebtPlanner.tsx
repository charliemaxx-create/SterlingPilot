import React, { useState, useMemo } from 'react';
import { Account, Transaction, TransactionType, AppSettings, AccountType, DebtAccount, PayoffPlan, MonthlyBreakdown } from '../types';
import { formatCurrency } from '../utils/currency';
import AddDebtAccountModal from './AddDebtAccountModal';
import DebtDetailsModal from './DebtDetailsModal';
import DebtPayoffChart from './DebtPayoffChart';

interface DebtPlannerProps {
    accounts: Account[];
    transactions: Transaction[];
    settings: AppSettings;
    addAccount: (account: Omit<Account, 'id'>) => void;
}

type Strategy = 'snowball' | 'avalanche';

const calculatePayoffPlan = (debts: DebtAccount[], strategy: Strategy, extraPayment: number): PayoffPlan | null => {
    if (debts.length === 0) return null;

    let localDebts = debts.map(d => ({ ...d, balance: Math.abs(d.currentBalance) }));
    
    // Set the payoff order based on the strategy
    const payoffOrder = [...localDebts];
    if (strategy === 'snowball') {
        payoffOrder.sort((a, b) => a.balance - b.balance);
    } else { // avalanche
        payoffOrder.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    }

    let months = 0;
    const maxMonths = 480; // 40 years limit
    let totalInterestPaid = 0;
    const totalInterestPerAccount: Record<string, number> = {};
    const totalPaymentPerAccount: Record<string, number> = {};
    const payoffMonth: Record<string, number> = {};

    let snowball = extraPayment;
    
    const detailedSchedule: MonthlyBreakdown[] = [];

    while (localDebts.some(d => d.balance > 0) && months < maxMonths) {
        months++;
        let monthSnowball = snowball;

        const monthlyDetails: Record<string, any> = {};
        
        const debtsToProcess = localDebts.filter(d => d.balance > 0);

        // Calculate interest and minimum payments for all active debts
        for (const debt of debtsToProcess) {
            const startingBalance = debt.balance;
            const monthlyInterestRate = (debt.interestRate || 0) / 100 / 12;
            const interest = debt.balance * monthlyInterestRate;
            
            debt.balance += interest;
            totalInterestPaid += interest;
            totalInterestPerAccount[debt.id] = (totalInterestPerAccount[debt.id] || 0) + interest;

            const minPayment = debt.minimumPayment || 0;
            const actualMinPayment = Math.min(debt.balance, minPayment);
            debt.balance -= actualMinPayment;
            
            totalPaymentPerAccount[debt.id] = (totalPaymentPerAccount[debt.id] || 0) + actualMinPayment;

            monthlyDetails[debt.id] = {
                startingBalance,
                payment: actualMinPayment,
                interestPaid: interest,
                endingBalance: 0, // will be set after snowball
            };
        }

        // Apply snowball payment according to the defined order
        for (const debt of payoffOrder) {
             if (debt.balance <= 0 || monthSnowball <= 0) continue;

             const payment = Math.min(debt.balance, monthSnowball);
             debt.balance -= payment;
             monthSnowball -= payment;
             
             totalPaymentPerAccount[debt.id] = (totalPaymentPerAccount[debt.id] || 0) + payment;
             monthlyDetails[debt.id].payment += payment;
             
             if (debt.balance <= 0) {
                 snowball += debt.minimumPayment || 0;
                 if (!payoffMonth[debt.id]) {
                    payoffMonth[debt.id] = months;
                 }
             }
        }
        
        // Finalize monthly details
        const allDebtIds = debts.map(d => d.id);
        allDebtIds.forEach(id => {
            const debt = localDebts.find(d => d.id === id);
            if (monthlyDetails[id]) {
                monthlyDetails[id].endingBalance = debt ? Math.max(0, debt.balance) : 0;
            } else {
                // If a debt was already paid off, carry over zero values
                 monthlyDetails[id] = { startingBalance: 0, payment: 0, interestPaid: 0, endingBalance: 0 };
            }
        });
        
        detailedSchedule.push({
            month: months,
            details: monthlyDetails,
            totalRemainingBalance: localDebts.reduce((sum, d) => sum + d.balance, 0),
        });
    }
    
    const startDate = new Date();
    const debtFreeDate = new Date(startDate.setMonth(startDate.getMonth() + months));

    const schedule = debts.map(d => {
        const pMonth = payoffMonth[d.id] || months;
        const pDate = new Date();
        pDate.setMonth(pDate.getMonth() + pMonth);
        return {
            accountId: d.id,
            payoffDate: pDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            totalInterest: totalInterestPerAccount[d.id] || 0,
            totalPayment: totalPaymentPerAccount[d.id] || 0,
        };
    });


    return {
        schedule,
        totalInterestPaid,
        debtFreeDate: debtFreeDate.toLocaleDateString('default', { month: 'long', year: 'numeric' }),
        detailedSchedule,
        totalMonths: months,
    };
};

const DebtPlanner: React.FC<DebtPlannerProps> = ({ accounts, transactions, settings, addAccount }) => {
    const [strategy, setStrategy] = useState<Strategy>('snowball');
    const [extraPayment, setExtraPayment] = useState(100);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingDetailsFor, setViewingDetailsFor] = useState<DebtAccount | null>(null);

    const debtAccounts = useMemo<DebtAccount[]>(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => balances.set(acc.id, acc.initialBalance || 0));

        transactions.forEach(t => {
            const currentBalance = balances.get(t.accountId) || 0;
            const amount = t.type === TransactionType.INCOME ? t.amount : -t.amount;
            balances.set(t.accountId, currentBalance + amount);
        });

        return accounts
            .filter(acc => (acc.type === AccountType.CREDIT_CARD || acc.type === AccountType.LOAN || acc.type === AccountType.LIABILITY) && (balances.get(acc.id) || 0) < 0)
            .map(acc => ({ ...acc, currentBalance: balances.get(acc.id) || 0 }));
    }, [accounts, transactions]);

    const payoffPlan = useMemo(() => {
        return calculatePayoffPlan(debtAccounts, strategy, extraPayment);
    }, [debtAccounts, strategy, extraPayment]);

    const baselinePlan = useMemo(() => {
        return calculatePayoffPlan(debtAccounts, strategy, 0);
    }, [debtAccounts, strategy]);

    const simulationImpact = useMemo(() => {
        if (!payoffPlan || !baselinePlan || extraPayment <= 0) {
            return null;
        }
        const interestSaved = baselinePlan.totalInterestPaid - payoffPlan.totalInterestPaid;
        const monthsSaved = baselinePlan.totalMonths - payoffPlan.totalMonths;

        if (monthsSaved <= 0 && interestSaved <= 0) {
            return null;
        }

        return { interestSaved, monthsSaved };
    }, [payoffPlan, baselinePlan, extraPayment]);
    
    const totalDebt = useMemo(() => debtAccounts.reduce((sum, acc) => sum + Math.abs(acc.currentBalance), 0), [debtAccounts]);
    const totalOriginalDebt = useMemo(() => debtAccounts.reduce((sum, acc) => sum + Math.abs(acc.originalAmount || acc.initialBalance), 0), [debtAccounts]);
    const totalAmountPaid = totalOriginalDebt > totalDebt ? totalOriginalDebt - totalDebt : 0;
    const overallProgress = totalOriginalDebt > 0 ? (totalAmountPaid / totalOriginalDebt) * 100 : (totalDebt > 0 ? 0 : 100);

    const baseCurrency = settings.baseCurrency;
    
    const orderedSchedule = useMemo(() => {
        if (!payoffPlan) return [];
        
        const planMap = new Map(payoffPlan.schedule.map(s => [s.accountId, s]));

        const sortedDebts = [...debtAccounts];
        if (strategy === 'snowball') {
            sortedDebts.sort((a, b) => Math.abs(a.currentBalance) - Math.abs(b.currentBalance));
        } else {
            sortedDebts.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
        }

        return sortedDebts.map(debt => ({
            ...debt,
            ...planMap.get(debt.id)
        }));

    }, [payoffPlan, debtAccounts, strategy]);
    
    const handleSaveDebtAccount = (accountData: Omit<Account, 'id'>) => {
        addAccount(accountData);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Debt Payoff Planner</h1>
                 <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-colors"
                >
                    + Add Debt Account
                </button>
            </div>

            {debtAccounts.length === 0 ? (
                 <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">You have no debt accounts (Credit Cards or Loans with a negative balance).</p>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Click 'Add Debt Account' to start planning!</p>
                </div>
            ) : (
            <>
                {/* Controls */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Scenario Simulator</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payoff Strategy</label>
                            <div className="flex rounded-md shadow-sm">
                                <button onClick={() => setStrategy('snowball')} className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-l-md w-full ${strategy === 'snowball' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>Debt Snowball</button>
                                <button onClick={() => setStrategy('avalanche')} className={`-ml-px px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md w-full ${strategy === 'avalanche' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>Debt Avalanche</button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {strategy === 'snowball' ? 'Focus on smallest balance first for quick wins.' : 'Focus on highest interest rate first to save more money.'}
                            </p>
                        </div>
                        <div>
                            <label htmlFor="extraPayment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Monthly Payment: <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(extraPayment, baseCurrency)}</span></label>
                            <input 
                                type="range" 
                                id="extraPayment" 
                                value={extraPayment} 
                                onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)} 
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
                                min="0" 
                                max="1000" 
                                step="10" 
                            />
                        </div>
                    </div>

                    {simulationImpact && (
                        <div className="mt-6 bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500 p-4 rounded-r-lg">
                            <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Payoff Simulation Impact</h3>
                            <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                                By paying an extra <span className="font-bold">{formatCurrency(extraPayment, baseCurrency)}</span> per month, you could achieve your goal faster and save money.
                            </p>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-white/60 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Time Saved</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {simulationImpact.monthsSaved} {simulationImpact.monthsSaved === 1 ? 'Month' : 'Months'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Sooner Debt-Free</p>
                                </div>
                                <div className="bg-white/60 dark:bg-gray-700/50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Interest Saved</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(simulationImpact.interestSaved, baseCurrency)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Less Interest Paid</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Overall Progress Summary */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col lg:flex-row items-center gap-8">
                    <div className="w-full lg:w-2/3">
                        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Overall Debt Progress</h2>
                        <div className="flex justify-between items-center mb-1 text-gray-800 dark:text-white">
                            <span className="font-bold text-lg">{formatCurrency(totalAmountPaid, baseCurrency)}</span>
                            <span className="text-sm">of {formatCurrency(totalOriginalDebt, baseCurrency)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-primary-600 h-4 rounded-full flex items-center justify-center transition-all duration-500" style={{ width: `${overallProgress}%` }}>
                               <span className="text-xs font-bold text-white whitespace-nowrap px-2">{overallProgress.toFixed(1)}% Paid Off</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 text-center lg:text-left">
                         <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Debt</p>
                            <p className="text-xl font-bold">{formatCurrency(totalDebt, baseCurrency)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Debt Free By</p>
                            <p className="text-xl font-bold text-green-500">{payoffPlan?.debtFreeDate}</p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Interest</p>
                            <p className="text-xl font-bold text-red-500">{formatCurrency(payoffPlan?.totalInterestPaid || 0, baseCurrency)}</p>
                        </div>
                    </div>
                </div>

                {/* Payoff Chart */}
                {payoffPlan && orderedSchedule.length > 0 && (
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Projected Payoff Timeline</h2>
                        <div className="h-96">
                            <DebtPayoffChart 
                                plan={payoffPlan} 
                                accounts={orderedSchedule}
                                baseCurrency={baseCurrency}
                            />
                        </div>
                    </div>
                )}


                {/* Payoff Schedule */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Payoff Order & Schedule</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-center hidden sm:table-cell">Order</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase">Debt / Progress</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right">Balance</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden lg:table-cell">APR</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase text-right hidden lg:table-cell">Min. Pmt</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-ray-300 uppercase text-right">Payoff Date</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 dark:text-ray-300 uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                            {orderedSchedule.map((debt, index) => {
                                const originalBalance = debt.originalAmount || Math.abs(debt.initialBalance);
                                const currentBalance = Math.abs(debt.currentBalance);
                                const amountPaid = originalBalance > currentBalance ? originalBalance - currentBalance : 0;
                                const progress = originalBalance > 0 ? (amountPaid / originalBalance) * 100 : (currentBalance > 0 ? 0 : 100);
                                const orderText = ['1st', '2nd', '3rd'][index] || `${index + 1}th`;

                                return (
                                    <tr key={debt.id} className={`border-b dark:border-gray-700 last:border-b-0 ${index === 0 ? 'bg-primary-50 dark:bg-primary-900/50' : ''}`}>
                                        <td className="py-4 px-4 text-center align-middle hidden sm:table-cell">
                                            <div className="font-bold text-lg text-primary-600">{orderText}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">to Payoff</div>
                                        </td>
                                        <td className="py-4 px-4 align-middle min-w-[200px] sm:min-w-[250px]">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-semibold text-gray-800 dark:text-white truncate" title={debt.name}>{debt.name}</div>
                                                <div className="text-sm font-bold text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2">{progress.toFixed(1)}%</div>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 relative">
                                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                <span>{formatCurrency(amountPaid, debt.currency)} paid</span>
                                                <span>Goal: {formatCurrency(originalBalance, debt.currency)}</span>
                                            </div>
                                            <div className="lg:hidden text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between flex-wrap gap-x-4">
                                                <span>APR: <strong>{debt.interestRate?.toFixed(2) || 'N/A'}%</strong></span>
                                                <span>Min. Pmt: <strong>{formatCurrency(debt.minimumPayment || 0, debt.currency)}</strong></span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-mono text-right align-middle">{formatCurrency(currentBalance, debt.currency)}</td>
                                        <td className="py-4 px-4 text-right align-middle hidden lg:table-cell">{debt.interestRate?.toFixed(2) || 'N/A'}%</td>
                                        <td className="py-4 px-4 text-right align-middle hidden lg:table-cell">{formatCurrency(debt.minimumPayment || 0, debt.currency)}</td>
                                        <td className="py-4 px-4 text-right font-semibold align-middle">{debt.payoffDate}</td>
                                        <td className="py-4 px-4 text-center align-middle">
                                            <button
                                                onClick={() => setViewingDetailsFor(debt)}
                                                className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-semibold"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                        {orderedSchedule.length > 0 && <p className="text-xs text-gray-500 mt-2">* Highlighted row is your current focus account.</p>}
                    </div>
                </div>
                
                {/* Full Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <details className="p-6">
                        <summary className="text-xl font-semibold cursor-pointer">Full Month-by-Month Breakdown</summary>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        <th rowSpan={2} className="py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">Month</th>
                                        {orderedSchedule.map(debt => (
                                            <th key={debt.id} colSpan={4} className="py-3 px-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-l border-gray-200 dark:border-gray-600">{debt.name}</th>
                                        ))}
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        {orderedSchedule.map(debt => (
                                            <React.Fragment key={debt.id}>
                                                <th className="py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-l border-gray-200 dark:border-gray-600 text-right">Balance</th>
                                                <th className="py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-gray-200 dark:border-gray-600 text-right">Payment</th>
                                                <th className="py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-gray-200 dark:border-gray-600 text-right">Interest</th>
                                                <th className="py-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase border-b-2 border-gray-200 dark:border-gray-600 text-right">New Bal.</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoffPlan?.detailedSchedule.map(month => (
                                        <tr key={month.month} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                            <td className="py-2 px-3 text-center font-semibold border-b border-gray-200 dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-800 z-10">{month.month}</td>
                                            {orderedSchedule.map(debt => {
                                                const details = month.details[debt.id];
                                                if (!details) return <td colSpan={4} key={debt.id}></td>;
                                                const isPaidOff = details.startingBalance === 0 && details.endingBalance === 0 && month.month > 1;
                                                return (
                                                    <React.Fragment key={debt.id}>
                                                        <td className={`py-2 px-2 font-mono text-xs text-right border-b border-l border-gray-200 dark:border-gray-600 ${isPaidOff ? 'text-gray-400' : ''}`}>{formatCurrency(details.startingBalance, debt.currency)}</td>
                                                        <td className={`py-2 px-2 font-mono text-xs text-right border-b border-gray-200 dark:border-gray-600 ${details.payment > (debt.minimumPayment || 0) ? 'text-green-500 font-bold' : isPaidOff ? 'text-gray-400' : ''}`}>{formatCurrency(details.payment, debt.currency)}</td>
                                                        <td className={`py-2 px-2 font-mono text-xs text-right border-b border-gray-200 dark:border-gray-600 ${isPaidOff ? 'text-gray-400' : 'text-red-500'}`}>{formatCurrency(details.interestPaid, debt.currency)}</td>
                                                        <td className={`py-2 px-2 font-mono text-xs text-right border-b border-gray-200 dark:border-gray-600 ${isPaidOff ? 'text-gray-400' : 'font-semibold'}`}>{formatCurrency(details.endingBalance, debt.currency)}</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div>
            </>
            )}

            {isModalOpen && (
                <AddDebtAccountModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveDebtAccount}
                    settings={settings}
                />
            )}

            {viewingDetailsFor && payoffPlan && (
                <DebtDetailsModal
                    debt={viewingDetailsFor}
                    fullPlan={payoffPlan}
                    onClose={() => setViewingDetailsFor(null)}
                />
            )}
        </div>
    );
};

export default DebtPlanner;