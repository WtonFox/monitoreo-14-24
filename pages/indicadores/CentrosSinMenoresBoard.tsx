import React, { useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { Users, Building2, Percent, AlertTriangle } from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';

interface CentroSinMenores {
  centro: string;
  provincia: string | null;
  total: number;
}

interface ComputedMetrics {
  totalCentros: number;
  centrosSinMenores: number;
  pctSinCobertura: number;
  totalMenores: number;
  centrosData: CentroSinMenores[];
}

const CentrosSinMenoresBoard: React.FC = () => {
  const { filteredData } = useIndicadoresFilters();

  const {
    totalCentros,
    centrosSinMenores,
    pctSinCobertura,
    totalMenores,
    centrosData,
  }: ComputedMetrics = useMemo(() => {
    // Gather all unique centros and their totals
    const centrosSet = new Set<string>();
    const centroProvincia = new Map<string, string | null>();
    const centroTotal = new Map<string, number>();

    for (const p of filteredData) {
      if (!p.centro) continue;
      centrosSet.add(p.centro);
      centroTotal.set(p.centro, (centroTotal.get(p.centro) ?? 0) + 1);
      if (p.provincia) {
        centroProvincia.set(p.centro, p.provincia);
      }
    }

    // Identify centros that HAVE registered 14-17yo participants
    // Usamos edadRegistro (edad al momento del registro) porque la edad actual
    // puede ser mayor — un participante registrado a los 16 hoy puede tener 20.
    const centrosConMenores = new Set<string>();
    let totalMenoresCount = 0;

    for (const p of filteredData) {
      if (p.centro && p.edadRegistro >= 14 && p.edadRegistro <= 17) {
        centrosConMenores.add(p.centro);
        totalMenoresCount++;
      }
    }

    // Diff -> centros without minors
    const allCentros = Array.from(centrosSet);
    const sinMenores = allCentros.filter(c => !centrosConMenores.has(c));

    // Build table data sorted by total desc
    const centrosDataArr: CentroSinMenores[] = sinMenores
      .map(c => ({
        centro: c,
        provincia: centroProvincia.get(c) ?? null,
        total: centroTotal.get(c) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      totalCentros: allCentros.length,
      centrosSinMenores: sinMenores.length,
      pctSinCobertura:
        allCentros.length > 0
          ? (sinMenores.length / allCentros.length) * 100
          : 0,
      totalMenores: totalMenoresCount,
      centrosData: centrosDataArr,
    };
  }, [filteredData]);

  // ── Empty state: no data at all ──
  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 mr-4">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Centros</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(totalCentros)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Centros sin cobertura de menores
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(centrosSinMenores)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Sin Cobertura</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(pctSinCobertura)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Participantes registrados 14-17
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatNumber(totalMenores)}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
      </div>

      {/* Centros Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Centros sin Cobertura de Menores
        </h3>

        {centrosData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Centro
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">
                    Provincia
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">
                    Total Participantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {centrosData.map(row => (
                  <tr
                    key={row.centro}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {row.centro}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {row.provincia || '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-800">
                      {formatNumber(row.total)}
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
    </BoardShell>
  );
};

export default CentrosSinMenoresBoard;
