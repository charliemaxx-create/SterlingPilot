import React from 'react';
import { NavBarPosition } from '../types';

type View = 'dashboard' | 'transactions' | 'advisor' | 'budgets' | 'recurring' | 'accounts' | 'goals' | 'reports' | 'settings' | 'debt';

interface NavItem {
    view: View;
    label: string;
    icon: JSX.Element;
}

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  navBarPosition: NavBarPosition;
}

const NavLink: React.FC<{
  label: string;
  view: View;
  icon: JSX.Element;
  currentView: View;
  setCurrentView: (view: View) => void;
  navBarPosition: NavBarPosition;
}> = ({ label, view, icon, currentView, setCurrentView, navBarPosition }) => {
  const isActive = currentView === view;

  const getTooltipClasses = () => {
    switch(navBarPosition) {
      case 'left':
        return "absolute left-full ml-4 top-1/2 -translate-y-1/2";
      case 'top':
        return "absolute top-full mt-4 left-1/2 -translate-x-1/2";
      case 'bottom':
        return "absolute bottom-full mb-4 left-1/2 -translate-x-1/2";
      case 'right':
      default:
        return "absolute right-full mr-4 top-1/2 -translate-y-1/2";
    }
  }

  const getArrowClasses = () => {
    switch(navBarPosition) {
      case 'left':
        return "absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 transform rotate-45";
      case 'top':
        return "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 transform rotate-45";
      case 'bottom':
        return "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 transform rotate-45";
      case 'right':
      default:
        return "absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 transform rotate-45";
    }
  }

  const tooltipBaseClasses = "bg-gray-900 text-white text-sm rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none dark:bg-gray-700 z-50";
  const arrowBaseClasses = "bg-gray-900 dark:bg-gray-700";

  return (
    <div className="relative group flex justify-center">
        <button
            onClick={() => setCurrentView(view)}
            className={`w-12 h-12 rounded-lg transition-colors duration-200 flex items-center justify-center ${
                isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-primary-700 hover:text-white'
            }`}
            aria-label={label}
        >
            {icon}
        </button>
        <div className={`${tooltipBaseClasses} ${getTooltipClasses()}`}>
            {label}
            <div className={`${arrowBaseClasses} ${getArrowClasses()}`}></div>
        </div>
    </div>
  );
};

