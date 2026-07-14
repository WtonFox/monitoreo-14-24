import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../types/routes';
import {
  LayoutDashboard, Users, MapPin, Activity, Heart,
  CheckCircle, AlertTriangle, Calendar, GraduationCap, Building2,
  TrendingDown, CalendarDays, FileWarning,
  ChevronDown,
} from 'lucide-react';
import { IndicadoresFiltersProvider } from '../contexts/IndicadoresFiltersContext';
import { useDashboard } from '../contexts/DashboardContext';

// ── Original tabs (always visible) ──

const MAIN_TABS = [
  { to: ROUTES.INDICADORES, label: 'Resumen', icon: LayoutDashboard },
  { to: ROUTES.INDICADORES_DEMOGRAFICOS, label: 'Demográficos', icon: Users },
  { to: ROUTES.INDICADORES_TERRITORIALES, label: 'Territoriales', icon: MapPin },
  { to: ROUTES.INDICADORES_PROGRAMA, label: 'Estado del Programa', icon: Activity },
  { to: ROUTES.INDICADORES_SOCIALES, label: 'Sociales', icon: Heart },
];

// ── New categories (grouped in dropdown) ──

const MORE_TABS = [
  { to: ROUTES.INDICADORES_CALIDAD, label: 'Calidad del Dato', icon: CheckCircle },
  { to: ROUTES.INDICADORES_VULNERABILIDAD, label: 'Vulnerabilidad', icon: AlertTriangle },
  { to: ROUTES.INDICADORES_COBERTURA, label: 'Cobertura Temporal', icon: Calendar },
  { to: ROUTES.INDICADORES_NIVEL_EDUCATIVO, label: 'Nivel Educativo', icon: GraduationCap },
  { to: ROUTES.INDICADORES_DESEMPENO_CENTRO, label: 'Desempeño Centro', icon: Building2 },
  { to: ROUTES.INDICADORES_CENTROS_SIN_MENORES, label: 'Centros sin Menores', icon: Users },
  { to: ROUTES.INDICADORES_DESERCION, label: 'Deserción', icon: TrendingDown },
  { to: ROUTES.INDICADORES_REGISTRO_DIARIO, label: 'Registro Diario', icon: CalendarDays },
  { to: ROUTES.INDICADORES_CALIDAD_ND, label: 'Calidad ND', icon: FileWarning },
];

// ── Shared tab style ──

const tabClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
    isActive
      ? 'border-blue-600 text-blue-700'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`;

// ── Component ──

const IndicadoresLayout: React.FC = () => {
  const [showMore, setShowMore] = useState(false);
  const { dashboardData } = useDashboard();
  const location = useLocation();

  const allYears = useMemo(() => {
    const years = new Set<number>();
    dashboardData.forEach(p => {
      if (p.fechaRegistro) {
        const y = new Date(p.fechaRegistro).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [dashboardData]);

  return (
    <div className="flex flex-col flex-1">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-2">
          {/* Main tabs + more button in a single flex row without overflow clipping */}
          <div className="flex items-center overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {MAIN_TABS.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === ROUTES.INDICADORES}
                className={tabClasses}
              >
                <tab.icon size={16} />
                {tab.label}
              </NavLink>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />
          </div>

          {/* Active More Tab pill — reactive to route changes via useLocation */}
          {(() => {
            const currentPath = location.pathname;
            const activeTab = MORE_TABS.find(t => t.to === currentPath);
            if (!activeTab) return null;
            const Icon = activeTab.icon;
            return (
              <div className="flex items-center gap-1.5 px-3 py-3 border-b-2 border-blue-600 text-blue-700 text-sm font-medium flex-shrink-0 whitespace-nowrap mr-1">
                <Icon size={16} />
                <span>{activeTab.label}</span>
              </div>
            );
          })()}

          {/* More dropdown trigger — OUTSIDE overflow container */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMore(prev => !prev)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                MORE_TABS.some(t => t.to === location.pathname)
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChevronDown size={16} />
              <span>Más indicadores</span>
              <span className="text-[10px] text-gray-400 font-bold ml-0.5">
                {MORE_TABS.length}
              </span>
            </button>

            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[220px]">
                  {MORE_TABS.map(tab => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={false}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      <tab.icon size={15} />
                      {tab.label}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <IndicadoresFiltersProvider allYears={allYears} rawData={dashboardData}>
          <Outlet />
        </IndicadoresFiltersProvider>
      </div>
    </div>
  );
};

export default IndicadoresLayout;
