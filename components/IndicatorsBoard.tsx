import React, { useState } from 'react';
import { Users, MapPin, Activity, Heart, CheckCircle, AlertTriangle, Calendar, GraduationCap, Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { IndicatorGroup, Indicator, IndicatorCategory } from '../hooks/useIndicators';
import { formatNumber } from '../utils/formatters';
import { useIndicadoresFilters } from '../contexts/IndicadoresFiltersContext';
import { IndicatorModal } from './IndicatorModal';

// ---------------------------------------------------------------------------
// Per-category style tokens
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<
  IndicatorCategory,
  {
    bar: string;
    icon: string;
    border: string;
    header: string;
    bg: string;
    accent: string;
  }
> = {
  demograficos: {
    bar: 'bg-blue-500',
    icon: 'text-blue-600',
    border: 'border-blue-100',
    header: 'text-blue-800 bg-blue-50 border-blue-200',
    bg: 'bg-blue-50/30',
    accent: 'bg-blue-50',
  },
  territoriales: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-600',
    border: 'border-emerald-100',
    header: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    bg: 'bg-emerald-50/30',
    accent: 'bg-emerald-50',
  },
  programa: {
    bar: 'bg-amber-500',
    icon: 'text-amber-600',
    border: 'border-amber-100',
    header: 'text-amber-800 bg-amber-50 border-amber-200',
    bg: 'bg-amber-50/30',
    accent: 'bg-amber-50',
  },
  sociales: {
    bar: 'bg-rose-500',
    icon: 'text-rose-600',
    border: 'border-rose-100',
    header: 'text-rose-800 bg-rose-50 border-rose-200',
    bg: 'bg-rose-50/30',
    accent: 'bg-rose-50',
  },
  'calidad-dato': {
    bar: 'bg-violet-500',
    icon: 'text-violet-600',
    border: 'border-violet-100',
    header: 'text-violet-800 bg-violet-50 border-violet-200',
    bg: 'bg-violet-50/30',
    accent: 'bg-violet-50',
  },
  vulnerabilidad: {
    bar: 'bg-red-500',
    icon: 'text-red-600',
    border: 'border-red-100',
    header: 'text-red-800 bg-red-50 border-red-200',
    bg: 'bg-red-50/30',
    accent: 'bg-red-50',
  },
  'cobertura-temporal': {
    bar: 'bg-cyan-500',
    icon: 'text-cyan-600',
    border: 'border-cyan-100',
    header: 'text-cyan-800 bg-cyan-50 border-cyan-200',
    bg: 'bg-cyan-50/30',
    accent: 'bg-cyan-50',
  },
  'nivel-educativo': {
    bar: 'bg-teal-500',
    icon: 'text-teal-600',
    border: 'border-teal-100',
    header: 'text-teal-800 bg-teal-50 border-teal-200',
    bg: 'bg-teal-50/30',
    accent: 'bg-teal-50',
  },
  'desempeno-centro': {
    bar: 'bg-slate-500',
    icon: 'text-slate-600',
    border: 'border-slate-100',
    header: 'text-slate-800 bg-slate-50 border-slate-200',
    bg: 'bg-slate-50/30',
    accent: 'bg-slate-50',
  },
};

const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  demograficos: Users,
  territoriales: MapPin,
  programa: Activity,
  sociales: Heart,
  'calidad-dato': CheckCircle,
  vulnerabilidad: AlertTriangle,
  'cobertura-temporal': Calendar,
  'nivel-educativo': GraduationCap,
  'desempeno-centro': Building2,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IndicatorsBoardProps {
  groups: IndicatorGroup[];
}

// ---------------------------------------------------------------------------
// Single indicator tile
// ---------------------------------------------------------------------------

const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

