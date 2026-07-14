import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../types/routes';
import { LayoutDashboard, List, WifiOff, Globe, PauseCircle, PlayCircle, Map as MapIcon, AlertCircle, RefreshCw, CheckCircle2, Activity, BarChart3 } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { CorruptedRecord } from '../hooks/useDashboardData';
import { useAuth } from '../contexts/AuthContext';

interface SyncStats {
    loaded: number;
    errors: number;
    corrupted: number;
    progress: number;
}

interface SidebarProps {
    syncStats: SyncStats;
    totalRecords: number;
    isSyncing: boolean;
    isPaused: boolean;
    onTogglePause: () => void;
    criticalConnectionError: boolean;
    isOpen: boolean;
    onClose: () => void;
    corruptedItems?: CorruptedRecord[];
    onManualRefresh: () => void;
}

interface NavItem {
    to: string;
    icon: React.FC<{ size?: number; className?: string }>;
    label: string;
}

const MAIN_NAV_ITEMS: NavItem[] = [
    { to: ROUTES.ESTADISTICAS, icon: LayoutDashboard, label: 'Estadísticas' },
    { to: ROUTES.INDICADORES, icon: BarChart3, label: 'Indicadores' },
    { to: ROUTES.IMPACTO_SOCIAL, icon: Globe, label: 'Impacto Social' },
    { to: ROUTES.MAPA_INTERACTIVO, icon: MapIcon, label: 'Mapa Interactivo' },
    { to: ROUTES.PARTICIPANTES, icon: List, label: 'Participantes' },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
    { to: ROUTES.DIAGNOSTICO, icon: Activity, label: 'Diagnóstico' },
];

export const Sidebar: React.FC<SidebarProps> = ({
    syncStats,
    totalRecords,
    isSyncing,
    isPaused,
    onTogglePause,
    criticalConnectionError,
    isOpen,
    onClose,
    corruptedItems = [],
    onManualRefresh
}) => {
    const { user, isAuthenticated, hasPermission } = useAuth();
    const hasErrors = syncStats.errors > 0 || syncStats.corrupted > 0;

    // Filter nav items based on user role.
    // If not authenticated, show all items (default to Consultor visibility).
    const visibleMainNav = useMemo(
        () =>
            isAuthenticated
                ? MAIN_NAV_ITEMS.filter((item) => hasPermission(item.to))
                : MAIN_NAV_ITEMS,
        [isAuthenticated, hasPermission],
    );

    const visibleBottomNav = useMemo(
        () =>
            isAuthenticated
                ? BOTTOM_NAV_ITEMS.filter((item) => hasPermission(item.to))
                : BOTTOM_NAV_ITEMS,
        [isAuthenticated, hasPermission],
    );

    const renderNavItem = (item: NavItem, isOrange = false) => (
        <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                    ? isOrange
                        ? 'bg-orange-50 text-orange-700 shadow-sm'
                        : 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
            }
        >
            <item.icon size={20} />
            {item.label}
        </NavLink>
    );

    return (
        <aside
            className={`
                bg-white border-r border-gray-200 flex-shrink-0 z-30 shadow-sm flex flex-col 
                fixed inset-y-0 left-0 h-full w-80 transition-transform duration-300 ease-in-out
                md:relative md:sticky md:top-0 md:h-screen md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
        >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img
                        src="/op-1424.jpg"
                        alt="Logo 14/24"
                        className="w-12 h-12 rounded-lg object-contain bg-white shadow-sm border border-gray-100"
                    />
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">Monitoreo 14-24</h1>
                        <p className="text-xs text-gray-500">Panel GPS</p>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600" aria-label="Cerrar menú">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <nav className="p-4 space-y-2 flex-grow-0">
                {visibleMainNav.map(item => renderNavItem(item))}

                {visibleBottomNav.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-gray-100">
                        {visibleBottomNav.map(item => renderNavItem(item, true))}
                    </div>
                )}
            </nav>

            {/* Sync Status Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-700">Progreso de Sincronización</span>
                        <span className="text-xs text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">{syncStats.progress}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${isSyncing ? 'bg-blue-600' : 'bg-green-500'}`}
                            style={{ width: `${syncStats.progress}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 mb-3">
                        <span>{formatNumber(syncStats.loaded)} / {formatNumber(totalRecords)}</span>
                        <span>{isSyncing ? 'Sincronizando...' : 'Completado'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onTogglePause}
                            disabled={!isSyncing && syncStats.progress === 100}
                            className={`flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 rounded-lg transition-colors border ${isPaused
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50'
                                }`}
                            aria-label={isPaused ? "Reanudar sincronización" : "Pausar sincronización"}
                        >
                            {isPaused ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                            {isPaused ? "REANUDAR" : "PAUSAR"}
                        </button>

                        <button
                            onClick={onManualRefresh}
                            className="flex items-center justify-center gap-1.5 text-[10px] font-bold py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            aria-label="Reiniciar sincronización"
                        >
                            <RefreshCw size={12} />
                            REINICIAR
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Zone / Live Log Compact */}
            <div className={`transition-all duration-300 bg-gray-50 border-t border-gray-200 ${hasErrors ? 'h-auto py-2' : 'h-0 overflow-hidden py-0'}`}>
                {/* Log Viewer Compact */}
                <div className="px-4 pb-2">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                            <AlertCircle size={10} className="text-orange-500" />
                            Últimos Errores
                        </h3>
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                            Total: {syncStats.corrupted + syncStats.errors}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        {/* Renderizar Errores de Red primero */}
                        {Array.from({ length: Math.min(5, syncStats.errors) }).map((_, idx) => (
                            <div key={`net-${idx}`} className="text-[9px] p-1.5 bg-red-50 border border-red-100 rounded shadow-sm flex justify-between items-center animate-in slide-in-from-left">
                                <span className="font-bold text-red-700 flex items-center gap-1">
                                    <WifiOff size={8} /> Error de Red
                                </span>
                                <span className="text-red-500 truncate">Fallo de conexión</span>
                            </div>
                        ))}

                        {/* Renderizar Corruptos */}
                        {corruptedItems.slice(-(5 - Math.min(5, syncStats.errors))).reverse().map((item, idx) => (
                            <div key={idx} className="text-[9px] p-1.5 bg-white border border-orange-100 rounded shadow-sm flex justify-between items-center animate-in slide-in-from-left">
                                <span className="font-mono text-gray-600">ID: {item.id}</span>
                                <span className="text-orange-500 truncate max-w-[100px]">{item.reason}</span>
                            </div>
                        ))}

                        {(corruptedItems.length + syncStats.errors > 5) && (
                            <NavLink
                                to={ROUTES.DIAGNOSTICO}
                                onClick={onClose}
                                className="text-center text-[9px] text-gray-400 mt-1 cursor-pointer hover:text-blue-500 block"
                            >
                                + {corruptedItems.length + syncStats.errors - 5} más (ver Diagnóstico)
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};
