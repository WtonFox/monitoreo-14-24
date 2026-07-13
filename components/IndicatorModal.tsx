import React, { useEffect } from 'react';
import {
  X, Users, MapPin, Activity, Heart,
  CheckCircle2, AlertTriangle, CheckCircle, Calendar, GraduationCap, Building2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Indicator, IndicatorCategory } from '../hooks/useIndicators';
import type { BoardData } from '../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../utils/formatters';

// ---------------------------------------------------------------------------
// Category palette
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  IndicatorCategory,
  { icon: React.FC<{ size?: number }>; primary: string; bg: string; light: string }
> = {
  demograficos: { icon: Users, primary: '#2563eb', bg: '#eff6ff', light: '#dbeafe' },
  territoriales: { icon: MapPin, primary: '#059669', bg: '#ecfdf5', light: '#d1fae5' },
  programa: { icon: Activity, primary: '#d97706', bg: '#fffbeb', light: '#fef3c7' },
  sociales: { icon: Heart, primary: '#e11d48', bg: '#fff1f2', light: '#ffe4e6' },
  'calidad-dato': { icon: CheckCircle, primary: '#7c3aed', bg: '#f5f3ff', light: '#ede9fe' },
  vulnerabilidad: { icon: AlertTriangle, primary: '#dc2626', bg: '#fef2f2', light: '#fecaca' },
  'cobertura-temporal': { icon: Calendar, primary: '#0891b2', bg: '#ecfeff', light: '#cffafe' },
  'nivel-educativo': { icon: GraduationCap, primary: '#0d9488', bg: '#f0fdfa', light: '#ccfbf1' },
  'desempeno-centro': { icon: Building2, primary: '#64748b', bg: '#f8fafc', light: '#e2e8f0' },
};

