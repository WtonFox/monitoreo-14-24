import React, { useMemo, useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorsBoard } from '../components/IndicatorsBoard';
import { DOMINICAN_PROVINCES } from '../constants';

const Indicadores: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [provinceFilter, setProvinceFilter] = useState<string>('todos');
  const [sexFilter, setSexFilter] = useState<string>('todos');

  const availableYears = useMemo<string[]>(() => {
    const years = new Set<number>();
    dashboardData.forEach(p => {
      if (p.fechaRegistro) {
        const y = new Date(p.fechaRegistro).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [dashboardData]);

  const filteredData = useMemo(() => {
    let data = dashboardData;
    if (yearFilter !== 'todos') {
      data = data.filter(p =>
        p.fechaRegistro && new Date(p.fechaRegistro).getFullYear().toString() === yearFilter
      );
    }
    if (provinceFilter !== 'todos') {
      data = data.filter(p => p.provincia === provinceFilter);
    }
    if (sexFilter !== 'todos') {
      data = data.filter(p => p.sexo?.toLowerCase() === sexFilter);
    }
    return data;
  }, [dashboardData, yearFilter, provinceFilter, sexFilter]);

  const { groups, lastUpdated } = useIndicators(filteredData);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Indicadores del Programa</h1>
        <span className="text-xs text-gray-400">
          Actualizado: {lastUpdated.toLocaleString()}
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Año:</label>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Provincia:</label>
          <select value={provinceFilter} onChange={e => setProvinceFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todas</option>
            {DOMINICAN_PROVINCES.map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Sexo:</label>
          <select value={sexFilter} onChange={e => setSexFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>No hay datos para los filtros seleccionados.</p>
        </div>
      ) : (
        <IndicatorsBoard groups={groups} data={filteredData} />
      )}
    </div>
  );
};

export default Indicadores;
