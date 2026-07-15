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
} from 'recharts';
import {
  MapPin,
  Building2,
  BookOpen,
  Grid3X3,
  List,
  Globe,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { chartClass, chartH } from '../../utils/indicadores-helpers';
import { YAxisTick } from '../../utils/indicadores-tick-components';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import BoardInfo from '../../components/BoardInfo';
import { findRegion } from '../../utils/geoUtils';
import { isWomen, isMen } from '../../utils/normalize';

type ViewMode = 'grid' | 'row';

const TerritorialesBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { territorialData } = boardData;

  // ── NEW SECTION DATA 1: Region Participation ──
  const regionParticipation = useMemo(() => {
    const regionCounts: Record<string, number> = {};
    for (const p of filteredData) {
      const region = findRegion(p.provincia || '');
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
    return Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // ── NEW SECTION DATA 2: Sex Distribution per Region ──
  const regionSexData = useMemo(() => {
    const regionMap = new Map<string, { women: number; men: number }>();
    for (const p of filteredData) {
      const region = findRegion(p.provincia || '');
      if (!regionMap.has(region)) regionMap.set(region, { women: 0, men: 0 });
      const entry = regionMap.get(region)!;
      if (isWomen(p.sexo)) entry.women++;
      else if (isMen(p.sexo)) entry.men++;
    }
    return Array.from(regionMap.entries())
      .map(([name, { women, men }]) => ({
        name,
        Mujeres: women,
        Hombres: men,
      }))
      .sort((a, b) => b.Mujeres + b.Hombres - (a.Mujeres + a.Hombres));
  }, [filteredData]);

  // ── NEW SECTION DATA 3: Age Distribution per Region (14-17 / 18-24) ──
  const regionAgeData = useMemo(() => {
    const regionMap = new Map<
      string,
      { total: number; age14_17: number; age18_24: number }
    >();
    for (const p of filteredData) {
      const region = findRegion(p.provincia || '');
      if (!regionMap.has(region))
        regionMap.set(region, { total: 0, age14_17: 0, age18_24: 0 });
      const entry = regionMap.get(region)!;
      entry.total++;
      if (p.edad >= 14 && p.edad <= 17) entry.age14_17++;
      if (p.edad >= 18 && p.edad <= 24) entry.age18_24++;
    }
    return Array.from(regionMap.entries())
      .filter(([_, d]) => d.total > 0)
      .map(([name, { total, age14_17, age18_24 }]) => ({
        name,
        total,
        pct14_17: total > 0 ? (age14_17 / total) * 100 : 0,
        pct18_24: total > 0 ? (age18_24 / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const renderHorizBar = (
    title: string,
    data: { name: string; value: number }[],
    color: string,
    dataKey = 'value',
    emptyMsg = 'Sin datos',
  ) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className={`h-${chartH} w-full`}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 10, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis
                dataKey="name"
                type="category"
                width={180}
                tick={<YAxisTick />}
              />
              <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
              <Legend />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            {emptyMsg}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <BoardShell
      title="Territoriales"
      description="Distribución geográfica de participantes por municipio, centro de formación y curso."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 mr-4">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Municipios</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(territorialData.municipioCount)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Centros</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(territorialData.centroCount)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Rutas Formativas
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(territorialData.cursoCount)}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Territoriales"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Distribución de participantes por municipio, centro de formación y curso. Permite identificar concentraciones geográficas y apoyar la planificación de intervenciones.',
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

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        {renderHorizBar(
          'Top 10 Municipios',
          territorialData.topMunicipios,
          '#10b981',
          'value',
          'Sin datos de municipios',
        )}
        {renderHorizBar(
          'Top 10 Centros',
          territorialData.topCentros,
          '#8b5cf6',
          'value',
          'Sin datos de centros',
        )}
        {renderHorizBar(
          'Top 10 Rutas Formativas',
          territorialData.topCursos,
          '#f59e0b',
          'value',
          'Sin datos de cursos',
        )}
        {/* Gender by Municipio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Sexo por Municipio (Top 10)
          </h3>
          <div className={`h-${chartH} w-full`}>
            {territorialData.genderByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={territorialData.genderByMunicipio}
                  layout="vertical"
                  margin={{ left: 10, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={<YAxisTick />}
                  />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                  <Bar
                    dataKey="Mujeres"
                    fill="#00C49F"
                    stackId="s"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="Hombres"
                    fill="#0088FE"
                    stackId="s"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de género por municipio
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: Participación por Región de Planificación ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Participación por Región de Planificación
        </h3>
        <div className="h-72 w-full">
          {regionParticipation.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionParticipation}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={<YAxisTick />}
                />
                <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  name="Participantes"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sin datos regionales
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION: Sex Distribution per Region (stacked bar) ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Distribución de Sexo por Región
        </h3>
        {regionSexData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Región
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Mujeres
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    % Mujeres
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Hombres
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    % Hombres
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionSexData.map((row) => {
                  const total = row.Mujeres + row.Hombres;
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-800">
                        {formatNumber(total)}
                      </td>
                      <td className="py-3 px-4 text-right text-pink-600 font-medium">
                        {formatNumber(row.Mujeres)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {total > 0
                          ? formatPercentage((row.Mujeres / total) * 100)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">
                        {formatNumber(row.Hombres)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {total > 0
                          ? formatPercentage((row.Hombres / total) * 100)
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos de género por región
          </div>
        )}
      </div>

      {/* ── SECTION: Age Distribution per Region ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Distribución Etaria por Región (14-17 / 18-24)
        </h3>
        {regionAgeData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Región
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    14-17
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    % 14-17
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    18-24
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    % 18-24
                  </th>
                </tr>
              </thead>
              <tbody>
                {regionAgeData.map((row) => (
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
                    <td className="py-3 px-4 text-right text-blue-600 font-medium">
                      {formatNumber(
                        Math.round((row.total * row.pct14_17) / 100),
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatPercentage(row.pct14_17)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {formatNumber(
                        Math.round((row.total * row.pct18_24) / 100),
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatPercentage(row.pct18_24)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos etarios por región
          </div>
        )}
      </div>
    </BoardShell>
  );
};

export default TerritorialesBoard;
