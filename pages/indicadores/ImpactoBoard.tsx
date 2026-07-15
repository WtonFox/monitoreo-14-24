import React, { useState } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Target, Grid3X3, List, AlertTriangle, Users, BookOpen, GraduationCap, MapPin, Shield, Heart } from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import BoardInfo from '../../components/BoardInfo';
import { useIndicadoresImpacto } from '../../hooks/useIndicadoresImpacto';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#a855f7', '#ec4899', '#3b82f6', '#22c55e'];
const RATE_COLORS = ['#3b82f6', '#22c55e'];

type ViewMode = 'grid' | 'row';

const ImpactoBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { filteredData, isDataLoading } = useIndicadoresFilters();
  const indicadores = useIndicadoresImpacto(filteredData);

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const multiVulnPct = indicadores.multiVulnConcentration.groups.find(g => g.group === '2+ condiciones')?.pct ?? 0;
  const avgRetention = indicadores.genderByRetention.groups
    .filter(g => g.group !== 'Sin registro' && g.value > 0)
    .reduce((sum, g) => sum + g.pct, 0);
  const retentionCount = indicadores.genderByRetention.groups
    .filter(g => g.group !== 'Sin registro' && g.value > 0).length;
  const overallRetention = retentionCount > 0 ? avgRetention / retentionCount : 0;

  return (
    <BoardShell
    title="Impacto Compuesto"
    description="Indicadores compuestos que cruzan dos o más dimensiones de los participantes: vulnerabilidad, programas sociales, género, edad, centros, educación y tutorías.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Target size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Cobertura × Vulnerabilidad</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {indicadores.coverageByVulnerability.status === 'viable'
                ? formatPercentage(indicadores.coverageByVulnerability.pct)
                : 'N/D'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Multivulnerabilidad (2+)</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {indicadores.multiVulnConcentration.status === 'viable'
                ? formatPercentage(multiVulnPct)
                : 'N/D'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Retención Promedio</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {indicadores.genderByRetention.status === 'viable'
                ? formatPercentage(overallRetention)
                : 'N/D'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Evaluados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(filteredData.length)}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar + View Toggle + Info */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio showSex noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Impacto Compuesto"
            sections={[
              { heading: '¿Qué mide?', content: 'Indicadores que cruzan dos o más dimensiones: vulnerabilidad × estado del programa, programas × egreso, género × retención, edad × egreso, tiempo de inclusión por centro, educación × programas, concentración de vulnerabilidades, tasa de éxito por provincia, cobertura × vulnerabilidad, y tutor × retención.' },
              { heading: 'Fórmula', content: 'Cada indicador compuesto se calcula segmentando la población filtrada y cruzando dos dimensiones. Los porcentajes se calculan sobre el total del grupo segmentado.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        {/* R1: Vulnerability × Program Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Vulnerabilidad × Estado del Programa</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.vulnByProgramStatus.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicadores.vulnByProgramStatus.groups}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickFormatter={tickShort} />
                  <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                  <Bar dataKey="pct" fill="#dc2626" radius={[4, 4, 0, 0]} name="Porcentaje" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de vulnerabilidad</div>
            )}
          </div>
        </div>

        {/* R2: Programs × Graduation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Programas Sociales × Tasa de Egreso</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.programsByGraduation.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicadores.programsByGraduation.groups}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickFormatter={tickShort} />
                  <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                  <Bar dataKey="pct" fill="#f97316" radius={[4, 4, 0, 0]} name="% Egreso" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de programas sociales</div>
            )}
          </div>
        </div>

        {/* R3: Gender × Retention */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo × Retención</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.genderByRetention.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicadores.genderByRetention.groups}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickFormatter={tickShort} />
                  <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                  <Bar dataKey="pct" fill="#3b82f6" radius={[4, 4, 0, 0]} name="% Activo" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de sexo</div>
            )}
          </div>
        </div>

        {/* R4: Age × Graduation (counts + %) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Edad × Egreso</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.ageByGraduation.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={indicadores.ageByGraduation.groups}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" />
                  <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                  <Bar dataKey="pct" fill="#eab308" radius={[4, 4, 0, 0]} name="% Egreso" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de edad</div>
            )}
            {/* Counts table row */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
              {indicadores.ageByGraduation.counts.map(c => (
                <div key={c.group} className="text-center bg-gray-50 rounded-lg p-2">
                  <span className="font-medium text-gray-700">{c.group}</span>
                  <br />
                  <span>{formatNumber(c.value)} participantes ({formatPercentage(c.pct)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* R5: Inclusion Time by Center — Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tiempo de Inclusión por Centro</h3>
          <p className="text-xs text-gray-400 mb-4">Días promedio entre registro e inclusión, ordenados de mayor a menor</p>
          {indicadores.inclusionTimeByCenter.length > 0 ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Centro</th>
                    <th className="px-4 py-3 text-right">Días promedio</th>
                    <th className="px-4 py-3 text-right w-20">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {indicadores.inclusionTimeByCenter.map(item => (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700 max-w-[200px] truncate" title={item.name}>{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-gray-900">
                        {item.isNa ? <span className="text-gray-400">—</span> : `${formatNumber(item.value)} días`}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {item.isNa ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">S/D</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos de inclusión por centro</div>
          )}
        </div>

        {/* R6: Education × Programs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel Educativo × Programas Sociales</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.educationByPrograms.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicadores.educationByPrograms.groups} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="group" type="category" width={140} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} name="Participantes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de nivel educativo</div>
            )}
          </div>
        </div>

        {/* R7: Multi-vulnerability Concentration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Concentración de Vulnerabilidades</h3>
          <div className={`h-${chartH} w-full`}>
            {indicadores.multiVulnConcentration.status === 'viable' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicadores.multiVulnConcentration.groups}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="group" tickFormatter={tickShort} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} name="Participantes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de vulnerabilidades</div>
            )}
          </div>
        </div>

        {/* R8: Province Success Rate — Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tasa de Éxito por Provincia</h3>
          <p className="text-xs text-gray-400 mb-4">Egresados / (Activos + Egresados) por provincia, ordenado de mayor a menor</p>
          {indicadores.provinceSuccessRate.length > 0 ? (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Provincia</th>
                    <th className="px-4 py-3 text-right">Tasa de Éxito</th>
                    <th className="px-4 py-3 text-right w-28">Barra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {indicadores.provinceSuccessRate.map(item => (
                    <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-700">{item.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-gray-900">
                        {formatPercentage(item.value)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(item.value, 100)}%`,
                                backgroundColor: item.value >= 60 ? '#22c55e' : item.value >= 30 ? '#f97316' : '#dc2626',
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
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos de provincias</div>
          )}
        </div>

        {/* R10: Tutor × Retention — Per-group cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tutor × Retención</h3>
          {indicadores.tutorByRetention.status === 'viable' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indicadores.tutorByRetention.groups.map(group => (
                <div key={group.group} className={`rounded-xl border p-5 ${group.status === 'viable' ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">{group.group}</p>
                    {group.status === 'no-viable' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        S/D
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                        OK
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <span className={`text-4xl font-bold tabular-nums ${group.status === 'viable' ? 'text-gray-900' : 'text-gray-300'}`}>
                      {group.status === 'viable' ? formatPercentage(group.pct) : '—'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">% Activo</p>
                  </div>
                  <div className="mt-3 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(group.pct, 100)}%`,
                        backgroundColor: group.status === 'viable' ? '#3b82f6' : '#d1d5db',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">{formatNumber(group.value)} participantes</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">Sin datos de tutor</div>
          )}
        </div>
      </div>
    </BoardShell>
  );
};

export default ImpactoBoard;
