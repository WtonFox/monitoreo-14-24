import type { Participant } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FilterWorkerFilters {
  search?: string;
  provincia?: string;
  municipio?: string;
  centro?: string;
  sexo?: string;
  estado?: string;
  yearIngreso?: string;
  yearInclusion?: string;
  ageGroup?: string;
  estadoCivil?: string;
  nivelEstudio?: string;
}

interface FilterWorkerRequest {
  data: Participant[];
  filters: FilterWorkerFilters;
  _gen?: number;
}

type FilterWorkerResponse =
  | { filtered: Participant[]; duration: number; _gen?: number }
  | { error: string; _gen?: number };

// ---------------------------------------------------------------------------
// Pure filter function — combinable inline (sync) or inside the worker
// ---------------------------------------------------------------------------

export function filterData(data: Participant[], filters: FilterWorkerFilters): Participant[] {
  return data.filter(item => {
    // Search: matches against multiple text fields (case-insensitive)
    const matchSearch = !filters.search
      ? true
      : (() => {
          const term = filters.search!.toLowerCase();
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
        })();

    // Provincia (sentinel: 'todas' or undefined = no filter)
    const matchProv =
      !filters.provincia || filters.provincia === 'todas'
        ? true
        : item.provincia === filters.provincia;

    // Municipio (sentinel: 'todos' or undefined = no filter)
    const matchMun =
      !filters.municipio || filters.municipio === 'todos'
        ? true
        : item.municipio === filters.municipio;

    // Centro (sentinel: 'todos' or undefined = no filter)
    const matchCentro =
      !filters.centro || filters.centro === 'todos'
        ? true
        : item.centro === filters.centro;

    // Sexo (sentinel: 'todos' or undefined = no filter)
    const matchSexo =
      !filters.sexo || filters.sexo === 'todos'
        ? true
        : item.sexo?.toLowerCase() === filters.sexo;

    // Estado (empty/undefined = no filter)
    const matchEstado = !filters.estado ? true : item.estado === filters.estado;

    // Year Ingreso (from fechaRegistro)
    const matchYearIngreso = !filters.yearIngreso
      ? true
      : (item.fechaRegistro &&
          new Date(item.fechaRegistro).getFullYear().toString() === filters.yearIngreso) ||
        false;

    // Year Inclusion (from fechaInclusion)
    const matchYearInclusion = !filters.yearInclusion
      ? true
      : (item.fechaInclusion &&
          new Date(item.fechaInclusion).getFullYear().toString() === filters.yearInclusion) ||
        false;

    // Age group ranges
    const matchAge = !filters.ageGroup
      ? true
      : (() => {
          const age = item.edad;
          switch (filters.ageGroup) {
            case '14-17':
              return age >= 14 && age <= 17;
            case '18-20':
              return age >= 18 && age <= 20;
            case '21-24':
              return age >= 21 && age <= 24;
            case '25-29':
              return age >= 25 && age <= 29;
            case '30+':
              return age >= 30;
            default:
              return true;
          }
        })();

    // Estado civil
    const matchEstadoCivil = !filters.estadoCivil
      ? true
      : item.estadoCivil === filters.estadoCivil;

    // Nivel estudio
    const matchNivelEstudio = !filters.nivelEstudio
      ? true
      : item.nivelEstudio === filters.nivelEstudio;

    return (
      matchSearch &&
      matchProv &&
      matchMun &&
      matchCentro &&
      matchSexo &&
      matchEstado &&
      matchYearIngreso &&
      matchYearInclusion &&
      matchAge &&
      matchEstadoCivil &&
      matchNivelEstudio
    );
  });
}

// ---------------------------------------------------------------------------
// Worker handler
// ---------------------------------------------------------------------------

self.onmessage = (e: MessageEvent<FilterWorkerRequest>) => {
  const start = performance.now();
  try {
    const { data, filters, _gen } = e.data;
    const filtered = filterData(data, filters);
    const response: FilterWorkerResponse = {
      filtered,
      duration: performance.now() - start,
      _gen,
    };
    self.postMessage(response);
  } catch (err) {
    const response: FilterWorkerResponse = {
      error: String(err),
      _gen: e.data._gen,
    };
    self.postMessage(response);
  }
};
