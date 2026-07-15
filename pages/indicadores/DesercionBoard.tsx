import React, { useState, useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingDown,
  Building2,
  Users,
  AlertTriangle,
  MapPin,
  Grid3X3,
  List,
  GraduationCap,
  Globe,
  TrendingUp,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import BoardInfo from '../../components/BoardInfo';
import { chartClass, chartH } from '../../utils/indicadores-helpers';
import { YAxisTick } from '../../utils/indicadores-tick-components';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import { DOMINICAN_PROVINCES } from '../../constants';
import { findRegion } from '../../utils/geoUtils';

type ViewMode = 'general' | 'provincia';

interface CentroDesercion {
  centro: string;
  total: number;
  desertores: number;
  tasa: number;
}

interface ComputedMetrics {
  tasaGeneral: number;
  centroMayorNombre: string;
  centroMayorTasa: number;
  totalDesertores: number;
  centrosAnalizados: number;
  topCenters: CentroDesercion[];
}

/** Estados que indican deserción (case-insensitive) */
const isDesertionStatus = (estado: string | null | undefined): boolean => {
  if (!estado) return false;
  const s = estado.trim().toLowerCase();
  return [
    'retirado',
    'desertor',
    'baja',
    'cancelado',
    'inactivo',
    'no admitido',
    'abandonó',
    'abandono',
  ].includes(s);
};

const DesercionBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'row'>('row');
  const [localProvince, setLocalProvince] = useState('todos');
  const { filteredData, isDataLoading } = useIndicadoresFilters();

  const {
    tasaGeneral,
    centroMayorNombre,
    centroMayorTasa,
    totalDesertores,
    centrosAnalizados,
    topCenters,
  }: ComputedMetrics = useMemo(() => {
    let data = filteredData;

    if (viewMode === 'provincia' && localProvince !== 'todos') {
      data = data.filter((p) => p.provincia === localProvince);
    }

    const centroMap = new Map<string, { total: number; desertores: number }>();
    for (const p of data) {
      if (!p.centro) continue;
      const entry = centroMap.get(p.centro) ?? { total: 0, desertores: 0 };
      entry.total++;
      if (isDesertionStatus(p.estado)) {
        entry.desertores++;
      }
      centroMap.set(p.centro, entry);
    }

    const allCentros = Array.from(centroMap.entries())
      .map(([centro, { total, desertores }]) => ({
        centro,
        total,
        desertores,
        tasa: total > 0 ? (desertores / total) * 100 : 0,
      }))
      .sort((a, b) => b.tasa - a.tasa);

    const top = allCentros.slice(0, 10);

    const totalDesertoresVal = allCentros.reduce((s, c) => s + c.desertores, 0);
    const totalParticipantes = allCentros.reduce((s, c) => s + c.total, 0);
    const generalRate =
      totalParticipantes > 0
        ? (totalDesertoresVal / totalParticipantes) * 100
        : 0;
    const topCenter = top.length > 0 ? top[0] : null;

    return {
      tasaGeneral: generalRate,
      centroMayorNombre: topCenter?.centro ?? '—',
      centroMayorTasa: topCenter?.tasa ?? 0,
      totalDesertores: totalDesertoresVal,
      centrosAnalizados: allCentros.length,
      topCenters: top,
    };
  }, [filteredData, viewMode, localProvince]);

  // ── NEW SECTION DATA: Course Ranking ──
  const courseData = useMemo(() => {
    const courseMap = new Map<string, { total: number; desertion: number }>();
    for (const p of filteredData) {
      if (!p.rutaFormativa) continue;
      const entry = courseMap.get(p.rutaFormativa) ?? {
        total: 0,
        desertion: 0,
      };
      entry.total++;
      if (isDesertionStatus(p.estado)) entry.desertion++;
      courseMap.set(p.rutaFormativa, entry);
    }
    return Array.from(courseMap.entries())
      .map(([name, { total, desertion }]) => ({
        name,
        total,
        desertion,
        rate: total > 0 ? (desertion / total) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filteredData]);

  // ── NEW SECTION DATA: Age Breakdown ──
  const ageBuckets = useMemo(() => {
    const buckets = [
      { name: '14-17', min: 14, max: 17 },
      { name: '18-20', min: 18, max: 20 },
      { name: '21-24', min: 21, max: 24 },
      { name: '25+', min: 25, max: 999 },
    ];
    return buckets
      .map((b) => {
        const bucketData = filteredData.filter(
          (p) => p.edad >= b.min && p.edad <= b.max,
        );
        const total = bucketData.length;
        const desertion = bucketData.filter((p) =>
          isDesertionStatus(p.estado),
        ).length;
        return {
          name: b.name,
          total,
          desertion,
          rate: total > 0 ? (desertion / total) * 100 : -1,
        };
      })
      .filter((b) => b.total > 0);
  }, [filteredData]);

  // ── NEW SECTION DATA: Region Ranking ──
  const regionData = useMemo(() => {
    const regionMap = new Map<string, { total: number; desertion: number }>();
    for (const p of filteredData) {
      const region = findRegion(p.provincia || '');
      const entry = regionMap.get(region) ?? { total: 0, desertion: 0 };
      entry.total++;
      if (isDesertionStatus(p.estado)) entry.desertion++;
      regionMap.set(region, entry);
    }
    return Array.from(regionMap.entries())
      .map(([name, { total, desertion }]) => ({
        name,
        total,
        desertion,
        rate: total > 0 ? (desertion / total) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filteredData]);

  // ── NEW SECTION DATA: Trend Table ──
  const trendData = useMemo(() => {
    const yearMap = new Map<number, { total: number; desertion: number }>();
    for (const p of filteredData) {
      if (!p.fechaRegistro) continue;
      const y = new Date(p.fechaRegistro).getFullYear();
      const entry = yearMap.get(y) ?? { total: 0, desertion: 0 };
      entry.total++;
      if (isDesertionStatus(p.estado)) entry.desertion++;
      yearMap.set(y, entry);
    }
    const years = Array.from(yearMap.keys()).sort();
    const data = years.map((y) => ({
      year: y,
      total: yearMap.get(y)!.total,
      desertion: yearMap.get(y)!.desertion,
      rate:
        yearMap.get(y)!.total > 0
          ? (yearMap.get(y)!.desertion / yearMap.get(y)!.total) * 100
          : 0,
    }));

    let direction = 'Sin tendencia disponible';
    if (data.length >= 2) {
      const firstRate = data[0].rate;
      const lastRate = data[data.length - 1].rate;
      if (lastRate < firstRate) direction = 'Mejorando';
      else if (lastRate > firstRate) direction = 'Empeorando';
      else direction = 'Estable';
    }

    return { data, direction };
  }, [filteredData]);

  // ── Empty state ──
  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell
      title="Deserción"
      description="Ranking de centros con mayor tasa de deserción. Incluye vista general y por provincia."
    >
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Tasa de deserción general
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(tasaGeneral)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Centro con mayor deserción
            </p>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">
              {centroMayorNombre}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatPercentage(centroMayorTasa)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total desertores
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(totalDesertores)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Centros analizados
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(centrosAnalizados)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Filters + View Toggles + Info ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Tablero de Deserción"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Identifica los centros con mayor tasa de deserción, calculada como el porcentaje de participantes que abandonaron el programa respecto al total de participantes de cada centro.',
              },
              {
                heading: 'Fórmula',
                content:
                  'Tasa de deserción = (Desertores del centro / Total participantes del centro) × 100',
              },
              {
                heading: '¿Quiénes cuentan como desertores?',
                content:
                  'Se considera desertor a todo participante cuyo estado sea:\n• Retirado\n• Desertor\n• Baja\n• Cancelado\n• Inactivo\n• No admitido\n• Abandonó\n\nLa comparación es insensible a mayúsculas ("Retirado", "retirado" y "RETIRADO" cuentan igual).',
              },
              {
                heading: 'Cómo leerlo',
                content:
                  'Un centro con tasa alta indica que proporcionalmente más participantes abandonaron. Útil para identificar centros que necesitan intervención en retención.',
              },
              {
                heading: 'Filtros',
                content:
                  'Los filtros globales (año, provincia, municipio) aplican sobre todos los datos. El toggle General/Por provincia permite segmentar el ranking.',
              },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setViewMode('general');
                setLocalProvince('todos');
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'general' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              General
            </button>
            <button
              onClick={() => setViewMode('provincia')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'provincia' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Por provincia
            </button>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('row')}
              className={`p-1.5 rounded ${layoutMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Local Province Filter ── */}
      {viewMode === 'provincia' && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <MapPin size={16} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-600">
            Provincia:
          </label>
          <select
            value={localProvince}
            onChange={(e) => setLocalProvince(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas</option>
            {DOMINICAN_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={chartClass(layoutMode)}>
        {/* ── Horizontal BarChart ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Top 10 — Deserción por Centro
            {viewMode === 'provincia' && localProvince !== 'todos' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({localProvince})
              </span>
            )}
          </h3>

          {topCenters.length > 0 ? (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCenters}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
                  />
                  <YAxis
                    dataKey="centro"
                    type="category"
                    width={180}
                    tick={<YAxisTick />}
                  />
                  <Tooltip
                    formatter={(v: unknown) => formatPercentage(Number(v))}
                  />
                  <Bar
                    dataKey="tasa"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                    name="Tasa de deserción"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-gray-400">
              <TrendingDown size={32} className="mb-2 text-gray-300" />
              <p>Sin datos</p>
            </div>
          )}
        </div>

        {/* ── Ranking Table ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Ranking de Deserción por Centro
            {viewMode === 'provincia' && localProvince !== 'todos' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({localProvince})
              </span>
            )}
          </h3>

          {topCenters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 w-12">
                      #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Centro
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Total Participantes
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Desertores
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Tasa %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCenters.map((row, idx) => (
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
                      <td className="py-3 px-4 text-right text-gray-800">
                        {formatNumber(row.total)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-800">
                        {formatNumber(row.desertores)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">
                        {formatPercentage(row.tasa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <Users size={32} className="mb-2 text-gray-300" />
              <p>Sin datos</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION: Course Ranking ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Deserción por Ruta Formativa
        </h3>
        {courseData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Ruta Formativa
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Desertores
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Tasa %
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseData.map((row, idx) => (
                  <tr
                    key={row.name}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.desertion)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatPercentage(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos de rutas formativas
          </div>
        )}
      </div>

      {/* ── SECTION: Age Breakdown ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Deserción por Grupo Etario
        </h3>
        {ageBuckets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Grupo Etario
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Desertores
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Tasa %
                  </th>
                </tr>
              </thead>
              <tbody>
                {ageBuckets.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.desertion)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatPercentage(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            —
          </div>
        )}
      </div>

      {/* ── SECTION: Region Ranking ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Deserción por Región de Planificación
        </h3>
        {regionData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Región
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Desertores
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Tasa %
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionData.map((row, idx) => (
                  <tr
                    key={row.name}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.desertion)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatPercentage(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos
          </div>
        )}
      </div>

      {/* ── SECTION: Trend Table ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Tendencia Anual de Deserción
          <span
            className={`ml-2 text-sm font-medium px-2 py-0.5 rounded-full ${
              trendData.direction === 'Mejorando'
                ? 'bg-green-50 text-green-700'
                : trendData.direction === 'Empeorando'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-500'
            }`}
          >
            {trendData.direction}
          </span>
        </h3>
        {trendData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Año
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Desertores
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Tasa %
                  </th>
                </tr>
              </thead>
              <tbody>
                {trendData.data.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.year}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.desertion)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-600">
                      {formatPercentage(row.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos de tendencia
          </div>
        )}
      </div>
    </BoardShell>
  );
};

export default DesercionBoard;
