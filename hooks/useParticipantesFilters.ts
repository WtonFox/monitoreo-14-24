import { useState, useMemo, useEffect } from 'react';
import { Participant } from '../types';
import { PROVINCE_MUNICIPALITIES, AGE_GROUPS } from '../constants';
import { useFilterWorker } from './useFilterWorker';

export interface UseParticipantesFiltersResult {
  searchTerm: string;
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
  setSearchTerm: (v: string) => void;
  setFilterProvincia: (v: string) => void;
  setFilterMunicipio: (v: string) => void;
  setFilterCentro: (v: string) => void;
  setFilterSexo: (v: string) => void;
  setFilterEstado: (v: string) => void;
  setFilterAnioIngreso: (v: string) => void;
  setFilterAnioInclusion: (v: string) => void;
  setFilterAgeGroup: (v: string) => void;
  setFilterEstadoCivil: (v: string) => void;
  setFilterNivelEstudio: (v: string) => void;
  availableProvincias: string[];
  availableMunicipios: string[];
  availableCentros: string[];
  availableEstados: string[];
  availableAniosIngreso: string[];
  availableAniosInclusion: string[];
  availableEstadoCivil: string[];
  availableNivelEstudio: string[];
  filteredData: Participant[];
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  setSortColumn: (col: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  clearAll: () => void;
  clearFilter: (key: string) => void;
}

/**
 * Hook para gestionar todos los filtros de la página de Participantes.
 * Recibe dashboardData como parámetro (NO usa useDashboard internamente)
 * para mantener testabilidad y consistencia con useFilters(data).
 */
const STORAGE_KEY = 'participantes_filters_v1';

function loadInitialState(): Record<string, unknown> {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return {};
}

export const useParticipantesFilters = (data: Participant[]): UseParticipantesFiltersResult => {
  const initial = loadInitialState();

  const [searchTerm, setSearchTerm] = useState((initial.searchTerm as string) ?? '');
  const [filterProvincia, setFilterProvincia] = useState((initial.filterProvincia as string) ?? 'todas');
  const [filterMunicipio, setFilterMunicipio] = useState((initial.filterMunicipio as string) ?? 'todos');
  const [filterCentro, setFilterCentro] = useState((initial.filterCentro as string) ?? 'todos');
  const [filterSexo, setFilterSexo] = useState((initial.filterSexo as string) ?? 'todos');
  const [filterEstado, setFilterEstado] = useState((initial.filterEstado as string) ?? '');
  const [filterAnioIngreso, setFilterAnioIngreso] = useState((initial.filterAnioIngreso as string) ?? '');
  const [filterAnioInclusion, setFilterAnioInclusion] = useState((initial.filterAnioInclusion as string) ?? '');
  const [filterAgeGroup, setFilterAgeGroup] = useState((initial.filterAgeGroup as string) ?? '');
  const [filterEstadoCivil, setFilterEstadoCivil] = useState((initial.filterEstadoCivil as string) ?? '');
  const [filterNivelEstudio, setFilterNivelEstudio] = useState((initial.filterNivelEstudio as string) ?? '');

  const [sortColumn, setSortColumn] = useState((initial.sortColumn as string) ?? '');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>((initial.sortDirection as 'asc' | 'desc') ?? 'asc');

  // Al cambiar provincia, resetear municipio y centro
  useEffect(() => {
    setFilterMunicipio('todos');
    setFilterCentro('todos');
  }, [filterProvincia]);

  // Persistir filtros en sessionStorage
  useEffect(() => {
    const state = {
      searchTerm, filterProvincia, filterMunicipio, filterCentro, filterSexo,
      filterEstado, filterAnioIngreso, filterAnioInclusion, filterAgeGroup,
      filterEstadoCivil, filterNivelEstudio, sortColumn, sortDirection,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage puede llenarse, ignorar silenciosamente
    }
  }, [
    searchTerm, filterProvincia, filterMunicipio, filterCentro, filterSexo,
    filterEstado, filterAnioIngreso, filterAnioInclusion, filterAgeGroup,
    filterEstadoCivil, filterNivelEstudio, sortColumn, sortDirection,
  ]);

  // --- Available lists ---

  const availableProvincias = useMemo(() => {
    const provincias = new Set<string>();
    data.forEach(p => {
      if (p.provincia) provincias.add(p.provincia);
    });
    return Array.from(provincias).sort();
  }, [data]);

  // Municipios desde datos primero, fallback al mapa estático
  // para cubrir provincias cuyo nombre no coincida exactamente con PROVINCE_MUNICIPALITIES
  const municipiosByProvincia = useMemo(() => {
    const map: Record<string, string[]> = {};
    data.forEach(p => {
      if (!p.municipio || !p.provincia) return;
      if (!map[p.provincia]) map[p.provincia] = [];
      if (!map[p.provincia].includes(p.municipio)) map[p.provincia].push(p.municipio);
    });
    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }, [data]);

  const availableMunicipios = useMemo(() => {
    if (!filterProvincia || filterProvincia === 'todas') return [];
    // Primero intentar desde los datos (match exacto con el nombre de provincia del dataset)
    const fromData = municipiosByProvincia[filterProvincia];
    if (fromData && fromData.length > 0) return fromData;
    // Fallback al mapa estático por si el nombre coincide con PROVINCE_MUNICIPALITIES
    return PROVINCE_MUNICIPALITIES[filterProvincia] || [];
  }, [filterProvincia, municipiosByProvincia]);

  const centrosByProvincia = useMemo(() => {
    const map: Record<string, string[]> = {};
    data.forEach(p => {
      if (!p.centro || !p.provincia) return;
      if (!map[p.provincia]) map[p.provincia] = [];
      if (!map[p.provincia].includes(p.centro)) map[p.provincia].push(p.centro);
    });
    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }, [data]);

  const availableCentros = useMemo(() => {
    if (!filterProvincia || filterProvincia === 'todas') {
      const all = new Set<string>();
      data.forEach(p => {
        if (p.centro) all.add(p.centro);
      });
      return Array.from(all).sort();
    }
    return centrosByProvincia[filterProvincia] || [];
  }, [filterProvincia, centrosByProvincia, data]);

  const availableEstados = useMemo(() => {
    const estados = new Set<string>();
    data.forEach(p => {
      if (p.estado) estados.add(p.estado);
    });
    return Array.from(estados).sort();
  }, [data]);

  const availableAniosIngreso = useMemo(() => {
    const years = new Set<string>();
    data.forEach(p => {
      if (p.fechaRegistro) {
        const year = new Date(p.fechaRegistro).getFullYear().toString();
        if (year !== 'NaN') years.add(year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [data]);

  const availableAniosInclusion = useMemo(() => {
    const years = new Set<string>();
    data.forEach(p => {
      if (p.fechaInclusion) {
        const year = new Date(p.fechaInclusion).getFullYear().toString();
        if (year !== 'NaN') years.add(year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [data]);

  const availableEstadoCivil = useMemo(() => {
    const values = new Set<string>();
    data.forEach(p => {
      if (p.estadoCivil && p.estadoCivil !== 'N/D' && p.estadoCivil !== 'Ninguna') {
        values.add(p.estadoCivil);
      }
    });
    return Array.from(values).sort();
  }, [data]);

  const availableNivelEstudio = useMemo(() => {
    const values = new Set<string>();
    data.forEach(p => {
      if (p.nivelEstudio && p.nivelEstudio !== 'N/D' && p.nivelEstudio !== 'Ninguna') {
        values.add(p.nivelEstudio);
      }
    });
    return Array.from(values).sort();
  }, [data]);

  // --- Filtered data: offloaded to Web Worker, sort stays on main thread ---

  const { filteredData: unsortedFiltered } = useFilterWorker(data, {
    search: searchTerm,
    provincia: filterProvincia,
    municipio: filterMunicipio,
    centro: filterCentro,
    sexo: filterSexo,
    estado: filterEstado,
    yearIngreso: filterAnioIngreso,
    yearInclusion: filterAnioInclusion,
    ageGroup: filterAgeGroup,
    estadoCivil: filterEstadoCivil,
    nivelEstudio: filterNivelEstudio,
  });

  // Sort on main thread (trivial cost, no benefit from offloading)
  const filteredData = useMemo(() => {
    if (!sortColumn) return unsortedFiltered;
    return [...unsortedFiltered].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (sortColumn === 'fullName') {
        aVal = String(a.apellidos ?? '');
        bVal = String(b.apellidos ?? '');
      } else {
        aVal = String(a[sortColumn as keyof Participant] ?? '');
        bVal = String(b[sortColumn as keyof Participant] ?? '');
      }

      const cmp = aVal.localeCompare(bVal, 'es', { numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [unsortedFiltered, sortColumn, sortDirection]);

  // --- Derived state ---

  const hasActiveFilters =
    searchTerm !== '' ||
    filterProvincia !== 'todas' ||
    filterMunicipio !== 'todos' ||
    filterCentro !== 'todos' ||
    filterSexo !== 'todos' ||
    filterEstado !== '' ||
    filterAnioIngreso !== '' ||
    filterAnioInclusion !== '' ||
    filterAgeGroup !== '' ||
    filterEstadoCivil !== '' ||
    filterNivelEstudio !== '';

  const activeFilterCount = [
    searchTerm !== '',
    filterProvincia !== 'todas',
    filterMunicipio !== 'todos',
    filterCentro !== 'todos',
    filterSexo !== 'todos',
    filterEstado !== '',
    filterAnioIngreso !== '',
    filterAnioInclusion !== '',
    filterAgeGroup !== '',
    filterEstadoCivil !== '',
    filterNivelEstudio !== '',
  ].filter(Boolean).length;

  // --- Actions ---

  const clearAll = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSearchTerm('');
    setFilterProvincia('todas');
    setFilterMunicipio('todos');
    setFilterCentro('todos');
    setFilterSexo('todos');
    setFilterEstado('');
    setFilterAnioIngreso('');
    setFilterAnioInclusion('');
    setFilterAgeGroup('');
    setFilterEstadoCivil('');
    setFilterNivelEstudio('');
  };

  const clearFilter = (key: string) => {
    switch (key) {
      case 'searchTerm':
        setSearchTerm('');
        break;
      case 'filterProvincia':
        setFilterProvincia('todas');
        setFilterMunicipio('todos');
        setFilterCentro('todos');
        break;
      case 'filterMunicipio':
        setFilterMunicipio('todos');
        break;
      case 'filterCentro':
        setFilterCentro('todos');
        break;
      case 'filterSexo':
        setFilterSexo('todos');
        break;
      case 'filterEstado':
        setFilterEstado('');
        break;
      case 'filterAnioIngreso':
        setFilterAnioIngreso('');
        break;
      case 'filterAnioInclusion':
        setFilterAnioInclusion('');
        break;
      case 'filterAgeGroup':
        setFilterAgeGroup('');
        break;
      case 'filterEstadoCivil':
        setFilterEstadoCivil('');
        break;
      case 'filterNivelEstudio':
        setFilterNivelEstudio('');
        break;
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    filterProvincia,
    setFilterProvincia,
    filterMunicipio,
    setFilterMunicipio,
    filterCentro,
    setFilterCentro,
    filterSexo,
    setFilterSexo,
    filterEstado,
    setFilterEstado,
    filterAnioIngreso,
    setFilterAnioIngreso,
    filterAnioInclusion,
    setFilterAnioInclusion,
    filterAgeGroup,
    setFilterAgeGroup,
    filterEstadoCivil,
    setFilterEstadoCivil,
    filterNivelEstudio,
    setFilterNivelEstudio,
    availableProvincias,
    availableMunicipios,
    availableCentros,
    availableEstados,
    availableAniosIngreso,
    availableAniosInclusion,
    availableEstadoCivil,
    availableNivelEstudio,
    filteredData,
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
    hasActiveFilters,
    activeFilterCount,
    clearAll,
    clearFilter,
  };
};
