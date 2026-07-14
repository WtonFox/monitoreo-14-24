/**
 * Participant factory helpers (design §3).
 *
 * Each function returns a `Participant` shaped to exercise a specific branch
 * in `utils/dataUtils.ts` and the normalized-vocabulary branches in
 * `utils/normalize.ts`. Factories mutate on top of a base "valid" row so
 * every case is structurally consistent: callers can spread the result and
 * override individual fields.
 *
 * String sentinels here mirror the vocabulary the source code uses to mean
 * "missing", per exploration:
 *   - 'N/D'  : reported by the API when the field is genuinely absent
 *   - 'N/A'  : reported by sanitizeParticipant as a fallback for text fields
 *   - ''     : empty string fallback path inside sanitizeParticipant
 */
import { FROZEN_TIME } from '../setup';

export type ParticipantOverrides = Partial<import('../../types').Participant>;

const ISO_NOW = FROZEN_TIME.toISOString();

export function validParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    return {
        id: 1,
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
        programasSociales: null,
        ...overrides
    };
}

export function minimalParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    return {
        id: 2,
        nombres: 'Juan',
        apellidos: 'García',
        cedula: null,
        edad: 0,
        fechaNacimiento: ISO_NOW,
        fechaRegistro: ISO_NOW,
        fechaInclusion: null,
        tutor: null,
        cedulaTutor: null,
        vulnerabilidades: null,
        estado: null,
        sexo: null,
        provincia: null,
        municipio: null,
        centro: null,
        direccion: null,
        rutaFormativa: null,
        telefonos: null,
        telefonosResponsable: null,
        edadRegistro: 0,
        estadoCivil: null,
        nivelEstudio: null,
        alergias: null,
        discapacidades: null,
        enfermedades: null,
        programasSociales: null,
        ...overrides
    };
}

export function missingDatesParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    // Both fechaNacimiento and fechaRegistro fall through getValue's null
    // path; sanitizeParticipant fabricates today's timestamp for both
    // (current behaviour, flagged as H1 / M4).
    const base = validParticipant();
    const sanitized: import('../../types').Participant = {
        ...base,
        id: 3,
        // getValue rejects undefined/null/'' and returns null; sanitizeParticipant
        // then uses new Date().toISOString() for both date fields.
        fechaNacimiento: undefined as unknown as string,
        fechaRegistro: undefined as unknown as string,
        ...overrides
    };
    return sanitized;
}

export function malformedParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    // Inputs whose `nombres` is non-string and other fields garbage; the
    // source casts via String(...) and yields the same shape regardless.
    return {
        id: 4,
        nombres: 42 as unknown as string,
        apellidos: null,
        cedula: '',
        edad: -3,
        fechaNacimiento: 'not-a-date',
        fechaRegistro: 'not-a-date',
        fechaInclusion: 'not-a-date',
        tutor: ' ',
        cedulaTutor: '',
        vulnerabilidades: 'N/D',
        estado: '',
        sexo: '',
        provincia: '',
        municipio: null,
        centro: '',
        direccion: null,
        rutaFormativa: '',
        telefonos: '',
        telefonosResponsable: '',
        edadRegistro: -1,
        estadoCivil: 'N/D',
        nivelEstudio: '',
        alergias: '',
        discapacidades: '',
        enfermedades: '',
        programasSociales: '',
        ...overrides
    };
}

export function nonObjectParticipant(): unknown {
    // The source's first guard branches on non-object input.
    return 'this-is-a-string-not-an-object';
}

export function unknownSexParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    return {
        ...validParticipant(),
        id: 5,
        sexo: 'X',
        ...overrides
    };
}

export function zeroAgeParticipant(overrides: ParticipantOverrides = {}): import('../../types').Participant {
    return {
        ...validParticipant(),
        id: 6,
        edad: 0,
        edadRegistro: 0,
        ...overrides
    };
}

export function corruptRowParticipant(): import('../../types').Participant {
    // Mirrors the canonical "corrupto" branch inside sanitizeParticipant
    // when `p` is non-object: nombres/apellidos become REGISTRO/DAÑADO,
    // estado becomes DATA_CORRUPTA, sexo becomes 'N/D'.
    return {
        id: 7,
        nombres: 'REGISTRO',
        apellidos: 'DAÑADO',
        cedula: 'N/D',
        edad: 0,
        fechaNacimiento: ISO_NOW,
        fechaRegistro: ISO_NOW,
        fechaInclusion: null,
        tutor: null,
        cedulaTutor: null,
        vulnerabilidades: null,
        estado: 'DATA_CORRUPTA',
        sexo: 'N/D',
        provincia: null,
        municipio: null,
        centro: null,
        direccion: null,
        rutaFormativa: null,
        telefonos: null,
        telefonosResponsable: null,
        edadRegistro: 0,
        estadoCivil: null,
        nivelEstudio: null,
        alergias: null,
        discapacidades: null,
        enfermedades: null,
        programasSociales: null
    };
}
