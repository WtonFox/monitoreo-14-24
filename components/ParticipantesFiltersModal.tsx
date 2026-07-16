import React, { useEffect, useRef } from 'react';
import { X, Filter, Trash2, Sliders } from 'lucide-react';
import { AGE_GROUPS } from '../constants';

export interface ParticipantesFiltersState {
  filterProvincia: string;
  filterMunicipio: string;
  filterCentro: string;
  filterSexo: string;
  filterEstado: string;
  filterAnioIngreso: string;
  filterAnioInclusion: string;
  filterAgeGroup: string;
  filterEstadoCivil: string;
  filterNivelEstudio: string;
}

interface ParticipantesFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ParticipantesFiltersState;
  onFiltersChange: (filters: ParticipantesFiltersState) => void;
  availableProvincias: string[];
  availableMunicipios: string[];
  availableCentros: string[];
  availableEstados: string[];
  availableAniosIngreso: string[];
  availableAniosInclusion: string[];
  availableEstadoCivil: string[];
  availableNivelEstudio: string[];
}

export const ParticipantesFiltersModal: React.FC<ParticipantesFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableProvincias,
  availableMunicipios,
  availableCentros,
  availableEstados,
  availableAniosIngreso,
  availableAniosInclusion,
  availableEstadoCivil = [],
  availableNivelEstudio = [],
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (key: keyof ParticipantesFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearAll = () => {
    onFiltersChange({
      filterProvincia: 'todas',
      filterMunicipio: 'todos',
      filterCentro: 'todos',
      filterSexo: 'todos',
      filterEstado: '',
      filterAnioIngreso: '',
      filterAnioInclusion: '',
      filterAgeGroup: '',
      filterEstadoCivil: '',
      filterNivelEstudio: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'todas' && v !== 'todos');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filtros Avanzados"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Filtros Avanzados</h2>
              <p className="text-xs text-blue-100">Personaliza la búsqueda de participantes</p>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Provincia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Provincia
              </label>
              <select
                value={filters.filterProvincia}
                onChange={(e) => handleChange('filterProvincia', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="todas">Todas las provincias</option>
                {availableProvincias.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Municipio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏘️ Municipio
              </label>
              <select
                value={filters.filterMunicipio}
                onChange={(e) => handleChange('filterMunicipio', e.target.value)}
                disabled={filters.filterProvincia === 'todas'}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="todos">Todos los municipios</option>
                {availableMunicipios.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Centro */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏛️ Centro
              </label>
              <select
                value={filters.filterCentro}
                onChange={(e) => handleChange('filterCentro', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="todos">Todos los centros</option>
                {availableCentros.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sexo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚧️ Sexo
              </label>
              <select
                value={filters.filterSexo}
                onChange={(e) => handleChange('filterSexo', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="todos">Todos</option>
                <option value="f">Femenino</option>
                <option value="m">Masculino</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📌 Estado
              </label>
              <select
                value={filters.filterEstado}
                onChange={(e) => handleChange('filterEstado', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos los estados</option>
                {availableEstados.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            {/* Año de Ingreso */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Año de Ingreso
              </label>
              <select
                value={filters.filterAnioIngreso}
                onChange={(e) => handleChange('filterAnioIngreso', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos los años</option>
                {availableAniosIngreso.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Año de Inclusión */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📋 Año de Inclusión
              </label>
              <select
                value={filters.filterAnioInclusion}
                onChange={(e) => handleChange('filterAnioInclusion', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos los años</option>
                {availableAniosInclusion.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Grupo de Edad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👥 Grupo de Edad
              </label>
              <select
                value={filters.filterAgeGroup}
                onChange={(e) => handleChange('filterAgeGroup', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos</option>
                {AGE_GROUPS.filter(g => g.value).map(group => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </div>

            {/* Estado Civil */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💍 Estado Civil
              </label>
              <select
                value={filters.filterEstadoCivil}
                onChange={(e) => handleChange('filterEstadoCivil', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos</option>
                {availableEstadoCivil.map(ec => (
                  <option key={ec} value={ec}>{ec}</option>
                ))}
              </select>
            </div>

            {/* Nivel Estudio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📚 Nivel de Estudio
              </label>
              <select
                value={filters.filterNivelEstudio}
                onChange={(e) => handleChange('filterNivelEstudio', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Todos</option>
                {availableNivelEstudio.map(ne => (
                  <option key={ne} value={ne}>{ne}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Info Banner */}
          {hasActiveFilters && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <Filter size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium">Filtros activos aplicados</p>
                <p className="text-xs text-blue-700 mt-1">
                  Los datos se están filtrando según los criterios seleccionados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
          <button
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Trash2 size={16} />
            Limpiar Todos
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors text-sm"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
