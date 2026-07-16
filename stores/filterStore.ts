import { create } from 'zustand';
import type { Participant, AdvancedFilterState } from '../types';
import { PROVINCE_MUNICIPALITIES } from '../constants';
import { filterData, type FilterWorkerFilters } from '../workers/filterWorker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeAvailableStatuses(data: Participant[]): string[] {
    const statuses = new Set<string>();
    data.forEach(p => { if (p.estado) statuses.add(p.estado); });
    return Array.from(statuses).sort();
}

function computeAvailableYears(data: Participant[]): { ingreso: string[]; inclusion: string[] } {
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
}

function computeAvailableMunicipios(data: Participant[]): string[] {
    const municipios = new Set<string>();
    data.forEach(p => { if (p.municipio) municipios.add(p.municipio); });
    return Array.from(municipios).sort();
}

function computeAvailableEstadoCivil(data: Participant[]): string[] {
    const values = new Set<string>();
    data.forEach(p => {
        if (p.estadoCivil && p.estadoCivil !== 'N/D' && p.estadoCivil !== 'Ninguna')
            values.add(p.estadoCivil);
    });
    return Array.from(values).sort();
}

function computeAvailableNivelEstudio(data: Participant[]): string[] {
    const values = new Set<string>();
    data.forEach(p => {
        if (p.nivelEstudio && p.nivelEstudio !== 'N/D' && p.nivelEstudio !== 'Ninguna')
            values.add(p.nivelEstudio);
    });
    return Array.from(values).sort();
}

function computeFilteredData(
    data: Participant[],
    selectedProvince: string,
    selectedStatus: string,
    selectedMunicipio: string,
    advancedFilters: AdvancedFilterState
): Participant[] {
    return data.filter(item => {
        const matchProv = selectedProvince ? item.provincia === selectedProvince : true;
        const matchStatus = selectedStatus ? item.estado === selectedStatus : true;
        const matchMunicipioBasic = selectedMunicipio ? item.municipio === selectedMunicipio : true;

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
                    case '25-29': return age >= 25 && age <= 29;
                    case '30+': return age >= 30;
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

        return matchProv && matchStatus && matchMunicipioBasic &&
            matchYearIngreso && matchYearInclusion && matchMunicipio &&
            matchAgeGroup && matchSexo && matchEstadoCivil && matchNivelEstudio;
    });
}

function computeAvailableMunicipiosForProvince(province: string): string[] {
    if (!province) return [];
    return PROVINCE_MUNICIPALITIES[province] || [];
}

function hasActiveFilters(
    selectedProvince: string,
    selectedStatus: string,
    selectedMunicipio: string,
    advancedFilters: AdvancedFilterState
): boolean {
    return selectedProvince !== '' ||
        selectedStatus !== '' ||
        selectedMunicipio !== '' ||
        Object.values(advancedFilters).some(v => v !== '');
}

// ---------------------------------------------------------------------------
// Async worker utility (optional opt-in path)
// ---------------------------------------------------------------------------

