import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../types/routes';
// Header.tsx
import { RefreshCw, Menu } from 'lucide-react';

interface HeaderProps {
    lastUpdated: Date;
    onRefresh: () => void;
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
    [ROUTES.INDICADORES]: 'Panel de Indicadores',
    [ROUTES.INDICADORES_DEMOGRAFICOS]: 'Indicadores Demográficos',
    [ROUTES.INDICADORES_TERRITORIALES]: 'Indicadores Territoriales',
    [ROUTES.INDICADORES_PROGRAMA]: 'Indicadores — Estado del Programa',
    [ROUTES.INDICADORES_SOCIALES]: 'Indicadores Sociales',
    [ROUTES.INDICADORES_CALIDAD]: 'Indicadores — Calidad del Dato',
    [ROUTES.INDICADORES_VULNERABILIDAD]: 'Indicadores — Vulnerabilidad',
    [ROUTES.INDICADORES_COBERTURA]: 'Indicadores — Cobertura Temporal',
    [ROUTES.INDICADORES_NIVEL_EDUCATIVO]: 'Indicadores — Nivel Educativo',
    [ROUTES.INDICADORES_DESEMPENO_CENTRO]: 'Indicadores — Desempeño Centro',
    [ROUTES.INDICADORES_CENTROS_SIN_MENORES]: 'Indicadores — Centros sin Menores',
    [ROUTES.INDICADORES_DESERCION]: 'Indicadores — Deserción',
    [ROUTES.INDICADORES_REGISTRO_DIARIO]: 'Indicadores — Registro Diario',
    [ROUTES.INDICADORES_CALIDAD_ND]: 'Indicadores — Calidad ND',
};

export const Header: React.FC<HeaderProps> = ({
    lastUpdated,
    onRefresh,
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
                        aria-label="Abrir menú"
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
                    <button
                        onClick={onRefresh}
                        disabled={isSyncing && !isPaused}
                        className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg md:rounded-full text-gray-600 transition-colors shadow-sm disabled:opacity-50"
                        title="Recargar Todo"
                        aria-label="Recargar datos"
                    >
                        <RefreshCw size={20} className={isSyncing && !isPaused ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
        </header>
    );
};
