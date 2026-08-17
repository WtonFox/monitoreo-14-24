import React, { useMemo, useState, useEffect } from 'react';
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
import AuditListModal from '../../components/AuditListModal';
import type { Participant } from '../../types';

interface KpiCard {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: string;
}

// ── Helpers de drill-down (Phase 3) ──

/** Límite visible de filas por tarjeta con lista; "Ver más" abre el modal (AUD-13). */
export const VER_MAS_LIMIT = 15;

/** Nombre legible de una persona desde la primera fila del grupo. */
const personName = (rows: Participant[]): string => {
  const first = rows[0];
  if (!first) return '—';
  return `${first.nombres ?? ''} ${first.apellidos ?? ''}`.trim() || '—';
};

const EmptyList: React.FC = () => <p className="text-sm text-gray-400">Sin datos</p>;

/** Caveat AUD-12: los grupos Q1/Q2/duplicados son candidatos, no afirmaciones. */
const CANDIDATE_CAVEAT =
  'Lista de candidatos: clasificación heurística sin historial en el origen, puede existir homonimia real. No se presenta como afirmación.';

/** Botón "Ver más" (AUD-13): abre el modal con la lista COMPLETA. */
const VerMasButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
  >
    Ver más
  </button>
);

/** Señales con modal "Ver más" (AUD-13). 'q3' se añade en S3 (tarjeta Q3). */
type ModalSignal =
  | 'duplicados'
  | 'q1'
  | 'q2'
  | 'nd'
  | 'anomalias'
  | 'vocabulario'
  | 'corruptos'
  | 'q3';

/** Metadatos estáticos del modal por señal (AD-2): título, icono, tono y caveat. */
const MODAL_META: Record<ModalSignal, { title: string; icon: React.ReactNode; tone: string; caveat?: React.ReactNode }> = {
  duplicados: {
    title: 'Duplicados de carga',
    icon: <Copy size={20} />,
    tone: 'bg-cyan-50 text-cyan-600',
    caveat: CANDIDATE_CAVEAT,
  },
  q1: {
    title: 'Multi-ruta (Q1)',
    icon: <GitBranch size={20} />,
    tone: 'bg-indigo-50 text-indigo-600',
    caveat: CANDIDATE_CAVEAT,
  },
  q2: {
    title: 'Re-inscripción (Q2)',
    icon: <RefreshCw size={20} />,
    tone: 'bg-blue-50 text-blue-600',
    caveat: CANDIDATE_CAVEAT,
  },
  nd: {
    title: 'ND Cédula',
    icon: <IdCard size={20} />,
    tone: 'bg-amber-50 text-amber-600',
  },
  anomalias: {
    title: 'Anomalías fecha/edad',
    icon: <AlertTriangle size={20} />,
    tone: 'bg-red-50 text-red-600',
  },
  vocabulario: {
    title: 'Vocabulario de estados',
    icon: <BookOpen size={20} />,
    tone: 'bg-violet-50 text-violet-600',
  },
  corruptos: {
    title: 'Corruptos',
    icon: <FileWarning size={20} />,
    tone: 'bg-rose-50 text-rose-600',
  },
  q3: {
    title: 'Egreso repetido (Q3)',
    icon: <Info size={20} />,
    tone: 'bg-amber-50 text-amber-600',
  },
};

/** Merge de los 4 sub-checks de anomalías en una lista única (AD-2). */
const flattenAnomalias = (
  a: AuditSignals['anomalias']
): { row: Participant; reason: string }[] => [
  ...a.futura.map((x) => ({ row: x.row, reason: 'Fecha de nacimiento futura' })),
  ...a.inclusionPrevia.map((x) => ({ row: x.row, reason: 'Inclusión anterior al registro' })),
  ...a.edadMismatch.map((x) => ({ row: x.row, reason: 'Edad no coincide con fecha de nacimiento' })),
  ...a.edadRegistroMenor.map((x) => ({ row: x.row, reason: 'Edad menor que edad de registro' })),
];

/** Count formateado del modal por señal (AD-2). */
const modalCount = (signals: AuditSignals, signal: ModalSignal): string => {
  switch (signal) {
    case 'duplicados':
      return formatNumber(signals.duplicados.length);
    case 'q1':
      return formatNumber(signals.q1.length);
    case 'q2':
      return formatNumber(signals.q2.length);
    case 'nd':
      return formatNumber(signals.ndCedula.count);
    case 'anomalias':
      return formatNumber(signals.anomalias.totalFilas);
    case 'vocabulario':
      return formatNumber(signals.vocabulario.fueraVocabulario);
    case 'corruptos':
      return formatNumber(signals.corruptos.count);
    case 'q3':
      return formatNumber(signals.q3.length);
  }
};

