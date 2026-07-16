import React, { useState, useEffect, useRef } from 'react';
import { DOMINICAN_PROVINCES } from '../constants';
import { Filter, ChevronDown, X, Sliders, Eye, EyeOff, Search } from 'lucide-react';

interface FilterBarProps {
    selectedProvince: string;
    selectedStatus: string;
    onProvinceChange: (province: string) => void;
    onStatusChange: (status: string) => void;
    onClearFilters: () => void;
    onOpenAdvancedFilters: () => void;
    availableStatuses: string[];
    filteredCount: number;
    hasActiveFilters: boolean;
    showLabels?: boolean;
    onToggleLabels?: () => void;
    // Nueva búsqueda por texto
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    // Nuevo filtro Centro
    selectedCentro?: string;
    onCentroChange?: (centro: string) => void;
    availableCentros?: string[];
    // Badge de filtros activos
    activeAdvancedFilterCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    selectedProvince,
    selectedStatus,
    onProvinceChange,
    onStatusChange,
    onClearFilters,
    onOpenAdvancedFilters,
    availableStatuses,
    filteredCount,
    hasActiveFilters,
    showLabels = false,
    onToggleLabels,
    searchTerm = '',
    onSearchChange,
    selectedCentro = '',
    onCentroChange,
    availableCentros = [],
    activeAdvancedFilterCount = 0,
}) => {
    const [localSearch, setLocalSearch] = useState(searchTerm);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevSearchTermRef = useRef(searchTerm);

    // Sync local state only when searchTerm changes externally (e.g., clear filters from parent)
    useEffect(() => {
        if (searchTerm !== prevSearchTermRef.current) {
            prevSearchTermRef.current = searchTerm;
            setLocalSearch(searchTerm);
        }
    }, [searchTerm]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearchChange?.(value);
        }, 300);
    };

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

            {/* Search input */}
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar participante..."
                    value={localSearch}
                    onChange={handleSearchChange}
                    className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg w-full text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400"
                />
            </div>

            {/* Centro select */}
            <div className="relative group w-full sm:w-auto">
                <select
                    className={`appearance-none pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:border-gray-400 cursor-pointer w-full sm:min-w-[180px] ${availableCentros.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={selectedCentro}
                    onChange={(e) => onCentroChange?.(e.target.value)}
                    disabled={availableCentros.length === 0}
                >
                    <option value="">{availableCentros.length === 0 ? 'Sin centros' : 'Todos los Centros'}</option>
                    {availableCentros.map(c => <option key={c} value={c}>{c}</option>)}
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

                {/* Botón Filtros Avanzados + Badge */}
                <button
                    onClick={onOpenAdvancedFilters}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                    title="Abrir filtros avanzados"
                >
                    <Sliders size={16} />
                    <span>Avanzado</span>
                    {activeAdvancedFilterCount > 0 && (
                        <span
                            className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full"
                            title={`${activeAdvancedFilterCount} filtro${activeAdvancedFilterCount !== 1 ? 's' : ''} activo${activeAdvancedFilterCount !== 1 ? 's' : ''}`}
                        >
                            {activeAdvancedFilterCount}
                        </span>
                    )}
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
