import React, { useMemo, useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorsBoard } from '../components/IndicatorsBoard';
import { DOMINICAN_PROVINCES, PROVINCE_MUNICIPALITIES } from '../constants';
import { HelpCircle, X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

// ── Info modal content ──

const STATUS_INFO = [
  {
    icon: CheckCircle2,
    label: 'VIABLE',
    color: 'text-green-700',
    bg: 'bg-green-50',
    desc: 'El indicador pudo calcularse correctamente con los datos disponibles y los filtros aplicados. El valor mostrado es representativo y puede usarse para análisis.',
  },
  {
    icon: AlertTriangle,
    label: 'PENDIENTE',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    desc: 'El indicador depende de un campo de datos que no está disponible en la API actual (ej: sector). No puede calcularse hasta que el dato sea incorporado.',
  },
  {
    icon: XCircle,
    label: 'NO VIABLE',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    desc: 'Con la combinación de filtros seleccionada no hay suficientes datos para calcular este indicador. Probá ajustando los filtros (ampliar rango de años, provincia, etc.).',
  },
];

const InfoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Leyenda de indicadores</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Los indicadores se evalúan automáticamente según los datos disponibles y los filtros aplicados.
            Cada estado refleja si el cálculo fue posible y si el resultado es significativo.
          </p>
          {STATUS_INFO.map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={18} className={s.color} />
                <span className={`font-bold text-sm ${s.color}`}>{s.label}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-1">Consejo de uso</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Usá los filtros de año, provincia y municipio para segmentar los indicadores.
              Si un indicador aparece como NO VIABLE, probá ampliando el rango de filtros.
              Los indicadores PENDIENTES dependen de datos que no están disponibles en la API.
            </p>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page component ──

const Indicadores: React.FC = () => {
  const { dashboardData } = useDashboard();
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [provinceFilter, setProvinceFilter] = useState<string>('todos');
  const [municipioFilter, setMunicipioFilter] = useState<string>('todos');
  const [sexFilter, setSexFilter] = useState<string>('todos');
  const [showInfo, setShowInfo] = useState(false);

  const availableYears = useMemo<string[]>(() => {
    const years = new Set<number>();
    dashboardData.forEach(p => {
      if (p.fechaRegistro) {
        const y = new Date(p.fechaRegistro).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [dashboardData]);

  // Municipios dependen de la provincia seleccionada
  const availableMunicipios = useMemo<string[]>(() => {
    if (provinceFilter === 'todos') return [];
    return PROVINCE_MUNICIPALITIES[provinceFilter] || [];
  }, [provinceFilter]);

  // Reset municipio when province changes
  const handleProvinceChange = (prov: string) => {
    setProvinceFilter(prov);
    setMunicipioFilter('todos');
  };

  const filteredData = useMemo(() => {
    let data = dashboardData;
    if (yearFilter !== 'todos') {
      data = data.filter(p =>
        p.fechaRegistro && new Date(p.fechaRegistro).getFullYear().toString() === yearFilter
      );
    }
    if (provinceFilter !== 'todos') {
      data = data.filter(p => p.provincia === provinceFilter);
    }
    if (municipioFilter !== 'todos') {
      data = data.filter(p => p.municipio === municipioFilter);
    }
    if (sexFilter !== 'todos') {
      data = data.filter(p => p.sexo?.toLowerCase() === sexFilter);
    }
    return data;
  }, [dashboardData, yearFilter, provinceFilter, municipioFilter, sexFilter]);

  const { groups, lastUpdated } = useIndicators(filteredData);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Indicadores del Programa</h1>
          <button
            onClick={() => setShowInfo(true)}
            className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="¿Cómo leer los indicadores?"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <span className="text-xs text-gray-400">
          Actualizado: {lastUpdated.toLocaleString()}
        </span>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Año:</label>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Provincia:</label>
          <select value={provinceFilter} onChange={e => handleProvinceChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todas</option>
            {DOMINICAN_PROVINCES.map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Municipio:</label>
          <select value={municipioFilter} onChange={e => setMunicipioFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
            disabled={provinceFilter === 'todos'}
          >
            <option value="todos">Todos</option>
            {availableMunicipios.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Sexo:</label>
          <select value={sexFilter} onChange={e => setSexFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            <option value="femenino">Femenino</option>
            <option value="masculino">Masculino</option>
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>No hay datos para los filtros seleccionados.</p>
        </div>
      ) : (
        <IndicatorsBoard groups={groups} data={filteredData} />
      )}

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
};

export default Indicadores;