/**
 * Children del modal: lista COMPLETA (sin `.slice()`, AD-2) en el mismo orden
 * que la tarjeta. El board arma el markup por señal (duplicación aceptada).
 */
const renderModalChildren = (signals: AuditSignals, signal: ModalSignal): React.ReactNode => {
  switch (signal) {
    case 'duplicados':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.duplicados.map((g, i) => (
            <li key={`dup-${g.identity}-${i}`} className="py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{personName(g.rows)}</p>
                <span className="text-xs text-gray-400">{g.rows.length} filas</span>
              </div>
              <p className="text-xs text-gray-500">Ruta: {g.ruta}</p>
              <p className="text-xs text-gray-500">IDs: {g.rows.map(r => r.id).join(', ')}</p>
              <p className="text-xs text-gray-400">Fechas: {g.fechas.join(' · ') || '—'}</p>
            </li>
          ))}
        </ul>
      );
    case 'q1':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.q1.map((c, i) => (
            <li key={`q1-${c.identity}-${i}`} className="py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{personName(c.rows)}</p>
                <span className="text-xs text-gray-400">{c.rows.length} filas</span>
              </div>
              <p className="text-xs text-gray-500">Rutas: {c.rutas.join(' · ')}</p>
              <p className="text-xs text-gray-400">
                {c.cedulaConfirmada
                  ? 'Cédula coincide entre rutas'
                  : 'Sin cédula que confirme — posible homonimia'}
              </p>
            </li>
          ))}
        </ul>
      );
    case 'q2':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.q2.map((c, i) => (
            <li key={`q2-${c.identity}-${i}`} className="py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{personName(c.rows)}</p>
                <span className="text-xs text-gray-400">{c.rows.length} filas</span>
              </div>
              <p className="text-xs text-gray-500">Ruta: {c.ruta}</p>
              <p className="text-xs text-gray-400">Fechas: {c.fechas.join(' · ') || '—'}</p>
            </li>
          ))}
        </ul>
      );
    case 'nd':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.ndCedula.rows.map(r => (
            <li key={`nd-${r.id}`} className="py-1.5 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                <span className="text-xs text-gray-400 mr-2">#{r.id}</span>
                {personName([r])}
              </p>
              <span className="text-xs text-gray-400">{r.cedula || '—'}</span>
            </li>
          ))}
        </ul>
      );
    case 'anomalias':
      return (
        <ul className="divide-y divide-gray-100">
          {flattenAnomalias(signals.anomalias).map((entry, i) => (
            <li key={`an-${entry.row.id}-${i}`} className="py-1.5">
              <p className="text-sm text-gray-700">
                <span className="text-xs text-gray-400 mr-2">#{entry.row.id}</span>
                {personName([entry.row])}
              </p>
              <p className="text-xs text-red-500 ml-7">{entry.reason}</p>
            </li>
          ))}
        </ul>
      );
    case 'vocabulario':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.vocabulario.valores
            .filter(v => !v.conocido)
            .map(v => (
              <li key={`voc-${v.valor}`} className="py-1.5 flex items-center justify-between">
                <p className="text-sm text-gray-700">{v.valor}</p>
                <span className="text-xs font-medium text-violet-600">{v.count} filas</span>
              </li>
            ))}
        </ul>
      );
    case 'corruptos':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.corruptos.items.map(item => (
            <li key={`cor-${item.id}`} className="py-1.5">
              <p className="text-sm text-gray-700">
                <span className="text-xs text-gray-400 mr-2">#{item.id}</span>
                {item.reason}
              </p>
            </li>
          ))}
        </ul>
      );
    case 'q3':
      return (
        <ul className="divide-y divide-gray-100">
          {signals.q3.map((c, i) => (
            <li key={`q3-${c.identity}-${i}`} className="py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{personName(c.rows)}</p>
                <span className="text-xs text-gray-400">{c.rows.length} filas</span>
              </div>
              <p className="text-xs text-gray-500">Rutas: {c.rutas.join(' · ')}</p>
              <p className="text-xs text-gray-400">Fechas: {c.fechas.join(' · ') || '—'}</p>
            </li>
          ))}
        </ul>
      );
  }
};

interface SignalCardProps {
  title: string;
  icon: React.ReactNode;
  tone: string;
  count: string;
  hint?: string;
  badge?: string;
  caveat?: boolean;
  children: React.ReactNode;
}

