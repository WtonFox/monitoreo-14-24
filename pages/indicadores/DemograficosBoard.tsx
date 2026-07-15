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
  Users,
  Heart,
  Calendar,
  Grid3X3,
  List,
  Table as TableIcon,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { chartClass, chartH, tickShort } from '../../utils/indicadores-helpers';
import { XAxisTick, YAxisTick } from '../../utils/indicadores-tick-components';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import BoardInfo from '../../components/BoardInfo';
import { isWomen, isMen } from '../../utils/normalize';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ff6b6b',
];

type ViewMode = 'grid' | 'row';

const DemograficosBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { demographicData } = boardData;

  // ── NEW SECTION DATA 1: Detailed Age-Bucket Distribution ──
  const detailedAgeData = useMemo(() => {
    const buckets: Record<string, number> = {
      '14-17': 0,
      '18-20': 0,
      '21-24': 0,
      '25+': 0,
      Unknown: 0,
    };
    for (const p of filteredData) {
      const age = p.edad;
      let key: string;
      if (age === null || age === undefined || age <= 0 || age > 120)
        key = 'Unknown';
      else if (age >= 14 && age <= 17) key = '14-17';
      else if (age >= 18 && age <= 20) key = '18-20';
      else if (age >= 21 && age <= 24) key = '21-24';
      else key = '25+';
      buckets[key]++;
    }
    const total = filteredData.length;
    return Object.entries(buckets).map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }));
  }, [filteredData]);

  // ── NEW SECTION DATA 2: Sex Ratio Per Age Group ──
  const sexRatioData = useMemo(() => {
    const ageSex: Record<string, { women: number; men: number }> = {
      '14-17': { women: 0, men: 0 },
      '18-20': { women: 0, men: 0 },
      '21-24': { women: 0, men: 0 },
      '25+': { women: 0, men: 0 },
      Unknown: { women: 0, men: 0 },
    };
    for (const p of filteredData) {
      const age = p.edad;
      let key: string;
      if (age === null || age === undefined || age <= 0 || age > 120)
        key = 'Unknown';
      else if (age >= 14 && age <= 17) key = '14-17';
      else if (age >= 18 && age <= 20) key = '18-20';
      else if (age >= 21 && age <= 24) key = '21-24';
      else key = '25+';
      if (isWomen(p.sexo)) ageSex[key].women++;
      else if (isMen(p.sexo)) ageSex[key].men++;
    }
    return Object.entries(ageSex).map(([name, { women, men }]) => ({
      name,
      Mujeres: women,
      Hombres: men,
      ratio: men > 0 ? (women / men).toFixed(1) : '∞',
    }));
  }, [filteredData]);

  // ── NEW SECTION DATA 3: Marital Status × Sex Cross-Tabulation ──
  const maritalSexCross = useMemo(() => {
    const cross: Record<
      string,
      { women: number; men: number; unknown: number }
    > = {};
    const isEmptyValue = (val: string | null | undefined): boolean =>
      val === null ||
      val === undefined ||
      val.trim() === '' ||
      val === 'N/A' ||
      val === 'N/D';
    for (const p of filteredData) {
      if (!p.estadoCivil || isEmptyValue(p.estadoCivil)) continue;
      if (!cross[p.estadoCivil])
        cross[p.estadoCivil] = { women: 0, men: 0, unknown: 0 };
      if (isWomen(p.sexo)) cross[p.estadoCivil].women++;
      else if (isMen(p.sexo)) cross[p.estadoCivil].men++;
      else cross[p.estadoCivil].unknown++;
    }
    const rows: { maritalStatus: string; combined: string; value: number }[] =
      [];
    for (const [status, counts] of Object.entries(cross)) {
      if (counts.women > 0)
        rows.push({
          maritalStatus: status,
          combined: `${status} (Mujeres)`,
          value: counts.women,
        });
      if (counts.men > 0)
        rows.push({
          maritalStatus: status,
          combined: `${status} (Hombres)`,
          value: counts.men,
        });
      if (counts.unknown > 0)
        rows.push({
          maritalStatus: status,
          combined: `${status} (Sexo desconocido)`,
          value: counts.unknown,
        });
    }
    return rows.sort((a, b) => b.value - a.value);
  }, [filteredData]);

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const genderPieData = [
    { name: 'Femenino', value: demographicData.women },
    { name: 'Masculino', value: demographicData.men },
  ];

  return (
    <BoardShell
      title="Demográficos"
      description="Distribución de participantes por sexo, grupos de edad y estado civil."
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Inscritos</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(demographicData.total)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-pink-50 rounded-lg text-pink-500 mr-4">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mujeres</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(demographicData.womenPct)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hombres</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(demographicData.menPct)}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Edad al Registro
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {demographicData.avgAgeReg.toFixed(1)}
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar
          showYear
          showProvince
          showMunicipio
          showSex
          noContainer
        />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Demográficos"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Distribución de participantes por sexo, grupos de edad y estado civil. Muestra la composición demográfica de la población atendida por el programa.',
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
        {/* Gender Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Distribución por Sexo
          </h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderPieData}
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
                  {genderPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Grupos de Edad
          </h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.ageBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData.ageBuckets}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={<XAxisTick />} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de edad
              </div>
            )}
          </div>
        </div>

        {/* Marital Status Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Estado Civil</h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.maritalStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicData.maritalStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }: any) =>
                      `${tickShort(name)}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demographicData.maritalStatus.map((_, i) => (
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
                Sin datos de estado civil
              </div>
            )}
          </div>
        </div>

        {/* Gender × Age Stacked */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Sexo por Grupo de Edad
          </h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.genderAgeCross.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData.genderAgeCross}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip
                    formatter={(v: unknown) => formatNumber(Number(v))}
                  />
                  <Legend />
                  <Bar
                    dataKey="Mujeres"
                    fill="#00C49F"
                    stackId="s"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Hombres"
                    fill="#0088FE"
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
      </div>

      {/* ── SECTION: Distribución Etaria Detallada (Horiz Bar) ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Distribución por Grupo Etario Detallado
        </h3>
        <div className="h-64 w-full">
          {detailedAgeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={detailedAgeData}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={<YAxisTick />}
                />
                <Tooltip
                  formatter={(v: unknown, name: unknown) => {
                    if (name === 'pct') return formatPercentage(Number(v));
                    return formatNumber(Number(v));
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  name="Participantes"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Sin datos de edad
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION: Sex Ratio per Age Group (with ratio column) ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Proporción Mujeres:Hombres por Grupo Etario
        </h3>
        {sexRatioData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Grupo Etario
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Mujeres
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Hombres
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Ratio (M:H)
                  </th>
                </tr>
              </thead>
              <tbody>
                {sexRatioData.map((row) => {
                  const total = row.Mujeres + row.Hombres;
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-right text-pink-600 font-medium">
                        {formatNumber(row.Mujeres)}
                        {total > 0
                          ? ` (${formatPercentage((row.Mujeres / total) * 100)})`
                          : ''}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-600 font-medium">
                        {formatNumber(row.Hombres)}
                        {total > 0
                          ? ` (${formatPercentage((row.Hombres / total) * 100)})`
                          : ''}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {row.ratio}:1
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-400">
            Sin datos
          </div>
        )}
      </div>

      {/* ── SECTION: Marital Status × Sex Cross-Tabulation ── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          Cruce de Estado Civil y Sexo
        </h3>
        {maritalSexCross.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Combinación
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Participantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {maritalSexCross.map((row, idx) => (
                  <tr
                    key={row.combined}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.combined}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      {formatNumber(row.value)}
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
    </BoardShell>
  );
};

export default DemograficosBoard;
