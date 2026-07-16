import { Page } from '@playwright/test';
import { Participant, PaginationResult } from '../types';

/**
 * Generate N realistic-looking participants for E2E test mock data.
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

  return Array.from({ length: count }, (_, i) => ({
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
