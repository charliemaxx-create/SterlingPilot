import React, { useState, useMemo } from 'react';
import { RecurringTransaction, Account, Frequency, TransactionType, Category, AppSettings } from '../types';
import { formatCurrency } from '../utils/currency';
import AddRecurringTransactionModal from './AddRecurringTransactionModal';

interface CalendarProps {
    recurringTransactions: RecurringTransaction[];
    accounts: Account[];
    categories: Category[];
    addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => void;
    settings: AppSettings;
    allTags: string[];
    addTag: (tag: string) => void;
}

interface ScheduledEvent extends RecurringTransaction {
    accountName: string;
    currency: string;
    categoryName: string;
}

const Calendar: React.FC<CalendarProps> = ({ recurringTransactions, accounts, categories, addRecurringTransaction, settings, allTags, addTag }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc])), [accounts]);
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const scheduledEventsByDate = useMemo(() => {
        const events = new Map<string, ScheduledEvent[]>();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const advanceMonth = (date: Date) => {
            const newDate = new Date(date);
            const originalDay = newDate.getDate();
            newDate.setMonth(newDate.getMonth() + 1);
            // If the new date's day of month has changed, it means we overflowed.
            // In that case, set date to 0, which is the last day of the previous month.
            if (newDate.getDate() !== originalDay) {
                newDate.setDate(0);
            }
            return newDate;
        };

        recurringTransactions.forEach(rt => {
            const account = accountMap.get(rt.accountId);
            if (!account) return;

            // Correctly parse date string to avoid timezone issues by treating it as local midnight.
            const startDateParts = rt.startDate.split('-').map(Number);
            let eventDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);

            while (eventDate <= lastDayOfMonth) {
                if (eventDate >= firstDayOfMonth) {
                    const dateStr = eventDate.toISOString().split('T')[0];
                    if (!events.has(dateStr)) {
                        events.set(dateStr, []);
                    }
                    events.get(dateStr)!.push({
                        ...rt,
                        accountName: account.name,
                        currency: account.currency,
                        categoryName: categoryMap.get(rt.categoryId) || 'Unknown'
                    });
                }

                switch (rt.frequency) {
                    case Frequency.DAILY:
                        eventDate.setDate(eventDate.getDate() + 1);
                        break;
                    case Frequency.WEEKLY:
                        eventDate.setDate(eventDate.getDate() + 7);
                        break;
                    case Frequency.MONTHLY:
                        eventDate = advanceMonth(eventDate);
                        break;
                }
            }
        });
        return events;
    }, [currentDate, recurringTransactions, accountMap, categoryMap]);
    
    const handleSaveRecurring = (data: Omit<RecurringTransaction, 'id'>[]) => {
        data.forEach(t => addRecurringTransaction(t));
        setIsModalOpen(false);
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDay(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDay(null);
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-6">
            <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Previous month">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Next month">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    );
    
    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 text-xs sm:text-sm">{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = firstDayOfMonth.getDay();
        const today = new Date();

        const cells = [];
        for (let i = 0; i < startingDay; i++) {
            cells.push(<div key={`empty-${i}`} className="border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            const dateStr = cellDate.toISOString().split('T')[0];
            const events = scheduledEventsByDate.get(dateStr) || [];
            const isToday = today.toDateString() === cellDate.toDateString();
            const isSelected = selectedDay && selectedDay.toDateString() === cellDate.toDateString();

            cells.push(
                <div
                    key={day}
                    className={`border rounded-lg p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] flex flex-col cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-100 dark:bg-primary-900 border-primary-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedDay(cellDate)}
                    role="button"
                    aria-label={`View payments for ${cellDate.toLocaleDateString()}`}
                >
                    <span className={`font-bold text-xs sm:text-base ${isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto text-xs flex-grow">
                        {events.map(event => (
                             <div key={event.id} className={`p-1 rounded truncate text-[10px] sm:text-xs ${event.type === TransactionType.INCOME ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`} title={event.description}>
                                {event.description}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">{cells}</div>;
    };
    
    const renderSelectedDayDetails = () => {
        if (!selectedDay) return (
             <div className="hidden lg:block lg:w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ml-8">
                 <div className="flex flex-col h-full justify-center items-center text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Select a day</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click on a day in the calendar to see its scheduled payments.</p>
                </div>
             </div>
        );

        const dateStr = selectedDay.toISOString().split('T')[0];
        const events = scheduledEventsByDate.get(dateStr) || [];

        return (
            <div className="mt-8 lg:mt-0 lg:w-1/3 xl:w-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 lg:ml-8 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {selectedDay.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close details">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {events.length > 0 ? (
                        <ul className="space-y-4">
                            {events.map(event => {
                                const isIncome = event.type === TransactionType.INCOME;
                                const amountColor = isIncome ? 'text-green-500' : 'text-red-500';
                                const amountPrefix = isIncome ? '+' : '-';
                                return (
                                    <li key={event.id} className="border-b dark:border-gray-700 pb-2 last:border-b-0">
                                        <p className="font-semibold">{event.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{event.accountName} - {event.categoryName}</p>
                                        <p className={`text-sm font-bold ${amountColor}`}>{amountPrefix} {formatCurrency(event.amount, event.currency)}</p>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No scheduled payments for this day.</p>
                    )}
                </div>
                 <div className="mt-auto pt-4 border-t dark:border-gray-700">
                    <button onClick={() => setIsModalOpen(true)} className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-primary-700">
                        + Add Recurring Payment
                    </button>
                </div>
            </div>
        )
    };

    return (
        <>
            <div className="flex flex-col lg:flex-row">
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>
                {renderSelectedDayDetails()}
            </div>
            {isModalOpen && selectedDay && (
                <AddRecurringTransactionModal
                    accounts={accounts}
                    categories={categories}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveRecurring}
                    settings={settings}
                    allTags={allTags}
                    addTag={addTag}
                    defaultStartDate={selectedDay.toISOString().split('T')[0]}
                />
            )}
        </>
    );
};

export default Calendar;