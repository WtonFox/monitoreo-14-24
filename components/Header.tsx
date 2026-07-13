import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../types/routes';
// Header.tsx
import { Download, RefreshCw, Menu } from 'lucide-react'; // Add Menu icon
import { formatNumber } from '../utils/formatters';

interface HeaderProps {
    lastUpdated: Date;
    onRefresh: () => void;
    onExport: () => void;
    onOpenMassExport: () => void;
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
    onExport,
    onOpenMassExport,
    totalRecords,
    isSyncing,
    isPaused,
    onToggleSidebar
}) => {
    const location = useLocation();
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
                    {/* Botón de Exportación Masiva */}
                    <button
                        onClick={onOpenMassExport}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-md"
                        title="Exportar todos los datos de la base de datos"
                    >
                        <Download size={18} />
                        <span className="hidden lg:inline">Exportar Todos</span>
                        {totalRecords > 0 && (
                            <span className="text-[10px] bg-blue-500 px-1.5 py-0.5 rounded-full ml-1 hidden sm:inline-block">
                                {formatNumber(totalRecords)}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors border border-green-200"
                        title="Exportar datos del dashboard"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>

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
