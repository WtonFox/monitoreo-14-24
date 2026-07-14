import React, { useState, useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Building2, Users, AlertTriangle, MapPin, Grid3X3, List } from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import { DOMINICAN_PROVINCES } from '../../constants';

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
  return ['retirado', 'desertor', 'baja', 'cancelado', 'inactivo', 'no admitido', 'abandonó', 'abandono'].includes(s);
};

const DesercionBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('general');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'row'>('grid');
  const [localProvince, setLocalProvince] = useState('todos');
  const { filteredData } = useIndicadoresFilters();

  const {
    tasaGeneral,
    centroMayorNombre,
    centroMayorTasa,
    totalDesertores,
    centrosAnalizados,
    topCenters,
  }: ComputedMetrics = useMemo(() => {
    // Start from global filteredData (respects year, province, municipio, sex filters)
    let data = filteredData;

    // In provincia mode, additionally filter by the local province selector
    if (viewMode === 'provincia' && localProvince !== 'todos') {
      data = data.filter(p => p.provincia === localProvince);
    }

    // Group by centro
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

    // Compute rates and sort desc
    const allCentros = Array.from(centroMap.entries())
      .map(([centro, { total, desertores }]) => ({
        centro,
        total,
        desertores,
        tasa: total > 0 ? (desertores / total) * 100 : 0,
      }))
      .sort((a, b) => b.tasa - a.tasa);

    // Top 10 (or fewer if not enough centers)
    const top = allCentros.slice(0, 10);

    // Global KPIs across all centro data
    const totalDesertoresVal = allCentros.reduce((s, c) => s + c.desertores, 0);
    const totalParticipantes = allCentros.reduce((s, c) => s + c.total, 0);
    const generalRate = totalParticipantes > 0
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

  // ── Empty state ──
  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell>
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

      {/* ── Filters + View Toggles ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setViewMode('general'); setLocalProvince('todos'); }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'general'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setViewMode('provincia')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                viewMode === 'provincia'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Por provincia
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

      {/* ── Local Province Filter ── */}
      {viewMode === 'provincia' && (
        <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <MapPin size={16} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-600">Provincia:</label>
          <select
            value={localProvince}
            onChange={e => setLocalProvince(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas</option>
            {DOMINICAN_PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
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
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCenters}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={v => `${Number(v).toFixed(0)}%`}
                />
                <YAxis
                  dataKey="centro"
                  type="category"
                  width={140}
                  tickFormatter={tickShort}
                  style={{ fontSize: '11px' }}
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
          <div className={`h-${chartH} flex flex-col items-center justify-center text-gray-400`}>
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
    </BoardShell>
  );
};

export default DesercionBoard;
