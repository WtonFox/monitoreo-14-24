import React from 'react';
import { Users, MapPin, Activity, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { IndicatorGroup, Indicator } from '../hooks/useIndicators';

/* ── icons per category ── */

const CATEGORY_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  demograficos: Users,
  territoriales: MapPin,
  programa: Activity,
  sociales: Heart,
};

const CATEGORY_STYLES: Record<string, { bg: string; icon: string; border: string; header: string }> = {
  demograficos: {
    bg: 'bg-blue-50/30',
    icon: 'text-blue-600',
    border: 'border-blue-100',
    header: 'text-blue-800 bg-blue-50 border-blue-200',
  },
  territoriales: {
    bg: 'bg-emerald-50/30',
    icon: 'text-emerald-600',
    border: 'border-emerald-100',
    header: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  },
  programa: {
    bg: 'bg-amber-50/30',
    icon: 'text-amber-600',
    border: 'border-amber-100',
    header: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  sociales: {
    bg: 'bg-rose-50/30',
    icon: 'text-rose-600',
    border: 'border-rose-100',
    header: 'text-rose-800 bg-rose-50 border-rose-200',
  },
};

/* ── props ── */

interface IndicatorsBoardProps {
  groups: IndicatorGroup[];
}

/* ── single indicator tile ── */

const IndicatorTile: React.FC<{ indicator: Indicator }> = ({ indicator }) => {
  const isPending = indicator.status === 'pending';

  return (
    <div
      className={`
        relative bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md
        ${isPending ? 'border-orange-300 opacity-70' : 'border-gray-100'}
      `}
    >
      {/* status badge */}
      <div className="absolute top-3 right-3">
        {isPending ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
            <AlertTriangle size={10} />
            PENDIENTE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 size={10} />
            VIABLE
          </span>
        )}
      </div>

      {/* name */}
      <p className="text-sm font-semibold text-gray-700 pr-24 mb-2">{indicator.name}</p>

      {/* value */}
      <div className="text-2xl font-bold text-gray-900 mb-2 break-words">{indicator.value}</div>

      {/* formula */}
      <p className="text-[11px] text-gray-400 font-mono mb-1">{indicator.formula}</p>

      {/* description */}
      <p className="text-[11px] text-gray-500">{indicator.description}</p>

      {/* pending reason (if applicable) */}
      {isPending && indicator.pendingReason && (
        <p className="text-[10px] text-orange-600 mt-2 font-medium italic">{indicator.pendingReason}</p>
      )}
    </div>
  );
};

/* ── category section ── */

const CategorySection: React.FC<{ group: IndicatorGroup }> = ({ group }) => {
  const Icon = CATEGORY_ICONS[group.category] || Users;
  const styles = CATEGORY_STYLES[group.category] || CATEGORY_STYLES.demograficos;
  const count = group.items.length;
  const viableCount = group.items.filter(i => i.status === 'viable').length;
  const pendingCount = count - viableCount;

  return (
    <section className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
      {/* header */}
      <div className={`flex items-center justify-between px-5 py-3 border-b ${styles.header}`}>
        <div className="flex items-center gap-2">
          <Icon size={20} className={styles.icon} />
          <h2 className="text-lg font-bold">{group.label}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="text-green-700">
            <CheckCircle2 size={12} className="inline mr-0.5" />
            {viableCount} viables
          </span>
          {pendingCount > 0 && (
            <span className="text-orange-700">
              <AlertTriangle size={12} className="inline mr-0.5" />
              {pendingCount} pendientes
            </span>
          )}
        </div>
      </div>

      {/* tiles grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {group.items.map(indicator => (
          <IndicatorTile key={indicator.id} indicator={indicator} />
        ))}
      </div>
    </section>
  );
};

/* ── board (main component) ── */

export const IndicatorsBoard: React.FC<IndicatorsBoardProps> = ({ groups }) => {
  return (
    <div className="space-y-8">
      {groups.map(group => (
        <CategorySection key={group.category} group={group} />
      ))}
    </div>
  );
};
