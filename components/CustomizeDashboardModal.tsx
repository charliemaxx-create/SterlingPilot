import React, { useState, useRef } from 'react';
import { DashboardWidget, DashboardWidgetType } from '../types';

interface CustomizeDashboardModalProps {
    widgets: DashboardWidget[];
    onClose: () => void;
    onSave: (widgets: DashboardWidget[]) => void;
}

const WIDGET_NAMES: Record<DashboardWidgetType, string> = {
    [DashboardWidgetType.ACCOUNTS]: 'Account Balances',
    [DashboardWidgetType.GOALS]: 'Savings Goals',
    [DashboardWidgetType.BUDGETS]: 'Budget Category Status',
    [DashboardWidgetType.PIE_CHART]: 'Expense Pie Chart',
    [DashboardWidgetType.RECENT_TRANSACTIONS]: 'Recent Transactions',
    [DashboardWidgetType.TOTAL_BUDGET_REMAINING]: 'Monthly Budget Summary',
    [DashboardWidgetType.BALANCE]: 'Total Balance',
};

const DraggableWidget: React.FC<{
    widget: DashboardWidget;
    index: number;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    onToggleVisibility: (id: string) => void;
}> = ({ widget, index, onDragStart, onDragEnter, onDragEnd, onToggleVisibility }) => {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="font-medium text-gray-800 dark:text-gray-200">{WIDGET_NAMES[widget.type]}</span>
            </div>
            <div className="flex items-center">
                <label htmlFor={`vis-${widget.id}`} className="mr-2 text-sm text-gray-600 dark:text-gray-400">Show</label>
                <input
                    type="checkbox"
                    id={`vis-${widget.id}`}
                    checked={widget.isVisible}
                    onChange={() => onToggleVisibility(widget.id)}
                    className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
            </div>
        </div>
    );
};


const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({ widgets, onClose, onSave }) => {
    const [localWidgets, setLocalWidgets] = useState(widgets);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        let _widgets = [...localWidgets];
        const draggedItemContent = _widgets.splice(dragItem.current, 1)[0];
        _widgets.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;

        setLocalWidgets(_widgets);
        onSave(_widgets); // Save changes on drop
    };

    const handleToggleVisibility = (id: string) => {
        const updatedWidgets = localWidgets.map(w =>
            w.id === id ? { ...w, isVisible: !w.isVisible } : w
        );
        setLocalWidgets(updatedWidgets);
        onSave(updatedWidgets); // Save changes on toggle
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Customize Dashboard</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">Drag and drop widgets to reorder them. Use the toggles to show or hide them on your dashboard.</p>
                
                <div className="space-y-3">
                    {localWidgets.map((widget, index) => (
                        <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            index={index}
                            onDragStart={(i) => dragItem.current = i}
                            onDragEnter={(i) => dragOverItem.current = i}
                            onDragEnd={handleSort}
                            onToggleVisibility={handleToggleVisibility}
                        />
                    ))}
                </div>

                <div className="flex justify-end mt-8">
                     <button onClick={onClose} className="px-6 py-2 rounded-md bg-primary-600 text-white font-semibold hover:bg-primary-700">Done</button>
                </div>
            </div>
        </div>
    );
};

export default CustomizeDashboardModal;