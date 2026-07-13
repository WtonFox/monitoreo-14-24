import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../types/routes';
import { LayoutDashboard, Users, MapPin, Activity, Heart } from 'lucide-react';

const TABS = [
  { to: ROUTES.INDICADORES, label: 'Resumen', icon: LayoutDashboard },
  { to: ROUTES.INDICADORES_DEMOGRAFICOS, label: 'Demográficos', icon: Users },
  { to: ROUTES.INDICADORES_TERRITORIALES, label: 'Territoriales', icon: MapPin },
  { to: ROUTES.INDICADORES_PROGRAMA, label: 'Estado del Programa', icon: Activity },
  { to: ROUTES.INDICADORES_SOCIALES, label: 'Sociales', icon: Heart },
];

const IndicadoresLayout: React.FC = () => {
  return (
    <div className="flex flex-col flex-1">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <nav className="flex overflow-x-auto px-4 gap-1">
          {TABS.map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === ROUTES.INDICADORES}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              }
            >
              <tab.icon size={16} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default IndicadoresLayout;
