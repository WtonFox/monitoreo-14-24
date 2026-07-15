import React, { useEffect, useMemo, useState } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import {
  CalendarDays,
  TrendingUp,
  Calendar,
  Clock,
  Building2,
  Grid3X3,
  List,
  RotateCcw,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import BoardInfo from '../../components/BoardInfo';
import { chartClass, chartH } from '../../utils/indicadores-helpers';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';

// ── Local types ──

interface DailyCount {
  date: string;
  count: number;
  movingAvg?: number;
}

interface CentroCount {
  centro: string;
  provincia: string | null;
  count: number;
}

interface ComputedMetrics {
  hoy: number;
  hoyCount: number;
  semana: number;
  mes: number;
  promedioDiario: number;
  weekGrowth: number;
  timeline: DailyCount[];
  centrosRanking: CentroCount[];
  dayOfWeek: { name: string; value: number }[];
  last7Days: { name: string; value: number }[];
  centrosHoy: CentroCount[];
}

// ── Helpers ──

/** Format a Date to YYYY-MM-DD local date string. */
const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse a YYYY-MM-DD string as a local Date (no timezone shift). */
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Short label for chart X axis: DD/MM */
const formatDateShort = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
};

/** Full label for tooltip: "lunes, 13 de julio de 2026" */
const formatDateFull = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Use Date.UTC to avoid local timezone shift
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/** Monday 00:00:00 of the week containing the given date. */
const getMonday = (d: Date): Date => {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// ── Component ──

const RegistroDiarioBoard: React.FC = () => {
  const { filteredData, isDataLoading } = useIndicadoresFilters();
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('row');
  const [now, setNow] = useState(() => new Date());

  // ── Local date range filter ──
  const today = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now],
  );
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date(today));

  const resetToLast30Days = () => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    setDateFrom(d);
    setDateTo(new Date(today));
  };

  // Self-recomputing clock tick — recompute boundaries at midnight without data change
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ── All computations via useMemo ──
  const metrics: ComputedMetrics = useMemo(() => {
    // ── Today's count (from base filtered data, independent of date range) ──
    const todayStrLocal = toDateStr(now);
    const hoyCount = filteredData.filter((p) => {
      if (!p.fechaRegistro) return false;
      return p.fechaRegistro.split('T')[0].split(' ')[0] === todayStrLocal;
    }).length;

    let data = filteredData;

    // Local date range filter
    const fromStr = toDateStr(dateFrom);
    const toStr = toDateStr(dateTo);
    data = data.filter((p) => {
      if (!p.fechaRegistro) return false;
      const dateOnly = p.fechaRegistro.split('T')[0].split(' ')[0];
      return dateOnly >= fromStr && dateOnly <= toStr;
    });

    const today = now;

    // Group by date and centro
    const dailyCounts = new Map<string, number>();
    const centroCounts = new Map<
      string,
      { count: number; provincia: string | null }
    >();

    for (const p of data) {
      if (!p.fechaRegistro) continue;

      // Normalize to YYYY-MM-DD
      const dateOnly = p.fechaRegistro.split('T')[0].split(' ')[0];
      dailyCounts.set(dateOnly, (dailyCounts.get(dateOnly) ?? 0) + 1);

      // Centro aggregation
      if (p.centro) {
        const prev = centroCounts.get(p.centro) ?? {
          count: 0,
          provincia: p.provincia ?? null,
        };
        centroCounts.set(p.centro, {
          count: prev.count + 1,
          provincia: p.provincia ?? prev.provincia,
        });
      }
    }

    // ── Timeline based on selected date range ──
    const timeline: DailyCount[] = [];
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const diffDays = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // ── KPIs for the selected date range ──
    const totalPeriodo = Array.from(dailyCounts.values()).reduce(
      (s, c) => s + c,
      0,
    );
    const diasConDatos = dailyCounts.size;
    const promedioDiarioRange =
      diffDays >= 0 ? Math.round((totalPeriodo / (diffDays + 1)) * 10) / 10 : 0;
    for (let i = 0; i <= diffDays; i++) {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      const dateStr = toDateStr(d);
      timeline.push({
        date: dateStr,
        count: dailyCounts.get(dateStr) ?? 0,
      });
    }

    // 7-day moving average (only when range >= 7 days)
    const timelineWithMA =
      timeline.length >= 7
        ? timeline.map((entry, idx) => {
            if (idx < 6) return { ...entry, movingAvg: undefined };
            const slice = timeline.slice(idx - 6, idx + 1);
            const sum = slice.reduce((s, e) => s + e.count, 0);
            return { ...entry, movingAvg: Math.round((sum / 7) * 10) / 10 };
          })
        : timeline.map((e) => ({ ...e, movingAvg: undefined }));

    // ── Center ranking (top 10) ──
    const centrosRanking: CentroCount[] = Array.from(centroCounts.entries())
      .map(([centro, info]) => ({
        centro,
        provincia: info.provincia,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Day-of-week distribution ──
    const DAYS = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    const dowCounts = new Array(7).fill(0);
    for (const [dateStr, count] of dailyCounts) {
      const d = parseLocalDate(dateStr);
      dowCounts[d.getDay()] += count;
    }
    const dayOfWeek = DAYS.map((name, i) => ({ name, value: dowCounts[i] }));

    // ── KPI: Daily average (last 30 days) ──
    const total30d = timeline.reduce((s, e) => s + e.count, 0);
    const promedioDiario =
      timeline.length > 0
        ? Math.round((total30d / timeline.length) * 10) / 10
        : 0;

    // ── Last 7 days timeline ──
    const last7Days: { name: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(toDate);
      d.setDate(toDate.getDate() - i);
      const dateStr = toDateStr(d);
      last7Days.push({
        name: formatDateShort(dateStr),
        value: dailyCounts.get(dateStr) ?? 0,
      });
    }

    // ── Centers registered on the last day of the range ──
    const toStrEnd = toDateStr(dateTo);
    const centrosPorDia = new Map<string, Map<string, number>>();
    for (const p of data) {
      if (!p.fechaRegistro || !p.centro) continue;
      const dateOnly = p.fechaRegistro.split('T')[0].split(' ')[0];
      if (!centrosPorDia.has(dateOnly)) centrosPorDia.set(dateOnly, new Map());
      const dia = centrosPorDia.get(dateOnly)!;
      dia.set(p.centro, (dia.get(p.centro) ?? 0) + 1);
    }
    const centrosHoyList: CentroCount[] = [];
    const centrosDelDia = centrosPorDia.get(toStrEnd);
    if (centrosDelDia) {
      for (const [centro, count] of centrosDelDia) {
        const p = data.find((d) => d.centro === centro);
        centrosHoyList.push({ centro, provincia: p?.provincia ?? null, count });
      }
      centrosHoyList.sort((a, b) => b.count - a.count);
    }

    return {
      hoy: totalPeriodo,
      hoyCount,
      semana: diasConDatos,
      mes: diffDays + 1,
      promedioDiario: promedioDiarioRange,
      weekGrowth: 0,
      timeline: timelineWithMA,
      centrosRanking,
      dayOfWeek,
      last7Days,
      centrosHoy: centrosHoyList,
    };
  }, [filteredData, dateFrom, dateTo, now]);

  // ── Empty state ──
  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell
      title="Registro Diario de Fichas"
      description="Monitoreo diario de fichas registradas: KPIs, timeline de 30 días y ranking de centros."
    >
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600 mr-4">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Fichas Hoy</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(metrics.hoyCount)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 mr-4">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total en el período
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(metrics.hoy)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Días con datos</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(metrics.semana)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500 mr-4">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rango de días</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(metrics.mes)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Promedio diario</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {metrics.promedioDiario.toFixed(1)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Unified Filter Bar ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar
          showYear
          showProvince
          showMunicipio
          showSex={false}
          noContainer
        />

        <div className="h-6 w-px bg-gray-200 hidden lg:block" />

        <label className="text-sm font-medium text-gray-600">Período:</label>
        <input
          type="date"
          value={toDateStr(dateFrom)}
          onChange={(e) => {
            const parts = e.target.value.split('-').map(Number);
            setDateFrom(new Date(parts[0], parts[1] - 1, parts[2]));
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={toDateStr(dateTo)}
          onChange={(e) => {
            const parts = e.target.value.split('-').map(Number);
            setDateTo(new Date(parts[0], parts[1] - 1, parts[2]));
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={resetToLast30Days}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors border border-gray-200"
          title="Restablecer a últimos 30 días"
        >
          <RotateCcw size={14} />
          Últimos 30 días
        </button>

        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Registro Diario de Fichas"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Monitorea el registro diario de participantes en el programa. Muestra cuántas fichas se registran por día, su evolución en el tiempo y qué centros registran más.',
              },
              {
                heading: 'KPIs',
                content:
                  '• Fichas Hoy: registros del día actual\n• Total en el período: suma de fichas en el rango de fechas seleccionado\n• Días con datos: cantidad de días con al menos un registro\n• Rango de días: días cubiertos por el período seleccionado\n• Promedio diario: total / días del período',
              },
              {
                heading: 'Timeline',
                content:
                  'El gráfico principal muestra barras diarias del período seleccionado con una línea de media móvil de 7 días (promedio semanal) para suavizar la tendencia.',
              },
              {
                heading: 'Día de la Semana',
                content:
                  'El gráfico de distribución semanal permite identificar patrones: ¿se registran más los lunes? ¿los fines de semana hay menos actividad?',
              },
              {
                heading: 'Ranking de Centros',
                content:
                  'Los centros se ordenan por cantidad total de fichas registradas.',
              },
              {
                heading: 'Filtros',
                content:
                  'Usá los filtros globales para segmentar por provincia, municipio y año. El selector de fechas permite analizar cualquier período.',
              },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={chartClass(viewMode)}>
        {/* ── 30-Day Timeline Chart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Fichas por Día
          </h3>
          <div className={`h-${chartH} w-full`}>
            {metrics.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={metrics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateShort}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    labelFormatter={(label: any) =>
                      typeof label === 'string'
                        ? formatDateFull(label)
                        : String(label ?? '')
                    }
                    formatter={(value: any) => formatNumber(Number(value))}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    name="Fichas"
                  />
                  <Line
                    type="monotone"
                    dataKey="movingAvg"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    name="Media 7d"
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        {/* ── Last 7 Days + Day-of-Week ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Últimos 7 Días
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Bar
                    dataKey="value"
                    fill="#06b6d4"
                    radius={[4, 4, 0, 0]}
                    name="Fichas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Distribución por Día de la Semana
            </h3>
            <p className="text-xs text-gray-400 mb-2">
              Valores acumulados del período seleccionado
            </p>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.dayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Bar
                    dataKey="value"
                    fill="#0891b2"
                    radius={[4, 4, 0, 0]}
                    name="Fichas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Centers active on the last day ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            Centros del {formatDateFull(toDateStr(dateTo))}
          </h3>
          {metrics.centrosHoy.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 w-8">
                      #
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">
                      Centro
                    </th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">
                      Provincia
                    </th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">
                      Fichas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.centrosHoy.slice(0, 10).map((row, idx) => (
                    <tr
                      key={row.centro}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-gray-800 font-medium">
                        {row.centro}
                      </td>
                      <td className="py-2 px-3 text-gray-500">
                        {row.provincia || '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-800">
                        {formatNumber(row.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-400">
              <CalendarDays size={24} className="mr-2 text-gray-300" />
              Sin registros en esta fecha
            </div>
          )}
        </div>

        {/* ── Center Ranking Table ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Ranking de Centros por Fichas Registradas
          </h3>
          {metrics.centrosRanking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Centro
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Provincia
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Fichas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.centrosRanking.map((row, idx) => (
                    <tr
                      key={row.centro}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {row.centro}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {row.provincia || '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-800">
                        {formatNumber(row.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <CalendarDays size={32} className="mb-2 text-gray-300" />
              <p>Sin datos</p>
            </div>
          )}
        </div>
      </div>
    </BoardShell>
  );
};

export default RegistroDiarioBoard;
