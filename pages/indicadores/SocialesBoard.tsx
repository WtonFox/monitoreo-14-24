import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Phone, MapPin, Grid3X3, List } from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../constants';

type ViewMode = 'grid' | 'row';

const SocialesBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [provinceFilter, setProvinceFilter] = useState<string>('todos');

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
    return data;
  }, [dashboardData, yearFilter, provinceFilter]);

  const { socialData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos sociales...</p>
        </div>
      </div>
    );
  }

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;
  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = '72';

  const renderHorizBar = (
    title: string,
    data: { name: string; Mujeres?: number; Hombres?: number; r14_17?: number; r18_24?: number }[],
    bars: { key: string; fill: string; stackId: string }[],
    emptyMsg = 'Sin datos'
  ) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className={`h-${chartH} w-full`}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
              <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
              <Legend />
              {bars.map(b => (
                <Bar key={b.key} dataKey={b.key} fill={b.fill} stackId={b.stackId} radius={[0, 4, 4, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="flex h-full items-center justify-center text-gray-400">{emptyMsg}</div>}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* Progress KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Phone size={24} /></div>
            <p className="text-sm text-gray-500 font-medium">Completitud Teléfono</p>
          </div>
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-800">{formatPercentage(socialData.phoneCompletenessPct)}</span>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(socialData.phoneCompletenessPct, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4"><MapPin size={24} /></div>
            <p className="text-sm text-gray-500 font-medium">Completitud Dirección</p>
          </div>
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-800">{formatPercentage(socialData.addressCompletenessPct)}</span>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(socialData.addressCompletenessPct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
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
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        {renderHorizBar('Sexo por Centro (Top 10)', socialData.genderByCentro,
          [{ key: 'Mujeres', fill: '#00C49F', stackId: 's' }, { key: 'Hombres', fill: '#0088FE', stackId: 's' }],
          'Sin datos de género por centro')}
        {renderHorizBar('Sexo por Ruta Formativa', socialData.genderByCurso,
          [{ key: 'Mujeres', fill: '#00C49F', stackId: 's' }, { key: 'Hombres', fill: '#0088FE', stackId: 's' }],
          'Sin datos de género por curso')}
        {renderHorizBar('Grupo Etario por Centro', socialData.ageByCentro,
          [{ key: 'r14_17', fill: '#0088FE', stackId: 'a' }, { key: 'r18_24', fill: '#00C49F', stackId: 'a' }],
          'Sin datos etarios por centro')}
        {renderHorizBar('Grupo Etario por Ruta Formativa', socialData.ageByCurso,
          [{ key: 'r14_17', fill: '#0088FE', stackId: 'a' }, { key: 'r18_24', fill: '#00C49F', stackId: 'a' }],
          'Sin datos etarios por curso')}
      </div>
    </div>
  );
};

export default SocialesBoard;
