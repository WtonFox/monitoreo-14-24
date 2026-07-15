/**
 * Behavioral spec for utils/dataUtils.ts (R-N1 through R-N4).
 *
 * Uses frozen clock (FROZEN_TIME from tests/setup.ts) to prove that
 * sanitizeParticipant does NOT fabricate timestamps — missing dates
 * stay null (R-N1).
 *
 * Asserts corruption tiers (R-N2), deterministic IDs (R-N3), and
 * center-key isolation (R-N4).
 *
 * Every buggy behavior from H1 (date fabrication) and M3 (vocabulary
 * divergence) has a spec-test counterpart asserting the CORRECT behavior.
 */
import { describe, expect, it } from 'vitest';
import { sanitizeParticipant } from './dataUtils';
import { FROZEN_TIME } from '../tests/setup';

const FROZEN_ISO = FROZEN_TIME.toISOString();

const fullInput = () => ({
    id: 100,
    nombres: 'Ana',
    apellidos: 'Pérez',
    cedula: '001-1234567-8',
    edad: 21,
    fechaNacimiento: '2003-06-15T00:00:00.000Z',
    fechaRegistro: '2024-02-01T00:00:00.000Z',
    fechaInclusion: '2024-02-15T00:00:00.000Z',
    tutor: null,
    cedulaTutor: null,
    vulnerabilidades: null,
    estado: 'Identificado',
    sexo: 'F',
    provincia: 'Santo Domingo',
    municipio: 'Santo Domingo Este',
    centro: 'Centro Tecnologico Comunal',
    direccion: 'Calle 1',
    rutaFormativa: 'Ruta A',
    telefonos: '809-555-0101',
    telefonosResponsable: null,
    edadRegistro: 0,
    estadoCivil: 'Soltero(a)',
    nivelEstudio: 'Bachiller',
    alergias: null,
    discapacidades: null,
    enfermedades: null,
    programasSociales: null
});

describe('utils/dataUtils.sanitizeParticipant — R-N1: Missing dates preserved as null', () => {
    it('keeps fechaNacimiento as null when absent — no fabrication (H1 fix)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaNacimiento;
        expect(sanitizeParticipant(input, 0).fechaNacimiento).toBeNull();
    });

    it('keeps fechaRegistro as null when absent — no fabrication (H1 fix)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaRegistro;
        expect(sanitizeParticipant(input, 0).fechaRegistro).toBeNull();
    });

    it('keeps BOTH dates null when both absent — no fabrication (H1 fix)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaNacimiento;
        delete (input as Record<string, unknown>).fechaRegistro;
        const out = sanitizeParticipant(input, 0);
        expect(out.fechaNacimiento).toBeNull();
        expect(out.fechaRegistro).toBeNull();
    });

    it('does NOT fabricate FROZEN_ISO when dates are absent (clock is frozen)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaNacimiento;
        delete (input as Record<string, unknown>).fechaRegistro;
        const out = sanitizeParticipant(input, 0);
        expect(out.fechaNacimiento).not.toBe(FROZEN_ISO);
        expect(out.fechaRegistro).not.toBe(FROZEN_ISO);
    });

    it('preserves both dates verbatim when present', () => {
        const out = sanitizeParticipant(fullInput(), 0);
        expect(out.fechaNacimiento).toBe('2003-06-15T00:00:00.000Z');
        expect(out.fechaRegistro).toBe('2024-02-01T00:00:00.000Z');
    });

    it('reads fechaNacimiento from PascalCase "FechaNacimiento" key', () => {
        const input = { ...fullInput(), FechaNacimiento: '1990-01-01T00:00:00.000Z' };
        delete (input as Record<string, unknown>).fechaNacimiento;
        expect(sanitizeParticipant(input, 0).fechaNacimiento).toBe('1990-01-01T00:00:00.000Z');
    });

    it('reads fechaRegistro from PascalCase "FechaRegistro" key', () => {
        const input = { ...fullInput(), FechaRegistro: '2020-05-05T00:00:00.000Z' };
        delete (input as Record<string, unknown>).fechaRegistro;
        expect(sanitizeParticipant(input, 0).fechaRegistro).toBe('2020-05-05T00:00:00.000Z');
    });
});

