import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MapPin, Building2, BookOpen, Grid3X3, List } from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../constants';

type ViewMode = 'grid' | 'row';

const TerritorialesBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [provinceFilter, setProvinceFilter] = useState<string>('todos');
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

  // ── Real data filtering ──
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

  const { territorialData } = useIndicatorBoards(filteredData);

  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos territoriales...</p>
        </div>
      </div>
    );
  }

  const tickShort = (val: string) => val.length > 14 ? val.substring(0, 12) + '…' : val;

  const chartClass = viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6';
  const chartH = viewMode === 'grid' ? 72 : 64;

  const renderHorizBar = (
    title: string,
    data: { name: string; value: number }[],
    color: string,
    dataKey = 'value',
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
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="flex h-full items-center justify-center text-gray-400">{emptyMsg}</div>}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 mr-4"><MapPin size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Municipios</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.municipioCount)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Centros</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.centroCount)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rutas Formativas</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.cursoCount)}</h3>
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
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass}>
        {renderHorizBar('Top 10 Municipios', territorialData.topMunicipios, '#10b981', 'value', 'Sin datos de municipios')}
        {renderHorizBar('Top 10 Centros', territorialData.topCentros, '#8b5cf6', 'value', 'Sin datos de centros')}
        {renderHorizBar('Top 10 Rutas Formativas', territorialData.topCursos, '#f59e0b', 'value', 'Sin datos de cursos')}
        {/* Gender by Municipio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo por Municipio (Top 10)</h3>
          <div className={`h-${chartH} w-full`}>
            {territorialData.genderByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={territorialData.genderByMunicipio} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" stackId="s" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" stackId="s" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de género por municipio</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritorialesBoard;
