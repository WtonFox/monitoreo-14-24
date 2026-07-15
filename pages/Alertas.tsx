import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bell, XCircle, Users, MapPin, Building2,
  TrendingDown, Shield, ChevronRight, Info, CheckCircle2, Activity,
  HelpCircle, X, ArrowUp, ArrowDown, Minus, RefreshCw,
  Calendar, Filter as FilterIcon,
} from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useAlerts, type Alert, type AlertSeverity, type AlertCategory, type TrendDirection } from '../hooks/useAlerts';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { ROUTES } from '../types/routes';
import { DOMINICAN_PROVINCES, PROVINCE_MUNICIPALITIES } from '../constants';

// ── Severity config ──

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.FC<{ size?: number; className?: string }>; label: string; bg: string; border: string; text: string; badge: string }> = {
  critical: {
    icon: XCircle, label: 'Crítica',
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  warning: {
    icon: AlertTriangle, label: 'Advertencia',
    bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  info: {
    icon: Info, label: 'Informativa',
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  desercion: 'Deserción',
  cobertura: 'Cobertura',
  calidad: 'Calidad del Dato',
  territorial: 'Territorial',
  operativo: 'Operativo',
};

const TREND_ICON: Record<TrendDirection, React.FC<{ size?: number; className?: string }>> = {
  up: ArrowUp,
  down: ArrowDown,
  stable: Minus,
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: 'text-red-500',
  down: 'text-green-500',
  stable: 'text-gray-400',
};

// ── Severity pills config ──

interface Pill<T> {
  value: T;
  label: string;
  count: number;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
}

const severityPills: Pill<AlertSeverity>[] = [
  { value: 'critical', label: 'Críticas', count: 0, icon: XCircle, color: 'text-red-600' },
  { value: 'warning', label: 'Advertencias', count: 0, icon: AlertTriangle, color: 'text-orange-600' },
  { value: 'info', label: 'Informativas', count: 0, icon: Info, color: 'text-blue-600' },
];

const categoryPills: Pill<AlertCategory>[] = [
  { value: 'desercion', label: 'Deserción', count: 0, icon: TrendingDown, color: 'text-red-500' },
  { value: 'cobertura', label: 'Cobertura', count: 0, icon: Activity, color: 'text-cyan-600' },
  { value: 'calidad', label: 'Calidad', count: 0, icon: CheckCircle2, color: 'text-violet-600' },
  { value: 'territorial', label: 'Territorial', count: 0, icon: MapPin, color: 'text-emerald-600' },
  { value: 'operativo', label: 'Operativo', count: 0, icon: Building2, color: 'text-slate-600' },
];

// ── Info Modal ──

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Acerca de las alertas</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Las alertas se calculan automáticamente con los datos disponibles en la API actual.
            Se reagrupan al cambiar los filtros de año, provincia o municipio.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">¿Cómo se calculan?</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Cada alerta compara los datos contra un umbral definido. Si se supera, se genera la alerta.
              La tendencia histórica compara participantes registrados en los últimos 6 meses contra los anteriores.
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-1">Próximas mejoras</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Cuando la API exponga nuevas variables (fechaExclusion, cohorte, seguimiento),
              se podrán agregar alertas más precisas como deserción temprana y análisis por cohorte.
            </p>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// ── Severity bar ──

const SeverityBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
  </div>
);

// ── Trend badge ──

const TrendBadge: React.FC<{ trend: TrendDirection; label: string }> = ({ trend, label }) => {
  const Icon = TREND_ICON[trend];
  const color = TREND_COLOR[trend];
  return (
    <div className={`flex items-center gap-1 text-[10px] ${color}`}>
      <Icon size={10} />
      <span className="truncate max-w-[200px]">{label}</span>
    </div>
  );
};

// ── Alert Card ──

const AlertCard: React.FC<{ alert: Alert; onNavigate: (route: string) => void }> = ({ alert, onNavigate }) => {
  const severityCfg = SEVERITY_CONFIG[alert.severity];
  const SeverityIcon = severityCfg.icon;
  const [expanded, setExpanded] = useState(false);

  // bar color
  const barColor = alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <div className={`bg-white rounded-xl border ${severityCfg.border} shadow-sm transition-all hover:shadow-md overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-4 p-4 md:p-5 text-left">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${severityCfg.bg} border ${severityCfg.border} flex-shrink-0 mt-0.5`}>
          <SeverityIcon size={20} className={severityCfg.text} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityCfg.badge}`}>
              {severityCfg.label}
            </span>
            <span className="text-[10px] text-gray-400">{CATEGORY_LABELS[alert.category] || alert.category}</span>
            {alert.trend && (
              <TrendBadge trend={alert.trend} label={alert.trendLabel || ''} />
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{alert.title}</h3>
          <p className={`text-xs text-gray-500 ${expanded ? '' : 'line-clamp-2'}`}>{alert.description}</p>
          {/* Severity bar */}
          <SeverityBar value={alert.severityBar} color={barColor} />
        </div>

        {/* Value + expand */}
        <div className="flex items-center gap-3 flex-shrink-0 self-start">
          <div className="text-right">
            <p className="text-base font-bold text-gray-800">{alert.value}</p>
            <p className="text-[10px] text-gray-400">umbral: {alert.threshold}</p>
          </div>
          <ChevronRight size={16} className={`text-gray-300 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 border-t border-gray-100 space-y-3">
          {alert.recommendation && (
            <div className="flex items-start gap-2 mt-3 text-xs text-gray-600">
              <Shield size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span><strong>Recomendación:</strong> {alert.recommendation}</span>
            </div>
          )}

          {alert.topAffected && alert.topAffected.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Principales afectados</p>
              <div className="space-y-1">
                {alert.topAffected.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="truncate mr-2">{i + 1}. {item.name}</span>
                    <span className="font-semibold tabular-nums flex-shrink-0">{formatNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={12} />
              <span>{formatNumber(alert.affectedCount)} afectados</span>
            </div>
            {alert.relatedBoard && (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigate(alert.relatedBoard!); }}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Shield size={12} />
                Ver board relacionado
                <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pill component ──

function PillRow<T extends string>({
  pills,
  active,
  onChange,
  label,
}: {
  pills: { value: T; label: string; count: number; icon: React.FC<{ size?: number; className?: string }>; color: string }[];
  active: T | 'todas';
  onChange: (v: T | 'todas') => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">{label}</span>
      <button
        onClick={() => onChange('todas')}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
          active === 'todas'
            ? 'bg-gray-800 text-white border-gray-800 font-medium'
            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        }`}
      >
        Todas
      </button>
      {pills.map(pill => (
        <button
          key={pill.value}
          onClick={() => onChange(active === pill.value ? 'todas' : pill.value)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
            active === pill.value
              ? 'bg-gray-800 text-white border-gray-800 font-medium'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          <pill.icon size={12} className={active === pill.value ? 'text-white' : pill.color} />
          {pill.label}
          <span className={`ml-0.5 text-[10px] ${active === pill.value ? 'text-gray-300' : 'text-gray-400'}`}>
            {pill.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Page ──

const Alertas: React.FC = () => {
  const { dashboardData } = useDashboard();
  const navigate = useNavigate();

  // ── Filters ──
  const [yearFilter, setYearFilter] = useState('todas');
  const [provinceFilter, setProvinceFilter] = useState('todas');
  const [municipioFilter, setMunicipioFilter] = useState('todas');
  const [sexFilter, setSexFilter] = useState<'todas' | 'm' | 'f'>('todas');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'todas'>('todas');
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'todas'>('todas');
  const [showInfo, setShowInfo] = useState(false);

  // ── Available filter options ──
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    dashboardData.forEach(p => {
      if (p.fechaRegistro) {
        const y = new Date(p.fechaRegistro).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [dashboardData]);

  const availableMunicipios = useMemo(() => {
    if (provinceFilter === 'todas') return [];
    return PROVINCE_MUNICIPALITIES[provinceFilter] || [];
  }, [provinceFilter]);

  // ── Filter data ──
  const filteredData = useMemo(() => {
    let data = dashboardData;
    if (yearFilter !== 'todas') {
      data = data.filter(p => p.fechaRegistro && new Date(p.fechaRegistro).getFullYear().toString() === yearFilter);
    }
    if (provinceFilter !== 'todas') {
      data = data.filter(p => p.provincia === provinceFilter);
    }
    if (municipioFilter !== 'todas') {
      data = data.filter(p => p.municipio === municipioFilter);
    }
    if (sexFilter !== 'todas') {
      data = data.filter(p => p.sexo?.toLowerCase() === sexFilter);
    }
    return data;
  }, [dashboardData, yearFilter, provinceFilter, municipioFilter, sexFilter]);

  // ── Refresh key for manual recalculation ──
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Alerts (se recalcula cuando cambian datos filtrados o se forza refresh) ──
  const { alerts, criticalCount, warningCount, infoCount, totalCount, lastUpdated } = useAlerts(
    useMemo(() => filteredData, [filteredData, refreshKey])
  );

  // ── Filtered alerts (por severidad + categoría) ──
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (severityFilter !== 'todas' && a.severity !== severityFilter) return false;
      if (categoryFilter !== 'todas' && a.category !== categoryFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, categoryFilter]);

  // ── Pill counts (siempre totales, para contexto) ──
  const pillsWithCounts = useMemo(() => ({
    severity: severityPills.map(p => ({ ...p, count: p.value === 'critical' ? criticalCount : p.value === 'warning' ? warningCount : infoCount })),
    category: categoryPills.map(p => ({ ...p, count: alerts.filter(a => a.category === p.value).length })),
  }), [alerts, criticalCount, warningCount, infoCount]);

  // ── Clear province resets municipio ──
  const handleProvinceChange = (v: string) => {
    setProvinceFilter(v);
    setMunicipioFilter('todas');
  };

  // ── Recalcular (NO vacía dashboardData — solo fuerza recálculo local) ──
  const handleRecalcular = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // ── Format lastUpdated ──
  const timeAgo = useMemo(() => {
    const diff = Date.now() - lastUpdated.getTime();
    if (diff < 60000) return 'recién calculadas';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `hace ${hrs}h ${mins % 60}min`;
  }, [lastUpdated]);

  // ── KPI summary (siempre muestran los totales, no importa el filtro de severidad/categoría) ──
  const kpis = [
    { icon: XCircle, count: criticalCount, label: 'Críticas', severity: 'critical' as AlertSeverity, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-500' },
    { icon: AlertTriangle, count: warningCount, label: 'Advertencias', severity: 'warning' as AlertSeverity, color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-500' },
    { icon: Info, count: infoCount, label: 'Informativas', severity: 'info' as AlertSeverity, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-500' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h1>
            <button
              onClick={() => setShowInfo(true)}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="¿Cómo funcionan las alertas?"
            >
              <HelpCircle size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            {totalCount > 0
              ? (severityFilter !== 'todas' || categoryFilter !== 'todas'
                  ? `${filteredAlerts.length} de ${totalCount} alerta${totalCount !== 1 ? 's' : ''}`
                  : `${totalCount} alerta${totalCount !== 1 ? 's' : ''} detectada${totalCount !== 1 ? 's' : ''}`
                )
              : 'Sin alertas'}
            <span className="text-gray-300">·</span>
            <Calendar size={12} className="text-gray-400" />
            {timeAgo}
          </p>
        </div>
        <button
          onClick={handleRecalcular}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={14} />
          Recalcular
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <button
            key={kpi.severity}
            onClick={() => setSeverityFilter(severityFilter === kpi.severity ? 'todas' : kpi.severity)}
            className={`bg-white rounded-xl border shadow-sm p-4 md:p-5 text-left transition-all hover:shadow-md ${
              severityFilter === kpi.severity
                ? `ring-2 ${kpi.ring} ring-offset-2 border-transparent`
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{kpi.count}</p>
                <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <FilterIcon size={14} />
          Filtros
        </div>

        {/* Data filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="todas">Todos los años</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={provinceFilter}
            onChange={e => handleProvinceChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="todas">Todas las provincias</option>
            {DOMINICAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={municipioFilter}
            onChange={e => setMunicipioFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            disabled={provinceFilter === 'todas'}
          >
            <option value="todas">Todos los municipios</option>
            {availableMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value as 'todas' | 'm' | 'f')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          >
            <option value="todas">Todos los sexos</option>
            <option value="m">Masculino</option>
            <option value="f">Femenino</option>
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Alert type pills */}
        <PillRow
          label="Severidad"
          pills={pillsWithCounts.severity}
          active={severityFilter}
          onChange={v => setSeverityFilter(v as AlertSeverity | 'todas')}
        />

        <PillRow
          label="Categoría"
          pills={pillsWithCounts.category}
          active={categoryFilter}
          onChange={v => setCategoryFilter(v as AlertCategory | 'todas')}
        />
      </div>

      {/* Alert list or empty state */}
      {filteredAlerts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <CheckCircle2 size={48} className="text-green-300 mb-3" />
          <p className="text-base font-medium text-gray-500">Sin alertas</p>
          <p className="text-sm text-gray-400 mt-1">
            {severityFilter !== 'todas' || categoryFilter !== 'todas' || yearFilter !== 'todas' || provinceFilter !== 'todas' || municipioFilter !== 'todas' || sexFilter !== 'todas'
              ? 'No hay alertas que coincidan con los filtros seleccionados.'
              : 'No se detectaron alertas con los datos disponibles.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {severityFilter !== 'todas' || categoryFilter !== 'todas'
                ? `${filteredAlerts.length} de ${totalCount} alertas`
                : `${totalCount} alertas`}
            </p>
          </div>
          {filteredAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onNavigate={navigate} />
          ))}
        </div>
      )}

      {/* Info modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
};

export default Alertas;
