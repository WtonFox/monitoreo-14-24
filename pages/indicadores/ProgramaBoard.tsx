import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { Activity, Award, Heart, Phone, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { chartClass, chartH } from '../../utils/indicadores-helpers'
import { YAxisTick } from '../../utils/indicadores-tick-components'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

const STATUS_BAR_COLOR = '#3b82f6';

const getStatusColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s === 'activo' || s === 'identificado' || s === 'en proceso') return '#22c55e';
  if (s.includes('egresado') || s.includes('egresada')) return '#3b82f6';
  if (s === 'retirado' || s === 'retirada') return '#ef4444';
  return '#9ca3af';
};

type ViewMode = 'grid' | 'row'

const ProgramaBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { programData } = boardData;

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell
    title="Estado del Programa"
    description="Seguimiento del estado actual de participantes: activos, egresados, retención y egreso por centro.">
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
                  <BoardInfo
            title="Estado del Programa"
            sections={[
              { heading: '¿Qué mide?', content: 'Seguimiento del estado de los participantes: activos, egresados, retirados. Incluye tasas de retención y egreso por centro y municipio.' },
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Distribución por Estado
            <span className="text-sm font-normal text-gray-400 ml-2">
              {formatNumber(filteredData.length)} participantes
            </span>
          </h3>
          <div className="h-80 w-full">
            {programData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.statusDistribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={160} tick={<YAxisTick />} />
                  <Tooltip
                    formatter={(v: unknown) => {
                      const val = Number(v);
                      const total = programData.statusDistribution.reduce((s, d) => s + d.value, 0);
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                      return [`${formatNumber(val)} (${pct}%)`, 'Participantes'];
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Participantes">
                    {programData.statusDistribution.map(entry => (
                      <Cell key={entry.name} fill={getStatusColor(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
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
                  <YAxis dataKey="name" type="category" width={180} tick={<YAxisTick />} />
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
                  <YAxis dataKey="name" type="category" width={180} tick={<YAxisTick />} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos por municipio</div>}
          </div>
        </div>

        {/* 2.1: Evolution by Year */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Evolución del Programa por Año
          </h3>
          <div className="h-80 w-full">
            {programData.evolutionByYear.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.evolutionByYear} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Retirados" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de evolución anual</div>}
          </div>
        </div>

        {/* 2.2: Status by Curso — Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Estado por Ruta Formativa
          </h3>
          <p className="text-xs text-gray-400 mb-4">Activos y egresados por ruta formativa, ordenado de mayor a menor</p>
          {programData.statusByCurso.length > 0 ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Ruta Formativa</th>
                    <th className="px-4 py-3 text-right">Activos</th>
                    <th className="px-4 py-3 text-right">Egresados</th>
                    <th className="px-4 py-3 text-right w-28">Activos vs Egresados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {programData.statusByCurso.map(item => {
                    const total = item.Activos + item.Egresados;
                    const pct = total > 0 ? (item.Activos / total) * 100 : 0;
                    return (
                      <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-700 max-w-[220px] truncate" title={item.name}>{item.name}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-green-600 font-semibold">{formatNumber(item.Activos)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-blue-600 font-semibold">{formatNumber(item.Egresados)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs tabular-nums text-gray-500">{formatPercentage(pct)} activos</span>
                            <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  backgroundColor: pct >= 60 ? '#22c55e' : pct >= 30 ? '#f97316' : '#dc2626',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos por ruta formativa</div>
          )}
        </div>

        {/* 2.5: avgAgeByStatus Dual KPI */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Edad Promedio al Registro
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-sm text-green-600 font-medium mb-1">Activos</p>
              <p className="text-3xl font-bold text-green-700">{formatNumber(programData.avgAgeByStatus.activeAvg)}</p>
              <p className="text-xs text-green-500 mt-1">años (edad al registro)</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-1">Egresados</p>
              <p className="text-3xl font-bold text-blue-700">{formatNumber(programData.avgAgeByStatus.graduatedAvg)}</p>
              <p className="text-xs text-blue-500 mt-1">años (edad al registro)</p>
            </div>
          </div>
        </div>

        {/* 2.3: Contactabilidad por Centro — Table with % bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Contactabilidad por Centro
          </h3>
          <p className="text-xs text-gray-400 mb-4">% de tutores con teléfono válido por centro, ordenado de mayor a menor</p>
          {programData.contactabilidadByCentro.length > 0 ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Centro</th>
                    <th className="px-4 py-3 text-right">Total Tutores</th>
                    <th className="px-4 py-3 text-right">Con Teléfono</th>
                    <th className="px-4 py-3 text-right w-28">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {programData.contactabilidadByCentro.map(item => (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{item.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{formatNumber(item.totalTutores)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{formatNumber(item.conTelefono)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold tabular-nums text-gray-900">{formatPercentage(item.pct)}</span>
                          <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(item.pct, 100)}%`,
                                backgroundColor: item.pct >= 60 ? '#22c55e' : item.pct >= 30 ? '#f97316' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos de contactabilidad</div>
          )}
        </div>

        {/* 2.4: Minors with Tutor by Centro — Table with % bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Menores con Tutor por Centro
          </h3>
          <p className="text-xs text-gray-400 mb-4">% de menores de edad con tutor asignado por centro, ordenado de mayor a menor</p>
          {programData.minorsTutorByCentro.length > 0 ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Centro</th>
                    <th className="px-4 py-3 text-right">Total Menores</th>
                    <th className="px-4 py-3 text-right">Con Tutor</th>
                    <th className="px-4 py-3 text-right w-28">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {programData.minorsTutorByCentro.map(item => (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{item.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{formatNumber(item.totalMenores)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">{formatNumber(item.conTutor)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold tabular-nums text-gray-900">{formatPercentage(item.pct)}</span>
                          <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(item.pct, 100)}%`,
                                backgroundColor: item.pct >= 60 ? '#22c55e' : item.pct >= 30 ? '#f97316' : '#dc2626',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos de menores por centro</div>
          )}
        </div>
      </div>
    </BoardShell>
  );
};

export default ProgramaBoard;