async function computeWithWorker(
    data: Participant[],
    province: string,
    status: string,
    municipio: string,
    advanced: AdvancedFilterState
): Promise<Participant[]> {
    if (typeof Worker === 'undefined') {
        return computeFilteredData(data, province, status, municipio, advanced);
    }
    try {
        const worker = new Worker(
            new URL('../workers/filterWorker.ts', import.meta.url),
            { type: 'module' }
        );
        return await new Promise<Participant[]>((resolve, reject) => {
            worker.onmessage = (e) => {
                const msg = e.data;
                worker.terminate();
                if (msg.error) reject(new Error(msg.error));
                else resolve(msg.filtered as Participant[]);
            };
            worker.onerror = () => { worker.terminate(); reject(new Error('Worker error')); };
            setTimeout(() => { worker.terminate(); reject(new Error('Worker timeout')); }, 5000);
            const filters: FilterWorkerFilters = {
                provincia: province || undefined,
                estado: status || undefined,
                municipio: municipio || undefined,
                yearIngreso: advanced.yearIngreso || undefined,
                yearInclusion: advanced.yearInclusion || undefined,
                ageGroup: advanced.ageGroup || undefined,
                sexo: advanced.sexo || undefined,
                estadoCivil: advanced.estadoCivil || undefined,
                nivelEstudio: advanced.nivelEstudio || undefined,
            };
            worker.postMessage({ data, filters });
        });
    } catch {
        return computeFilteredData(data, province, status, municipio, advanced);
    }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const DEFAULT_ADVANCED_FILTERS: AdvancedFilterState = {
    yearIngreso: '',
    yearInclusion: '',
    municipio: '',
    ageGroup: '',
    sexo: '',
    estadoCivil: '',
    nivelEstudio: ''
};

interface FilterState {
    selectedProvince: string;
    selectedStatus: string;
    selectedMunicipio: string;
    advancedFilters: AdvancedFilterState;
    dashboardData: Participant[];

    // Derived (recomputed on state changes)
    availableStatuses: string[];
    availableYears: { ingreso: string[]; inclusion: string[] };
    availableEstadoCivil: string[];
    availableNivelEstudio: string[];
    availableMunicipios: string[];
    availableMunicipiosForProvince: string[];
    filteredData: Participant[];
    hasActiveFilters: boolean;

    // Actions
    setSelectedProvince: (province: string) => void;
    setSelectedStatus: (status: string) => void;
    setSelectedMunicipio: (municipio: string) => void;
    setAdvancedFilters: (filters: AdvancedFilterState) => void;
    clearAllFilters: () => void;
    setData: (data: Participant[]) => void;
    setDataViaWorker: (data: Participant[]) => Promise<void>;
}

function recompute(state: FilterState): Partial<FilterState> {
    const { dashboardData, selectedProvince, selectedStatus, selectedMunicipio, advancedFilters } = state;
    return {
        availableStatuses: computeAvailableStatuses(dashboardData),
        availableYears: computeAvailableYears(dashboardData),
        availableEstadoCivil: computeAvailableEstadoCivil(dashboardData),
        availableNivelEstudio: computeAvailableNivelEstudio(dashboardData),
        availableMunicipios: computeAvailableMunicipios(dashboardData),
        availableMunicipiosForProvince: computeAvailableMunicipiosForProvince(selectedProvince),
        filteredData: computeFilteredData(dashboardData, selectedProvince, selectedStatus, selectedMunicipio, advancedFilters),
        hasActiveFilters: hasActiveFilters(selectedProvince, selectedStatus, selectedMunicipio, advancedFilters),
    };
}

export const useFilterStore = create<FilterState>((set, get) => ({
    selectedProvince: '',
    selectedStatus: '',
    selectedMunicipio: '',
    advancedFilters: { ...DEFAULT_ADVANCED_FILTERS },
    dashboardData: [],

    availableStatuses: [],
    availableYears: { ingreso: [], inclusion: [] },
    availableEstadoCivil: [],
    availableNivelEstudio: [],
    availableMunicipios: [],
    availableMunicipiosForProvince: [],
    filteredData: [],
    hasActiveFilters: false,

    setSelectedProvince: (province) => {
        set(state => {
            const next = { ...state, selectedProvince: province, selectedMunicipio: '' };
            return { ...next, ...recompute(next) };
        });
    },

    setSelectedStatus: (status) => {
        set(state => {
            const next = { ...state, selectedStatus: status };
            return { ...next, ...recompute(next) };
        });
    },

    setSelectedMunicipio: (municipio) => {
        set(state => {
            const next = { ...state, selectedMunicipio: municipio };
            return { ...next, ...recompute(next) };
        });
    },

    setAdvancedFilters: (filters) => {
        set(state => {
            const next = { ...state, advancedFilters: filters };
            return { ...next, ...recompute(next) };
        });
    },

    clearAllFilters: () => {
        set(state => {
            const next = {
                ...state,
                selectedProvince: '',
                selectedStatus: '',
                selectedMunicipio: '',
                advancedFilters: { ...DEFAULT_ADVANCED_FILTERS },
            };
            return { ...next, ...recompute(next) };
        });
    },

    setData: (data) => {
        set(state => {
            const next = { ...state, dashboardData: data };
            return { ...next, ...recompute(next) };
        });
    },

    setDataViaWorker: async (data) => {
        const state = get();
        const filtered = await computeWithWorker(
            data, state.selectedProvince, state.selectedStatus,
            state.selectedMunicipio, state.advancedFilters
        );
        set(state => {
            const next = { ...state, dashboardData: data };
            return {
                ...next,
                filteredData: filtered,
                // Other derived fields still computed synchronously
                availableStatuses: computeAvailableStatuses(data),
                availableYears: computeAvailableYears(data),
                availableEstadoCivil: computeAvailableEstadoCivil(data),
                availableNivelEstudio: computeAvailableNivelEstudio(data),
                availableMunicipios: computeAvailableMunicipios(data),
                availableMunicipiosForProvince: computeAvailableMunicipiosForProvince(next.selectedProvince),
                hasActiveFilters: hasActiveFilters(next.selectedProvince, next.selectedStatus, next.selectedMunicipio, next.advancedFilters),
            };
        });
    },
}));