const mainNavItems: NavItem[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { view: 'transactions', label: 'Transactions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> },
    { view: 'accounts', label: 'Accounts', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9A2.25 2.25 0 0018.75 6.75h-1.5a2.25 2.25 0 00-2.25 2.25v1.5m1.5-1.5h-15" /></svg> },
    { view: 'goals', label: 'Goals', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> },
    { view: 'debt', label: 'Debt Planner', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 21z" /></svg> },
    { view: 'reports', label: 'Reports', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 21v-7.875zM12.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM21 3.75c0-.621-.504-1.125-1.125-1.125h-2.25a1.125 1.125 0 00-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h2.25a1.125 1.125 0 001.125-1.125V3.75z" /></svg> },
    { view: 'recurring', label: 'Recurring', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-4.991v4.99" /></svg> },
    { view: 'budgets', label: 'Budgets', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12m18 0v-2.25A2.25 2.25 0 0018.75 7.5H5.25A2.25 2.25 0 003 9.75v2.25m18 0v2.25a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25v-2.25m18 0l-2.939 5.878A2.25 2.25 0 0116.342 19.5H7.658a2.25 2.25 0 01-1.71-3.372L3 12.001M12 12V9" /></svg> },
];

const secondaryNavItems: NavItem[] = [
    { view: 'advisor', label: 'AI Advisor', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.672-2.672L11.25 18l1.938-.648a3.375 3.375 0 002.672-2.672L16.25 13.5l.648 1.938a3.375 3.375 0 002.672 2.672L21 18.75l-1.938.648a3.375 3.375 0 00-2.672 2.672z" /></svg> },
    { view: 'settings', label: 'Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.008 1.11-1.227l.11-.041c.49-.185.992-.32 1.493-.414l.11-.019c.59-.104 1.18-.163 1.77-.193l.11-.005c.61-.027 1.21-.038 1.81-.038h.002c.62 0 1.22.016 1.83.045l.109.005c.59.03 1.18.089 1.77.193l.11.019c.501.094 1.003.229 1.493.414l.11.041c.55.219 1.02.685 1.11 1.227l.019.11c.094.501.229 1.003.414 1.493l.041.11c.219.55.685 1.02 1.227 1.11l.11.019c.501.094 1.003.229 1.493.414l.019.11c.104.59.163 1.18.193 1.77l.005.11c.027.61.038 1.21.038 1.81v.002c0 .62-.016 1.22-.045 1.83l-.005.109c-.03.59-.089 1.18-.193 1.77l-.019.11c-.094.501-.229 1.003-.414 1.493l-.041.11c-.219.55-.685 1.02-1.227 1.11l-.11.019c-.501.094-1.003.229-1.493.414l-.11.041c-.55.219-1.02.685-1.11 1.227l-.019.11c-.094.501-.229 1.003-.414 1.493l-.041.11c-.219.55-.685 1.02-1.227 1.11l-.11.019c-.501.094-1.003.229-1.493.414l-.11.041c-.55.219-1.02.685-1.11 1.227l-.019.11c-.094.501-.229 1.003-.414 1.493l-.041.11c-.219.55-.685 1.02-1.227 1.11l-.11.019c-.501.094-1.003.229-1.493.414l-.11.041c-.55.219-1.02.685-1.11 1.227l-.019.11c-.094.501-.229 1.003-.414 1.493l-.041.11c-.219.55-.685 1.02-1.227 1.11l-.11.019c-.501.094-1.003.229-1.493.414l-.11.041c-.55.219-1.02.685-1.11 1.227l-.019.11c-.094.501-.229 1.003-.414 1.493l-.041.11c-.219.55-.685 1.02-1.227 1.11l-.11.019c-.501.094-1.003.229-1.493.414l-.11.041c-.55.219-1.02.685-1.11 1.227z M12 15a3 3 0 100-6 3 3 0 000 6z" /></svg> },
];

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, navBarPosition }) => {
  const isVertical = navBarPosition === 'left' || navBarPosition === 'right';

  const navClasses = isVertical
    ? "bg-primary-800 shadow-lg flex flex-col items-center py-4 space-y-4 flex-shrink-0 w-20"
    : "bg-primary-800 shadow-lg flex flex-wrap items-center justify-center sm:justify-start px-2 sm:px-4 gap-x-2 gap-y-2 flex-shrink-0 py-2 sm:h-20 w-full";
  
  const mainListContainerClasses = isVertical
    ? "flex flex-col items-center space-y-2 flex-grow"
    : "flex flex-wrap items-center space-x-2 flex-grow justify-center";
  
  const secondaryListContainerClasses = isVertical
    ? "flex flex-col items-center space-y-2"
    : "flex items-center space-x-2";

  return (
    <nav className={navClasses}>
        <button onClick={() => setCurrentView('dashboard')} className="flex-shrink-0 text-white flex items-center" aria-label="Go to dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4m0 0H9m3 0h3m-3-5a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
        </button>
        
        <div className={mainListContainerClasses}>
            {mainNavItems.map(item => (
                <NavLink key={item.view} {...item} currentView={currentView} setCurrentView={setCurrentView} navBarPosition={navBarPosition} />
            ))}
        </div>

        <div className={secondaryListContainerClasses}>
            {secondaryNavItems.map(item => (
                 <NavLink key={item.view} {...item} currentView={currentView} setCurrentView={setCurrentView} navBarPosition={navBarPosition} />
            ))}
        </div>
    </nav>
  );
};

export default Header;