const IndicatorTile: React.FC<{
  indicator: Indicator;
  styles: (typeof CATEGORY_STYLES)[IndicatorCategory];
  onClick: () => void;
}> = ({ indicator, styles, onClick }) => {
  const isPending = indicator.status === 'pending';
  const isNotViable = indicator.status === 'no-viable';

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => handleKeyDown(e, onClick)}
      tabIndex={0}
      role="button"
      aria-label={indicator.name}
      className={`
        relative flex bg-white rounded-xl shadow-sm border cursor-pointer
        transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]
        ${isPending ? 'border-orange-200 opacity-80' : isNotViable ? 'border-gray-200 opacity-60' : 'border-gray-100'}
      `}
    >
      {/* Left color accent bar */}
      <div
        className={`w-1.5 rounded-l-xl flex-shrink-0 ${
          isPending ? 'bg-orange-400' : isNotViable ? 'bg-gray-300' : styles.bar
        }`}
      />

      <div className="flex-1 p-4">
        {/* Status badge — top right */}
        <div className="absolute top-3 right-3">
          {isPending ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              <AlertTriangle size={10} />
              PENDIENTE
            </span>
          ) : isNotViable ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
              <XCircle size={10} /> NO VIABLE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              <CheckCircle2 size={10} />
              VIABLE
            </span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-gray-700 pr-24 mb-3 leading-snug">
          {indicator.name}
        </p>

        {/* Value or structured top-items list */}
        {indicator.topItems && indicator.topItems.length > 0 ? (
          <div className={`space-y-1.5 mb-3 w-full pr-8 p-2.5 rounded-lg ${styles.accent}`}>
            {indicator.topItems.slice(0, 5).map((item, i) => (
              <div key={i} className="flex justify-between items-center gap-2 text-xs">
                <span className="font-medium text-gray-700 min-w-0 break-words">
                  {i + 1}. {item.name}
                </span>
                <span className="font-bold text-gray-900 tabular-nums whitespace-nowrap flex-shrink-0">
                  {formatNumber(item.value)}
                  {item.pct !== undefined ? ` (${item.pct.toFixed(1)}%)` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`inline-block px-2.5 py-0.5 rounded-lg text-base font-bold text-gray-900 mb-3 ${
              isPending ? 'bg-gray-50' : isNotViable ? 'bg-gray-50' : styles.accent
            }`}
          >
            {indicator.value}
          </div>
        )}

        {/* Formula */}
        <p className="text-[11px] text-gray-400 font-mono mb-1.5">{indicator.formula}</p>

        {/* Description */}
        <p className="text-[12px] text-gray-500 leading-relaxed">{indicator.description}</p>

        {/* Pending reason */}
        {isPending && indicator.pendingReason && (
          <p className="text-[11px] text-orange-600 mt-2 font-medium italic">
            {indicator.pendingReason}
          </p>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Category section
// ---------------------------------------------------------------------------

const CategorySection: React.FC<{
  group: IndicatorGroup;
  onIndicatorClick: (indicator: Indicator) => void;
}> = ({ group, onIndicatorClick }) => {
  const styles = CATEGORY_STYLES[group.category];
  const Icon = CATEGORY_ICONS[group.category] || Users;
  const count = group.items.length;
  const viableCount = group.items.filter(i => i.status === 'viable').length;
  const pendingCount = group.items.filter(i => i.status === 'pending').length;
  const notViableCount = group.items.filter(i => i.status === 'no-viable').length;

  return (
    <section
      className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-5 py-3 border-b ${styles.header}`}
      >
        <div className="flex items-center gap-2">
          <Icon size={20} className={styles.icon} />
          <h2 className="text-lg font-bold">{group.label}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-green-700">
            <CheckCircle2 size={12} className="inline mr-0.5" />
            {viableCount} VIABLES
          </span>
          {pendingCount > 0 && (
            <span className="text-orange-700">
              <AlertTriangle size={12} className="inline mr-0.5" />
              {pendingCount} PENDIENTES
            </span>
          )}
          {notViableCount > 0 && (
            <span className="text-gray-500">
              <XCircle size={12} className="inline mr-0.5" />
              {notViableCount} NO VIABLES
            </span>
          )}
        </div>
      </div>

      {/* Tiles grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.items.map(indicator => (
          <IndicatorTile
            key={indicator.id}
            indicator={indicator}
            styles={styles}
            onClick={() => onIndicatorClick(indicator)}
          />
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Board (main component)
// ---------------------------------------------------------------------------

export const IndicatorsBoard: React.FC<IndicatorsBoardProps> = ({ groups }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const { boardData } = useIndicadoresFilters();

  return (
    <>
      <div className="space-y-8">
        {groups.map(group => (
          <CategorySection
            key={group.category}
            group={group}
            onIndicatorClick={setSelectedIndicator}
          />
        ))}
      </div>

      {selectedIndicator && (
        <IndicatorModal
          indicator={selectedIndicator}
          boardData={boardData}
          onClose={() => setSelectedIndicator(null)}
        />
      )}
    </>
  );
};
