import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Building2, Users, TrendingUp, Award, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

type ViewMode = 'grid' | 'row'

const DesempenoCentroBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { centerData } = boardData;

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const totalParticipantesConCentro = centerData.topCenters.reduce((s, c) => s + c.total, 0);
  const promedioPorCentro = centerData.totalCenters > 0
    ? totalParticipantesConCentro / centerData.totalCenters
    : 0;
  const totalActivos = centerData.topCenters.reduce((s, c) => s + c.activos, 0);
  const totalEgresados = centerData.topCenters.reduce((s, c) => s + c.egresados, 0);
  const tasaRetencion = totalParticipantesConCentro > 0
    ? (totalActivos / totalParticipantesConCentro) * 100
    : 0;
  const tasaEgreso = totalParticipantesConCentro > 0
    ? (totalEgresados / totalParticipantesConCentro) * 100
    : 0;

  const retentionEgresoData = centerData.topCenters.map(c => ({
    name: c.name,
    Retención: c.activos,
    Egreso: c.egresados,
  }));

  return (
    <BoardShell
    title="Desempeño por Centro"
    description="Rendimiento de centros: distribución, retención, egreso, género y edad promedio.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 mr-4"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Centros</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(centerData.totalCenters)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Promedio por Centro</p>
            <h3 className="text-2xl font-bold text-gray-800">{promedioPorCentro.toFixed(1)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa Retención</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(tasaRetencion)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4"><Award size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa Egreso</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(tasaEgreso)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
                  <BoardInfo
            title="Desempeño por Centro"
            sections={[
              { heading: '¿Qué mide?', content: 'Distribución de participantes por centro, tasas de retención y egreso, composición de género y edad promedio. Indicadores clave para evaluar el desempeño de cada centro.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Centros</h3>
          <div className={`h-${chartH} w-full`}>
            {centerData.topCenters.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centerData.topCenters} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="total" fill="#64748b" radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="activos" fill="#10b981" radius={[0, 4, 4, 0]} name="Activos" />
                  <Bar dataKey="egresados" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Egresados" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Retención vs Egreso por Centro</h3>
          <div className={`h-${chartH} w-full`}>
            {retentionEgresoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionEgresoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Retención" fill="#10b981" stackId="s" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egreso" fill="#3b82f6" stackId="s" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Género por Centro</h3>
          <div className={`h-${chartH} w-full`}>
            {centerData.genderByCenter.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centerData.genderByCenter} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" stackId="s" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" stackId="s" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Edad Promedio por Centro</h3>
          <div className={`h-${chartH} w-full`}>
            {centerData.avgAgeByCenter.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={centerData.avgAgeByCenter} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 'dataMax + 2']} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => (Number(v)).toFixed(1)} />
                  <Legend />
                  <Bar dataKey="avgAge" fill="#64748b" radius={[0, 4, 4, 0]} name="Edad Prom." />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default DesempenoCentroBoard;
