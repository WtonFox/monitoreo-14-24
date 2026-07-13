import React from 'react';
import { Filter, X, Calendar, MapPin, Users, CalendarRange } from 'lucide-react';

interface MapFiltersProps {
    selectedProvince: string | null;
    selectedMunicipality: string | null;
    selectedGender: string | null;
    selectedAgeRange: string | null;

    // New Props for Years
    selectedYearIngreso: string | null;
    selectedYearInclusion: string | null;

    availableProvinces: string[];
    availableMunicipalities: string[];

    onProvinceChange: (value: string | null) => void;
    onMunicipalityChange: (value: string | null) => void;
    onGenderChange: (value: string | null) => void;
    onAgeRangeChange: (value: string | null) => void;

    // New Handlers for Years
    onYearIngresoChange: (value: string | null) => void;
    onYearInclusionChange: (value: string | null) => void;

    onClearFilters: () => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({
    selectedProvince,
    selectedMunicipality,
    selectedGender,
    selectedAgeRange,
    selectedYearIngreso,
    selectedYearInclusion,
    availableProvinces,
    availableMunicipalities,
    onProvinceChange,
    onMunicipalityChange,
    onGenderChange,
    onAgeRangeChange,
    onYearIngresoChange,
    onYearInclusionChange,
    onClearFilters
}) => {
    const hasFilters = selectedProvince || selectedMunicipality || selectedGender || selectedAgeRange || selectedYearIngreso || selectedYearInclusion;

    // Hardcoded years for now, ideally derived from data min/max
    const years = ['2020', '2021', '2022', '2023', '2024', '2025'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    Filtros del Mapa
                </h3>
                {hasFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                    >
                        <X size={14} /> Limpiar todo
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-4">
                {/* Year Selectors - New */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <CalendarRange size={12} /> Año Ingreso
                        </label>
                        <select
                            value={selectedYearIngreso || ''}
                            onChange={(e) => onYearIngresoChange(e.target.value || null)}
                            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Todos</option>
                            {years.map(y => <option key={`ing-${y}`} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <CalendarRange size={12} /> Año Inclusión
                        </label>
                        <select
                            value={selectedYearInclusion || ''}
                            onChange={(e) => onYearInclusionChange(e.target.value || null)}
                            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Todos</option>
                            {years.map(y => <option key={`inc-${y}`} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-1"></div>

                {/* Province Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <MapPin size={14} /> Provincia
                    </label>
                    <select
                        value={selectedProvince || ''}
                        onChange={(e) => onProvinceChange(e.target.value || null)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Todas las provincias</option>
                        {availableProvinces.sort().map(prov => (
                            <option key={prov} value={prov}>{prov}</option>
                        ))}
                    </select>
                </div>

                {/* Municipality Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 ml-3 border-l-2 border-gray-200 pl-2">
                        └ Municipio
                    </label>
                    <select
                        value={selectedMunicipality || ''}
                        onChange={(e) => onMunicipalityChange(e.target.value || null)}
                        disabled={!selectedProvince}
                        className={`w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all ${!selectedProvince
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                            }`}
                    >
                        <option value="">Todos los municipios</option>
                        {availableMunicipalities.sort().map(mun => (
                            <option key={mun} value={mun}>{mun}</option>
                        ))}
                    </select>
                </div>

                <div className="h-px bg-gray-100 my-1"></div>

                {/* Gender Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <Users size={14} /> Género
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onGenderChange(null)}
                            className={`text-xs py-1.5 px-2 rounded border transition-all ${!selectedGender
                                ? 'bg-gray-800 text-white border-gray-800 font-medium'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => onGenderChange('M')}
                            className={`text-xs py-1.5 px-2 rounded border transition-all ${selectedGender === 'M'
                                ? 'bg-blue-600 text-white border-blue-600 font-medium'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
                                }`}
                        >
                            Masculino
                        </button>
                        <button
                            onClick={() => onGenderChange('F')}
                            className={`text-xs py-1.5 px-2 rounded border transition-all ${selectedGender === 'F'
                                ? 'bg-pink-600 text-white border-pink-600 font-medium'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-pink-50'
                                }`}
                        >
                            Femenino
                        </button>
                    </div>
                </div>

                {/* Age Range Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <Calendar size={14} /> Edad
                    </label>
                    <select
                        value={selectedAgeRange || ''}
                        onChange={(e) => onAgeRangeChange(e.target.value || null)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Todas las edades</option>
                        <option value="14-17">14-17 años</option>
                        <option value="18-24">18-24 años</option>
                        <option value="25-29">25-29 años</option>
                        <option value="30+">30+ años</option>
                    </select>
                </div>
            </div>
        </div>
    );
};
