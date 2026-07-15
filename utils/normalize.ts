/**
 * Archivo de normalización de datos de la API.
 * La API de Presidencia usa convenciones específicas que NO coinciden
 * con lo que el código espera. Este archivo centraliza TODAS las
 * normalizaciones para que los hooks y componentes usen datos consistentes.
 *
 * API real vs código:
 * - sexo: "M"/"F" (NO "Masculino"/"Femenino")
 * - estado: "Identificado", "Egresado pasantía", "Egresado fase lectiva" (NO "Activo")
 * - estadoCivil: "Soltero(a)" (con paréntesis)
 * - vulnerabilidades/datos sociales: "N/D" cuando no aplica
 *
 * Canonical 5-category classifier (R-N5):
 * | Category | Recognized values | Example fields |
 * |---|---|---|
 * | MISSING | null, undefined, '' | any |
 * | NOT_AVAILABLE | 'N/D', 'N/A', 's/d', 'Sin Centro', 'Sin Estado', 'Sin Provincia' | string fields |
 * | NONE_REPORTED | 'Ninguna', 'Ninguno' (case-insensitive) | boolean-y fields |
 * | INVALID | Unrecognized value | any |
 * | PRESENT | Any recognized real value | any |
 */

// ─── Vocabulary tables ───────────────────────────────────────────────────────

const NA_VALUES = new Set([
    'n/d',
    'n/a',
    's/d',
    'sin centro',
    'sin estado',
    'sin provincia'
]);

const NONE_REPORTED_VALUES = new Set(['ninguna', 'ninguno']);

// ─── Canonical 5-category classifiers ────────────────────────────────────────

/**
 * True when the value is structurally missing: null, undefined, or empty string.
 */
export function isMissing(val: string | null | undefined): boolean {
    return val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
}

/**
 * True when the value is an explicit "Not Available" sentinel (N/D, N/A, s/d, etc.).
 * Case-insensitive. Returns false for null/undefined/empty.
 */
export function isNotAvailable(val: string | null | undefined): boolean {
    if (isMissing(val)) return false;
    return NA_VALUES.has(val!.trim().toLowerCase());
}

/**
 * True when the value is a "none reported" sentinel (Ninguna, Ninguno).
 * Case-insensitive. Returns false for null/undefined/empty.
 * Distinct from NOT_AVAILABLE — field-level prevalence can choose denominator.
 */
export function isNoneReported(val: string | null | undefined): boolean {
    if (isMissing(val)) return false;
    return NONE_REPORTED_VALUES.has(val!.trim().toLowerCase());
}

/**
 * True when the value is present but not a recognized real value.
 * Reserved for future field-aware vocabulary dispatch. Without per-field
 * valid-value schemas, no value is classified as INVALID — any non-ND,
 * non-NR value is considered PRESENT.
 */
export function isInvalid(_val: string | null | undefined): boolean {
    return false;
}

/**
 * True when the value is a recognized real data value.
 * Returns false for MISSING, NOT_AVAILABLE, NONE_REPORTED, and INVALID.
 *
 * This is the canonical implementation; existing consumers calling hasValue()
 * continue to see the same behavior they relied on in M3.
 */
export function hasValue(val: string | null | undefined): boolean {
    return !isMissing(val) && !isNotAvailable(val) && !isNoneReported(val) && !isInvalid(val);
}

// ─── Existing normalizers (unchanged) ────────────────────────────────────────

/**
 * Determina si un valor de sexo corresponde a mujer.
 * Acepta tanto "F" como "Femenino" (case insensitive).
 * Recibe el STRING de sexo directamente, no un Participant.
 */
export function isWomen(sexo: string | null | undefined): boolean {
    const v = (sexo || '').trim().toUpperCase();
    return v === 'F' || v === 'FEMENINO';
}

/**
 * Determina si un valor de sexo corresponde a hombre.
 * Acepta tanto "M" como "Masculino" (case insensitive).
 * Recibe el STRING de sexo directamente, no un Participant.
 */
export function isMen(sexo: string | null | undefined): boolean {
    const v = (sexo || '').trim().toUpperCase();
    return v === 'M' || v === 'MASCULINO';
}

/**
 * Determina si un estado cuenta como "Activo" para los indicadores.
 * La API usa "Identificado" en vez de "Activo".
 */
export function isActiveStatus(estado: string | null | undefined): boolean {
    if (!estado) return false;
    const s = estado.trim().toLowerCase();
    return s === 'activo' || s === 'identificado' || s === 'en proceso';
}

/**
 * Determina si un estado cuenta como "Egresado".
 * La API usa "Egresado pasantía" y "Egresado fase lectiva".
 */
export function isGraduatedStatus(estado: string | null | undefined): boolean {
    if (!estado) return false;
    return estado.toLowerCase().includes('egresado') || estado.toLowerCase().includes('egresada');
}
