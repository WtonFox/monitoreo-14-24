import { Participant } from '../types';

/**
 * Helper para extraer valor de forma segura desde objeto de API
 * Intenta diferentes convenciones de nombres (exact, PascalCase, camelCase)
 */
const getValue = (p: any, key: string): string | null => {
    // 1. Intento exacto (prioridad al esquema)
    if (p[key] !== undefined && p[key] !== null && p[key] !== '') {
        return String(p[key]).trim();
    }

    // 2. Intento PascalCase (convención .NET común)
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (p[pascal] !== undefined && p[pascal] !== null && p[pascal] !== '') {
        return String(p[pascal]).trim();
    }

    // 3. Intento camelCase
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (p[camel] !== undefined && p[camel] !== null && p[camel] !== '') {
        return String(p[camel]).trim();
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
 * Sanitiza y normaliza un participante desde la respuesta de la API
 * Maneja múltiples convenciones de nombres y datos inválidos
 */
export const sanitizeParticipant = (p: any, index: number): Participant => {
    // Validación básica de estructura
    if (!p || typeof p !== 'object') {
        console.warn('Registro con estructura inválida:', p);
        return {
            id: Math.floor(Math.random() * 1000000) + index,
            nombres: 'REGISTRO',
            apellidos: 'DAÑADO',
            cedula: 'N/D',
            edad: 0,
            fechaNacimiento: new Date().toISOString(),
            fechaRegistro: new Date().toISOString(),
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

    // Mapeo directo - la API incluye todos los campos necesarios
    return {
        id: p.id || p.Id || index,
        nombres: getValue(p, 'nombres') || 'N/A',
        apellidos: getValue(p, 'apellidos') || 'N/A',
        cedula: getValue(p, 'cedula') || 'N/D',
        edad: getNumericValue(p, 'edad'),
        fechaNacimiento: getValue(p, 'fechaNacimiento') || new Date().toISOString(),
        fechaRegistro: getValue(p, 'fechaRegistro') || new Date().toISOString(),
        fechaInclusion: getValue(p, 'fechaInclusion'),
        tutor: getValue(p, 'tutor'),
        cedulaTutor: getValue(p, 'cedulaTutor'),
        vulnerabilidades: getValue(p, 'vulnerabilidades'),
        estado: getValue(p, 'estado') || 'Sin Estado',
        sexo: getValue(p, 'sexo') || 'N/D',
        provincia: getValue(p, 'provincia') || 'Sin Provincia',
        municipio: getValue(p, 'municipio'),
        centro: getValue(p, 'centro') || getValue(p, 'rutaFormativa') || 'Sin Centro',
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
