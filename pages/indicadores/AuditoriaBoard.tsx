import React, { useMemo } from 'react';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  Copy,
  GitBranch,
  RefreshCw,
  IdCard,
  AlertTriangle,
  BookOpen,
  ShieldAlert,
  FileWarning,
  Info,
} from 'lucide-react';
import BoardShell from '../../components/BoardShell';
import BoardInfo from '../../components/BoardInfo';
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext';
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar';
import { useParticipantStore } from '../../stores/participantStore';
import { computeAuditSignals } from '../../utils/auditSignals';
import type { AuditSignals } from '../../utils/auditSignals';

interface KpiCard {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: string;
}

const AuditoriaBoard: React.FC = () => {
  const { filteredData } = useIndicadoresFilters();
  const corruptedItems = useParticipantStore(s => s.corruptedItems);
  const syncStats = useParticipantStore(s => s.syncStats);
  const isSyncing = useParticipantStore(s => s.isSyncing);

  // ── Señales de auditoría (AUD-11): una sola pasada O(n) sobre filteredData ──
  const signals: AuditSignals = useMemo(
    () => computeAuditSignals(filteredData, corruptedItems, syncStats),
    [filteredData, corruptedItems, syncStats]
  );

  // ── Loading / Empty states (AUD-1) ──
  if (isSyncing) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const sentinelTotal =
    signals.centinelas.centro +
    signals.centinelas.estado +
    signals.centinelas.provincia +
    signals.centinelas.rutaFormativa;

  const kpis: KpiCard[] = [
    {
      label: 'Duplicados de carga',
      value: formatNumber(signals.duplicados.length),
      hint: 'grupos candidatos',
      icon: <Copy size={24} />,
      tone: 'bg-cyan-50 text-cyan-600',
    },
    {
      label: 'Multi-ruta (Q1)',
      value: formatNumber(signals.q1.length),
      hint: 'candidatos en ≥2 rutas',
      icon: <GitBranch size={24} />,
      tone: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Re-inscripción (Q2)',
      value: formatNumber(signals.q2.length),
      hint: 'candidatos por fecha distante',
      icon: <RefreshCw size={24} />,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'ND Cédula',
      value: formatNumber(signals.ndCedula.count),
      hint: `${formatPercentage(signals.ndCedula.pct)} del universo filtrado`,
      icon: <IdCard size={24} />,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Anomalías fecha/edad',
      value: formatNumber(signals.anomalias.totalFilas),
      hint: 'filas con ≥1 anomalía',
      icon: <AlertTriangle size={24} />,
      tone: 'bg-red-50 text-red-600',
    },
    {
      label: 'Vocabulario de estados',
      value: formatNumber(signals.vocabulario.fueraVocabulario),
      hint: 'valores fuera del vocabulario',
      icon: <BookOpen size={24} />,
      tone: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Centinelas',
      value: formatNumber(sentinelTotal),
      hint: 'centro · estado · provincia · ruta',
      icon: <ShieldAlert size={24} />,
      tone: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Corruptos',
      value: formatNumber(signals.corruptos.count),
      hint: 'registros del sync',
      icon: <FileWarning size={24} />,
      tone: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <BoardShell
      title="Auditoría de Datos"
      description="Auditoría de la calidad del dataset: duplicados de carga, multi-ruta, re-inscripción, ND de cédula, anomalías de fecha/edad, vocabulario de estados, centinelas y registros corruptos."
    >
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center"
          >
            <div className={`p-3 ${kpi.tone} rounded-lg mr-4`}>{kpi.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpi.value}</h3>
              <p className="text-xs text-gray-400">{kpi.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Q3 Callout (AUD-10) ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Egreso repetido (Q3)</p>
          <p>
            Egreso repetido: no respondible sin fecha de egreso. El modelo de
            datos no expone el campo fechaEgreso, por lo que esta señal no es
            respondible desde el dataset actual.
          </p>
        </div>
      </div>

      {/* ── Filtros + Info ── */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar
          showYear
          showProvince
          showMunicipio
          showSex={false}
          noContainer
        />
        <div className="ml-auto flex items-center gap-2">
          <BoardInfo
            title="Auditoría de Datos"
            sections={[
              {
                heading: '¿Qué mide?',
                content:
                  'Audita la calidad del dataset con 8 señales: duplicados de carga, multi-ruta (Q1), re-inscripción (Q2), ND de cédula, anomalías de fecha/edad, vocabulario de estados, centinelas y registros corruptos.',
              },
              {
                heading: 'Candidatos (Q1/Q2)',
                content:
                  'Q1 (multi-ruta) y Q2 (re-inscripción) son heurísticas sobre la identidad normalizada (nombres + apellidos, sin acentos ni espacios). Se reportan siempre como candidatos: puede existir homonimia real y la clasificación no tiene historial en el origen.',
              },
              {
                heading: 'Egreso repetido (Q3)',
                content:
                  'No respondible: el modelo de datos no expone fechaEgreso, por lo que no es posible confirmar egresos repetidos.',
              },
              {
                heading: 'Filtros',
                content:
                  'Todas las señales se calculan sobre el universo filtrado (año, provincia y municipio), respetando los filtros globales de indicadores.',
              },
            ]}
          />
        </div>
      </div>
    </BoardShell>
  );
};

export default AuditoriaBoard;
