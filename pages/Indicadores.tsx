import React, { useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorsBoard } from '../components/IndicatorsBoard';

const Indicadores: React.FC = () => {
  const { dashboardData } = useDashboard();
  const { groups, lastUpdated } = useIndicators(dashboardData);

  // Solo mostrar loading mientras no hay datos y estamos en primer render
  const isReady = useMemo(() => groups.length > 0 && groups.some(g => g.items.length > 0), [groups]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Indicadores del Programa</h1>
        <span className="text-xs text-gray-400">
          Actualizado: {lastUpdated.toLocaleString()}
        </span>
      </div>

      {dashboardData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos para indicadores...</p>
        </div>
      ) : !isReady ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-500 font-medium">Calculando indicadores...</span>
        </div>
      ) : (
        <IndicatorsBoard groups={groups} data={dashboardData} />
      )}
    </div>
  );
};

export default Indicadores;
