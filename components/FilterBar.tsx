import React from 'react';
import { DOMINICAN_PROVINCES } from '../constants';
import { Filter, ChevronDown, X, Sliders, Eye, EyeOff } from 'lucide-react';

interface FilterBarProps {
    selectedProvince: string;
    selectedStatus: string;
    selectedMunicipio: string;
    onProvinceChange: (province: string) => void;
    onStatusChange: (status: string) => void;
    onMunicipioChange: (municipio: string) => void;
    onClearFilters: () => void;
    onOpenAdvancedFilters: () => void;
    availableStatuses: string[];
    availableMunicipiosForProvince: string[];
    filteredCount: number;
    hasActiveFilters: boolean;
    showLabels?: boolean;
    onToggleLabels?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    selectedProvince,
    selectedStatus,
    selectedMunicipio,
    onProvinceChange,
    onStatusChange,
    onMunicipioChange,
    onClearFilters,
    onOpenAdvancedFilters,
    availableStatuses,
    availableMunicipiosForProvince,
    filteredCount,
    hasActiveFilters,
    showLabels = false,
    onToggleLabels,
}) => {
    return (
        <div className="px-4 py-3 md:px-6 bg-white border-t border-gray-200 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mr-2 mb-1 sm:mb-0">
                <Filter size={16} /> <span className="inline">Filtros:</span>
            </div>

            <div className="relative group w-full sm:w-auto">
                <select
                    className="appearance-none pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400 cursor-pointer w-full sm:min-w-[180px]"
                    value={selectedProvince}
                    onChange={(e) => onProvinceChange(e.target.value)}
                >
                    <option value="">Todas las Provincias</option>
                    {DOMINICAN_PROVINCES.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none group-hover:text-gray-800" size={16} />
            </div>

            <div className="relative group w-full sm:w-auto">
                <select
                    className="appearance-none pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400 cursor-pointer w-full sm:min-w-[180px]"
                    value={selectedStatus}
                    onChange={(e) => onStatusChange(e.target.value)}
                >
                    <option value="">Todos los Estados</option>
                    {availableStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none group-hover:text-gray-800" size={16} />
            </div>

            <div className="relative group w-full sm:w-auto">
                <select
                    className={`appearance-none pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400 cursor-pointer w-full sm:min-w-[180px] ${!selectedProvince ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={selectedMunicipio}
                    onChange={(e) => onMunicipioChange(e.target.value)}
                    disabled={!selectedProvince}
                >
                    <option value="">Todos los Municipios</option>
                    {availableMunicipiosForProvince.map(mun => <option key={mun} value={mun}>{mun}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none group-hover:text-gray-800" size={16} />
            </div>

            {/* Action Buttons Container */}
            <div className="flex flex-row gap-2 mt-1 sm:mt-0 w-full sm:w-auto">
                {/* Botón Borrar Filtros */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-red-200"
                        title="Borrar todos los filtros"
                    >
                        <X size={16} />
                        <span>Borrar</span>
                    </button>
                )}

                {/* Botón Filtros Avanzados */}
                <button
                    onClick={onOpenAdvancedFilters}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                    title="Abrir filtros avanzados"
                >
                    <Sliders size={16} />
                    <span>Avanzado</span>
                </button>
            </div>

            <div className="w-full sm:flex-1 text-center sm:text-right text-xs text-gray-400 mt-1 sm:mt-0">
                <button
                    onClick={onToggleLabels}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all mr-3 ${showLabels ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
                    title={showLabels ? 'Ocultar etiquetas en gráficas' : 'Mostrar etiquetas en gráficas'}
                >
                    {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                    {showLabels ? 'Ocultar Etiquetas' : 'Mostrar Etiquetas'}
                </button>
                Registros en Vista: {filteredCount.toLocaleString()}
            </div>
        </div>
    );
};
