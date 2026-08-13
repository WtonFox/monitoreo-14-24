/**
 * Normalización de identidad para la auditoría de datos (AUD-0, AD-1..AD-3).
 *
 * La clave primaria de detección de grupos repetidos es nombres + apellidos
 * normalizados (trim, case-fold, sin acentos, sin espacios internos) unidos
 * con el separador \u0001 (AD-1/AD-2). La cédula normalizada a dígitos se usa
 * solo como confirmación secundaria (AD-3): los valores 'N/D'/vacíos quedan
 * excluidos del matching por cédula pero NUNCA del matching por nombre.
 */
import { isMissing, isNotAvailable } from './normalize';

/**
 * Vocabulario centinela de identidad (AUD-0/AUD-8): coincide con NA_VALUES de
 * normalize.ts más los fallbacks 'N/A' que produce sanitizeParticipant.
 * Comparación case-insensitive.
 */
export const SENTINEL_WORDS: readonly string[] = [
    'n/d',
    'n/a',
    's/d',
    'sin centro',
    'sin estado',
    'sin provincia'
];

/**
 * Normaliza un fragmento de nombre (AD-2):
 * trim → toLowerCase → NFD → quitar marcas combinantes [\u0300-\u036f] →
 * eliminar TODOS los espacios internos.
 *
 * "María De León" → "mariadeleon" (idéntico a "maria de leon").
 */
export function normalizeNamePart(value: string | null): string {
    return (value ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');
}

/**
 * Clave de identidad normalizada (AD-1): `normalizeNamePart(nombres) + '\u0001'
 * + normalizeNamePart(apellidos)`. El separador evita la colisión
 * "Maria De"+"Leon" vs "Maria"+"De Leon".
 *
 * Devuelve null cuando alguna de las partes es centinela o está vacía — esas
 * filas se excluyen del agrupamiento por identidad (AUD-0).
 */
export function normalizeIdentity(nombres: string | null, apellidos: string | null): string | null {
    if (isSentinelIdentity(nombres) || isSentinelIdentity(apellidos)) return null;
    return normalizeNamePart(nombres) + '\u0001' + normalizeNamePart(apellidos);
}

/**
 * Cédula normalizada a dígitos (AD-3). Devuelve null cuando no quedan dígitos
 * (vacía, 'N/D', solo no-dígitos): la fila queda excluida del matching por
 * cédula pero sigue participando del matching por nombre.
 *
 * '001-0000001-1' → '00100000011' (equivale a '00100000011').
 */
export function normalizeCedula(cedula: string | null): string | null {
    if (cedula === null || cedula === undefined) return null;
    const digits = cedula.replace(/\D/g, '');
    return digits.length > 0 ? digits : null;
}

/**
 * Detecta identidades centinela: nulos/vacíos y los valores de SENTINEL_WORDS
 * ('N/A', 'N/D', 'S/D', 'sin centro', 'sin estado', 'sin provincia'),
 * case-insensitive. Reutiliza los clasificadores isMissing/isNotAvailable de
 * normalize.ts. Un valor compuesto (clave completa con separador \u0001) es
 * centinela si cualquiera de sus partes lo es.
 */
export function isSentinelIdentity(value: string | null | undefined): boolean {
    if (value === null || value === undefined) return true;
    const parts = value.includes('\u0001') ? value.split('\u0001') : [value];
    return parts.some((part) => isMissing(part) || isNotAvailable(part));
}
