import React, { useState, useMemo } from 'react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  GraduationCap,
  BookOpen,
  Grid3X3,
  List,
  Globe,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { chartClass, chartH } from '../../utils/indicadores-helpers';
import { XAxisTick } from '../../utils/indicadores-tick-components';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import BoardInfo from '../../components/BoardInfo';
import { findRegion } from '../../utils/geoUtils';

const COLORS = [
  '#0d9488',
  '#14b8a6',
  '#2dd4bf',
  '#5eead4',
  '#99f6e4',
  '#ccfbf1',
];

type ViewMode = 'grid' | 'row';

const NivelEducativoBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { educationData } = boardData;

  // ── NEW SECTION DATA 1: Province Breakdown ──
  const provinceTopEducation = useMemo(() => {
    const provEduMap = new Map<string, Record<string, number>>();
    for (const p of filteredData) {
      if (!p.provincia || !p.nivelEstudio) continue;
      if (!provEduMap.has(p.provincia)) provEduMap.set(p.provincia, {});
      const levels = provEduMap.get(p.provincia)!;
      levels[p.nivelEstudio] = (levels[p.nivelEstudio] || 0) + 1;
    }
    return Array.from(provEduMap.entries())
      .map(([prov, levels]) => {
        const totalProv = Object.values(levels).reduce((s, v) => s + v, 0);
        const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
        return {
          province: prov,
          level: top ? top[0] : 'Sin datos',
          count: top ? top[1] : 0,
          total: totalProv,
          pct: totalProv > 0 && top ? (top[1] / totalProv) * 100 : 0,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // ── NEW SECTION DATA 2: Region Aggregation ──
  const regionEducation = useMemo(() => {
    const regEduMap = new Map<string, Record<string, number>>();
    for (const p of filteredData) {
      if (!p.nivelEstudio) continue;
      const region = findRegion(p.provincia || '');
      if (!regEduMap.has(region)) regEduMap.set(region, {});
      const levels = regEduMap.get(region)!;
      levels[p.nivelEstudio] = (levels[p.nivelEstudio] || 0) + 1;
    }
    return Array.from(regEduMap.entries())
      .map(([region, levels]) => {
        const totalReg = Object.values(levels).reduce((s, v) => s + v, 0);
        const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
        return {
          region,
          level: top ? top[0] : 'Sin datos',
          count: top ? top[1] : 0,
          total: totalReg,
          pct: totalReg > 0 && top ? (top[1] / totalReg) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // ── NEW SECTION DATA 3: Desertion Correlation ──
  const educationDesertion = useMemo(() => {
    const eduDesMap = new Map<string, { total: number; desertion: number }>();
    const isDesertion = (estado: string | null | undefined): boolean => {
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
    for (const p of filteredData) {
      if (!p.nivelEstudio) continue;
      if (!eduDesMap.has(p.nivelEstudio))
        eduDesMap.set(p.nivelEstudio, { total: 0, desertion: 0 });
      const entry = eduDesMap.get(p.nivelEstudio)!;
      entry.total++;
      if (isDesertion(p.estado)) entry.desertion++;
    }
    return Array.from(eduDesMap.entries())
      .map(([level, { total, desertion }]) => ({
        level,
        total,
        desertion,
        rate: total > 0 ? (desertion / total) * 100 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  }, [filteredData]);

  // ── NEW SECTION DATA 4: YoY Education Trend ──
  const eduTrendData = useMemo(() => {
    const yearEduMap = new Map<number, Record<string, number>>();
    for (const p of filteredData) {
      if (!p.nivelEstudio || !p.fechaRegistro) continue;
      const y = new Date(p.fechaRegistro).getFullYear();
      if (!yearEduMap.has(y)) yearEduMap.set(y, {});
      const levels = yearEduMap.get(y)!;
      levels[p.nivelEstudio] = (levels[p.nivelEstudio] || 0) + 1;
    }
    const years = Array.from(yearEduMap.keys()).sort();
    const data = years.map((y) => {
      const levels = yearEduMap.get(y)!;
      const total = Object.values(levels).reduce((s, v) => s + v, 0);
      const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
      return {
        year: y,
        topLevel: top ? top[0] : 'N/A',
        topCount: top ? top[1] : 0,
        total,
        pct: total > 0 && top ? (top[1] / total) * 100 : 0,
      };
    });

    let direction = 'Sin tendencia disponible';
    if (data.length >= 2) {
      const firstLevel = data[0].topLevel;
      const lastLevel = data[data.length - 1].topLevel;
      if (firstLevel !== lastLevel)
        direction = `Cambió de "${firstLevel}" a "${lastLevel}"`;
      else direction = `Se mantiene en "${firstLevel}"`;
    }

    return { data, direction };
  }, [filteredData]);

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const totalConDato = educationData.educationDistribution.reduce(
    (s, e) => s + e.value,
    0,
  );
  const totalSinDato = filteredData.length - totalConDato;
  const pctSinDato =
    filteredData.length > 0 ? (totalSinDato / filteredData.length) * 100 : 0;
  const nivelMasComun =
    educationData.educationDistribution.length > 0
      ? educationData.educationDistribution[0]
      : null;
  const pctMasComun =
    nivelMasComun && filteredData.length > 0
      ? (nivelMasComun.value / filteredData.length) * 100
      : 0;

  return (
    <BoardShell
      title="Nivel Educativo"
      description="Distribución por nivel de estudio y su relación con el estado del programa y sexo."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600 mr-4">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Niveles Distintos
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(educationData.educationDistribution.length)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Más Común</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {nivelMasComun
                ? `${nivelMasComun.name}: ${formatPercentage(pctMasComun)}`
                : 'N/A'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total con Dato</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(totalConDato)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-500 mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Sin Dato</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(pctSinDato)}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Nivel Educativo"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Distribución de participantes por nivel de estudio. Relación entre nivel educativo, estado del programa (activo/egresado) y sexo.',
              },
              {
                heading: 'Fórmula',
                content:
                  'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.',
              },
              {
                heading: 'Filtros',
                content:
                  'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.',
              },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              title="Vista fila"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              title="Vista cuadrícula"
            >
              <Grid3X3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Distribución Educativa
          </h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={educationData.educationDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }: any) =>
                      `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {educationData.educationDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Nivel × Estado
          </h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData.educationByStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={<XAxisTick />} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                  <Bar
                    dataKey="Activos"
                    fill="#14b8a6"
                    stackId="s"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Egresados"
                    fill="#3b82f6"
                    stackId="s"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel × Sexo</h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationBySex.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData.educationBySex}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={<XAxisTick />} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Nivel predominante por Centro
          </h3>
          <div className={`h-${chartH} w-full overflow-y-auto`}>
            {educationData.topEducationByCenter.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Centro
                    </th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">
                      Nivel
                    </th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">
                      Participantes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {educationData.topEducationByCenter.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 text-gray-700">{item.center}</td>
                      <td className="py-2 px-3">
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {item.level}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900">
                        {formatNumber(item.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: Nivel Educativo por Provincia ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Nivel Educativo Predominante por Provincia
        </h3>
        {provinceTopEducation.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Provincia
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Nivel Predominante
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    %
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Participantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {provinceTopEducation.map((row, idx) => (
                  <tr
                    key={row.province}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.province}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {row.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatPercentage(row.pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatNumber(row.count)}/{formatNumber(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos por provincia
          </div>
        )}
      </div>

      {/* ── SECTION: Nivel Educativo por Región ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Distribución por Región de Planificación
        </h3>
        {regionEducation.length > 0 ? (
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
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Nivel Predominante
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    %
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionEducation.map((row, idx) => (
                  <tr
                    key={row.region}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.region}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {row.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatPercentage(row.pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatNumber(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos por región
          </div>
        )}
      </div>

      {/* ── SECTION: Desertion Correlation ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Correlación Deserción y Nivel Educativo
        </h3>
        {educationDesertion.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Nivel Educativo
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
                {educationDesertion.map((row, idx) => (
                  <tr
                    key={row.level}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.level}
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

      {/* ── SECTION: YoY Education Trend ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Tendencia Anual de Nivel Educativo
          <span className="ml-2 text-sm font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {eduTrendData.direction}
          </span>
        </h3>
        {eduTrendData.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Año
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Nivel Predominante
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    %
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Participantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {eduTrendData.data.map((row) => (
                  <tr
                    key={row.year}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.year}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {row.topLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatPercentage(row.pct)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatNumber(row.total)}
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

export default NivelEducativoBoard;
