import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, Check, GripVertical, RotateCcw } from 'lucide-react';

export interface ColumnConfig {
    id: string;
    label: string;
    visible: boolean;
    required?: boolean; // If true, cannot be hidden (e.g., ID or Name)
}

interface ColumnSelectorProps {
    columns: ColumnConfig[];
    onToggleColumn: (id: string) => void;
    onReset: () => void;
    onClose: () => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
    columns,
    onToggleColumn,
    onReset,
    onClose
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="absolute top-12 right-0 z-50 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div ref={modalRef}>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Settings size={16} className="text-blue-600" />
                        Configurar Columnas
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    {columns.map((col) => (
                        <div
                            key={col.id}
                            className={`flex items-center justify-between p-2 rounded-lg text-sm select-none transition-colors
                ${col.required ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
              `}
                            onClick={() => !col.required && onToggleColumn(col.id)}
                        >
                            <div className="flex items-center gap-3">
                                <GripVertical size={14} className="text-gray-300" />
                                <span className={col.visible ? 'text-gray-700 font-medium' : 'text-gray-400'}>
                                    {col.label}
                                </span>
                            </div>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors
                ${col.visible
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-gray-300'
                                }
                ${col.required ? 'opacity-50' : ''}
              `}>
                                {col.visible && <Check size={12} strokeWidth={3} />}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                    <button
                        onClick={onReset}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-blue-50 transition-colors"
                    >
                        <RotateCcw size={12} /> Restaurar
                    </button>
                    <span className="text-xs text-gray-400">
                        {columns.filter(c => c.visible).length} visibles
                    </span>
                </div>
            </div>
        </div>
    );
};
