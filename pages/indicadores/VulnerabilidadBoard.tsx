import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { AlertTriangle, Grid3X3, List, Accessibility, Heart, Shield } from 'lucide-react';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#a855f7', '#ec4899'];
const PIE_COLORS = ['#dc2626', '#fca5a5', '#fef2f2'];

type ViewMode = 'grid' | 'row';

const VulnerabilidadBoard: React.FC = () => {
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

  const { vulnerabilityData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos de vulnerabilidad...</p>
        </div>
      </div>
    );
  }

  const prevalenceData = [
    { name: 'Discapacidad', value: vulnerabilityData.disabilitiesPct },
    { name: 'Enfermedad', value: vulnerabilityData.diseasesPct },
    { name: 'Alergia', value: vulnerabilityData.allergiesPct },
    { name: 'Prog. Sociales', value: vulnerabilityData.socialProgramsPct },
    { name: 'Vulnerabilidad', value: vulnerabilityData.vulnerabilitiesPct },
  ];

  const pieData = [
    { name: 'Con discapacidad', value: vulnerabilityData.disabilitiesPct },
    { name: 'Con enfermedad', value: vulnerabilityData.diseasesPct },
    { name: 'Con alergia', value: vulnerabilityData.allergiesPct },
  ].filter(d => d.value > 0);

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;
  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = '72';
  const chartHSmall = '64';

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4"><Accessibility size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Discapacidad</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.disabilitiesPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Enfermedad</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.diseasesPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Shield size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Prog. Sociales</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.socialProgramsPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-500 mr-4"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Evaluados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(dashboardData.length)}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-red-500">
              <option value="todos">Todos</option>
              {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Prevalencia</h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prevalenceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickFormatter={tickShort} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                <Legend />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} name="Prevalencia" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución de condiciones</h3>
          <div className={`h-${chartH} w-full`}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Discapacidades</h3>
          <div className={`h-${chartHSmall} w-full`}>
            {vulnerabilityData.topDisabilities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityData.topDisabilities} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Enfermedades</h3>
          <div className={`h-${chartHSmall} w-full`}>
            {vulnerabilityData.topDiseases.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityData.topDiseases} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VulnerabilidadBoard;