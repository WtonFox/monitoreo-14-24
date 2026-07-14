/**
 * Characterization suite for utils/dataUtils.ts (design §6, spec R-verify-6).
 *
 * These tests document the CURRENT behaviour of `sanitizeParticipant`,
 * including known fabrication and corrupt-row bugs. They are NOT meant to
 * encode a desired contract — that contract lands in M4 (H1). Per spec:
 *   - failing tests = regression; revert the WU.
 *   - passing tests = behaviour is locked in until the M4 refactor lands.
 *
 * The M3a green gate (`npm run test:unit`) MUST exit 0 with all 25 cases
 * passing. Helpers used here live in tests/setup.ts and import the frozen
 * clock (`FROZEN_TIME`) for stable fabricated-date assertions.
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

describe('utils/dataUtils.sanitizeParticipant (characterization — 25 cases)', () => {
    // 1. Date fabrication (current behaviour — see M4/H1): 3 cases
    it("fabricates today's ISO timestamp when fechaNacimiento is missing (current behaviour — see M4/H1)", () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaNacimiento;
        expect(sanitizeParticipant(input, 0).fechaNacimiento).toBe(FROZEN_ISO);
    });

    it("fabricates today's ISO timestamp when fechaRegistro is missing (current behaviour — see M4/H1)", () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaRegistro;
        expect(sanitizeParticipant(input, 0).fechaRegistro).toBe(FROZEN_ISO);
    });

    it("fabricates today's ISO timestamp when both fechaNacimiento and fechaRegistro are missing (current behaviour — see M4/H1)", () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).fechaNacimiento;
        delete (input as Record<string, unknown>).fechaRegistro;
        const out = sanitizeParticipant(input, 0);
        expect(out.fechaNacimiento).toBe(FROZEN_ISO);
        expect(out.fechaRegistro).toBe(FROZEN_ISO);
    });

    // 4. Date preservation (current behaviour): 1 combined case
    it('preserves both fechaNacimiento and fechaRegistro verbatim when present (current behaviour)', () => {
        const out = sanitizeParticipant(fullInput(), 0);
        expect(out.fechaNacimiento).toBe('2003-06-15T00:00:00.000Z');
        expect(out.fechaRegistro).toBe('2024-02-01T00:00:00.000Z');
    });

    // 5–6. PascalCase key fallback (current behaviour — .NET API convention)
    it('reads fechaNacimiento from "FechaNacimiento" PascalCase key (current behaviour)', () => {
        const input = { ...fullInput(), FechaNacimiento: '1990-01-01T00:00:00.000Z' };
        delete (input as Record<string, unknown>).fechaNacimiento;
        expect(sanitizeParticipant(input, 0).fechaNacimiento).toBe('1990-01-01T00:00:00.000Z');
    });

    it('reads fechaRegistro from "FechaRegistro" PascalCase key (current behaviour)', () => {
        const input = { ...fullInput(), FechaRegistro: '2020-05-05T00:00:00.000Z' };
        delete (input as Record<string, unknown>).fechaRegistro;
        expect(sanitizeParticipant(input, 0).fechaRegistro).toBe('2020-05-05T00:00:00.000Z');
    });

    // 7–9. String fallback defaults (current behaviour)
    it('falls back to "N/A" when nombres is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).nombres;
        expect(sanitizeParticipant(input, 0).nombres).toBe('N/A');
    });

    it('falls back to "N/A" when apellidos is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).apellidos;
        expect(sanitizeParticipant(input, 0).apellidos).toBe('N/A');
    });

    it('falls back to "N/D" when cedula is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).cedula;
        expect(sanitizeParticipant(input, 0).cedula).toBe('N/D');
    });

    // 10–12. Numeric parsing (current behaviour)
    it('parses edad as Number, returning 0 for missing/non-numeric and the parsed value otherwise (current behaviour)', () => {
        const base = fullInput();
        expect(sanitizeParticipant({ ...base, edad: undefined as unknown as string }, 0).edad).toBe(0);
        expect(sanitizeParticipant({ ...base, edad: 'no es numero' }, 0).edad).toBe(0);
        expect(sanitizeParticipant({ ...base, edad: 18 }, 0).edad).toBe(18);
        expect(sanitizeParticipant({ ...base, edad: '25' }, 0).edad).toBe(25);
    });

    it('parses edadRegistro as Number, returning 0 for missing/non-numeric (current behaviour)', () => {
        const base = fullInput();
        expect(sanitizeParticipant({ ...base, edadRegistro: undefined as unknown as string }, 0).edadRegistro).toBe(0);
        expect(sanitizeParticipant({ ...base, edadRegistro: 'no es numero' }, 0).edadRegistro).toBe(0);
    });

    it('preserves edad=0 and edadRegistro=0 (current behaviour — see M5 denominator flag)', () => {
        const out = sanitizeParticipant({ ...fullInput(), edad: 0, edadRegistro: 0 }, 0);
        expect(out.edad).toBe(0);
        expect(out.edadRegistro).toBe(0);
    });

    // 13–17. Status / sex / location fallbacks (current behaviour)
    it('falls back to "Sin Estado" when estado is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).estado;
        expect(sanitizeParticipant(input, 0).estado).toBe('Sin Estado');
    });

    it('falls back to "N/D" when sexo is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).sexo;
        expect(sanitizeParticipant(input, 0).sexo).toBe('N/D');
    });

    it('falls back to "Sin Provincia" when provincia is missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).provincia;
        expect(sanitizeParticipant(input, 0).provincia).toBe('Sin Provincia');
    });

    it('does NOT default municipio — leaves it null when missing (current behaviour — see M4/H1)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).municipio;
        expect(sanitizeParticipant(input, 0).municipio).toBeNull();
    });

    it('does NOT default tutor — leaves it null when missing (current behaviour — see M4/H1)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).tutor;
        expect(sanitizeParticipant(input, 0).tutor).toBeNull();
    });

    // 18–20. Centro resolution (current behaviour)
    it('uses rutaFormativa as a centro fallback when centro is missing (current behaviour)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).centro;
        expect(sanitizeParticipant(input, 0).centro).toBe('Ruta A');
    });

    it('uses "Sin Centro" when both centro and rutaFormativa are missing (current fallback)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).centro;
        delete (input as Record<string, unknown>).rutaFormativa;
        expect(sanitizeParticipant(input, 0).centro).toBe('Sin Centro');
    });

    it('prefers explicit centro over rutaFormativa when both are present (current behaviour)', () => {
        expect(sanitizeParticipant(fullInput(), 0).centro).toBe('Centro Tecnologico Comunal');
    });

    // 21–22. id resolution (current behaviour)
    it('uses the provided index when both p.id and p.Id are missing (current behaviour)', () => {
        const input = fullInput();
        delete (input as Record<string, unknown>).id;
        expect(sanitizeParticipant(input, 42).id).toBe(42);
    });

    it('reads id from the PascalCase "Id" key when present (current behaviour — .NET convention)', () => {
        const input = { Id: 7 } as unknown as Record<string, unknown>;
        expect(sanitizeParticipant(input, 0).id).toBe(7);
    });

    // 23–24. Non-object / corrupt input (current behaviour — see M4/H1)
    it('returns the REGISTRO DAÑADO / DATA_CORRUPTA shape when input is null (current behaviour — see M4/H1)', () => {
        const out = sanitizeParticipant(null, 1);
        expect(out.nombres).toBe('REGISTRO');
        expect(out.apellidos).toBe('DAÑADO');
        expect(out.estado).toBe('DATA_CORRUPTA');
        expect(out.sexo).toBe('N/D');
        expect(out.fechaNacimiento).toBe(FROZEN_ISO);
        expect(typeof out.id).toBe('number');
    });

    it('returns the REGISTRO DAÑADO shape when input is undefined or a primitive string (current behaviour — see M4/H1)', () => {
        const undef = sanitizeParticipant(undefined, 1);
        expect(undef.nombres).toBe('REGISTRO');
        expect(undef.apellidos).toBe('DAÑADO');
        expect(undef.estado).toBe('DATA_CORRUPTA');

        const str = sanitizeParticipant('a string, not an object', 1);
        expect(str.nombres).toBe('REGISTRO');
        expect(str.apellidos).toBe('DAÑADO');
        expect(str.estado).toBe('DATA_CORRUPTA');
        expect(str.sexo).toBe('N/D');
    });

    // 25. Unknown sex preservation (current behaviour)
    it('preserves unknown sex value "X" without routing to a known bucket (current behaviour — see M5 denominator flag)', () => {
        expect(sanitizeParticipant({ ...fullInput(), sexo: 'X' }, 0).sexo).toBe('X');
    });
});
