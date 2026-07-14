/**
 * Characterization suite for utils/normalize.ts (design §6, spec R-verify-6).
 *
 * These tests lock in the CURRENT vocabulary semantics of normalize.ts,
 * including the documented divergence between `hasValue` here and the
 * inline `isEmptyValue` helpers in hooks/useIndicatorBoards.ts and
 * hooks/useIndicators.ts (which do NOT treat 'Ninguna' as empty).
 *
 * Per spec:
 *   - failing tests = regression; revert the WU.
 *   - passing tests = vocabulary is locked in until M4/M5 reorganize the
 *     four classifiers.
 *
 * 20 cases total per spec R-verify-6.
 */
import { describe, expect, it } from 'vitest';
import {
    hasValue,
    isActiveStatus,
    isGraduatedStatus,
    isMen,
    isWomen,
    normalizeSexo
} from './normalize';

describe('utils/normalize (characterization — 20 cases)', () => {
    // hasValue — vocabulary divergence (current behaviour)
    it('hasValue returns false for "N/D" (current behaviour)', () => {
        expect(hasValue('N/D')).toBe(false);
    });

    it('hasValue returns false for "N/A" (current behaviour)', () => {
        expect(hasValue('N/A')).toBe(false);
    });

    it('hasValue returns false for "Ninguna" — diverges from hooks/useIndicatorBoards isEmptyValue (current behaviour — see M5/H4)', () => {
        expect(hasValue('Ninguna')).toBe(false);
    });

    it('hasValue returns false for an empty string (current behaviour)', () => {
        expect(hasValue('')).toBe(false);
    });

    it('hasValue returns true for "  texto  " after trim (current behaviour)', () => {
        expect(hasValue('  texto  ')).toBe(true);
    });

    it('hasValue returns true for arbitrary non-empty text (current behaviour)', () => {
        expect(hasValue('algún valor')).toBe(true);
    });

    // isWomen — case-insensitive female detection (current behaviour)
    it('isWomen returns true for "F" (current behaviour)', () => {
        expect(isWomen('F')).toBe(true);
    });

    it('isWomen returns true for "femenino" — case-insensitive (current behaviour)', () => {
        expect(isWomen('femenino')).toBe(true);
        expect(isWomen('FEMENINO')).toBe(true);
    });

    it('isWomen returns false for "M", unknown sex, or null (current behaviour)', () => {
        expect(isWomen('M')).toBe(false);
        expect(isWomen('X')).toBe(false);
        expect(isWomen(null)).toBe(false);
        expect(isWomen(undefined)).toBe(false);
    });

    // isMen — case-insensitive male detection (current behaviour)
    it('isMen returns true for "M" (current behaviour)', () => {
        expect(isMen('M')).toBe(true);
    });

    it('isMen returns true for "masculino" — case-insensitive (current behaviour)', () => {
        expect(isMen('masculino')).toBe(true);
        expect(isMen('MASCULINO')).toBe(true);
    });

    it('isMen returns false for "F", unknown sex, or null (current behaviour)', () => {
        expect(isMen('F')).toBe(false);
        expect(isMen('X')).toBe(false);
        expect(isMen(null)).toBe(false);
        expect(isMen(undefined)).toBe(false);
    });

    // isActiveStatus — API uses "Identificado" instead of "Activo" (current behaviour)
    it('isActiveStatus returns true for "Identificado" — current behaviour; the API sends this in place of "Activo"', () => {
        expect(isActiveStatus('Identificado')).toBe(true);
        expect(isActiveStatus('identificado')).toBe(true);
    });

    it('isActiveStatus returns true for "activo" or "en proceso" (current behaviour)', () => {
        expect(isActiveStatus('activo')).toBe(true);
        expect(isActiveStatus('Activo')).toBe(true);
        expect(isActiveStatus('en proceso')).toBe(true);
        expect(isActiveStatus('En Proceso')).toBe(true);
    });

    it('isActiveStatus returns false for graduated states and missing values (current behaviour)', () => {
        expect(isActiveStatus('Egresado pasantía')).toBe(false);
        expect(isActiveStatus('Egresada fase lectiva')).toBe(false);
        expect(isActiveStatus(null)).toBe(false);
        expect(isActiveStatus(undefined)).toBe(false);
        expect(isActiveStatus('')).toBe(false);
    });

    // isGraduatedStatus — handles both "egresado" and feminine "egresada" (current behaviour)
    it('isGraduatedStatus returns true for "Egresado pasantía" (current behaviour)', () => {
        expect(isGraduatedStatus('Egresado pasantía')).toBe(true);
        expect(isGraduatedStatus('egresado')).toBe(true);
    });

    it('isGraduatedStatus returns true for the feminine "Egresada" variant (current behaviour)', () => {
        expect(isGraduatedStatus('Egresada fase lectiva')).toBe(true);
        expect(isGraduatedStatus('egresada')).toBe(true);
    });

    it('isGraduatedStatus returns false for active states and missing values (current behaviour)', () => {
        expect(isGraduatedStatus('Activo')).toBe(false);
        expect(isGraduatedStatus('Identificado')).toBe(false);
        expect(isGraduatedStatus(null)).toBe(false);
        expect(isGraduatedStatus(undefined)).toBe(false);
    });

    // normalizeSexo — API sends short codes (current behaviour)
    it('normalizeSexo maps "F"/"M" case-insensitively to Femenino/Masculino (current behaviour)', () => {
        expect(normalizeSexo('F')).toBe('Femenino');
        expect(normalizeSexo('f')).toBe('Femenino');
        expect(normalizeSexo('M')).toBe('Masculino');
        expect(normalizeSexo('m')).toBe('Masculino');
    });

    it('normalizeSexo returns null for missing values and preserves other strings verbatim (current behaviour)', () => {
        // Unknown values pass through so downstream can route them to an
        // explicit Unknown bucket (see M5 denominator flag).
        expect(normalizeSexo('X')).toBe('X');
        expect(normalizeSexo('Masculino')).toBe('Masculino');
        expect(normalizeSexo(null)).toBeNull();
        expect(normalizeSexo(undefined)).toBeNull();
        expect(normalizeSexo('')).toBeNull();
    });
});
