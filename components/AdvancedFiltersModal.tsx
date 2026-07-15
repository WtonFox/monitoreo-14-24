import React, { useEffect, useRef } from 'react';
import { X, Filter, Trash2 } from 'lucide-react';
import { AdvancedFilterState, AGE_GROUPS } from '../types';

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: AdvancedFilterState;
    onFiltersChange: (filters: AdvancedFilterState) => void;
    availableYears: { ingreso: string[]; inclusion: string[] };
    availableMunicipios: string[];
    availableEstadoCivil?: string[];
    availableNivelEstudio?: string[];
}

export const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    availableYears,
    availableMunicipios,
    availableEstadoCivil = [],
    availableNivelEstudio = []
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

    const handleFilterChange = (key: keyof AdvancedFilterState, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const handleClearAll = () => {
        onFiltersChange({
            yearIngreso: '',
            yearInclusion: '',
            municipio: '',
            ageGroup: '',
            sexo: '',
            estadoCivil: '',
            nivelEstudio: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

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
                            <Filter size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Filtros Avanzados</h2>
                            <p className="text-xs text-blue-100">Personaliza tu búsqueda de datos</p>
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

                        {/* Año de Ingreso */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                📅 Año de Ingreso
                            </label>
                            <select
                                value={filters.yearIngreso}
                                onChange={(e) => handleFilterChange('yearIngreso', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Todos los años</option>
                                {availableYears.ingreso.map(year => (
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
                                value={filters.yearInclusion}
                                onChange={(e) => handleFilterChange('yearInclusion', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Todos los años</option>
                                {availableYears.inclusion.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Municipio */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                🏘️ Municipio
                            </label>
                            <select
                                value={filters.municipio}
                                onChange={(e) => handleFilterChange('municipio', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Todos los municipios</option>
                                {availableMunicipios.map(mun => (
                                    <option key={mun} value={mun}>{mun}</option>
                                ))}
                            </select>
                        </div>

                        {/* Grupo de Edad */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                👥 Grupo de Edad
                            </label>
                            <select
                                value={filters.ageGroup}
                                onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                {AGE_GROUPS.map(group => (
                                    <option key={group.value} value={group.value}>{group.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sexo */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ⚧️ Sexo
                            </label>
                            <select
                                value={filters.sexo}
                                onChange={(e) => handleFilterChange('sexo', e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="">Todos</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>

                        {/* Estado Civil */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                💍 Estado Civil
                            </label>
                            <select
                                value={filters.estadoCivil}
                                onChange={(e) => handleFilterChange('estadoCivil', e.target.value)}
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
                                value={filters.nivelEstudio}
                                onChange={(e) => handleFilterChange('nivelEstudio', e.target.value)}
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
                                    Los datos del dashboard se están filtrando según los criterios seleccionados.
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