const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface IndicatorModalProps {
  indicator: Indicator;
  boardData: BoardData;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const IndicatorModal: React.FC<IndicatorModalProps> = ({
  indicator,
  boardData,
  onClose,
}) => {
  const meta = CATEGORY_META[indicator.category];
  const Icon = meta.icon;
  const isPending = indicator.status === 'pending';

  // ESC to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Category-specific contextual content ──

  const renderContext = () => {
    const { demographicData, territorialData, programData, socialData, qualityData, vulnerabilityData, temporalData, educationData, centerData } = boardData;

    switch (indicator.category) {
      case 'demograficos':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gender pie */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Distribución por sexo
              </h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mujeres', value: demographicData.women },
                      { name: 'Hombres', value: demographicData.men },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65}
                    dataKey="value"
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Mujeres: {formatPercentage(demographicData.womenPct)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Hombres: {formatPercentage(demographicData.menPct)}
                </span>
              </div>
            </div>

            {/* Age bars */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Grupos de edad
              </h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={demographicData.ageBuckets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'territoriales':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Top Municipios', items: territorialData.topMunicipios.slice(0, 5) },
              { title: 'Top Centros', items: territorialData.topCentros.slice(0, 5) },
              { title: 'Top Cursos', items: territorialData.topCursos.slice(0, 5) },
            ].map(section => (
              <div key={section.title} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
                <div className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs items-center">
                      <span className="text-gray-600 truncate mr-2 flex-1">{item.name}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  ))}
                  {section.items.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Sin datos</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case 'programa':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status pie */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Distribución por estado
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={programData.statusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72}
                    dataKey="value"
                    nameKey="name"
                  >
                    {programData.statusDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] mt-1">
                {programData.statusDistribution.slice(0, 6).map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {s.name}: {formatNumber(s.value)}
                  </span>
                ))}
              </div>
            </div>

            {/* Retention bars */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Resumen de retención
              </h4>
              <div className="space-y-4 mt-2">
                {[
                  { label: 'Activos', pct: programData.activePct, color: 'bg-green-500' },
                  { label: 'Egresados', pct: programData.graduatedPct, color: 'bg-blue-500' },
                  { label: 'Menores con tutor', pct: programData.minorsWithTutorPct, color: 'bg-amber-500' },
                  { label: 'Responsables con teléfono', pct: programData.tutorsWithPhonePct, color: 'bg-purple-500' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{bar.label}</span>
                      <span className="font-semibold text-gray-900">
                        {formatPercentage(bar.pct)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${bar.color} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.min(bar.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'sociales':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Completeness bars */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Completitud de datos
              </h4>
              <div className="space-y-5 mt-2">
                {[
                  { label: 'Teléfono registrado', pct: socialData.phoneCompletenessPct, color: 'bg-blue-500' },
                  { label: 'Dirección registrada', pct: socialData.addressCompletenessPct, color: 'bg-emerald-500' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-600">{bar.label}</span>
                      <span className="font-bold text-gray-900">
                        {formatPercentage(bar.pct)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${bar.color} h-3 rounded-full transition-all`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gender by centro */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Género por centro (top 5)
              </h4>
              <div className="space-y-2 mt-1">
                {socialData.genderByCentro.slice(0, 5).map((item, i) => {
                  const total = item.Mujeres + item.Hombres;
                  const wp = total > 0 ? (item.Mujeres / total) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                        <span className="truncate mr-2">{item.name}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 transition-all"
                          style={{ width: `${wp}%` }}
                        />
                        <div
                          className="bg-amber-400 h-1.5 transition-all"
                          style={{ width: `${100 - wp}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'calidad-dato':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Completitud por campo
              </h4>
              <div className="space-y-4 mt-2">
                {qualityData.fieldBreakdown.map((field, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate mr-2 flex-1">{field.name}</span>
                      <span className="font-bold text-gray-900">{formatPercentage(field.pct)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-violet-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(field.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Resumen de calidad
              </h4>
              <div className="space-y-3 mt-2">
                {[
                  { label: 'Cédula', pct: qualityData.cedulaPct },
                  { label: 'Fecha de nacimiento', pct: qualityData.birthDatePct },
                  { label: 'Nivel de estudio', pct: qualityData.educationPct },
                  { label: 'Alergias', pct: qualityData.allergiesPct },
                  { label: 'Discapacidades', pct: qualityData.disabilitiesPct },
                  { label: 'Enfermedades', pct: qualityData.diseasesPct },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: meta.primary }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-24 text-right">
                      {item.label}: {formatPercentage(item.pct)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'vulnerabilidad':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Prevalencia
              </h4>
              <div className="space-y-4 mt-2">
                {[
                  { label: 'Discapacidad', pct: vulnerabilityData.disabilitiesPct, color: 'bg-red-500' },
                  { label: 'Enfermedad', pct: vulnerabilityData.diseasesPct, color: 'bg-orange-500' },
                  { label: 'Alergia', pct: vulnerabilityData.allergiesPct, color: 'bg-amber-500' },
                  { label: 'Programas Sociales', pct: vulnerabilityData.socialProgramsPct, color: 'bg-purple-500' },
                  { label: 'Vulnerabilidades', pct: vulnerabilityData.vulnerabilitiesPct, color: 'bg-rose-500' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{bar.label}</span>
                      <span className="font-bold text-gray-900">{formatPercentage(bar.pct)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${bar.color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(bar.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Top listas
              </h4>
              <div className="space-y-4 mt-2">
                {[
                  { title: 'Discapacidades', items: vulnerabilityData.topDisabilities },
                  { title: 'Enfermedades', items: vulnerabilityData.topDiseases },
                  { title: 'Alergias', items: vulnerabilityData.topAllergies },
                ].map(section => (
                  <div key={section.title}>
                    <h5 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{section.title}</h5>
                    {section.items.length > 0 ? (
                      <div className="space-y-1">
                        {section.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-600 truncate mr-2 flex-1">{item.name}</span>
                            <span className="font-semibold text-gray-900">{formatNumber(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-gray-400 italic">Sin datos</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cobertura-temporal':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Registros por año
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={temporalData.registrationsByYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Métricas temporales
              </h4>
              <div className="space-y-4 mt-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs text-gray-600">Edad registro promedio</span>
                  <span className="text-sm font-bold text-gray-900">{temporalData.avgAgeAtRegistration.toFixed(1)} años</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-xs text-gray-600">Días a inclusión</span>
                  <span className="text-sm font-bold text-gray-900">{temporalData.avgDaysToInclusion.toFixed(0)} días</span>
                </div>
                <div className="mt-4">
                  <h5 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Registros por trimestre</h5>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={temporalData.registrationsByQuarter}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} hide />
                      <Tooltip />
                      <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case 'nivel-educativo':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Distribución educativa
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={educationData.educationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Nivel × Estado
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={educationData.educationByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Activos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'desempeno-centro':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Top centros
              </h4>
              <div className="space-y-2 mt-1 max-h-60 overflow-y-auto">
                {centerData.topCenters.slice(0, 5).map((item, i) => (
                  <div key={i} className="text-xs border-b border-gray-100 pb-1.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-700 font-medium truncate mr-2 flex-1">{item.name}</span>
                      <span className="font-bold text-gray-900">{formatNumber(item.total)}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>Activos: {formatNumber(item.activos)}</span>
                      <span>Egresados: {formatNumber(item.egresados)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Género por centro
              </h4>
              <div className="space-y-2 mt-1">
                {centerData.genderByCenter.slice(0, 5).map((item, i) => {
                  const total = item.Mujeres + item.Hombres;
                  const wp = total > 0 ? (item.Mujeres / total) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                        <span className="truncate mr-2">{item.name}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden">
                        <div className="bg-teal-500 h-1.5 transition-all" style={{ width: `${wp}%` }} />
                        <div className="bg-amber-400 h-1.5 transition-all" style={{ width: `${100 - wp}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ──

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        style={{ borderTop: `4px solid ${meta.primary}` }}
      >
        {/* ── Header ── */}
        <div className={`flex items-start justify-between px-6 py-4 border-b ${meta.bg}`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl mt-0.5 ${meta.light}`}>
              <Icon size={20} style={{ color: meta.primary }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {indicator.name}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{indicator.formula}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Value ── */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div
            className="text-3xl font-bold break-words leading-tight"
            style={{ color: meta.primary }}
          >
            {indicator.value}
          </div>
          {isPending && indicator.pendingReason && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
              <AlertTriangle size={14} />
              {indicator.pendingReason}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        <div className="px-6 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed">{indicator.description}</p>
        </div>

        {/* ── Contextual data ── */}
        {indicator.status === 'viable' && (
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Datos contextuales
            </h3>
            {renderContext()}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              isPending
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-green-100 text-green-700 border border-green-200'
            }`}
          >
            {isPending ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {isPending ? 'PENDIENTE' : 'VIABLE'}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Cerrar <span className="text-gray-300">(ESC)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
