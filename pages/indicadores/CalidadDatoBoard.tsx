import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { CheckCircle, Grid3X3, List } from 'lucide-react';

const COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#8b5cf6'];
const PIE_COLORS = ['#7c3aed', '#e5e7eb'];

type ViewMode = 'grid' | 'row';

const CalidadDatoBoard: React.FC = () => {
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

  const { qualityData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos de calidad del dato...</p>
        </div>
      </div>
    );
  }

  const overallPct = qualityData.fieldBreakdown.length > 0
    ? qualityData.fieldBreakdown.reduce((s, f) => s + f.pct, 0) / qualityData.fieldBreakdown.length
    : 0;
  const camposAbove80 = qualityData.fieldBreakdown.filter(f => f.pct >= 80).length;
  const completaData = [
    { name: 'Completos', value: qualityData.fieldBreakdown.filter(f => f.pct >= 80).length },
    { name: 'Incompletos', value: qualityData.fieldBreakdown.filter(f => f.pct < 80).length },
  ];

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;
  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = '72';

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-violet-50 rounded-lg text-violet-600 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completitud General</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(overallPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos &gt; 80%</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(camposAbove80)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-500 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos Críticos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(qualityData.fieldBreakdown.filter(f => f.pct < 60).length)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-600 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Campos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(qualityData.fieldBreakdown.length)}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-violet-500">
              <option value="todos">Todos</option>
              {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Completitud por Campo</h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData.fieldBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickFormatter={tickShort} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                <Legend />
                <Bar dataKey="pct" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Completitud" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Campos Completos vs Incompletos</h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={completaData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80} fill="#8884d8" dataKey="value">
                  {completaData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Desglose de completitud</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Campo</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Completitud</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Con dato</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">N/D</th>
                </tr>
              </thead>
              <tbody>
                {qualityData.fieldBreakdown.map((field, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-700">{field.name}</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatPercentage(field.pct)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatNumber(field.total)}</td>
                    <td className="py-2 px-3 text-right text-gray-400">{formatNumber(field.ndCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalidadDatoBoard;