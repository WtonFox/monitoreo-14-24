import { Participant } from '../types';

/**
 * Helper para extraer valor de forma segura desde objeto de API
 * Intenta diferentes convenciones de nombres (exact, PascalCase, camelCase)
 */
/** Limpia entidades HTML residuales que llegan desde la API (&#x0D;, &#x0A;, &amp;, etc.) */
const stripHtmlEntities = (s: string): string =>
    s.replace(/&#x[0-9A-Fa-f]+;/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();

const getValue = (p: any, key: string): string | null => {
    // 1. Intento exacto (prioridad al esquema)
    if (p[key] !== undefined && p[key] !== null && p[key] !== '') {
        return stripHtmlEntities(String(p[key]));
    }

    // 2. Intento PascalCase (convención .NET común)
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (p[pascal] !== undefined && p[pascal] !== null && p[pascal] !== '') {
        return stripHtmlEntities(String(p[pascal]));
    }

    // 3. Intento camelCase
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (p[camel] !== undefined && p[camel] !== null && p[camel] !== '') {
        return stripHtmlEntities(String(p[camel]));
    }

    return null;
};

/**
 * Helper para extraer valores numéricos de forma segura
 */
const getNumericValue = (p: any, key: string): number => {
    const raw = p[key] || p[key.charAt(0).toUpperCase() + key.slice(1)] || p[key.charAt(0).toLowerCase() + key.slice(1)];
    const parsed = Number(raw);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : 0;
};

/**
 * Deterministic hash (DJB2) for fallback participant IDs.
 * Same input always produces the same output.
 */
function stableHash(input: string): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Checks whether a string value represents a valid ISO date.
 * Returns true for null/undefined (missing dates are valid — they stay null).
 */
function isValidDate(value: string | null | undefined): boolean {
    if (value === null || value === undefined) return true;
    const d = new Date(value);
    return !isNaN(d.getTime());
}

/**
 * Sanitiza y normaliza un participante desde la respuesta de la API
 * Maneja múltiples convenciones de nombres y datos inválidos
 */
export const sanitizeParticipant = (p: any, index: number): Participant => {
    // Validación básica de estructura
    if (!p || typeof p !== 'object') {
        console.warn('Registro con estructura inválida:', p);
        return {
            id: stableHash(String(index) + ':' + String(p)),
            nombres: 'REGISTRO',
            apellidos: 'DAÑADO',
            cedula: 'N/D',
            edad: 0,
            fechaNacimiento: null,
            fechaRegistro: null,
            fechaInclusion: null,
            tutor: null,
            cedulaTutor: null,
            vulnerabilidades: null,
            estado: 'CRITICALLY_CORRUPT',
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

    // Mapeo directo - la API incluye todos los campos necesarios
    const fechaNacimiento = getValue(p, 'fechaNacimiento') || null;
    const fechaRegistro = getValue(p, 'fechaRegistro') || null;

    // Detect logical corruption: dates that are present but unparseable
    const hasCorruptDates =
        (fechaNacimiento !== null && !isValidDate(fechaNacimiento)) ||
        (fechaRegistro !== null && !isValidDate(fechaRegistro));

    return {
        id: p.id || p.Id || stableHash(String(index) + ':' + JSON.stringify(p)),
        nombres: getValue(p, 'nombres') || 'N/A',
        apellidos: getValue(p, 'apellidos') || 'N/A',
        cedula: getValue(p, 'cedula') || 'N/D',
        edad: getNumericValue(p, 'edad'),
        fechaNacimiento,
        fechaRegistro,
        fechaInclusion: getValue(p, 'fechaInclusion'),
        tutor: getValue(p, 'tutor'),
        cedulaTutor: getValue(p, 'cedulaTutor'),
        vulnerabilidades: getValue(p, 'vulnerabilidades'),
        estado: hasCorruptDates ? 'GENERIC_ERROR' : (getValue(p, 'estado') || 'Sin Estado'),
        sexo: getValue(p, 'sexo') || 'N/D',
        provincia: getValue(p, 'provincia') || 'Sin Provincia',
        municipio: getValue(p, 'municipio'),
        centro: getValue(p, 'centro'),
        direccion: getValue(p, 'direccion'),
        rutaFormativa: getValue(p, 'rutaFormativa'),
        telefonos: getValue(p, 'telefonos'),
        telefonosResponsable: getValue(p, 'telefonosResponsable'),
        edadRegistro: getNumericValue(p, 'edadRegistro'),
        estadoCivil: getValue(p, 'estadoCivil'),
        nivelEstudio: getValue(p, 'nivelEstudio'),
        alergias: getValue(p, 'alergias'),
        discapacidades: getValue(p, 'discapacidades'),
        enfermedades: getValue(p, 'enfermedades'),
        programasSociales: getValue(p, 'programasSociales')
    };
};
