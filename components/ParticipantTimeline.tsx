import React from 'react';
import { Calendar, Target, UserCheck } from 'lucide-react';

interface ParticipantTimelineProps {
  fechaRegistro: string | null;
  fechaInclusion: string | null;
  edadRegistro: number;
  estado: string | null;
}

const isValidDateString = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now();
};

const daysSince = (dateStr: string | null): number | null => {
  if (!isValidDateString(dateStr)) return null;
  return Math.floor((Date.now() - new Date(dateStr!).getTime()) / (1000 * 60 * 60 * 24));
};

const formatTimeDelta = (dateStr: string | null): string | null => {
  const days = daysSince(dateStr);
  if (days === null) return null;
  if (days < 30) return `${days} días`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years === 0) return `${months} meses`;
  if (months === 0) return `${years}a`;
  return `${years}a ${months}m`;
};

const formatDateShort = (dateStr: string | null): string | null => {
  if (!isValidDateString(dateStr)) return null;
  return new Date(dateStr!).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Milestone node — fixed width, centered content
// ---------------------------------------------------------------------------

interface MilestoneProps {
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  date: string | null;
  subtitle: string | null;
}

const Milestone: React.FC<MilestoneProps> = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  date,
  subtitle,
}) => (
  <div className="flex flex-col items-center text-center w-28 flex-shrink-0">
    <div className={`relative z-10 w-9 h-9 rounded-full ${iconBg} flex items-center justify-center shadow-sm ring-2 ring-white`}>
      <Icon size={16} className={iconColor} />
    </div>

    <p className="text-xs font-semibold text-gray-700 mt-2 leading-tight">{label}</p>

    {date && (
      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{date}</p>
    )}

    {subtitle && (
      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{subtitle}</p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ParticipantTimeline: React.FC<ParticipantTimelineProps> = ({
  fechaRegistro,
  fechaInclusion,
  edadRegistro,
  estado,
}) => {
  const hasRegistro = isValidDateString(fechaRegistro);
  const hasInclusion = isValidDateString(fechaInclusion);
  const hasAnyData = hasRegistro || hasInclusion;
  const hasEdad = edadRegistro > 0;

  // Fallback
  if (!hasAnyData) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
        <Calendar size={14} />
        Sin datos de registro
      </div>
    );
  }

  // Count how many visual nodes we have (milestones + badge)
  const nodesCount = 1 + (hasInclusion ? 1 : 0); // registro + inclusion (optional)
  // We have: registro always, then optional inclusion
  // edad badge sits between them if both exist, or next to the single node

  return (
    <div className="bg-gray-50/60 rounded-xl border border-gray-100 px-4 py-4">
      <div className="relative flex justify-center items-start gap-4 md:gap-8">
        {/* Connecting line behind the dots — full width icon row */}
        {nodesCount > 1 && (
          <div className="absolute inset-x-0 top-[18px] h-0.5 bg-gray-200 -z-0" />
        )}

        {/* Registro */}
        <Milestone
          icon={Calendar}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          label="Registrado"
          date={formatDateShort(fechaRegistro)}
          subtitle={daysSince(fechaRegistro) !== null ? `Hace ${daysSince(fechaRegistro)} días` : null}
        />

        {/* Edad al registrar — badge entre registro e inclusión */}
        {hasEdad && nodesCount > 1 && (
          <div className="flex items-center pt-[18px] -translate-y-1/2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-medium whitespace-nowrap shadow-sm">
              <UserCheck size={11} />
              {edadRegistro} años
            </div>
          </div>
        )}

        {/* Edad badge when only registro exists (centered below) */}
        {hasEdad && nodesCount === 1 && (
          <div className="flex items-center pt-[18px] -translate-y-1/2">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-medium whitespace-nowrap shadow-sm">
              <UserCheck size={11} />
              {edadRegistro} años al registrar
            </div>
          </div>
        )}

        {/* Inclusión */}
        {hasInclusion && (
          <Milestone
            icon={Target}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            label="Incluido"
            date={formatDateShort(fechaInclusion)}
            subtitle={formatTimeDelta(fechaInclusion) ? `${formatTimeDelta(fechaInclusion)} en programa` : null}
          />
        )}
      </div>

      {/* Estado actual como línea de texto */}
      <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-400">Estado actual:</span>
        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-medium">
          {estado || 'Sin estado'}
        </span>
      </div>
    </div>
  );
};
