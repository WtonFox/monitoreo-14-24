import React, { useState, useMemo } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import { chartClass } from '../../utils/indicadores-helpers'
import { Users, Building2, Percent, AlertTriangle, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import BoardInfo from '../../components/BoardInfo'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'

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
  centrosSinMenoresActual: number;
  centrosDataActual: CentroSinMenores[];
  totalMenoresActual: number;
  centrosSinMenoresRegistro: number;
  centrosDataRegistro: CentroSinMenores[];
  totalMenoresRegistro: number;
}

const CentrosSinMenoresBoard: React.FC = () => {
  const { filteredData, isDataLoading } = useIndicadoresFilters();
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('row');

  const {
    totalCentros,
    centrosSinMenores,
    pctSinCobertura,
    totalMenores,
    centrosData,
    centrosSinMenoresActual,
    centrosDataActual,
    totalMenoresActual,
    centrosSinMenoresRegistro,
    centrosDataRegistro,
    totalMenoresRegistro,
  } = useMemo(() => {
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

    const allCentros = Array.from(centrosSet);

    // ── LÓGICA A: Edad ACTUAL (p.edad) — la original ──
    const centrosConMenoresActual = new Set<string>();
    let totalMenoresActualCount = 0;
    for (const p of filteredData) {
      if (p.centro && p.edad >= 14 && p.edad <= 17) {
        centrosConMenoresActual.add(p.centro);
        totalMenoresActualCount++;
      }
    }
    const sinMenoresActual = allCentros.filter(c => !centrosConMenoresActual.has(c));
    const centrosDataActualArr: CentroSinMenores[] = sinMenoresActual
      .map(c => ({ centro: c, provincia: centroProvincia.get(c) ?? null, total: centroTotal.get(c) ?? 0 }))
      .sort((a, b) => b.total - a.total);

    // ── LÓGICA B: Edad al REGISTRO (p.edadRegistro) — la nueva ──
    const centrosConMenoresRegistro = new Set<string>();
    let totalMenoresRegistroCount = 0;
    for (const p of filteredData) {
      if (p.centro && p.edadRegistro >= 14 && p.edadRegistro <= 17) {
        centrosConMenoresRegistro.add(p.centro);
        totalMenoresRegistroCount++;
      }
    }
    const sinMenoresRegistro = allCentros.filter(c => !centrosConMenoresRegistro.has(c));
    const centrosDataRegistroArr: CentroSinMenores[] = sinMenoresRegistro
      .map(c => ({ centro: c, provincia: centroProvincia.get(c) ?? null, total: centroTotal.get(c) ?? 0 }))
      .sort((a, b) => b.total - a.total);

    // ── KPIs con la lógica de Edad Actual (la medición directa) ──
    return {
      totalCentros: allCentros.length,
      centrosSinMenores: sinMenoresActual.length,
      pctSinCobertura: allCentros.length > 0 ? (sinMenoresActual.length / allCentros.length) * 100 : 0,
      totalMenores: totalMenoresActualCount,
      centrosData: centrosDataActualArr,
      // Datos para la tabla comparativa (lógica actual)
      centrosSinMenoresActual: sinMenoresActual.length,
      centrosDataActual: centrosDataActualArr,
      totalMenoresActual: totalMenoresActualCount,
      // Datos para la tabla comparativa (lógica registro)
      centrosSinMenoresRegistro: sinMenoresRegistro.length,
      centrosDataRegistro: centrosDataRegistroArr,
      totalMenoresRegistro: totalMenoresRegistroCount,
    };
  }, [filteredData]);

  // ── Empty state: no data at all ──
  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell
    title="Centros sin Cobertura de Menores"
    description="Centros de formación sin participantes en el rango 14-17 años. Compara edad actual vs edad al registro.">
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

      {/* Filter Bar + Info + View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Centros sin Cobertura de Menores"
            sections={[
              { heading: '¿Qué mide?', content: 'Identifica los centros de formación que no tienen participantes en el rango de edad objetivo del programa (14-17 años).' },
              { heading: 'Lógica: Edad Actual', content: 'Usa la edad actual del participante (p.edad). Muestra los centros sin participantes menores de edad en el momento actual. Es la métrica principal del tablero.' },
              { heading: 'Lógica: Edad al Registro', content: 'Usa la edad que tenía el participante al momento de inscribirse (p.edadRegistro). Muestra centros que nunca registraron un menor, incluso si ese menor hoy ya es mayor. Se muestra en la tabla derecha para comparación.' },
              { heading: 'Fórmula', content: 'Centro sin cobertura = centro donde COUNT(participantes 14-17) = 0 sobre el total de participantes del centro.' },
              { heading: 'Cómo leerlo', content: 'La tabla izquierda (Edad Actual) te dice qué centros hoy no atienden menores. La tabla derecha (Edad Registro) te dice qué centros nunca atendieron menores. La diferencia entre ambas revela centros donde los menores se inscribieron pero ya crecieron.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* ── Comparison tables ── */}
      <div className={chartClass(viewMode)}>
        {/* Table A: Edad ACTUAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Sin cobertura (edad actual)
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Usa <code className="text-xs bg-gray-100 px-1 rounded">p.edad</code> — {formatNumber(centrosSinMenoresActual)} centros, {formatNumber(totalMenoresActual)} menores 14-17
          </p>
          {centrosDataActual.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Centro</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Provincia</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {centrosDataActual.map(row => (
                    <tr key={row.centro} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-800 font-medium text-sm">{row.centro}</td>
                      <td className="py-2 px-3 text-gray-500 text-sm">{row.provincia || '—'}</td>
                      <td className="py-2 px-3 text-right text-gray-800 text-sm">{formatNumber(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Todos los centros tienen menores</div>
          )}
        </div>

        {/* Table B: Edad al REGISTRO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Sin cobertura (edad registro)
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Usa <code className="text-xs bg-gray-100 px-1 rounded">p.edadRegistro</code> — {formatNumber(centrosSinMenoresRegistro)} centros, {formatNumber(totalMenoresRegistro)} menores 14-17
          </p>
          {centrosDataRegistro.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Centro</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Provincia</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {centrosDataRegistro.map(row => (
                    <tr key={row.centro} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-800 font-medium text-sm">{row.centro}</td>
                      <td className="py-2 px-3 text-gray-500 text-sm">{row.provincia || '—'}</td>
                      <td className="py-2 px-3 text-right text-gray-800 text-sm">{formatNumber(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-gray-400 text-sm">Todos los centros tienen menores</div>
          )}
        </div>
      </div>
    </BoardShell>
  );
};

export default CentrosSinMenoresBoard;

