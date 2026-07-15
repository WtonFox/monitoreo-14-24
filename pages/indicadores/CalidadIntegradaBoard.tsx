import React, { useState, useMemo } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { CheckCircle, FileWarning, AlertTriangle, BarChart3, Table as TableIcon, Grid3X3, List, Circle, PieChart as PieChartIcon } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import BoardInfo from '../../components/BoardInfo'
import { chartClass, chartH } from '../../utils/indicadores-helpers'
import { XAxisTick, YAxisTick } from '../../utils/indicadores-tick-components'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import type { Participant } from '../../types'

// ── ND Helpers (reused from CalidadNdBoard) ──

const hasNdValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' ||
  val.toLowerCase() === 'nd' || val === 'N/D' || val.toLowerCase() === 'no disponible'

interface FieldDef {
  key: keyof Participant;
  label: string;
}

const ND_FIELDS: FieldDef[] = [
  { key: 'telefonos', label: 'Teléfonos' },
  { key: 'telefonosResponsable', label: 'Tel. Responsable' },
  { key: 'cedulaTutor', label: 'Cédula Tutor' },
  { key: 'tutor', label: 'Nombre Tutor' },
  { key: 'alergias', label: 'Alergias' },
  { key: 'discapacidades', label: 'Discapacidades' },
  { key: 'enfermedades', label: 'Enfermedades' },
  { key: 'programasSociales', label: 'Programas Sociales' },
  { key: 'nivelEstudio', label: 'Nivel de Estudio' },
  { key: 'estadoCivil', label: 'Estado Civil' },
  { key: 'direccion', label: 'Dirección' },
];

interface FieldQuality {
  key: string;
  label: string;
  ndCount: number;
  total: number;
  pct: number;
}

interface NdMetrics {
  overallNdPct: number;
  worstField: { label: string; pct: number } | null;
  camposAbove50: number;
  totalRecords: number;
  fieldRanking: FieldQuality[];
}

const barColor = (pct: number): string => {
  if (pct > 50) return '#dc2626'
  if (pct > 30) return '#f59e0b'
  if (pct > 15) return '#eab308'
  return '#22c55e'
};

const COMPLETITUD_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#8b5cf6'];

type ViewMode = 'grid' | 'row'

