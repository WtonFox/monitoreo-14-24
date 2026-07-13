import React, { useMemo, useState } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';
import { CalendarDays, TrendingUp, Calendar, Clock, Grid3X3, List } from 'lucide-react';
import BoardShell from '../../components/BoardShell';
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
  semana: number;
  mes: number;
  promedioDiario: number;
  weekGrowth: number;
  timeline: DailyCount[];
  centrosRanking: CentroCount[];
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
  const { filteredData } = useIndicadoresFilters();
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');
  const [localProvincia, setLocalProvincia] = useState<string>('todos');

  // ── Available provinces for local filter ──
  const availableProvinces = useMemo(() => {
    const provinces = new Set<string>();
    for (const p of filteredData) {
      if (p.provincia) provinces.add(p.provincia);
    }
    return Array.from(provinces).sort();
  }, [filteredData]);

  // ── All computations via useMemo ──
  const metrics: ComputedMetrics = useMemo(() => {
    let data = filteredData;
    if (localProvincia !== 'todos') {
      data = data.filter(p => p.provincia === localProvincia);
    }

    const today = new Date();
    const todayStr = toDateStr(today);

    // Group by date and centro
    const dailyCounts = new Map<string, number>();
    const centroCounts = new Map<string, { count: number; provincia: string | null }>();

    for (const p of data) {
      if (!p.fechaRegistro) continue;

      // Normalize to YYYY-MM-DD
      const dateOnly = p.fechaRegistro.split('T')[0].split(' ')[0];
      dailyCounts.set(dateOnly, (dailyCounts.get(dateOnly) ?? 0) + 1);

      // Centro aggregation
      if (p.centro) {
        const prev = centroCounts.get(p.centro) ?? { count: 0, provincia: p.provincia ?? null };
        centroCounts.set(p.centro, {
          count: prev.count + 1,
          provincia: p.provincia ?? prev.provincia,
        });
      }
    }

    // ── KPI: Hoy ──
    const hoy = dailyCounts.get(todayStr) ?? 0;

    // ── KPI: Esta semana (Mon–Sun) ──
    const thisWeekMonday = getMonday(today);
    const thisWeekSunday = new Date(thisWeekMonday);
    thisWeekSunday.setDate(thisWeekMonday.getDate() + 6);
    thisWeekSunday.setHours(23, 59, 59, 999);

    // ── KPI: Semana anterior (for % growth) ──
    const prevWeekMonday = new Date(thisWeekMonday);
    prevWeekMonday.setDate(thisWeekMonday.getDate() - 7);
    const prevWeekSunday = new Date(thisWeekMonday);
    prevWeekSunday.setMilliseconds(-1); // Sunday 23:59:59.999 of prev week

    let semana = 0;
    let semanaAnterior = 0;

    for (const [dateStr, count] of dailyCounts) {
      const d = parseLocalDate(dateStr);
      if (d >= thisWeekMonday && d <= thisWeekSunday) {
        semana += count;
      }
      if (d >= prevWeekMonday && d <= prevWeekSunday) {
        semanaAnterior += count;
      }
    }

    const weekGrowth =
      semanaAnterior > 0 ? ((semana - semanaAnterior) / semanaAnterior) * 100 : 0;

    // ── KPI: Este mes ──
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let mes = 0;
    for (const [dateStr, count] of dailyCounts) {
      const d = parseLocalDate(dateStr);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        mes += count;
      }
    }

    // ── 30-day timeline ──
    const timeline: DailyCount[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = toDateStr(d);
      timeline.push({
        date: dateStr,
        count: dailyCounts.get(dateStr) ?? 0,
      });
    }

    // 7-day moving average
    const timelineWithMA = timeline.map((entry, idx) => {
      if (idx < 6) return { ...entry, movingAvg: undefined };
      const slice = timeline.slice(idx - 6, idx + 1);
      const sum = slice.reduce((s, e) => s + e.count, 0);
      return { ...entry, movingAvg: Math.round((sum / 7) * 10) / 10 };
    });

    // ── Center ranking (top 10) ──
    const centrosRanking: CentroCount[] = Array.from(centroCounts.entries())
      .map(([centro, info]) => ({ centro, provincia: info.provincia, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── KPI: Daily average (last 30 days) ──
    const total30d = timeline.reduce((s, e) => s + e.count, 0);
    const promedioDiario =
      timeline.length > 0 ? Math.round((total30d / timeline.length) * 10) / 10 : 0;

    return {
      hoy,
      semana,
      mes,
      promedioDiario,
      weekGrowth,
      timeline: timelineWithMA,
      centrosRanking,
    };
  }, [filteredData, localProvincia]);

  // ── Empty state ──
  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell>
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600 mr-4">
            <CalendarDays size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Fichas Hoy</p>
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
            <p className="text-sm text-gray-500 font-medium">Esta Semana</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(metrics.semana)}
            </h3>
            <p
              className={`text-xs font-medium ${
                metrics.weekGrowth >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {metrics.weekGrowth >= 0 ? '+' : ''}
              {formatPercentage(metrics.weekGrowth, 1)} vs semana anterior
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500 mr-4">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Este Mes</p>
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
            <p className="text-sm text-gray-500 font-medium">
              Promedio Diario (30d)
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {metrics.promedioDiario.toFixed(1)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Filter Bar + Local Province Filter ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-sm text-gray-500 font-medium">Provincia:</label>
          <select
            value={localProvincia}
            onChange={e => setLocalProvincia(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todas</option>
            {availableProvinces.map(prov => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
          </div>
        </div>
      </div>

      <div className={chartClass(viewMode)}>
      {/* ── 30-Day Timeline Chart ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Fichas por Día (Últimos 30 Días)
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
