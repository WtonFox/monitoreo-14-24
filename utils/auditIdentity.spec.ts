/**
 * Spec unit de utils/auditIdentity.ts (AUD-0, AD-1..AD-3).
 *
 * Cubre: equivalencia de variantes ortográficas, separador anti-colisión
 * (\u0001), cédula normalizada a dígitos con exclusión de 'N/D' del matching
 * por cédula (pero no del de nombre) y detección de identidades centinela.
 */
import { describe, expect, it } from 'vitest';
import {
    SENTINEL_WORDS,
    isSentinelIdentity,
    normalizeCedula,
    normalizeIdentity,
    normalizeNamePart
} from './auditIdentity';

describe('utils/auditIdentity — normalizeNamePart (AD-2)', () => {
    it('equivale variantes ortográficas: "María De León" ≡ "maria de leon"', () => {
        expect(normalizeNamePart('María De León')).toBe('mariadeleon');
        expect(normalizeNamePart('maria de leon')).toBe('mariadeleon');
        expect(normalizeNamePart('María De León')).toBe(normalizeNamePart('maria de leon'));
    });

    it('quita acentos, mayúsculas y espacios internos', () => {
        expect(normalizeNamePart('  ÁNGEL  JOSÉ  ')).toBe('angeljose');
    });

    it('maneja null como cadena vacía', () => {
        expect(normalizeNamePart(null)).toBe('');
    });
});

describe('utils/auditIdentity — normalizeIdentity (AD-1)', () => {
    it('"María De León" ≡ "maria de leon" como clave de grupo', () => {
        expect(normalizeIdentity('María', 'De León')).toBe('maria\u0001deleon');
        expect(normalizeIdentity('maria', 'de leon')).toBe('maria\u0001deleon');
        expect(normalizeIdentity('María', 'De León')).toBe(normalizeIdentity('maria', 'de leon'));
    });

    it('anti-colisión: "Maria De"+"Leon" ≠ "Maria"+"De Leon"', () => {
        const a = normalizeIdentity('Maria De', 'Leon');
        const b = normalizeIdentity('Maria', 'De Leon');
        expect(a).not.toBe(b);
        expect(a).toBe('mariade\u0001leon');
        expect(b).toBe('maria\u0001deleon');
    });

    it('no depende de la cédula: "N/D" no excluye del matching por nombre (AUD-0)', () => {
        // La cédula no participa de la clave de identidad: la clave sigue
        // existiendo aunque la cédula sea 'N/D'.
        expect(normalizeIdentity('María', 'De León')).not.toBeNull();
        expect(normalizeCedula('N/D')).toBeNull();
        // Dos filas con el mismo nombre comparten grupo aunque sus cédulas
        // difieran o una sea 'N/D'.
        expect(normalizeIdentity('María', 'De León')).toBe(normalizeIdentity('Maria', 'de leon'));
    });

    it('identidad centinela → null (AUD-0)', () => {
        expect(normalizeIdentity('N/A', 'N/A')).toBeNull();
        expect(normalizeIdentity('N/D', 'De León')).toBeNull();
        expect(normalizeIdentity('Sin Centro', 'De León')).toBeNull();
        expect(normalizeIdentity('', '')).toBeNull();
        expect(normalizeIdentity(null, null)).toBeNull();
    });
});

describe('utils/auditIdentity — normalizeCedula (AD-3)', () => {
    it('solo dígitos: "001-0000001-1" ≡ "00100000011"', () => {
        expect(normalizeCedula('001-0000001-1')).toBe('00100000011');
        expect(normalizeCedula('00100000011')).toBe('00100000011');
        expect(normalizeCedula('001-0000001-1')).toBe(normalizeCedula('00100000011'));
    });

    it('valores sin dígitos → null', () => {
        expect(normalizeCedula('N/D')).toBeNull();
        expect(normalizeCedula('')).toBeNull();
        expect(normalizeCedula('abc')).toBeNull();
        expect(normalizeCedula(null)).toBeNull();
    });
});

describe('utils/auditIdentity — isSentinelIdentity', () => {
    it('detecta centinelas case-insensitive', () => {
        expect(isSentinelIdentity('N/A')).toBe(true);
        expect(isSentinelIdentity('n/d')).toBe(true);
        expect(isSentinelIdentity('S/D')).toBe(true);
        expect(isSentinelIdentity('Sin Centro')).toBe(true);
        expect(isSentinelIdentity('sin estado')).toBe(true);
        expect(isSentinelIdentity('SIN PROVINCIA')).toBe(true);
    });

    it('detecta vacíos y nulos', () => {
        expect(isSentinelIdentity('')).toBe(true);
        expect(isSentinelIdentity('   ')).toBe(true);
        expect(isSentinelIdentity(null)).toBe(true);
        expect(isSentinelIdentity(undefined)).toBe(true);
    });

    it('rechaza identidades reales (incluidas claves compuestas)', () => {
        expect(isSentinelIdentity('María De León')).toBe(false);
        expect(isSentinelIdentity('maria\u0001deleon')).toBe(false);
    });

    it('detecta centinela en claves compuestas con separador', () => {
        expect(isSentinelIdentity('n/a\u0001n/a')).toBe(true);
        expect(isSentinelIdentity('maria\u0001n/d')).toBe(true);
    });

    it('expone el vocabulario centinela', () => {
        expect(SENTINEL_WORDS).toContain('n/d');
        expect(SENTINEL_WORDS).toContain('n/a');
        expect(SENTINEL_WORDS).toContain('sin centro');
    });
});
