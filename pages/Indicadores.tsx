import React, { useState, useEffect } from 'react';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorsBoard } from '../components/IndicatorsBoard';
import { IndicadoresFilterBar } from '../components/IndicadoresFilterBar';
import { useIndicadoresFilters } from '../contexts/IndicadoresFiltersContext';
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
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
  const filters = useIndicadoresFilters();
  const [showInfo, setShowInfo] = useState(false);

  const { groups, lastUpdated } = useIndicators(filters.filteredData);

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

      <IndicadoresFilterBar />

      {filters.filteredData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>No hay datos para los filtros seleccionados.</p>
        </div>
      ) : (
        <IndicatorsBoard groups={groups} />
      )}

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
};

export default Indicadores;
