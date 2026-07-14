import React, { useState, useMemo } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'
import { FileWarning, AlertTriangle, BarChart3, Table as TableIcon, Grid3X3, List, Circle, CheckCircle2 } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import BoardInfo from '../../components/BoardInfo'
import { tickShort, chartClass } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import type { Participant } from '../../types'

// ── Local helper — not exported ──
const hasNdValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' ||
  val.toLowerCase() === 'nd' || val === 'N/D' || val.toLowerCase() === 'no disponible'

// ── Field definitions (reconciled against real Participant type) ──
// Spec listed 15 fields including sector, nombreTutor, apellidoTutor which don't exist in type.
// Design listed 9. Added estadoCivil (exists in type) and tutor (spec intent → real field tutor).
interface FieldDef {
  key: keyof Participant;
  label: string;
}

const FIELDS: FieldDef[] = [
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

interface ComputedMetrics {
  overallNdPct: number;
  worstField: { label: string; pct: number } | null;
  camposAbove50: number;
  totalRecords: number;
  fieldRanking: FieldQuality[];
}

type ViewMode = 'general' | 'provincia'

// ── Bar color gradient: red (>50%) → amber (>30%) → yellow (>15%) → green (≤15%) ──
const barColor = (pct: number): string => {
  if (pct > 50) return '#dc2626'
  if (pct > 30) return '#f59e0b'
  if (pct > 15) return '#eab308'
  return '#22c55e'
};

const CalidadNdBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'row'>('grid');
  const { filteredData } = useIndicadoresFilters();

  const computed: ComputedMetrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        overallNdPct: 0,
        worstField: null,
        camposAbove50: 0,
        totalRecords: 0,
        fieldRanking: [],
      };
    }

    // Per-field ND counting
    const fieldRanking: FieldQuality[] = FIELDS.map(f => {
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

    const totalCells = total * FIELDS.length;
    const totalNd = fieldRanking.reduce((s, f) => s + f.ndCount, 0);
    const overallNdPct = totalCells > 0 ? (totalNd / totalCells) * 100 : 0;

    const worstField = fieldRanking.length > 0
      ? { label: fieldRanking[0].label, pct: fieldRanking[0].pct }
      : null;

    const camposAbove50 = fieldRanking.filter(f => f.pct > 50).length;

    return { overallNdPct, worstField, camposAbove50, totalRecords: total, fieldRanking };
  }, [filteredData]);

  const { overallNdPct, worstField, camposAbove50, totalRecords, fieldRanking } = computed;

  // ── Per-province breakdown (only computed when provincia view is active) ──
  const provinceBreakdown = useMemo(() => {
    if (viewMode !== 'provincia' || filteredData.length === 0) return [];

    const provinceMap = new Map<string, Participant[]>();
    for (const p of filteredData) {
      const prov = p.provincia || 'Sin provincia'
      if (!provinceMap.has(prov)) provinceMap.set(prov, []);
      provinceMap.get(prov)!.push(p);
    }

    return Array.from(provinceMap.entries())
      .map(([provincia, participants]) => {
        const total = participants.length;
        const fields = FIELDS.map(f => {
          let ndCount = 0;
          for (const p of participants) {
            if (hasNdValue(p[f.key] as string | null | undefined)) ndCount++;
          }
          return {
            key: f.key as string,
            label: f.label,
            ndCount,
            total,
            pct: (ndCount / total) * 100,
          };
        });
        const totalCells = total * FIELDS.length;
        const totalNd = fields.reduce((s, f) => s + f.ndCount, 0);
        const overallPct = totalCells > 0 ? (totalNd / totalCells) * 100 : 0;
        return { provincia, fields, overallPct };
      })
      .sort((a, b) => b.overallPct - a.overallPct);
  }, [filteredData, viewMode]);

  // ── Empty state ──
  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  // Chart data
  const chartData = fieldRanking.map(f => ({
    name: f.label,
    pct: Number(f.pct.toFixed(1)),
    ndCount: f.ndCount,
    total: f.total,
  }));

  // Donut data: overall ND vs non-ND
  const totalCells = filteredData.length * FIELDS.length;
  const totalNd = fieldRanking.reduce((s, f) => s + f.ndCount, 0);
  const totalOk = totalCells - totalNd;
  const donutData = [
    { name: 'Completos', value: totalOk, color: '#22c55e' },
    { name: 'No disponibles', value: totalNd, color: '#dc2626' },
  ];

  return (
    <BoardShell
    title="Calidad del Dato (ND)"
    description="Porcentaje de valores no disponibles en 11 campos clave del formulario de participantes.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4">
            <FileWarning size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% de datos no disponibles</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(overallNdPct)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Peor campo</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {worstField ? worstField.label : '—'}
            </h3>
            {worstField && (
              <p className="text-xs text-gray-400">
                {formatPercentage(worstField.pct)}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campos &gt;50% ND</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(camposAbove50)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-600 mr-4">
            <TableIcon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total registros</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(totalRecords)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Bar + View Toggles + Info */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <BoardInfo
            title="Calidad del Dato (ND)"
            sections={[
              { heading: '¿Qué mide?', content: 'Evalúa la calidad de los datos registrados calculando el porcentaje de valores "No Disponible" (ND) en los campos más importantes del formulario de cada participante.' },
              { heading: '¿Qué se considera ND?', content: 'Un campo se marca como ND si su valor es:\n• null / undefined\n• Vacío ("")\n• "N/A"\n• "N/D"\n• "No Disponible" (case-insensitive)\n\nCualquier otro valor (incluyendo "Ninguna") se considera como un dato válido.' },
              { heading: 'Fórmula', content: '% ND global = (Total celdas ND / Total celdas analizadas) × 100\n\nTotal celdas = Cantidad de registros × 11 campos analizados\n\n% ND por campo = (Registros con ND en ese campo / Total registros) × 100' },
              { heading: 'Campos analizados', content: '11 campos: Teléfonos, Tel. Responsable, Cédula Tutor, Nombre Tutor, Alergias, Discapacidades, Enfermedades, Programas Sociales, Nivel de Estudio, Estado Civil, Dirección.' },
              { heading: 'Cómo leerlo', content: 'Los campos con mayor % ND son los que tienen peor calidad de dato. El código de colores del gráfico indica gravedad: rojo >50%, ámbar >30%, amarillo >15%, verde ≤15%.' },
              { heading: 'Vista por provincia', content: 'Cambia a "Por Provincia" para ver el desglose de % ND de cada campo por provincia. Útil para detectar patrones geográficos en la calidad del dato.' },
            ]}
          />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('general')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'general'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={14} />
              General
            </button>
            <button
              onClick={() => setViewMode('provincia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'provincia'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableIcon size={14} />
              Por Provincia
            </button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
            <button onClick={() => setLayoutMode('row')}
              className={`p-1.5 rounded ${layoutMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
          </div>
        </div>
      </div>

      {viewMode === 'general' ? (
        <div className={chartClass(layoutMode)}>
          {/* Overview Donut Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Vista general de calidad de dato
            </h3>
            <div className="flex items-center justify-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {donutData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <Circle size={10} fill={entry.color} stroke={entry.color} />
                    <span className="text-sm text-gray-600">{entry.name}: <strong>{formatNumber(entry.value)}</strong></span>
                  </div>
                ))}
                <div className="text-xs text-gray-400 mt-2">
                  {formatNumber(totalCells)} celdas totales ({formatNumber(FIELDS.length)} campos × {formatNumber(filteredData.length)} registros)
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal BarChart with color gradient */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Campos con peor calidad de dato
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 20, right: 40, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `${v}%`} domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickFormatter={tickShort}
                    width={90}
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    formatter={(v: unknown) => formatPercentage(Number(v))}
                    labelFormatter={(l) => l}
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} name="% ND">
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={barColor(entry.pct)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Ranking de campos por calidad de dato
            </h3>
            {fieldRanking.length > 0 ? (
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
                    {fieldRanking.map((field, i) => (
                      <tr key={field.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{field.label}</td>
                        <td className="py-3 px-4 text-right font-semibold" style={{ color: barColor(field.pct) }}>
                          {formatPercentage(field.pct)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatNumber(field.ndCount)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">
                          {formatNumber(field.total)}
                        </td>
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
      ) : (
        /* Province Breakdown */
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
                    {FIELDS.map(f => (
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
                        <td
                          key={f.key}
                          className="py-3 px-2 text-right text-gray-600 whitespace-nowrap"
                          style={{ color: barColor(f.pct) }}
                        >
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

export default CalidadNdBoard;
