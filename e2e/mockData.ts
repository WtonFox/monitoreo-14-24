import { Page } from '@playwright/test';
import { Participant, PaginationResult } from '../types';

/**
 * Fixed audit fixtures appended to every generated dataset.
 *
 * These create deterministic repeated identities (AUD-2/AUD-3/AUD-4) so the
 * Auditoria board (utils/auditSignals.ts) produces predictable signals in e2e:
 *
 * - Q1 (multi-ruta): "María De León" in 2 DIFFERENT rutaFormativa
 *   → 1 Q1 candidate (precedence over temporal, AD-6)
 * - Duplicado de carga: "Juan Fernández" with CONSECUTIVE ids (100003/100004),
 *   same ruta and same fechaRegistro → 1 duplicate group
 * - Q2 (re-inscripción): "Rosa Castillo" same ruta, fechas ~8 months apart
 *   (244 days > T1=30) → 1 Q2 candidate
 *
 * Ids use a reserved range (100001+) that never collides with generated ids
 * (1..count), and last names are outside the generator's list so fixture
 * identities never merge with generated rows for any count. Dates and cedulas
 * are fixed; rows use a dedicated provincia/municipio/centro so they do not
 * disturb the aggregation-based assertions of other e2e specs.
 */
const AUDIT_FIXTURES: Participant[] = [
  {
    id: 100001,
    nombres: 'María',
    apellidos: 'De León',
    cedula: '001-0000001-1',
    edad: 31,
    fechaNacimiento: '1995-03-10',
    fechaRegistro: '2024-01-15',
    fechaInclusion: '2024-01-15',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'femenino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Informática',
    telefonos: '809-555-0101',
    telefonosResponsable: '829-555-0102',
    edadRegistro: 20,
    estadoCivil: 'soltero',
    nivelEstudio: 'medio',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
  {
    id: 100002,
    nombres: 'María',
    apellidos: 'De León',
    cedula: '001-0000001-1',
    edad: 31,
    fechaNacimiento: '1995-03-10',
    fechaRegistro: '2024-01-20',
    fechaInclusion: '2024-01-20',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'femenino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Camarero de Barra',
    telefonos: '809-555-0101',
    telefonosResponsable: '829-555-0102',
    edadRegistro: 20,
    estadoCivil: 'soltero',
    nivelEstudio: 'medio',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
  {
    id: 100003,
    nombres: 'Juan',
    apellidos: 'Fernández',
    cedula: '001-0000002-2',
    edad: 28,
    fechaNacimiento: '1997-11-05',
    fechaRegistro: '2024-05-02',
    fechaInclusion: '2024-05-02',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'masculino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Programa A',
    telefonos: '809-555-0201',
    telefonosResponsable: '829-555-0202',
    edadRegistro: 21,
    estadoCivil: 'casado',
    nivelEstudio: 'basico',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
  {
    id: 100004,
    nombres: 'Juan',
    apellidos: 'Fernández',
    cedula: '001-0000002-2',
    edad: 28,
    fechaNacimiento: '1997-11-05',
    fechaRegistro: '2024-05-02',
    fechaInclusion: '2024-05-02',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'masculino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Programa A',
    telefonos: '809-555-0201',
    telefonosResponsable: '829-555-0202',
    edadRegistro: 21,
    estadoCivil: 'casado',
    nivelEstudio: 'basico',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
  {
    id: 100005,
    nombres: 'Rosa',
    apellidos: 'Castillo',
    cedula: '001-0000003-3',
    edad: 35,
    fechaNacimiento: '1990-07-25',
    fechaRegistro: '2024-01-20',
    fechaInclusion: '2024-01-20',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'femenino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Programa B',
    telefonos: '809-555-0301',
    telefonosResponsable: '829-555-0302',
    edadRegistro: 30,
    estadoCivil: 'divorciado',
    nivelEstudio: 'superior',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
  {
    id: 100006,
    nombres: 'Rosa',
    apellidos: 'Castillo',
    cedula: '001-0000003-3',
    edad: 35,
    fechaNacimiento: '1990-07-25',
    fechaRegistro: '2024-09-20',
    fechaInclusion: '2024-09-20',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'femenino',
    provincia: 'Monte Plata',
    municipio: 'Monte Plata',
    centro: 'Centro Especializado',
    direccion: 'Calle 1, No. 1',
    rutaFormativa: 'Programa B',
    telefonos: '809-555-0301',
    telefonosResponsable: '829-555-0302',
    edadRegistro: 30,
    estadoCivil: 'divorciado',
    nivelEstudio: 'superior',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  },
];

/**
 * Generate N realistic-looking participants for E2E test mock data.
 * Appends the fixed audit fixtures (AUDIT_FIXTURES) so audit signals are
 * deterministic for any spec that navigates to /indicadores/auditoria.
 */
function generateParticipants(count: number): Participant[] {
  const firstNames = ['Ana', 'Luis', 'Carlos', 'Maria', 'Pedro', 'Rosa', 'Juan', 'Diana', 'Jose', 'Elena'];
  const lastNames = ['Martinez', 'Perez', 'Rodriguez', 'Garcia', 'Lopez', 'Hernandez', 'Diaz', 'Torres'];
  const provincias = ['Santo Domingo', 'Santiago', 'La Vega', 'San Cristóbal', 'Puerto Plata', 'Duarte', 'La Altagracia'];
  const municipios = ['Santo Domingo Este', 'Santiago de los Caballeros', 'La Vega', 'San Cristóbal', 'Puerto Plata', 'San Francisco de Macorís', 'Higüey'];
  const centros = ['Centro A', 'Centro B', 'Centro C', 'Centro D'];
  const estados = ['activo', 'egresado', 'suspendido'];
  const sexos = ['masculino', 'femenino'];
  const rutas = ['Programa A', 'Programa B', 'Programa C'];
  const edoCiviles = ['soltero', 'casado', 'divorciado', 'union libre'];
  const niveles = ['basico', 'medio', 'superior', 'ninguno'];

  const generated = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    nombres: firstNames[i % firstNames.length],
    apellidos: lastNames[i % lastNames.length],
    cedula: `000-0000000-${(i + 1).toString().padStart(2, '0')}`,
    edad: 18 + (i % 30),
    fechaNacimiento: `200${i % 9}-${(i % 12) + 1}-${(i % 28) + 1}`,
    fechaRegistro: `2024-${(i % 12) + 1}-${(i % 28) + 1}`,
    fechaInclusion: `2024-${(i % 12) + 1}-${(i % 28) + 1}`,
    tutor: i % 10 === 0 ? null : 'Tutor',
    cedulaTutor: i % 10 === 0 ? null : `000-0000000-${(i + 100).toString().padStart(2, '0')}`,
    vulnerabilidades: i % 5 === 0 ? 'vulnerabilidad' : null,
    estado: estados[i % estados.length],
    sexo: sexos[i % sexos.length],
    provincia: provincias[i % provincias.length],
    municipio: municipios[i % municipios.length],
    centro: centros[i % centros.length],
    direccion: `Calle ${i + 1}, No. ${i * 10}`,
    rutaFormativa: rutas[i % rutas.length],
    telefonos: `809-${(1000000 + i).toString().slice(1)}`,
    telefonosResponsable: `829-${(2000000 + i).toString().slice(1)}`,
    edadRegistro: 18 + (i % 5),
    estadoCivil: edoCiviles[i % edoCiviles.length],
    nivelEstudio: niveles[i % niveles.length],
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null,
  }));

  return [...generated, ...AUDIT_FIXTURES];
}

/**
 * Build a mock JSON response body matching the PaginationResult type.
 */
function buildMockResponse(data: Participant[], pageIndex: number, pageSize: number): PaginationResult {
  const start = (pageIndex - 1) * pageSize;
  const items = data.slice(start, start + pageSize);
  return {
    items,
    totalItems: data.length,
    currentPage: pageIndex,
    pageSize,
  };
}

const API_URL_PATTERN = /\/api\/estadisticasPresidencia\/getParticipantsStaticsPaged/;

/**
 * Set up page.route to intercept API participant calls and return mock data.
 *
 * Call this in beforeEach BEFORE navigating to the page. The mock returns
 * seeded data that the participant store will load via startSmartSync().
 *
 * @example
 *   import { mockParticipantApi } from './mockData';
 *   test.beforeEach(async ({ page }) => {
 *     await mockParticipantApi(page, 50);
 *     await injectToken(page, ADMIN_TOKEN);
 *     await page.goto('/#/participantes');
 *   });
 */
export async function mockParticipantApi(page: Page, participantCount = 50): Promise<void> {
  const data = generateParticipants(participantCount);

  await page.route(API_URL_PATTERN, async (route) => {
    const url = new URL(route.request().url());
    const pageIndex = parseInt(url.searchParams.get('pageIndex') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '1', 10);

    const body = buildMockResponse(data, pageIndex, pageSize);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}
