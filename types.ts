export interface Participant {
  id: number;
  nombres: string | null;
  apellidos: string | null;
  cedula: string | null;
  edad: number;
  fechaNacimiento: string | null;
  fechaRegistro: string | null;
  fechaInclusion: string | null;
  tutor: string | null;
  cedulaTutor: string | null;
  vulnerabilidades: string | null;
  estado: string | null;
  sexo: string | null;
  provincia: string | null;
  municipio: string | null;
  centro: string | null;
  direccion: string | null;
  rutaFormativa: string | null;
  telefonos: string | null;
  telefonosResponsable: string | null;
  edadRegistro: number;
  estadoCivil: string | null;
  nivelEstudio: string | null;
  alergias: string | null;
  discapacidades: string | null;
  enfermedades: string | null;
  programasSociales: string | null;
}

export interface PaginationResult {
  items: Participant[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
}

export interface FilterState {
  search: string;
  provincia: string;
  estado: string;
}

export interface AdvancedFilterState {
  yearIngreso: string;
  yearInclusion: string;
  municipio: string;
  ageGroup: string;
  sexo: string;
  estadoCivil: string;
  nivelEstudio: string;
}

export const AGE_GROUPS = [
  { value: '', label: 'Todos' },
  { value: '14-17', label: '14-17 años' },
  { value: '18-20', label: '18-20 años' },
  { value: '21-24', label: '21-24 años' }
];

