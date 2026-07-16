import { useState, useMemo, useEffect } from 'react';
import { Participant } from '../types';
import { PROVINCE_MUNICIPALITIES, AGE_GROUPS } from '../constants';

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
export const useParticipantesFilters = (data: Participant[]): UseParticipantesFiltersResult => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvincia, setFilterProvincia] = useState('todas');
  const [filterMunicipio, setFilterMunicipio] = useState('todos');
  const [filterCentro, setFilterCentro] = useState('todos');
  const [filterSexo, setFilterSexo] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterAnioIngreso, setFilterAnioIngreso] = useState('');
  const [filterAnioInclusion, setFilterAnioInclusion] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');
  const [filterEstadoCivil, setFilterEstadoCivil] = useState('');
  const [filterNivelEstudio, setFilterNivelEstudio] = useState('');

  // Al cambiar provincia, resetear municipio y centro
  useEffect(() => {
    setFilterMunicipio('todos');
    setFilterCentro('todos');
  }, [filterProvincia]);

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

  // --- Filtered data (AND entre todos los filtros) ---

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search text
      const matchSearch = searchTerm
        ? (() => {
            const term = searchTerm.toLowerCase();
            return (
              (item.nombres?.toLowerCase().includes(term) || false) ||
              (item.apellidos?.toLowerCase().includes(term) || false) ||
              (item.cedula?.includes(term) || false) ||
              (item.provincia?.toLowerCase().includes(term) || false) ||
              (item.municipio?.toLowerCase().includes(term) || false) ||
              (item.centro?.toLowerCase().includes(term) || false) ||
              (item.estado?.toLowerCase().includes(term) || false) ||
              (item.estadoCivil?.toLowerCase().includes(term) || false) ||
              (item.nivelEstudio?.toLowerCase().includes(term) || false) ||
              (item.rutaFormativa?.toLowerCase().includes(term) || false)
            );
          })()
        : true;

      const matchProv = filterProvincia === 'todas' || item.provincia === filterProvincia;
      const matchMun = filterMunicipio === 'todos' || item.municipio === filterMunicipio;
      const matchCentro = filterCentro === 'todos' || item.centro === filterCentro;
      const matchSexo = filterSexo === 'todos' || item.sexo?.toLowerCase() === filterSexo;
      const matchEstado = !filterEstado || item.estado === filterEstado;

      const matchAnioIngreso = !filterAnioIngreso
        ? true
        : (item.fechaRegistro && new Date(item.fechaRegistro).getFullYear().toString() === filterAnioIngreso) || false;

      const matchAnioInclusion = !filterAnioInclusion
        ? true
        : (item.fechaInclusion && new Date(item.fechaInclusion).getFullYear().toString() === filterAnioInclusion) || false;

      const matchAge = !filterAgeGroup
        ? true
        : (() => {
            const age = item.edad;
            switch (filterAgeGroup) {
              case '14-17': return age >= 14 && age <= 17;
              case '18-20': return age >= 18 && age <= 20;
              case '21-24': return age >= 21 && age <= 24;
              case '25-29': return age >= 25 && age <= 29;
              case '30+': return age >= 30;
              default: return true;
            }
          })();

      const matchEstadoCivil = !filterEstadoCivil || item.estadoCivil === filterEstadoCivil;
      const matchNivelEstudio = !filterNivelEstudio || item.nivelEstudio === filterNivelEstudio;

      return (
        matchSearch &&
        matchProv &&
        matchMun &&
        matchCentro &&
        matchSexo &&
        matchEstado &&
        matchAnioIngreso &&
        matchAnioInclusion &&
        matchAge &&
        matchEstadoCivil &&
        matchNivelEstudio
      );
    });
  }, [
    data,
    searchTerm,
    filterProvincia,
    filterMunicipio,
    filterCentro,
    filterSexo,
    filterEstado,
    filterAnioIngreso,
    filterAnioInclusion,
    filterAgeGroup,
    filterEstadoCivil,
    filterNivelEstudio,
  ]);

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
    hasActiveFilters,
    activeFilterCount,
    clearAll,
    clearFilter,
  };
};