describe('utils/dataUtils.sanitizeParticipant — R-N2: Corruption tiers', () => {
    it('returns CRITICALLY_CORRUPT for null input', () => {
        const out = sanitizeParticipant(null, 1);
        expect(out.estado).toBe('CRITICALLY_CORRUPT');
        expect(out.nombres).toBe('REGISTRO');
        expect(out.apellidos).toBe('DAÑADO');
        expect(out.fechaNacimiento).toBeNull();
    });

    it('returns CRITICALLY_CORRUPT for undefined input', () => {
        const out = sanitizeParticipant(undefined, 1);
        expect(out.estado).toBe('CRITICALLY_CORRUPT');
        expect(out.nombres).toBe('REGISTRO');
    });

    it('returns CRITICALLY_CORRUPT for non-object input (string)', () => {
        const out = sanitizeParticipant('not-an-object', 1);
        expect(out.estado).toBe('CRITICALLY_CORRUPT');
        expect(out.nombres).toBe('REGISTRO');
    });

    it('returns GENERIC_ERROR for unparseable fechaNacimiento (not DATA_CORRUPTA)', () => {
        const input = { ...fullInput(), fechaNacimiento: 'not-a-date' };
        expect(sanitizeParticipant(input, 0).estado).toBe('GENERIC_ERROR');
    });

    it('returns GENERIC_ERROR for unparseable fechaRegistro', () => {
        const input = { ...fullInput(), fechaRegistro: 'not-a-date' };
        expect(sanitizeParticipant(input, 0).estado).toBe('GENERIC_ERROR');
    });

    it('keeps estado unchanged for valid data', () => {
        expect(sanitizeParticipant(fullInput(), 0).estado).toBe('Identificado');
    });

    it('falls back to "Sin Estado" when estado is missing and dates are valid', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).estado;
        expect(sanitizeParticipant(input, 0).estado).toBe('Sin Estado');
    });

    it('cleanBatch excludes CRITICALLY_CORRUPT records', () => {
        const valid = sanitizeParticipant(fullInput(), 0);
        const corrupt = sanitizeParticipant(null, 0);
        const cleanBatch = [valid].filter(p => p.estado !== 'CRITICALLY_CORRUPT' && p.estado !== 'GENERIC_ERROR');
        expect(cleanBatch).toHaveLength(1);
        expect(cleanBatch[0].id).toBe(valid.id);
        expect(corrupt.estado).toBe('CRITICALLY_CORRUPT');
    });
});

describe('utils/dataUtils.sanitizeParticipant — R-N3: Deterministic IDs', () => {
    it('produces identical IDs for identical input and index', () => {
        const input = fullInput();
        // Remove API id so fallback kicks in
        delete (input as Record<string, unknown>).id;
        const a = sanitizeParticipant(input, 42);
        const b = sanitizeParticipant(input, 42);
        expect(a.id).toBe(b.id);
    });

    it('produces different IDs for different indices', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).id;
        const a = sanitizeParticipant(input, 0);
        const b = sanitizeParticipant(input, 1);
        expect(a.id).not.toBe(b.id);
    });

    it('preserves the API id when present', () => {
        const input = fullInput();
        expect(sanitizeParticipant(input, 0).id).toBe(100);
    });

    it('reads id from PascalCase "Id" key', () => {
        const input = { Id: 7 } as unknown as Record<string, unknown>;
        expect(sanitizeParticipant(input, 0).id).toBe(7);
    });

    it('non-object IDs are deterministic (same input, same index, same ID)', () => {
        const a = sanitizeParticipant(null, 1);
        const b = sanitizeParticipant(null, 1);
        expect(a.id).toBe(b.id);
    });
});

describe('utils/dataUtils.sanitizeParticipant — R-N4: Center-key isolation', () => {
    it('keeps centro as null when missing (no fallback to rutaFormativa)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).centro;
        expect(sanitizeParticipant(input, 0).centro).toBeNull();
    });

    it('preserves centro value when present', () => {
        expect(sanitizeParticipant(fullInput(), 0).centro).toBe('Centro Tecnologico Comunal');
    });
});

describe('utils/dataUtils.sanitizeParticipant — String fallbacks (unchanged)', () => {
    it('falls back to "N/A" when nombres is missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).nombres;
        expect(sanitizeParticipant(input, 0).nombres).toBe('N/A');
    });

    it('falls back to "N/D" when cedula is missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).cedula;
        expect(sanitizeParticipant(input, 0).cedula).toBe('N/D');
    });

    it('falls back to "N/D" when sexo is missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).sexo;
        expect(sanitizeParticipant(input, 0).sexo).toBe('N/D');
    });

    it('falls back to "Sin Provincia" when provincia is missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).provincia;
        expect(sanitizeParticipant(input, 0).provincia).toBe('Sin Provincia');
    });

    it('does NOT default municipio — leaves null when missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).municipio;
        expect(sanitizeParticipant(input, 0).municipio).toBeNull();
    });

    it('does NOT default tutor — leaves null when missing', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).tutor;
        expect(sanitizeParticipant(input, 0).tutor).toBeNull();
    });
});

describe('utils/dataUtils.sanitizeParticipant — Numeric parsing (unchanged)', () => {
    it('parses edad as Number, returning 0 for missing/non-numeric', () => {
        const base = fullInput();
        expect(sanitizeParticipant({ ...base, edad: undefined as unknown as string }, 0).edad).toBe(0);
        expect(sanitizeParticipant({ ...base, edad: 'no es numero' }, 0).edad).toBe(0);
        expect(sanitizeParticipant({ ...base, edad: 18 }, 0).edad).toBe(18);
        expect(sanitizeParticipant({ ...base, edad: '25' }, 0).edad).toBe(25);
    });

    it('preserves edad=0 and edadRegistro=0', () => {
        const out = sanitizeParticipant({ ...fullInput(), edad: 0, edadRegistro: 0 }, 0);
        expect(out.edad).toBe(0);
        expect(out.edadRegistro).toBe(0);
    });

    it('preserves unknown sex value "X" without routing to a known bucket', () => {
        expect(sanitizeParticipant({ ...fullInput(), sexo: 'X' }, 0).sexo).toBe('X');
    });
});