const CalidadIntegradaBoard: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<ViewMode>('row');
  const [ndViewMode, setNdViewMode] = useState<'general' | 'provincia'>('general');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { qualityData } = boardData;

  // ── ND metrics (computed from filteredData) ──
  const ndMetrics: NdMetrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return { overallNdPct: 0, worstField: null, camposAbove50: 0, totalRecords: 0, fieldRanking: [] };
    }

    const fieldRanking: FieldQuality[] = ND_FIELDS.map(f => {
      let ndCount = 0;
      for (const p of filteredData) {
        if (hasNdValue(p[f.key] as string | null | undefined)) {
          ndCount++;
        }
      }
      return {
        key: f.key as string,
        label: f.label,
        ndCount,
        total,
        pct: (ndCount / total) * 100,
      };
    }).sort((a, b) => b.pct - a.pct);

    const totalCells = total * ND_FIELDS.length;
    const totalNd = fieldRanking.reduce((s, f) => s + f.ndCount, 0);
    const overallNdPct = totalCells > 0 ? (totalNd / totalCells) * 100 : 0;
    const worstField = fieldRanking.length > 0
      ? { label: fieldRanking[0].label, pct: fieldRanking[0].pct }
      : null;
    const camposAbove50 = fieldRanking.filter(f => f.pct > 50).length;

    return { overallNdPct, worstField, camposAbove50, totalRecords: total, fieldRanking };
  }, [filteredData]);

  // ── Province breakdown for ND ──
  const provinceBreakdown = useMemo(() => {
    if (ndViewMode !== 'provincia' || filteredData.length === 0) return [];

    const provinceMap = new Map<string, Participant[]>();
    for (const p of filteredData) {
      const prov = p.provincia || 'Sin provincia';
      if (!provinceMap.has(prov)) provinceMap.set(prov, []);
      provinceMap.get(prov)!.push(p);
    }

    return Array.from(provinceMap.entries())
      .map(([provincia, participants]) => {
        const total = participants.length;
        const fields = ND_FIELDS.map(f => {
          let ndCount = 0;
          for (const p of participants) {
            if (hasNdValue(p[f.key] as string | null | undefined)) ndCount++;
          }
          return { label: f.label, ndCount, total, pct: (ndCount / total) * 100 };
        });
        const totalCells = total * ND_FIELDS.length;
        const totalNd = fields.reduce((s, f) => s + f.ndCount, 0);
        return { provincia, fields, overallPct: totalCells > 0 ? (totalNd / totalCells) * 100 : 0 };
      })
      .sort((a, b) => b.overallPct - a.overallPct);
  }, [filteredData, ndViewMode]);

  // ── Completeness KPI ──
  const overallCompletitudPct = qualityData.fieldBreakdown.length > 0
    ? qualityData.fieldBreakdown.reduce((s, f) => s + f.pct, 0) / qualityData.fieldBreakdown.length
    : 0;

  // ── Empty / Loading states ──
  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  // ── Chart data for ND ──
  const ndChartData = ndMetrics.fieldRanking.map(f => ({
    name: f.label,
    pct: Number(f.pct.toFixed(1)),
    ndCount: f.ndCount,
    total: f.total,
  }));

  return (
    <BoardShell
      title="Calidad del Dato"
      description="Completitud de campos y valores no disponibles en el formulario de participantes. Vista integrada de ambas métricas."
    >
      {/* ── SECTION A: Completeness KPIs ── */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Completitud
        </h2>
        <p className="text-sm text-gray-500">Porcentaje de registros que tienen el dato completado en cada campo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-violet-50 rounded-lg text-violet-600 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completitud General</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(overallCompletitudPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos &gt; 80%</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(qualityData.fieldBreakdown.filter(f => f.pct >= 80).length)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-500 mr-4"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos Críticos (&lt;60%)</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(qualityData.fieldBreakdown.filter(f => f.pct < 60).length)}
            </h3>
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

      {/* ── SECTION B: ND KPIs ── */}
      <div className="mb-2 mt-8">
        <h2 className="text-xl font-bold text-gray-900">
          No Disponibles (ND)
        </h2>
        <p className="text-sm text-gray-500">Porcentaje de valores no disponibles en 11 campos socio-demográficos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4"><FileWarning size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% de datos no disponibles</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(ndMetrics.overallNdPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Peor campo</p>
            <h3 className="text-2xl font-bold text-gray-800">{ndMetrics.worstField ? ndMetrics.worstField.label : '—'}</h3>
            {ndMetrics.worstField && (
              <p className="text-xs text-gray-400">{formatPercentage(ndMetrics.worstField.pct)}</p>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4"><BarChart3 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos &gt;50% ND</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(ndMetrics.camposAbove50)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-600 mr-4"><TableIcon size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total registros</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(ndMetrics.totalRecords)}</h3>
          </div>
        </div>
      </div>

      {/* ── Filters + View Toggle + Info ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Calidad del Dato (Integrada)"
            sections={[
              { heading: '¿Qué mide?', content: 'Este tablero integra dos métricas complementarias de calidad del dato:\n\n**Completitud**: ¿Cuántos registros TIENEN el dato completado? (Campos: cédula, fecha de nacimiento, nivel de estudio, alergias, discapacidades, enfermedades)\n\n**No Disponibles (ND)**: ¿Cuántos registros tienen valores ND/Nulo/Vacío en campos clave? (11 campos socio-demográficos)' },
              { heading: 'Diferencia clave', content: 'Completitud mide presencia del dato (el campo fue llenado). ND mide si el valor es informativo (no es ND/N/A). Un campo puede tener baja completitud PERO bajo ND si los datos que existen son de calidad, o viceversa.' },
              { heading: 'Campos de Completitud', content: '6 campos: Cédula, Fecha de nacimiento, Nivel de estudio, Alergias, Discapacidades, Enfermedades.' },
              { heading: 'Campos de ND', content: '11 campos: Teléfonos, Tel. Responsable, Cédula Tutor, Nombre Tutor, Alergias, Discapacidades, Enfermedades, Programas Sociales, Nivel de Estudio, Estado Civil, Dirección.' },
              { heading: 'Fórmula ND global', content: '% ND global = (Total celdas ND / Total celdas analizadas) × 100\n\nTotal celdas = Cantidad de registros × 11 campos analizados' },
              { heading: 'Código de colores ND', content: 'Rojo >50%, Ámbar >30%, Amarillo >15%, Verde ≤15%.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setNdViewMode('general')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${ndViewMode === 'general' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              General
            </button>
            <button onClick={() => setNdViewMode('provincia')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${ndViewMode === 'provincia' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              Por provincia
            </button>
          </div>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setLayoutMode('row')}
              className={`p-1.5 rounded ${layoutMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
            <button onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      <div className={chartClass(layoutMode)}>
        {/* ── SECTION A DETAIL: Completeness Bar Chart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Completitud por Campo
          </h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData.fieldBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={<XAxisTick />} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                <Bar dataKey="pct" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Completitud" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION A DETAIL: Completeness Table ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Desglose de Completitud
          </h3>
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

        {/* ── SECTION A DETAIL: Completeness Pie Chart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Campos Completos vs Incompletos
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completos (≥80%)', value: qualityData.fieldBreakdown.filter(f => f.pct >= 80).length, color: '#7c3aed' },
                      { name: 'Incompletos (<80%)', value: qualityData.fieldBreakdown.filter(f => f.pct < 80).length, color: '#e5e7eb' },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell key={0} fill="#7c3aed" />
                    <Cell key={1} fill="#e5e7eb" />
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Circle size={10} fill="#7c3aed" stroke="#7c3aed" />
                <span className="text-sm text-gray-600">Completos (≥80%): <strong>{formatNumber(qualityData.fieldBreakdown.filter(f => f.pct >= 80).length)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Circle size={10} fill="#e5e7eb" stroke="#e5e7eb" />
                <span className="text-sm text-gray-600">{'Incompletos (<80%):'} <strong>{formatNumber(qualityData.fieldBreakdown.filter(f => f.pct < 80).length)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION B DETAIL: ND Horizontal Bar Chart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Campos con peor calidad de dato (ND)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ndChartData}
                layout="vertical"
                margin={{ left: 20, right: 40, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={<YAxisTick />}
                  width={140}
                />
                <Tooltip
                  formatter={(v: unknown) => formatPercentage(Number(v))}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="% ND">
                  {ndChartData.map((entry, idx) => (
                    <Cell key={idx} fill={barColor(entry.pct)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── SECTION B DETAIL: ND Ranking Table ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Ranking de campos ND
          </h3>
          {ndMetrics.fieldRanking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Campo</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">% ND</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Count ND</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ndMetrics.fieldRanking.map((field, i) => (
                    <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{field.label}</td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: barColor(field.pct) }}>
                        {formatPercentage(field.pct)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatNumber(field.ndCount)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{formatNumber(field.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <TableIcon size={32} className="mb-2 text-gray-300" />
              <p>Sin datos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION B DETAIL: Province Breakdown (visible in provincia mode) ── */}
      {ndViewMode === 'provincia' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Desglose por provincia — % ND por campo
          </h3>
          {provinceBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 whitespace-nowrap">Provincia</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 whitespace-nowrap">% ND General</th>
                    {ND_FIELDS.map(f => (
                      <th key={f.key as string} className="text-right py-3 px-2 font-medium text-gray-500 text-xs whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {provinceBreakdown.map(prov => (
                    <tr key={prov.provincia} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-medium whitespace-nowrap">{prov.provincia}</td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap" style={{ color: barColor(prov.overallPct) }}>
                        {formatPercentage(prov.overallPct)}
                      </td>
                      {prov.fields.map(f => (
                        <td key={f.label} className="py-3 px-2 text-right text-gray-600 whitespace-nowrap" style={{ color: barColor(f.pct) }}>
                          {formatPercentage(f.pct)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <TableIcon size={32} className="mb-2 text-gray-300" />
              <p>Sin datos</p>
            </div>
          )}
        </div>
      )}
    </BoardShell>
  );
};

export default CalidadIntegradaBoard;
