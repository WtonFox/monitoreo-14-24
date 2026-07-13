import React, { useMemo } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Activity, Award, Heart, Phone } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];

const ProgramaBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const { programData } = useIndicatorBoards(dashboardData);

  // ── Local filter state ──
  const [yearFilter, setYearFilter] = React.useState<string>('todos');

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

  // ── Empty state ──
  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos del programa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* ── Section 1: KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* % Activos */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Activos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.activePct)}</h3>
          </div>
        </div>

        {/* % Egresados */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Egresados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.graduatedPct)}</h3>
          </div>
        </div>

        {/* % Menores con tutor */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-4">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Menores con Tutor</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.minorsWithTutorPct)}</h3>
          </div>
        </div>

        {/* % Tutores con teléfono */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4">
            <Phone size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Tutores con Teléfono</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.tutorsWithPhonePct)}</h3>
          </div>
        </div>
      </div>

      {/* ── Section 2: Local Filters ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="year-filter" className="text-sm font-medium text-gray-600">Año:</label>
          <select
            id="year-filter"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Section 3: Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1 — Status Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Estado</h3>
          <div className="h-64 w-full">
            {programData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={programData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => `${name}: ${formatNumber(value)} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {programData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de estado
              </div>
            )}
          </div>
        </div>

        {/* Chart 2 — Active vs Graduated by Centro */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Centro</h3>
          <div className="h-64 w-full">
            {programData.activeVsGraduatedByCentro.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByCentro} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" style={{ fontSize: '10px' }} interval={0} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos por centro
              </div>
            )}
          </div>
        </div>

        {/* Chart 3 — Active vs Graduated by Municipio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Municipio</h3>
          <div className="h-64 w-full">
            {programData.activeVsGraduatedByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByMunicipio} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" style={{ fontSize: '10px' }} interval={0} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos por municipio
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgramaBoard;
