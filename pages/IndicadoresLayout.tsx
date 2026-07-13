import React, { useRef, useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../types/routes';
import {
  LayoutDashboard, Users, MapPin, Activity, Heart,
  CheckCircle, AlertTriangle, Calendar, GraduationCap, Building2,
  ChevronLeft, ChevronRight, MoreHorizontal,
} from 'lucide-react';

const TABS = [
  { to: ROUTES.INDICADORES, label: 'Resumen', icon: LayoutDashboard },
  { to: ROUTES.INDICADORES_DEMOGRAFICOS, label: 'Demográficos', icon: Users },
  { to: ROUTES.INDICADORES_TERRITORIALES, label: 'Territoriales', icon: MapPin },
  { to: ROUTES.INDICADORES_PROGRAMA, label: 'Estado del Programa', icon: Activity },
  { to: ROUTES.INDICADORES_SOCIALES, label: 'Sociales', icon: Heart },
  { to: ROUTES.INDICADORES_CALIDAD, label: 'Calidad Dato', icon: CheckCircle },
  { to: ROUTES.INDICADORES_VULNERABILIDAD, label: 'Vulnerabilidad', icon: AlertTriangle },
  { to: ROUTES.INDICADORES_COBERTURA, label: 'Cobertura Temporal', icon: Calendar },
  { to: ROUTES.INDICADORES_NIVEL_EDUCATIVO, label: 'Nivel Educativo', icon: GraduationCap },
  { to: ROUTES.INDICADORES_DESEMPENO_CENTRO, label: 'Desempeño Centro', icon: Building2 },
];

const TabButton: React.FC<{
  to: string;
  label: string;
  icon: React.FC<{ size?: number }>;
  end?: boolean;
}> = ({ to, label, icon: Icon, end }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = linkRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      },
      { root: el.closest('[data-tabs-scroll]'), threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <NavLink
      ref={linkRef}
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
          isActive
            ? 'border-blue-600 text-blue-700'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
};

const IndicadoresLayout: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [overflowTabs, setOverflowTabs] = useState<typeof TABS>([]);

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hidden: typeof TABS = [];
    const buttons = el.querySelectorAll<HTMLAnchorElement>('a');
    buttons.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      const parentRect = el.getBoundingClientRect();
      if (rect.right > parentRect.right - 10 || rect.left < parentRect.left + 10) {
        if (TABS[i]) hidden.push(TABS[i]);
      }
    });
    setOverflowTabs(hidden);
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateOverflow);
    ro.observe(el);
    el.addEventListener('scroll', updateOverflow, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', updateOverflow);
    };
  }, [updateOverflow]);

  const scrollByTab = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const firstTab = el.querySelector<HTMLAnchorElement>('a');
    if (!firstTab) return;
    const tabWidth = firstTab.offsetWidth + 4;
    el.scrollBy({ left: direction === 'left' ? -tabWidth : tabWidth, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center relative">
          <button
            onClick={() => scrollByTab('left')}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 hidden md:flex"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={scrollRef}
            data-tabs-scroll
            className="flex overflow-x-auto gap-1 px-2 scrollbar-hide flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {TABS.map(tab => (
              <TabButton key={tab.to} to={tab.to} label={tab.label} icon={tab.icon} end={tab.to === ROUTES.INDICADORES} />
            ))}
          </div>
          <button
            onClick={() => scrollByTab('right')}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 hidden md:flex"
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
          {overflowTabs.length > 0 && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowOverflowMenu(prev => !prev)}
                className="flex items-center gap-1 px-3 py-3 text-sm text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              >
                <MoreHorizontal size={16} />
                <span className="text-xs">{overflowTabs.length}</span>
              </button>
              {showOverflowMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowOverflowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[200px]">
                    {overflowTabs.map(tab => (
                      <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === ROUTES.INDICADORES}
                        onClick={() => setShowOverflowMenu(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`
                        }
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </NavLink>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default IndicadoresLayout;
