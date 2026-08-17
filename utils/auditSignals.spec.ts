/**
 * Spec unit de utils/auditSignals.ts (AUD-2..AUD-9, AD-4..AD-9).
 *
 * Los fixtures de anomalías usan fechas independientes del reloj del runner:
 * el proyecto unit NO ejecuta tests/setup.ts (el clock congelado solo aplica
 * al proyecto integration, que redefine setupFiles).
 */
import { describe, expect, it } from 'vitest';
import type { Participant } from '../types';
import type { CorruptedRecord, SyncStats } from '../stores/participantStore';
import { AGE_MISMATCH_TOLERANCE_YEARS, computeAuditSignals } from './auditSignals';

let seq = 0;

/** Construye una fila válida con valores por defecto; overrides para el caso. */
const row = (overrides: Partial<Participant> = {}): Participant => {
    seq += 1;
    return {
        id: seq,
        nombres: 'María',
        apellidos: 'De León',
        cedula: '00100000011',
        edad: 30,
        fechaNacimiento: null,
        fechaRegistro: '2025-01-15',
        fechaInclusion: null,
        tutor: null,
        cedulaTutor: null,
        vulnerabilidades: null,
        estado: 'Identificado',
        sexo: 'F',
        provincia: 'Santiago',
        municipio: null,
        centro: 'Centro A',
        direccion: null,
        rutaFormativa: 'Programa A',
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
};

const syncStats = (overrides: Partial<SyncStats> = {}): SyncStats => ({
    loaded: 0,
    errors: 0,
    corrupted: 0,
    duplicated: 0,
    progress: 0,
    erroredPages: [],
    ...overrides
});

describe('utils/auditSignals — duplicados de carga (AUD-2, AD-4/AD-5)', () => {
    it('ids 1001/1002 con fechas iguales → 1 grupo duplicado', () => {
        const data = [
            row({ id: 1001, cedula: '001-0000001-1', fechaRegistro: '2025-01-15' }),
            row({ id: 1002, cedula: '00100000011', fechaRegistro: '2025-01-15' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(1);
        expect(s.duplicados[0].rows.map((r) => r.id)).toEqual([1001, 1002]);
        expect(s.duplicados[0].ruta).toBe('Programa A');
        expect(s.duplicados[0].cedulaConfirmada).toBe(true); // misma cédula normalizada
        expect(s.q2).toHaveLength(0);
    });

    it('fechas separadas 14 meses → NO es duplicado de carga (candidato Q2)', () => {
        const data = [
            row({ id: 3001, fechaRegistro: '2024-01-15' }),
            row({ id: 3002, fechaRegistro: '2025-03-15' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(0);
        expect(s.q2).toHaveLength(1);
    });

    it('ids consecutivos sin fechas parseables → duplicado estructural (AD-5)', () => {
        const data = [
            row({ id: 5001, fechaRegistro: 'no-parseable' }),
            row({ id: 5002, fechaRegistro: 'no-parseable' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(1);
        expect(s.duplicados[0].rows.map((r) => r.id)).toEqual([5001, 5002]);
    });

    it('fila sin cédula válida comparte grupo por nombre (AUD-0)', () => {
        const data = [
            row({ id: 6001, cedula: 'N/D', fechaRegistro: '2025-01-15' }),
            row({ id: 6002, cedula: '00100000011', fechaRegistro: '2025-01-15' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(1);
    });
});

describe('utils/auditSignals — Q2 re-inscripción (AUD-4, AD-6)', () => {
    it('fechas separadas 8 meses en misma ruta → 1 candidato Q2 con fechas visibles', () => {
        const data = [
            row({ id: 2001, fechaRegistro: '2024-01-15' }),
            row({ id: 2002, fechaRegistro: '2024-09-15' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q2).toHaveLength(1);
        expect(s.q2[0].rows).toHaveLength(2);
        expect(s.q2[0].fechas).toEqual(['2024-01-15', '2024-09-15']);
        expect(s.q2[0].ruta).toBe('Programa A');
        expect(s.duplicados).toHaveLength(0);
    });

    it('grupo mixto de 3 filas → 1 duplicado + 1 Q2 (AD-6)', () => {
        const data = [
            row({ id: 4001, fechaRegistro: '2024-01-15' }),
            row({ id: 4002, fechaRegistro: '2024-02-01' }), // 17 días → clúster duplicado
            row({ id: 4003, fechaRegistro: '2024-10-01' }) // ~8 meses → Q2
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(1);
        expect(s.q2).toHaveLength(1);
        expect(s.duplicados[0].rows.map((r) => r.id)).toEqual([4001, 4002]);
        expect(s.q2[0].rows.map((r) => r.id)).toEqual([4003]);
    });
});

describe('utils/auditSignals — Q1 multi-ruta (AUD-3, AD-6)', () => {
    it('homónimos en rutas distintas → 1 candidato Q1 con cedulaConfirmada=false', () => {
        const data = [
            row({ id: 5101, nombres: 'Juan', apellidos: 'Pérez', cedula: '00100000011', rutaFormativa: 'Programa A' }),
            row({ id: 5102, nombres: 'Juan', apellidos: 'Perez', cedula: '00200000022', rutaFormativa: 'Programa B' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q1).toHaveLength(1);
        expect(s.q1[0].rutas).toEqual(['Programa A', 'Programa B']);
        expect(s.q1[0].cedulaConfirmada).toBe(false);
        expect(s.duplicados).toHaveLength(0);
        expect(s.q2).toHaveLength(0);
    });

    it('misma cédula en dos rutas → Q1 confirmado (cedulaConfirmada=true)', () => {
        const data = [
            row({ id: 5201, cedula: '00100000011', rutaFormativa: 'Programa A' }),
            row({ id: 5202, cedula: '001-0000001-1', rutaFormativa: 'Programa B' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q1).toHaveLength(1);
        expect(s.q1[0].cedulaConfirmada).toBe(true);
    });

    it('excluye filas corruptas del agrupamiento por identidad', () => {
        const data = [
            row({ id: 5301, estado: 'GENERIC_ERROR' }),
            row({ id: 5302, estado: 'Identificado' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(0);
        expect(s.q1).toHaveLength(0);
        expect(s.q2).toHaveLength(0);
    });

    it('excluye identidades centinela del agrupamiento', () => {
        const data = [
            row({ id: 5401, nombres: 'N/A', apellidos: 'N/A', fechaRegistro: '2025-01-15' }),
            row({ id: 5402, nombres: 'N/A', apellidos: 'N/A', fechaRegistro: '2025-01-15' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.duplicados).toHaveLength(0);
        expect(s.q1).toHaveLength(0);
        expect(s.q2).toHaveLength(0);
    });
});

describe('utils/auditSignals — ND cédula (AUD-5)', () => {
    it('840 de 2000 sin cédula válida → count 840 y 42.0%', () => {
        const data = Array.from({ length: 2000 }, (_, i) =>
            row({
                id: 7000 + i,
                nombres: `Persona${i}`,
                apellidos: 'Apellido',
                cedula: i < 840 ? 'N/D' : `${i}`.padStart(11, '0')
            })
        );
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.ndCedula.count).toBe(840);
        expect(s.ndCedula.pct).toBe(42.0);
    });

    it('universo sin ND → 0 y 0.0% con lista vacía', () => {
        const data = [
            row({ id: 7101, cedula: '00100000011' }),
            row({ id: 7102, cedula: '00200000022' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.ndCedula.count).toBe(0);
        expect(s.ndCedula.pct).toBe(0.0);
        expect(s.ndCedula.rows).toHaveLength(0);
    });
});

describe('utils/auditSignals — anomalías fecha/edad (AUD-6, AD-8)', () => {
    it('4 sub-checks: futura, inclusión previa, edad vs nacimiento, edadRegistro menor', () => {
        const data = [
            // Fechas elegidas independientes del reloj del runner (el proyecto
            // unit no congela la hora; el integration sí): futura lejana y
            // nacimiento muy antiguo para que el mismatch supere siempre ±2.
            // fechaNacimiento posterior a hoy → anomalía futura
            row({ id: 8101, fechaNacimiento: '2099-01-01', edad: 0 }),
            // inclusión previa al registro
            row({ id: 8102, fechaRegistro: '2025-06-01', fechaInclusion: '2025-01-01' }),
            // edad 30 pero nacimiento 1950-01-01 → ~75 años → mismatch > ±2
            row({ id: 8103, fechaNacimiento: '1950-01-01', edad: 30 }),
            // edadRegistro 35 > edad 30 → imposible
            row({ id: 8104, edad: 30, edadRegistro: 35 })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.anomalias.futura.map((a) => a.row.id)).toEqual([8101]);
        expect(s.anomalias.inclusionPrevia.map((a) => a.row.id)).toEqual([8102]);
        expect(s.anomalias.edadMismatch.map((a) => a.row.id)).toEqual([8103]);
        expect(s.anomalias.edadRegistroMenor.map((a) => a.row.id)).toEqual([8104]);
        expect(s.anomalias.totalFilas).toBe(4);
        expect(AGE_MISMATCH_TOLERANCE_YEARS).toBe(2);
    });

    it('fecha no parseable NO cuenta como anomalía (ya va a AUD-9)', () => {
        const data = [
            row({ id: 8201, fechaNacimiento: 'no-parseable', edad: 30 }),
            row({ id: 8202, fechaRegistro: 'fecha-corrupta' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.anomalias.futura).toHaveLength(0);
        expect(s.anomalias.inclusionPrevia).toHaveLength(0);
        expect(s.anomalias.edadMismatch).toHaveLength(0);
        expect(s.anomalias.edadRegistroMenor).toHaveLength(0);
        expect(s.anomalias.totalFilas).toBe(0);
    });
});

describe('utils/auditSignals — vocabulario de estados (AUD-7, AD-7)', () => {
    it('"En proceso" fuera de vocabulario con count 5; conocidos no marcados', () => {
        const data = [
            row({ id: 9001, estado: 'En proceso' }),
            row({ id: 9002, estado: 'En proceso' }),
            row({ id: 9003, estado: 'En proceso' }),
            row({ id: 9004, estado: 'En proceso' }),
            row({ id: 9005, estado: 'En proceso' }),
            row({ id: 9006, estado: 'Identificado' }),
            row({ id: 9007, estado: 'egresado pasantía' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        const fuera = s.vocabulario.valores.find((v) => v.valor === 'En proceso');
        expect(fuera).toBeDefined();
        expect(fuera!.count).toBe(5);
        expect(fuera!.conocido).toBe(false);
        expect(s.vocabulario.fueraVocabulario).toBe(1);
        const identificado = s.vocabulario.valores.find((v) => v.valor === 'Identificado');
        expect(identificado!.conocido).toBe(true);
        const egresado = s.vocabulario.valores.find((v) => v.valor === 'egresado pasantía');
        expect(egresado!.conocido).toBe(true); // case-insensitive
    });
});

describe('utils/auditSignals — centinelas (AUD-8)', () => {
    it('12 filas con "Sin Centro" → count 12 en el campo centro', () => {
        const data = Array.from({ length: 12 }, (_, i) =>
            row({ id: 9100 + i, nombres: `Persona${i}`, apellidos: 'Apellido', centro: 'Sin Centro' })
        );
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.centinelas.centro).toBe(12);
        expect(s.centinelas.estado).toBe(0);
        expect(s.centinelas.provincia).toBe(0);
        expect(s.centinelas.rutaFormativa).toBe(0);
    });

    it('un centinela por campo (centro/estado/provincia/ruta)', () => {
        const data = [
            row({ id: 9201, nombres: 'A', apellidos: 'B', centro: 'Sin Centro' }),
            row({ id: 9202, nombres: 'C', apellidos: 'D', estado: 'Sin Estado' }),
            row({ id: 9203, nombres: 'E', apellidos: 'F', provincia: 'N/D' }),
            row({ id: 9204, nombres: 'G', apellidos: 'H', rutaFormativa: 's/d' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.centinelas).toEqual({ centro: 1, estado: 1, provincia: 1, rutaFormativa: 1 });
    });
});

describe('utils/auditSignals — corruptos (AUD-9, AD-9)', () => {
    it('sync con 3 corruptos → count 3 y lista con razones', () => {
        const items: CorruptedRecord[] = [
            { id: 1, raw: {}, reason: 'fecha inválida' },
            { id: 2, raw: {}, reason: 'estructura dañada' },
            { id: 3, raw: {}, reason: 'campo desconocido' }
        ];
        const s = computeAuditSignals([], items, syncStats({ corrupted: 3 }));
        expect(s.corruptos.count).toBe(3);
        expect(s.corruptos.items).toHaveLength(3);
        expect(s.corruptos.items[0]).toEqual({ id: 1, reason: 'fecha inválida' });
        expect(s.corruptos.items[2]).toEqual({ id: 3, reason: 'campo desconocido' });
    });

    it('sin corruptos → 0 y lista vacía', () => {
        const s = computeAuditSignals([], [], syncStats({ corrupted: 0 }));
        expect(s.corruptos.count).toBe(0);
        expect(s.corruptos.items).toHaveLength(0);
    });
});

describe('utils/auditSignals — Q3 egreso repetido (AUD-10, AD-6)', () => {
    it('2 filas + 1 "Egresado pasantía" → 1 candidato Q3 con identity/rows/rutas/estados/fechas', () => {
        const data = [
            row({ id: 6001, estado: 'Egresado pasantía' }),
            row({ id: 6002, estado: 'Identificado' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(1);
        expect(s.q3[0].identity).toBeDefined();
        expect(s.q3[0].rows.map((r) => r.id)).toEqual([6001, 6002]);
        expect(s.q3[0].rutas).toEqual(['Programa A']);
        expect(s.q3[0].estados).toEqual(['Egresado pasantía', 'Identificado']);
        expect(s.q3[0].fechas).toEqual(['2025-01-15', '2025-01-15']);
    });

    it('2 filas sin estado egresado → Q3 vacío', () => {
        const data = [
            row({ id: 6003, estado: 'Identificado' }),
            row({ id: 6004, estado: 'Desertor' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(0);
    });

    it('1 sola fila egresado → Q3 vacío (requiere ≥2 filas)', () => {
        const data = [row({ id: 6005, estado: 'Egresado fase lectiva' })];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(0);
    });

    it('1 sola fila sin egresado → Q3 vacío', () => {
        const data = [row({ id: 6006, estado: 'Identificado' })];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(0);
    });

    it('overlap: 2 rutas distintas + egresado → presente en Q1 Y Q3', () => {
        const data = [
            row({ id: 6007, rutaFormativa: 'Programa A', estado: 'Egresado pasantía' }),
            row({ id: 6008, rutaFormativa: 'Programa B', estado: 'Identificado' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q1).toHaveLength(1);
        expect(s.q3).toHaveLength(1);
    });

    it('overlap: misma ruta con fechas distantes + egresado → presente en Q2 Y Q3', () => {
        const data = [
            row({ id: 6009, fechaRegistro: '2024-01-15', estado: 'Egresado pasantía' }),
            row({ id: 6010, fechaRegistro: '2024-09-15', estado: 'Identificado' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q2).toHaveLength(1);
        expect(s.q3).toHaveLength(1);
    });

    it('`estados` mapea `rows` en orden', () => {
        const data = [
            row({ id: 6011, estado: 'Identificado' }),
            row({ id: 6012, estado: 'Egresado pasantía' }),
            row({ id: 6013, estado: 'Desertor' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(1);
        expect(s.q3[0].rows.map((r) => r.id)).toEqual([6011, 6012, 6013]);
        expect(s.q3[0].estados).toEqual(['Identificado', 'Egresado pasantía', 'Desertor']);
    });

    it('corruptos excluidos del agrupamiento → Q3 vacío', () => {
        const data = [
            row({ id: 6014, estado: 'GENERIC_ERROR' }),
            row({ id: 6015, estado: 'Egresado pasantía' })
        ];
        const s = computeAuditSignals(data, [], syncStats());
        expect(s.q3).toHaveLength(0);
    });
});
