import { useState, useMemo, useEffect } from 'react';
import { Participant, AdvancedFilterState } from '../types';
import { PROVINCE_MUNICIPALITIES } from '../constants';

interface UseFiltersResult {
    selectedProvince: string;
    selectedStatus: string;
    selectedMunicipio: string;
    advancedFilters: AdvancedFilterState;
    setSelectedProvince: (province: string) => void;
    setSelectedStatus: (status: string) => void;
    setSelectedMunicipio: (municipio: string) => void;
    setAdvancedFilters: (filters: AdvancedFilterState) => void;
    clearAllFilters: () => void;
    availableStatuses: string[];
    availableYears: { ingreso: string[]; inclusion: string[] };
    availableEstadoCivil: string[];
    availableNivelEstudio: string[];
    availableMunicipios: string[];
    availableMunicipiosForProvince: string[];
    filteredData: Participant[];
    hasActiveFilters: boolean;
}

/**
 * Hook para gestionar filtros básicos y avanzados
 */
export const useFilters = (data: Participant[]): UseFiltersResult => {
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
        yearIngreso: '',
        yearInclusion: '',
        municipio: '',
        ageGroup: '',
        sexo: '',
        estadoCivil: '',
        nivelEstudio: ''
    });

    // Clear municipio when province changes
    useEffect(() => {
        setSelectedMunicipio('');
    }, [selectedProvince]);

    // Get available municipalities for selected province
    const availableMunicipiosForProvince = useMemo(() => {
        if (!selectedProvince) return [];
        return PROVINCE_MUNICIPALITIES[selectedProvince] || [];
    }, [selectedProvince]);

    // Calcular estados disponibles
    const availableStatuses = useMemo(() => {
        const statuses = new Set<string>();
        data.forEach(p => {
            if (p.estado) statuses.add(p.estado);
        });
        return Array.from(statuses).sort();
    }, [data]);

    // Calcular años disponibles
    const availableYears = useMemo(() => {
        const ingresoYears = new Set<string>();
        const inclusionYears = new Set<string>();

        data.forEach(p => {
            if (p.fechaRegistro) {
                const year = new Date(p.fechaRegistro).getFullYear().toString();
                if (year !== 'NaN') ingresoYears.add(year);
            }
            if (p.fechaInclusion) {
                const year = new Date(p.fechaInclusion).getFullYear().toString();
                if (year !== 'NaN') inclusionYears.add(year);
            }
        });

        return {
            ingreso: Array.from(ingresoYears).sort().reverse(),
            inclusion: Array.from(inclusionYears).sort().reverse()
        };
    }, [data]);

    // Calcular municipios disponibles
    const availableMunicipios = useMemo(() => {
        const municipios = new Set<string>();
        data.forEach(p => {
            if (p.municipio) municipios.add(p.municipio);
        });
        return Array.from(municipios).sort();
    }, [data]);

    // Calcular estados civiles disponibles
    const availableEstadoCivil = useMemo(() => {
        const values = new Set<string>();
        data.forEach(p => {
            if (p.estadoCivil && p.estadoCivil !== 'N/D' && p.estadoCivil !== 'Ninguna') values.add(p.estadoCivil);
        });
        return Array.from(values).sort();
    }, [data]);

    // Calcular niveles de estudio disponibles
    const availableNivelEstudio = useMemo(() => {
        const values = new Set<string>();
        data.forEach(p => {
            if (p.nivelEstudio && p.nivelEstudio !== 'N/D' && p.nivelEstudio !== 'Ninguna') values.add(p.nivelEstudio);
        });
        return Array.from(values).sort();
    }, [data]);

    // Calcular datos filtrados
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Filtros básicos
            const matchProv = selectedProvince ? item.provincia === selectedProvince : true;
            const matchStatus = selectedStatus ? item.estado === selectedStatus : true;
            const matchMunicipioBasic = selectedMunicipio ? item.municipio === selectedMunicipio : true;

            // Filtros avanzados
            const matchYearIngreso = advancedFilters.yearIngreso
                ? item.fechaRegistro && new Date(item.fechaRegistro).getFullYear().toString() === advancedFilters.yearIngreso
                : true;

            const matchYearInclusion = advancedFilters.yearInclusion
                ? (item.fechaInclusion && new Date(item.fechaInclusion).getFullYear().toString() === advancedFilters.yearInclusion)
                : true;

            const matchMunicipio = advancedFilters.municipio
                ? item.municipio === advancedFilters.municipio
                : true;

            const matchAgeGroup = advancedFilters.ageGroup
                ? (() => {
                    const age = item.edad;
                    switch (advancedFilters.ageGroup) {
                        case '14-17': return age >= 14 && age <= 17;
                        case '18-20': return age >= 18 && age <= 20;
                        case '21-24': return age >= 21 && age <= 24;
                        default: return true;
                    }
                })()
                : true;

            const matchSexo = advancedFilters.sexo
                ? item.sexo === advancedFilters.sexo
                : true;

            const matchEstadoCivil = advancedFilters.estadoCivil
                ? item.estadoCivil === advancedFilters.estadoCivil
                : true;

            const matchNivelEstudio = advancedFilters.nivelEstudio
                ? item.nivelEstudio === advancedFilters.nivelEstudio
                : true;

            return matchProv && matchStatus && matchMunicipioBasic && matchYearIngreso && matchYearInclusion && matchMunicipio && matchAgeGroup && matchSexo && matchEstadoCivil && matchNivelEstudio;
        });
    }, [data, selectedProvince, selectedStatus, selectedMunicipio, advancedFilters]);

    // Verificar si hay filtros activos
    const hasActiveFilters = useMemo(() => {
        return selectedProvince !== '' ||
            selectedStatus !== '' ||
            selectedMunicipio !== '' ||
            Object.values(advancedFilters).some(v => v !== '');
    }, [selectedProvince, selectedStatus, selectedMunicipio, advancedFilters]);

    // Limpiar todos los filtros
    const clearAllFilters = () => {
        setSelectedProvince('');
        setSelectedStatus('');
        setSelectedMunicipio('');
        setAdvancedFilters({
            yearIngreso: '',
            yearInclusion: '',
            municipio: '',
            ageGroup: '',
            sexo: '',
            estadoCivil: '',
            nivelEstudio: ''
        });
    };

    return {
        selectedProvince,
        selectedStatus,
        selectedMunicipio,
        advancedFilters,
        setSelectedProvince,
        setSelectedStatus,
        setSelectedMunicipio,
        setAdvancedFilters,
        clearAllFilters,
        availableStatuses,
        availableYears,
        availableEstadoCivil,
        availableNivelEstudio,
        availableMunicipios,
        availableMunicipiosForProvince,
        filteredData,
        hasActiveFilters
    };
};
