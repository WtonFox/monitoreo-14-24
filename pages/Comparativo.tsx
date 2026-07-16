import React, { useMemo } from 'react';
import { useComparativo, type Dimension } from '../hooks/useComparativo';
import { useParticipantStore } from '../stores/participantStore';
import { ComparativoCharts } from '../components/ComparativoCharts';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { ArrowLeftRight, BarChart3, HelpCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIMENSION_OPTIONS: { value: Dimension; label: string; desc: string }[] = [
  { value: 'provincia',     label: 'Provincia',        desc: 'Comparar por provincia' },
  { value: 'municipio',     label: 'Municipio',        desc: 'Comparar por municipio' },
  { value: 'centro',        label: 'Centro',           desc: 'Comparar por centro educativo' },
  { value: 'año',           label: 'Año de Ingreso',   desc: 'Comparar cohortes de ingreso' },
  { value: 'anioInclusion', label: 'Año de Inclusión', desc: 'Comparar cohortes de inclusión' },
  { value: 'estado',        label: 'Estado',           desc: 'Comparar por estado del participante' },
  { value: 'nivelEstudio',  label: 'Nivel de Estudio', desc: 'Comparar por nivel educativo' },
];

// ---------------------------------------------------------------------------
// Delta Badge
// ---------------------------------------------------------------------------

const DeltaBadge: React.FC<{ value: number | null; inverted?: boolean }> = ({ value, inverted }) => {
  if (value === null) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-400">N/A</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const isImprovement = inverted ? isNegative : isPositive;
  const isWorsening = inverted ? isPositive : isNegative;

  let bgClass = 'bg-gray-100 text-gray-500';
  if (isImprovement) bgClass = 'bg-green-100 text-green-700';
  else if (isWorsening) bgClass = 'bg-red-100 text-red-700';

  const sign = isPositive ? '+' : '';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${bgClass}`}>
      {isImprovement ? '▼' : isWorsening ? '▲' : '◆'}
      {sign}{formatPercentage(Math.abs(value), 1)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  formatA: string;
  formatB: string;
  delta: number | null;
  inverted?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, formatA, formatB, delta, inverted }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all hover:shadow-md">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{label}</p>
    <div className="grid grid-cols-2 gap-3 items-end">
      <div className="text-center">
        <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Grupo A</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatA}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Grupo B</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatB}</p>
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-center">
      <DeltaBadge value={delta} inverted={inverted} />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// KPI config helper
// ---------------------------------------------------------------------------

interface KpiConfig {
  label: string;
  getA: (k: NonNullable<ReturnType<typeof useComparativo>['kpiA']>) => number;
  getB: (k: NonNullable<ReturnType<typeof useComparativo>['kpiB']>) => number;
  getDelta: (d: NonNullable<ReturnType<typeof useComparativo>['deltas']>) => number | null;
  format: (v: number) => string;
  inverted?: boolean;
}

function buildKpiCards(kpiA: NonNullable<ReturnType<typeof useComparativo>['kpiA']>,
                       kpiB: NonNullable<ReturnType<typeof useComparativo>['kpiB']>,
                       deltas: NonNullable<ReturnType<typeof useComparativo>['deltas']>,
                       configs: KpiConfig[]): KpiCardProps[] {
  return configs.map(c => ({
    label: c.label,
    formatA: c.format(c.getA(kpiA)),
    formatB: c.format(c.getB(kpiB)),
    delta: c.getDelta(deltas),
    inverted: c.inverted,
  }));
}

const KPI_CONFIGS: KpiConfig[] = [
  { label: 'Total Participantes',      getA: k => k.total,        getB: k => k.total,        getDelta: d => d.total,        format: v => formatNumber(v) },
  { label: 'Edad Promedio',            getA: k => k.avgAge,       getB: k => k.avgAge,       getDelta: d => d.avgAge,       format: v => v.toFixed(1) },
  { label: 'Mujeres',                  getA: k => k.womenPct,     getB: k => k.womenPct,     getDelta: d => d.womenPct,     format: v => formatPercentage(v, 1) },
  { label: 'Hombres',                  getA: k => k.menPct,       getB: k => k.menPct,       getDelta: d => d.menPct,       format: v => formatPercentage(v, 1) },
  { label: 'Tasa de Deserción',        getA: k => k.desertionRate, getB: k => k.desertionRate, getDelta: d => d.desertionRate, format: v => formatPercentage(v, 1), inverted: true },
  { label: 'Participantes Activos',    getA: k => k.activeCount,  getB: k => k.activeCount,  getDelta: d => d.activeCount,  format: v => formatNumber(v) },
  { label: 'Centros',                  getA: k => k.centerCount,  getB: k => k.centerCount,  getDelta: d => d.centerCount,  format: v => formatNumber(v) },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const Comparativo: React.FC = () => {
  const dashboardData = useParticipantStore(s => s.dashboardData);
  const {
    dimension, valA, valB,
    dataA, dataB,
    kpiA, kpiB, deltas,
    availableValues,
    setDimension, setValA, setValB,
  } = useComparativo();

  // Build KPI card list when data is ready
  const kpiCards = useMemo(() => {
    if (!kpiA || !kpiB || !deltas) return null;
    return buildKpiCards(kpiA, kpiB, deltas, KPI_CONFIGS);
  }, [kpiA, kpiB, deltas]);

  const bothSelected = valA && valB;
  const showResults = bothSelected && kpiCards;

  // ── Empty state: no data loaded ──
  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
        <div className="h-96 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <BarChart3 size={48} className="text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-500">No hay datos disponibles</p>
          <p className="text-sm mt-1">Esperando a que los datos se carguen para mostrar el modo comparativo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Modo Comparativo</h1>
            <button
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Compare dos grupos seleccionando una dimensión y dos valores distintos"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Seleccione una dimensión y dos valores para comparar indicadores lado a lado.
          </p>
        </div>
      </div>

      {/* Dimension Selector */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          <ArrowLeftRight size={14} />
          Dimensión de Comparación
        </div>
        <div className="flex flex-wrap gap-2">
          {DIMENSION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDimension(opt.value)}
              title={opt.desc}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dimension === opt.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Value Selectors A | B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Group A */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">A</span>
            <span className="text-sm font-semibold text-gray-700">Grupo A</span>
          </div>
          <select
            value={valA}
            onChange={e => setValA(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="">Seleccionar {DIMENSION_OPTIONS.find(o => o.value === dimension)?.label.toLowerCase()}...</option>
            {availableValues.map(v => (
              <option key={v} value={v} disabled={v === valB}>{v}</option>
            ))}
          </select>
          {valA && (
            <p className="text-xs text-blue-600 mt-2 font-medium">
              {formatNumber(dataA.length)} participantes
            </p>
          )}
        </div>

        {/* Group B */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold">B</span>
            <span className="text-sm font-semibold text-gray-700">Grupo B</span>
          </div>
          <select
            value={valB}
            onChange={e => setValB(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
          >
            <option value="">Seleccionar {DIMENSION_OPTIONS.find(o => o.value === dimension)?.label.toLowerCase()}...</option>
            {availableValues.map(v => (
              <option key={v} value={v} disabled={v === valA}>{v}</option>
            ))}
          </select>
          {valB && (
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              {formatNumber(dataB.length)} participantes
            </p>
          )}
        </div>
      </div>

      {/* Selection prompt if not both selected */}
      {!bothSelected && (
        <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <BarChart3 size={40} className="text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-500">Seleccione dos valores para comparar</p>
          <p className="text-sm mt-1">Elija un valor para Grupo A y otro distinto para Grupo B.</p>
        </div>
      )}

      {/* Results: KPIs + Charts */}
      {showResults && (
        <>
          {/* KPI Cards */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">Indicadores Clave</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {kpiCards.map(card => (
                <KpiCard key={card.label} {...card} />
              ))}
            </div>
          </div>

          {/* Charts */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-4">Gráficas Comparativas</h2>
            <ComparativoCharts dataA={dataA} dataB={dataB} />
          </div>
        </>
      )}
    </div>
  );
};

export default Comparativo;
