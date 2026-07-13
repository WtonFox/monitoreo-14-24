import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { Calendar, TrendingUp, Clock, Grid3X3, List } from 'lucide-react';

type ViewMode = 'grid' | 'row';

const CoberturaBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [yearFilter, setYearFilter] = useState<string>('todos');

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
    return data;
  }, [dashboardData, yearFilter]);

  const { temporalData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos de cobertura temporal...</p>
        </div>
      </div>
    );
  }

  const totalRegistros = temporalData.registrationsByYear.reduce((s, r) => s + r.value, 0);
  const growthData = temporalData.yearGrowth.length > 0 ? temporalData.yearGrowth : [];
  const avgGrowth = growthData.length > 0
    ? growthData.reduce((s, g) => s + g.growth, 0) / growthData.length
    : 0;

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;
  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = '72';

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600 mr-4"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Registros</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(totalRegistros)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Edad Registro Prom.</p>
            <h3 className="text-2xl font-bold text-gray-800">{temporalData.avgAgeAtRegistration.toFixed(1)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500 mr-4"><Clock size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Días a Inclusión</p>
            <h3 className="text-2xl font-bold text-gray-800">{temporalData.avgDaysToInclusion.toFixed(0)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Crecimiento Anual Prom.</p>
            <h3 className="text-2xl font-bold text-gray-800">{growthData.length > 0 ? formatPercentage(avgGrowth) : 'N/A'}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-cyan-500">
              <option value="todos">Todos</option>
              {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Registros por Año</h3>
          <div className={`h-${chartH} w-full`}>
            {temporalData.registrationsByYear.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporalData.registrationsByYear}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Registros" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Crecimiento Anual</h3>
          <div className={`h-${chartH} w-full`}>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={v => `${v.toFixed(0)}%`} />
                  <Tooltip formatter={(v: unknown) => `${(Number(v)).toFixed(1)}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="growth" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Crecimiento %" />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de crecimiento</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Registros por Trimestre</h3>
          <div className={`h-${chartH} w-full`}>
            {temporalData.registrationsByQuarter.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temporalData.registrationsByQuarter}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="value" fill="#0891b2" radius={[4, 4, 0, 0]} name="Registros" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle por Año</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Año</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Registros</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Crecimiento</th>
                </tr>
              </thead>
              <tbody>
                {temporalData.registrationsByYear.map((row, i) => {
                  const growth = temporalData.yearGrowth.find(g => g.name === row.name);
                  return (
                    <tr key={row.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-700 font-medium">{row.name}</td>
                      <td className="py-2 px-3 text-right text-gray-900">{formatNumber(row.value)}</td>
                      <td className="py-2 px-3 text-right">
                        {growth ? (
                          <span className={growth.growth >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {growth.growth >= 0 ? '+' : ''}{formatPercentage(growth.growth)}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoberturaBoard;