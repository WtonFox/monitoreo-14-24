import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../types/routes';
// Header.tsx
import { Download, RefreshCw, Menu, ChevronDown, FileSpreadsheet, FileJson } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface HeaderProps {
    lastUpdated: Date;
    onRefresh: () => void;
    onExportFormat: (format: 'csv' | 'xlsx' | 'json') => void;
    totalRecords: number;
    isSyncing: boolean;
    isPaused: boolean;
    onToggleSidebar?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
    [ROUTES.ESTADISTICAS]: 'Panel de Control',
    [ROUTES.PARTICIPANTES]: 'Listado Detallado de Participantes',
    [ROUTES.MAPA_INTERACTIVO]: 'Mapa Interactivo Geográfico',
    [ROUTES.IMPACTO_SOCIAL]: 'Análisis de Impacto Social',
    [ROUTES.DIAGNOSTICO]: 'Diagnóstico del Sistema',
};

export const Header: React.FC<HeaderProps> = ({
    lastUpdated,
    onRefresh,
    onExportFormat,
    totalRecords,
    isSyncing,
    isPaused,
    onToggleSidebar
}) => {
    const location = useLocation();
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const pageTitle = PAGE_TITLES[location.pathname] || 'Monitoreo 14-24';

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onToggleSidebar}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>

                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                            {pageTitle}
                        </h2>
                        <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            Última actualización: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 md:gap-3 items-center">
                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportDropdown(prev => !prev)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                      >
                        <Download size={18} />
                        <span className="hidden sm:inline">Exportar</span>
                        <ChevronDown size={14} />
                      </button>

                      {showExportDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowExportDropdown(false)} />
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                            <button
                              onClick={() => { setShowExportDropdown(false); onExportFormat('csv'); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FileSpreadsheet size={16} className="text-green-600" />
                              CSV
                            </button>
                            <button
                              onClick={() => { setShowExportDropdown(false); onExportFormat('xlsx'); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FileSpreadsheet size={16} className="text-blue-600" />
                              Excel (XLSX)
                            </button>
                            <button
                              onClick={() => { setShowExportDropdown(false); onExportFormat('json'); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <FileJson size={16} className="text-purple-600" />
                              JSON
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={isSyncing && !isPaused}
                        className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg md:rounded-full text-gray-600 transition-colors shadow-sm disabled:opacity-50"
                        title="Recargar Todo"
                    >
                        <RefreshCw size={20} className={isSyncing && !isPaused ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
        </header>
    );
};
