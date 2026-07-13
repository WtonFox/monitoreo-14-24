import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Activity, Award, Heart, Phone, Grid3X3, List } from 'lucide-react';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];
type ViewMode = 'grid' | 'row';

const ProgramaBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const filters = useIndicadoresFilters();

  const filteredData = useMemo(() => {
    let data = dashboardData;
    if (filters.year !== 'todos') {
      data = data.filter(p =>
        p.fechaRegistro && new Date(p.fechaRegistro).getFullYear().toString() === filters.year
      );
    }
    if (filters.province !== 'todos') {
      data = data.filter(p => p.provincia === filters.province);
    }
    if (filters.municipio !== 'todos') {
      data = data.filter(p => p.municipio === filters.municipio);
    }
    return data;
  }, [dashboardData, filters.year, filters.province, filters.municipio]);

  const { programData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos del programa...</p>
        </div>
      </div>
    );
  }

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;
  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = '72';

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Activos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.activePct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Award size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Egresados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.graduatedPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Menores con Tutor</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.minorsWithTutorPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Phone size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Tutores con Teléfono</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.tutorsWithPhonePct)}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Estado</h3>
          <div className={`h-${chartH} w-full`}>
            {programData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={programData.statusDistribution} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent, value }: any) => `${tickShort(name)}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {programData.statusDistribution.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de estado</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Centro</h3>
          <div className={`h-${chartH} w-full`}>
            {programData.activeVsGraduatedByCentro.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByCentro} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '10px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos por centro</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Municipio</h3>
          <div className={`h-${chartH} w-full`}>
            {programData.activeVsGraduatedByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByMunicipio} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '10px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos por municipio</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramaBoard;