const SignalCard: React.FC<SignalCardProps> = ({
  title,
  icon,
  tone,
  count,
  hint,
  badge,
  caveat,
  children,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-3 ${tone} rounded-lg`}>{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            {title}
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                {badge}
              </span>
            )}
          </h3>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <span className="text-2xl font-bold text-gray-800 shrink-0">{count}</span>
    </div>
    {caveat && (
      <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
        {CANDIDATE_CAVEAT}
      </p>
    )}
    <div className="mt-3">{children}</div>
  </div>
);

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

  // ── Modal "Ver más" (AUD-13): estado + stale-guard (AD-3) ──
  // Hooks van ANTES de los early-returns de loading/empty (regla de hooks).
  const [openModal, setOpenModal] = useState<ModalSignal | null>(null);
  useEffect(() => {
    setOpenModal(null);
  }, [filteredData]);

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

      {/* ── Drill-downs de señales (AUD-2..AUD-9, AUD-12; Phase 3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Duplicados de carga (AUD-2) — candidatos */}
        <SignalCard
          title="Duplicados de carga"
          icon={<Copy size={20} />}
          tone="bg-cyan-50 text-cyan-600"
          count={formatNumber(signals.duplicados.length)}
          hint="grupos candidatos de carga repetida"
          badge="candidatos"
          caveat
        >
          {signals.duplicados.length === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.duplicados.slice(0, VER_MAS_LIMIT).map((g, i) => (
                <li key={`dup-${g.identity}-${i}`} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{personName(g.rows)}</p>
                    <span className="text-xs text-gray-400">{g.rows.length} filas</span>
                  </div>
                  <p className="text-xs text-gray-500">Ruta: {g.ruta}</p>
                  <p className="text-xs text-gray-500">
                    IDs: {g.rows.map(r => r.id).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Fechas: {g.fechas.join(' · ') || '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {signals.duplicados.length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('duplicados')} />
          )}
        </SignalCard>

        {/* Multi-ruta Q1 (AUD-3) — candidatos */}
        <SignalCard
          title="Multi-ruta (Q1)"
          icon={<GitBranch size={20} />}
          tone="bg-indigo-50 text-indigo-600"
          count={formatNumber(signals.q1.length)}
          hint="candidatos con ≥2 rutas formativas"
          badge="candidatos"
          caveat
        >
          {signals.q1.length === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.q1.slice(0, VER_MAS_LIMIT).map((c, i) => (
                <li key={`q1-${c.identity}-${i}`} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{personName(c.rows)}</p>
                    <span className="text-xs text-gray-400">{c.rows.length} filas</span>
                  </div>
                  <p className="text-xs text-gray-500">Rutas: {c.rutas.join(' · ')}</p>
                  <p className="text-xs text-gray-400">
                    {c.cedulaConfirmada ? 'Cédula coincide entre rutas' : 'Sin cédula que confirme — posible homonimia'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {signals.q1.length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('q1')} />
          )}
        </SignalCard>

        {/* Re-inscripción Q2 (AUD-4) — candidatos */}
        <SignalCard
          title="Re-inscripción (Q2)"
          icon={<RefreshCw size={20} />}
          tone="bg-blue-50 text-blue-600"
          count={formatNumber(signals.q2.length)}
          hint="candidatos con fechas distantes"
          badge="candidatos"
          caveat
        >
          {signals.q2.length === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.q2.slice(0, VER_MAS_LIMIT).map((c, i) => (
                <li key={`q2-${c.identity}-${i}`} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{personName(c.rows)}</p>
                    <span className="text-xs text-gray-400">{c.rows.length} filas</span>
                  </div>
                  <p className="text-xs text-gray-500">Ruta: {c.ruta}</p>
                  <p className="text-xs text-gray-400">
                    Fechas: {c.fechas.join(' · ') || '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {signals.q2.length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('q2')} />
          )}
        </SignalCard>

        {/* ND cédula (AUD-5) */}
        <SignalCard
          title="ND Cédula"
          icon={<IdCard size={20} />}
          tone="bg-amber-50 text-amber-600"
          count={formatNumber(signals.ndCedula.count)}
          hint={`${formatPercentage(signals.ndCedula.pct)} del universo filtrado`}
        >
          {signals.ndCedula.rows.length === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.ndCedula.rows.slice(0, VER_MAS_LIMIT).map(r => (
                <li key={`nd-${r.id}`} className="py-1.5 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    <span className="text-xs text-gray-400 mr-2">#{r.id}</span>
                    {personName([r])}
                  </p>
                  <span className="text-xs text-gray-400">{r.cedula || '—'}</span>
                </li>
              ))}
            </ul>
          )}
          {signals.ndCedula.rows.length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('nd')} />
          )}
        </SignalCard>

        {/* Anomalías fecha/edad (AUD-6) */}
        <SignalCard
          title="Anomalías fecha/edad"
          icon={<AlertTriangle size={20} />}
          tone="bg-red-50 text-red-600"
          count={formatNumber(signals.anomalias.totalFilas)}
          hint="filas con ≥1 anomalía lógica"
        >
          {signals.anomalias.totalFilas === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {flattenAnomalias(signals.anomalias)
                .slice(0, VER_MAS_LIMIT)
                .map((entry, i) => (
                  <li key={`an-${entry.row.id}-${i}`} className="py-1.5">
                    <p className="text-sm text-gray-700">
                      <span className="text-xs text-gray-400 mr-2">#{entry.row.id}</span>
                      {personName([entry.row])}
                    </p>
                    <p className="text-xs text-red-500 ml-7">{entry.reason}</p>
                  </li>
                ))}
            </ul>
          )}
          {flattenAnomalias(signals.anomalias).length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('anomalias')} />
          )}
        </SignalCard>

        {/* Vocabulario de estados (AUD-7) */}
        <SignalCard
          title="Vocabulario de estados"
          icon={<BookOpen size={20} />}
          tone="bg-violet-50 text-violet-600"
          count={formatNumber(signals.vocabulario.fueraVocabulario)}
          hint="valores fuera del vocabulario conocido"
        >
          {signals.vocabulario.fueraVocabulario === 0 ? (
            <EmptyList />
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.vocabulario.valores
                .filter(v => !v.conocido)
                .slice(0, VER_MAS_LIMIT)
                .map(v => (
                  <li key={`voc-${v.valor}`} className="py-1.5 flex items-center justify-between">
                    <p className="text-sm text-gray-700">{v.valor}</p>
                    <span className="text-xs font-medium text-violet-600">{v.count} filas</span>
                  </li>
                ))}
            </ul>
          )}
          {signals.vocabulario.valores.filter(v => !v.conocido).length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('vocabulario')} />
          )}
        </SignalCard>

        {/* Centinelas (AUD-8) */}
        <SignalCard
          title="Centinelas"
          icon={<ShieldAlert size={20} />}
          tone="bg-orange-50 text-orange-600"
          count={formatNumber(sentinelTotal)}
          hint="valores N/D · N/A · S/D por campo"
        >
          <ul className="divide-y divide-gray-100">
            {([
              ['Centro', signals.centinelas.centro],
              ['Estado', signals.centinelas.estado],
              ['Provincia', signals.centinelas.provincia],
              ['Ruta formativa', signals.centinelas.rutaFormativa],
            ] as const).map(([campo, count]) => (
              <li key={`cen-${campo}`} className="py-1.5 flex items-center justify-between">
                <p className="text-sm text-gray-700">{campo}</p>
                <span className="text-sm font-semibold text-gray-800">{formatNumber(count)}</span>
              </li>
            ))}
          </ul>
        </SignalCard>

        {/* Corruptos (AUD-9, AD-9) */}
        <SignalCard
          title="Corruptos"
          icon={<FileWarning size={20} />}
          tone="bg-rose-50 text-rose-600"
          count={formatNumber(signals.corruptos.count)}
          hint="registros del sync"
        >
          {signals.corruptos.count === 0 ? (
            <EmptyList />
          ) : signals.corruptos.items.length === 0 ? (
            <p className="text-xs text-gray-400">
              El conteo proviene del sync, pero la lista de razones no se
              persiste en caché (best-effort, AD-9).
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {signals.corruptos.items.slice(0, VER_MAS_LIMIT).map(item => (
                <li key={`cor-${item.id}`} className="py-1.5">
                  <p className="text-sm text-gray-700">
                    <span className="text-xs text-gray-400 mr-2">#{item.id}</span>
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {/* AD-8: sin modal si no hay items (best-effort), aunque count > 0. */}
          {signals.corruptos.items.length > VER_MAS_LIMIT && (
            <VerMasButton onClick={() => setOpenModal('corruptos')} />
          )}
        </SignalCard>
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

      {/* ── Modal "Ver más" (AUD-13, AD-1/AD-2/AD-4) ── */}
      {openModal && (
        <AuditListModal
          title={MODAL_META[openModal].title}
          icon={MODAL_META[openModal].icon}
          tone={MODAL_META[openModal].tone}
          count={modalCount(signals, openModal)}
          caveat={MODAL_META[openModal].caveat}
          onClose={() => setOpenModal(null)}
        >
          {renderModalChildren(signals, openModal)}
        </AuditListModal>
      )}
    </BoardShell>
  );
};

export default AuditoriaBoard;
