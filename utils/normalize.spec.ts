/**
 * Behavioral spec for utils/normalize.ts (R-N5 — Canonical 5-category classifier).
 *
 * Asserts the vocabulary contract defined in the canonical table:
 *   MISSING → isMissing=true, hasValue=false
 *   NOT_AVAILABLE → isNotAvailable=true, hasValue=false
 *   NONE_REPORTED → isNoneReported=true, hasValue=false (distinguishable)
 *   INVALID → isInvalid=true, hasValue=false
 *   PRESENT → hasValue=true
 *
 * Ninguna policy: NONE_REPORTED (Option A).
 * Existing isWomen/isMen/isActiveStatus/isGraduatedStatus: unchanged.
 */
import { describe, expect, it } from 'vitest';
import {
    isMissing,
    isNotAvailable,
    isNoneReported,
    isInvalid,
    hasValue,
    isWomen,
    isMen,
    isActiveStatus,
    isGraduatedStatus
} from './normalize';

describe('utils/normalize — isMissing', () => {
    it('returns true for null', () => {
        expect(isMissing(null)).toBe(true);
    });

    it('returns true for undefined', () => {
        expect(isMissing(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
        expect(isMissing('')).toBe(true);
    });

    it('returns true for whitespace-only string', () => {
        expect(isMissing('   ')).toBe(true);
    });

    it('returns false for a non-empty value', () => {
        expect(isMissing('texto')).toBe(false);
    });

    it('returns false for "N/D"', () => {
        expect(isMissing('N/D')).toBe(false);
    });

    it('returns false for "Ninguna"', () => {
        expect(isMissing('Ninguna')).toBe(false);
    });
});

describe('utils/normalize — isNotAvailable', () => {
    it('returns true for "N/D"', () => {
        expect(isNotAvailable('N/D')).toBe(true);
    });

    it('returns true for "N/A"', () => {
        expect(isNotAvailable('N/A')).toBe(true);
    });

    it('returns true for "s/d" (lowercase)', () => {
        expect(isNotAvailable('s/d')).toBe(true);
    });

    it('returns true for "Sin Centro" (case-insensitive)', () => {
        expect(isNotAvailable('sin centro')).toBe(true);
        expect(isNotAvailable('Sin Centro')).toBe(true);
    });

    it('returns true for "Sin Estado"', () => {
        expect(isNotAvailable('Sin Estado')).toBe(true);
    });

    it('returns true for "Sin Provincia"', () => {
        expect(isNotAvailable('Sin Provincia')).toBe(true);
    });

    it('returns false for null/undefined/empty', () => {
        expect(isNotAvailable(null)).toBe(false);
        expect(isNotAvailable(undefined)).toBe(false);
        expect(isNotAvailable('')).toBe(false);
    });

    it('returns false for "Ninguna"', () => {
        expect(isNotAvailable('Ninguna')).toBe(false);
    });

    it('returns false for a real value', () => {
        expect(isNotAvailable('Santo Domingo')).toBe(false);
    });
});

describe('utils/normalize — isNoneReported (Ninguna policy: NONE_REPORTED)', () => {
    it('returns true for "Ninguna"', () => {
        expect(isNoneReported('Ninguna')).toBe(true);
    });

    it('returns true for "Ninguno"', () => {
        expect(isNoneReported('Ninguno')).toBe(true);
    });

    it('returns true for lowercase "ninguna"', () => {
        expect(isNoneReported('ninguna')).toBe(true);
    });

    it('returns true for uppercase "NINGUNA"', () => {
        expect(isNoneReported('NINGUNA')).toBe(true);
    });

    it('returns false for null/undefined/empty', () => {
        expect(isNoneReported(null)).toBe(false);
        expect(isNoneReported(undefined)).toBe(false);
        expect(isNoneReported('')).toBe(false);
    });

    it('returns false for "N/D"', () => {
        expect(isNoneReported('N/D')).toBe(false);
    });

    it('returns false for "N/A"', () => {
        expect(isNoneReported('N/A')).toBe(false);
    });

    it('returns false for a real value', () => {
        expect(isNoneReported('Alergia al polen')).toBe(false);
    });
});

describe('utils/normalize — isInvalid', () => {
    it('returns false for null (delegates to isMissing)', () => {
        expect(isInvalid(null)).toBe(false);
    });

    it('returns false for "N/D" (delegates to isNotAvailable)', () => {
        expect(isInvalid('N/D')).toBe(false);
    });

    it('returns false for "Ninguna" (delegates to isNoneReported)', () => {
        expect(isInvalid('Ninguna')).toBe(false);
    });

    it('returns false for a real value (reserved — no field-aware dispatch yet)', () => {
        expect(isInvalid('Alergia al polen')).toBe(false);
    });
});

describe('utils/normalize — hasValue (canonical)', () => {
    it('returns false for null (MISSING)', () => {
        expect(hasValue(null)).toBe(false);
    });

    it('returns false for undefined (MISSING)', () => {
        expect(hasValue(undefined)).toBe(false);
    });

    it('returns false for empty string (MISSING)', () => {
        expect(hasValue('')).toBe(false);
    });

    it('returns false for "N/D" (NOT_AVAILABLE)', () => {
        expect(hasValue('N/D')).toBe(false);
    });

    it('returns false for "N/A" (NOT_AVAILABLE)', () => {
        expect(hasValue('N/A')).toBe(false);
    });

    it('returns false for "s/d" (NOT_AVAILABLE)', () => {
        expect(hasValue('s/d')).toBe(false);
    });

    it('returns false for "Ninguna" (NONE_REPORTED) — distinguishable via isNoneReported', () => {
        expect(hasValue('Ninguna')).toBe(false);
        expect(isNoneReported('Ninguna')).toBe(true);
    });

    it('returns false for "ninguno" (NONE_REPORTED)', () => {
        expect(hasValue('ninguno')).toBe(false);
        expect(isNoneReported('ninguno')).toBe(true);
    });

    it('returns true for a real non-empty value', () => {
        expect(hasValue('Alergia al polen')).toBe(true);
    });

    it('returns true after trimming whitespace', () => {
        expect(hasValue('  texto  ')).toBe(true);
    });

    it('returns true for arbitrary non-empty text', () => {
        expect(hasValue('algún valor')).toBe(true);
    });

    it('returns true for "Sin Centro" — NOT_AVAILABLE only when centro field', () => {
        // Without field dispatch, "Sin Centro" is PRESENT in non-centro contexts
        // (current behavior matches hasValue returning true for it)
        expect(hasValue('Sin Centro')).toBe(true);
    });
});

describe('utils/normalize — isWomen (unchanged)', () => {
    it('returns true for "F"', () => {
        expect(isWomen('F')).toBe(true);
    });

    it('returns true for "femenino" — case-insensitive', () => {
        expect(isWomen('femenino')).toBe(true);
        expect(isWomen('FEMENINO')).toBe(true);
    });

    it('returns false for "M", unknown sex, or null', () => {
        expect(isWomen('M')).toBe(false);
        expect(isWomen('X')).toBe(false);
        expect(isWomen(null)).toBe(false);
        expect(isWomen(undefined)).toBe(false);
    });
});

describe('utils/normalize — isMen (unchanged)', () => {
    it('returns true for "M"', () => {
        expect(isMen('M')).toBe(true);
    });

    it('returns true for "masculino" — case-insensitive', () => {
        expect(isMen('masculino')).toBe(true);
        expect(isMen('MASCULINO')).toBe(true);
    });

    it('returns false for "F", unknown sex, or null', () => {
        expect(isMen('F')).toBe(false);
        expect(isMen('X')).toBe(false);
        expect(isMen(null)).toBe(false);
        expect(isMen(undefined)).toBe(false);
    });
});

describe('utils/normalize — isActiveStatus (unchanged)', () => {
    it('returns true for "Identificado" (API convention)', () => {
        expect(isActiveStatus('Identificado')).toBe(true);
        expect(isActiveStatus('identificado')).toBe(true);
    });

    it('returns true for "activo" or "en proceso"', () => {
        expect(isActiveStatus('activo')).toBe(true);
        expect(isActiveStatus('Activo')).toBe(true);
        expect(isActiveStatus('en proceso')).toBe(true);
    });

    it('returns false for graduated states and missing', () => {
        expect(isActiveStatus('Egresado pasantía')).toBe(false);
        expect(isActiveStatus(null)).toBe(false);
    });
});

describe('utils/normalize — isGraduatedStatus (unchanged)', () => {
    it('returns true for "Egresado pasantía"', () => {
        expect(isGraduatedStatus('Egresado pasantía')).toBe(true);
    });

    it('returns true for feminine "Egresada" variant', () => {
        expect(isGraduatedStatus('Egresada fase lectiva')).toBe(true);
    });

    it('returns false for active states and missing', () => {
        expect(isGraduatedStatus('Activo')).toBe(false);
        expect(isGraduatedStatus(null)).toBe(false);
    });
});
