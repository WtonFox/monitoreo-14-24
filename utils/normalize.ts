import type { Participant } from '../types';

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
 */

/** Normaliza el campo sexo: 'M'/'F' → 'Masculino'/'Femenino' */
export function normalizeSexo(raw: string | null | undefined): string | null {
  const v = (raw || '').trim().toUpperCase();
  if (v === 'F') return 'Femenino';
  if (v === 'M') return 'Masculino';
  return raw || null;
}

/** Determina si un participante es mujer (tolera M/F y Masculino/Femenino) */
export function isWomen(p: Participant): boolean {
  const s = (p.sexo || '').trim().toUpperCase();
  return s === 'F' || s === 'FEMENINO';
}

/** Determina si un participante es hombre (tolera M/F y Masculino/Femenino) */
export function isMen(p: Participant): boolean {
  const s = (p.sexo || '').trim().toUpperCase();
  return s === 'M' || s === 'MASCULINO';
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

/** Limpia valores "N/D", "N/A", vacíos */
export function hasValue(val: string | null | undefined): boolean {
  if (!val) return false;
  const v = val.trim();
  return v !== '' && v !== 'N/D' && v !== 'N/A' && v !== 'Ninguna';
}
