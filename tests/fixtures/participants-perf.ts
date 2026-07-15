/**
 * Deterministic performance-test fixture generator (R-perf-1).
 *
 * Uses a mulberry32 seeded PRNG so every seed produces identical data
 * across runs. Distributes records across 32 provinces, 3 municipalities
 * per province, 12 centers, 4 age ranges, 2 sexes, and 3 statuses.
 *
 * Exports:
 *   generateParticipants(count, seed?)  — generic generator
 *   perfFixture10k(seed?)               —  10 000 records
 *   perfFixture67k(seed?)               —  67 000 records
 *   perfFixture100k(seed?)              — 100 000 records
 */
import type { Participant } from '../../types';

// ── Seeded PRNG (mulberry32) ──

function mulberry32(a: number): () => number {
  let state = a | 0;
  return () => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Distribution pools ──

const PROVINCES = [
  'Azua', 'Baoruco', 'Barahona', 'Dajabón', 'Distrito Nacional', 'Duarte',
  'Elías Piña', 'El Seibo', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal',
  'Independencia', 'La Altagracia', 'La Romana', 'La Vega',
  'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata',
  'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal',
  'San José de Ocoa', 'San Juan', 'San Pedro de Macorís', 'Sánchez Ramírez',
  'Santiago', 'Santiago Rodríguez', 'Santo Domingo', 'Valverde',
] as const;

// 3 canonical municipalities per province (deterministic from province index)
const MUNI_SUFFIXES = ['Norte', 'Centro', 'Sur'] as const;

const CENTERS = [
  'Centro Tecnológico Comunal',
  'Centro de Capacitación y Producción',
  'Centro de Desarrollo Integral',
  'Centro de Formación Técnica',
  'Centro de Innovación y Emprendimiento',
  'Centro de Recursos para el Aprendizaje',
  'Centro Educativo de Jornada Extendida',
  'Centro Comunitario de Aprendizaje',
  'Centro de Formación Profesional',
  'Centro de Desarrollo Juvenil',
  'Centro de Educación Alternativa',
  'Centro de Inclusión Digital',
] as const;

const AGE_RANGES: readonly { min: number; max: number }[] = [
  { min: 14, max: 17 },
  { min: 18, max: 20 },
  { min: 21, max: 24 },
  { min: 25, max: 60 },
] as const;

const SEXES: readonly string[] = ['M', 'F'];
const STATUSES: readonly string[] = ['Activo', 'Egresado', 'Identificado'];
const EDUCATION_LEVELS: readonly (string | null)[] = [
  'Bachiller',
  'Básico',
  'Universitario',
  'Técnico',
  null,
];
const CIVIL_STATUSES: readonly (string | null)[] = [
  'Soltero(a)',
  'Casado(a)',
  'Unión Libre',
  null,
];
const RUTAS: readonly string[] = ['Ruta A', 'Ruta B', 'Ruta C'];

// ── Helpers ──

const pick = <T>(arr: readonly T[], rng: () => number): T =>
  arr[Math.floor(rng() * arr.length)];

const randInt = (min: number, max: number, rng: () => number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const padId = (n: number): string => String(n).padStart(8, '0');

// ── Generator ──

export function generateParticipants(
  count: number,
  seed = 42,
): Participant[] {
  const rng = mulberry32(seed);
  const result: Participant[] = [];

  for (let i = 0; i < count; i++) {
    const province = pick(PROVINCES, rng);
    const muniSuffix = pick(MUNI_SUFFIXES, rng);
    const municipio = `${province} - ${muniSuffix}`;
    const centro = pick(CENTERS, rng);
    const ageRange = pick(AGE_RANGES, rng);
    const edad = randInt(ageRange.min, ageRange.max, rng);
    const sexo = pick(SEXES, rng);
    const status = pick(STATUSES, rng);
    const educación = pick(EDUCATION_LEVELS, rng);
    const civil = pick(CIVIL_STATUSES, rng);
    const ruta = pick(RUTAS, rng);
    const registroYear = randInt(2020, 2025, rng);
    const registroMonth = randInt(0, 11, rng);
    const registroDay = randInt(1, 28, rng);
    const nacYear = registroYear - edad;
    const nacMonth = randInt(0, 11, rng);
    const nacDay = randInt(1, 28, rng);

    // Sporadic null fields for realism (~15% chance each)
    const tutorChance = rng();
    const alergiasChance = rng();
    const discapacidadesChance = rng();
    const enfermedadesChance = rng();
    const programasSocialesChance = rng();
    const vulnerabilidadesChance = rng();
    const phoneChance = rng();

    result.push({
      id: i + 1,
      nombres: `Participante`,
      apellidos: `${padId(i + 1)}`,
      cedula: i < count * 0.98
        ? `000-${String(i + 1).padStart(7, '0')}-${randInt(1, 9, rng)}`
        : null,
      edad,
      fechaNacimiento: new Date(
        nacYear, nacMonth, nacDay,
      ).toISOString(),
      fechaRegistro: new Date(
        registroYear, registroMonth, registroDay,
      ).toISOString(),
      fechaInclusion: status === 'Activo'
        ? new Date(
          registroYear, registroMonth + randInt(1, 3, rng), registroDay,
        ).toISOString()
        : null,
      tutor: tutorChance > 0.85 ? `Tutor ${padId(i + 1)}` : null,
      cedulaTutor: tutorChance > 0.85
        ? `001-${String(i + 1).padStart(7, '0')}-${randInt(1, 9, rng)}`
        : null,
      vulnerabilidades: vulnerabilidadesChance > 0.9
        ? pick(['Pobreza', 'Desempleo', 'Violencia'], rng)
        : null,
      estado: status,
      sexo,
      provincia: province,
      municipio,
      centro,
      direccion: `Calle ${randInt(1, 100, rng)}`,
      rutaFormativa: ruta,
      telefonos: phoneChance > 0.08
        ? `809-${String(randInt(100, 999, rng))}-${String(randInt(1000, 9999, rng))}`
        : null,
      telefonosResponsable: tutorChance > 0.85 && phoneChance > 0.2
        ? `809-${String(randInt(100, 999, rng))}-${String(randInt(1000, 9999, rng))}`
        : null,
      edadRegistro: edad,
      estadoCivil: civil,
      nivelEstudio: educación,
      alergias: alergiasChance > 0.92
        ? pick(['Polvo', 'Penicilina', 'Polen'], rng)
        : null,
      discapacidades: discapacidadesChance > 0.95
        ? pick(['Motora', 'Visual', 'Auditiva'], rng)
        : null,
      enfermedades: enfermedadesChance > 0.9
        ? pick(['Asma', 'Diabetes', 'Hipertensión'], rng)
        : null,
      programasSociales: programasSocialesChance > 0.88
        ? pick(['Alimentación', 'Salud', 'Educación'], rng)
        : null,
    });
  }

  return result;
}

// ── Named fixtures ──

export function perfFixture10k(seed?: number): Participant[] {
  return generateParticipants(10_000, seed ?? 42);
}

export function perfFixture67k(seed?: number): Participant[] {
  return generateParticipants(67_000, seed ?? 42);
}

export function perfFixture100k(seed?: number): Participant[] {
  return generateParticipants(100_000, seed ?? 42);
}
