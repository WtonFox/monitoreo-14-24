/**
 * Señales de auditoría de datos (AUD-2..AUD-9, AD-4..AD-9).
 *
 * computeAuditSignals recorre filteredData una sola vez (O(n)) construyendo
 * un Map<identidad, filas[]> que excluye filas corruptas e identidades
 * centinela; luego clasifica cada grupo con ≥2 filas (Q1/Q2/duplicados).
 * Las demás señales (ND cédula, anomalías, vocabulario, centinelas,
 * corruptos) se acumulan en la misma pasada.
 *
 * Los grupos Q1/Q2/duplicados son heurísticas sobre identidad normalizada:
 * siempre se reportan como candidatos, nunca como afirmaciones (AUD-12).
 */
import type { Participant } from '../types';
import type { CorruptedRecord, SyncStats } from '../stores/participantStore';
import { isNotAvailable } from './normalize';
import { normalizeCedula, normalizeIdentity } from './auditIdentity';

/** Umbral T1 (AD-4): dos registros separados por más de 30 días no son una carga duplicada. */
export const DUPLICATE_WINDOW_DAYS = 30;

/** Tolerancia de la edad vs fechaNacimiento (AD-8). */
export const AGE_MISMATCH_TOLERANCE_YEARS = 2;

/**
 * Vocabulario efectivo de estados (AD-7): los 8 estados reales de la API +
 * "Sin Estado" (centinela de AUD-8). Comparación case-insensitive; los
 * valores fuera del set se marcan en la señal vocabulario.
 */
export const AUDIT_STATUS_VOCABULARY: readonly string[] = [
    'identificado',
    'egresado pasantía',
    'egresado fase lectiva',
    'desertor',
    'no admitido',
    'baja',
    'cancelado',
    'inactivo',
    'sin estado'
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Estados que el sync marca como corruptos (AUD-9). */
const isCorruptRow = (row: Participant): boolean =>
    row.estado === 'GENERIC_ERROR' || row.estado === 'CRITICALLY_CORRUPT';

/** Parsea una fecha ISO; null si está ausente o no es parseable (AD-8). */
const parseDate = (value: string | null): Date | null => {
    if (value === null || value === undefined || value.trim() === '') return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

/** Edad en años cumplidos a la fecha `at`. */
const ageAt = (birth: Date, at: Date): number => {
    let age = at.getFullYear() - birth.getFullYear();
    const m = at.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && at.getDate() < birth.getDate())) age -= 1;
    return age;
};

/** true si ≥2 filas del grupo comparten la misma cédula normalizada no nula. */
const hasConfirmedCedula = (rows: Participant[]): boolean => {
    const seen = new Set<string>();
    for (const row of rows) {
        const cedula = normalizeCedula(row.cedula);
        if (cedula === null) continue;
        if (seen.has(cedula)) return true;
        seen.add(cedula);
    }
    return false;
};

/** Rutas formativas reales (excluye centinelas vía isNotAvailable). */
const distinctRealRoutes = (rows: Participant[]): Set<string> => {
    const routes = new Set<string>();
    for (const row of rows) {
        const ruta = row.rutaFormativa;
        if (ruta !== null && ruta !== undefined && !isNotAvailable(ruta)) routes.add(ruta.trim());
    }
    return routes;
};

export interface Anomalia {
    row: Participant;
}

export interface DuplicateGroup {
    identity: string;
    ruta: string;
    rows: Participant[];
    fechas: string[];
    cedulaConfirmada: boolean;
}

export interface Q1Candidate {
    identity: string;
    rutas: string[];
    rows: Participant[];
    cedulaConfirmada: boolean;
}

export interface Q2Candidate {
    identity: string;
    ruta: string;
    rows: Participant[];
    fechas: string[];
}

export interface AuditSignals {
    duplicados: DuplicateGroup[];
    q1: Q1Candidate[];
    q2: Q2Candidate[];
    ndCedula: { count: number; pct: number; rows: Participant[] };
    anomalias: {
        totalFilas: number;
        futura: Anomalia[];
        inclusionPrevia: Anomalia[];
        edadMismatch: Anomalia[];
        edadRegistroMenor: Anomalia[];
    };
    vocabulario: { valores: { valor: string; count: number; conocido: boolean }[]; fueraVocabulario: number };
    centinelas: { centro: number; estado: number; provincia: number; rutaFormativa: number };
    corruptos: { count: number; items: { id: number; reason: string }[] };
}

/**
 * Clasifica un grupo con la MISMA ruta (AD-4/AD-5/AD-6): clústeres de filas
 * con fechaRegistro a ≤T1 → duplicados de carga; filas sin fecha parseable se
 * refuerzan por ids consecutivos (|idA−idB| === 1); el resto del grupo pasa a
 * Q2 (re-inscripción candidata). Un grupo mixto produce 1 duplicado + 1 Q2.
 */
const classifySameRoute = (
    identity: string,
    rows: Participant[],
    duplicados: DuplicateGroup[],
    q2: Q2Candidate[]
): void => {
    const routes = distinctRealRoutes(rows);
    const ruta = routes.size === 1 ? [...routes][0] : (rows[0]?.rutaFormativa ?? '');

    const dated: Participant[] = [];
    const undated: Participant[] = [];
    for (const row of rows) {
        (parseDate(row.fechaRegistro) !== null ? dated : undated).push(row);
    }

    const dupRows: Participant[] = [];

    const emitCluster = (cluster: Participant[]): void => {
        if (cluster.length < 2) return;
        duplicados.push({
            identity,
            ruta,
            rows: cluster,
            fechas: cluster.map((row) => row.fechaRegistro ?? ''),
            cedulaConfirmada: hasConfirmedCedula(cluster)
        });
        dupRows.push(...cluster);
    };

    // Clústeres por gap de fecha ≤ T1 (las fechas parseables mandan, AD-4/AD-6).
    const dateOf = (row: Participant): number => (parseDate(row.fechaRegistro) as Date).getTime();
    dated.sort((a, b) => dateOf(a) - dateOf(b));
    let cluster: Participant[] = [];
    for (const row of dated) {
        if (cluster.length === 0) {
            cluster = [row];
            continue;
        }
        const gapDays = (dateOf(row) - dateOf(cluster[cluster.length - 1])) / DAY_MS;
        if (gapDays <= DUPLICATE_WINDOW_DAYS) {
            cluster.push(row);
        } else {
            emitCluster(cluster);
            cluster = [row];
        }
    }
    emitCluster(cluster);

    // Sin fechas parseables: refuerzo estructural por ids consecutivos (AD-5).
    undated.sort((a, b) => a.id - b.id);
    let chain: Participant[] = [];
    for (const row of undated) {
        if (chain.length === 0) {
            chain = [row];
            continue;
        }
        if (Math.abs(row.id - chain[chain.length - 1].id) === 1) {
            chain.push(row);
        } else {
            emitCluster(chain);
            chain = [row];
        }
    }
    emitCluster(chain);

    // Q2: filas del grupo que no entraron en ningún clúster duplicado (AD-6).
    const dupIds = new Set(dupRows.map((row) => row.id));
    const remaining = rows.filter((row) => !dupIds.has(row.id));
    if (rows.length >= 2 && remaining.length > 0) {
        q2.push({
            identity,
            ruta,
            rows: remaining,
            fechas: remaining.map((row) => row.fechaRegistro ?? '')
        });
    }
};

/**
 * Computa las 8 señales de auditoría sobre el universo filtrado (AUD-11).
 * Un solo pasada O(n) sobre filteredData; solo el dato de corruptos proviene
 * del sync (esos registros nunca entran a dashboardData).
 */
export function computeAuditSignals(
    filteredData: Participant[],
    corruptedItems: CorruptedRecord[],
    syncStats: SyncStats
): AuditSignals {
    const groups = new Map<string, Participant[]>();

    let ndCount = 0;
    const ndRows: Participant[] = [];
    const futura: Anomalia[] = [];
    const inclusionPrevia: Anomalia[] = [];
    const edadMismatch: Anomalia[] = [];
    const edadRegistroMenor: Anomalia[] = [];
    const estadoCounts = new Map<string, number>();
    let sentinelCentro = 0;
    let sentinelEstado = 0;
    let sentinelProvincia = 0;
    let sentinelRuta = 0;

    const now = new Date();

    for (const row of filteredData) {
        const corrupt = isCorruptRow(row);

        // AUD-5 — ND cédula: cuenta sobre TODO el universo filtrado.
        if (normalizeCedula(row.cedula) === null) {
            ndCount += 1;
            ndRows.push(row);
        }

        // Agrupación por identidad: excluye corruptos e identidades sentinela.
        if (!corrupt) {
            const identity = normalizeIdentity(row.nombres, row.apellidos);
            if (identity !== null) {
                const bucket = groups.get(identity);
                if (bucket) bucket.push(row);
                else groups.set(identity, [row]);
            }
        }

        // AUD-6/AD-8 — anomalías solo con fechas parseables; las corruptas van a AUD-9.
        if (!corrupt) {
            const nacimiento = parseDate(row.fechaNacimiento);
            const registro = parseDate(row.fechaRegistro);
            const inclusion = parseDate(row.fechaInclusion);

            if (nacimiento !== null && nacimiento.getTime() > now.getTime()) {
                futura.push({ row });
            }
            if (registro !== null && inclusion !== null && inclusion.getTime() < registro.getTime()) {
                inclusionPrevia.push({ row });
            }
            if (nacimiento !== null && nacimiento.getTime() <= now.getTime() && row.edad > 0) {
                const computed = ageAt(nacimiento, now);
                if (Math.abs(computed - row.edad) > AGE_MISMATCH_TOLERANCE_YEARS) {
                    edadMismatch.push({ row });
                }
            }
            if (row.edad > 0 && row.edadRegistro > 0 && row.edad < row.edadRegistro) {
                edadRegistroMenor.push({ row });
            }

            // AUD-7 — vocabulario de estados (excluye corruptos).
            const estado = (row.estado ?? 'Sin Estado').trim() || 'Sin Estado';
            estadoCounts.set(estado, (estadoCounts.get(estado) ?? 0) + 1);
        }

        // AUD-8 — centinelas por campo vía isNotAvailable (NA_VALUES).
        if (isNotAvailable(row.centro)) sentinelCentro += 1;
        if (isNotAvailable(row.estado)) sentinelEstado += 1;
        if (isNotAvailable(row.provincia)) sentinelProvincia += 1;
        if (isNotAvailable(row.rutaFormativa)) sentinelRuta += 1;
    }

    const duplicados: DuplicateGroup[] = [];
    const q1: Q1Candidate[] = [];
    const q2: Q2Candidate[] = [];

    for (const [identity, rows] of groups) {
        if (rows.length < 2) continue;
        const routes = distinctRealRoutes(rows);
        if (routes.size >= 2) {
            // AD-6: ≥2 rutas distintas → Q1 (precedencia, nunca temporal).
            q1.push({ identity, rutas: [...routes], rows, cedulaConfirmada: hasConfirmedCedula(rows) });
        } else {
            classifySameRoute(identity, rows, duplicados, q2);
        }
    }

    const valores = [...estadoCounts.entries()].map(([valor, count]) => ({
        valor,
        count,
        conocido: AUDIT_STATUS_VOCABULARY.includes(valor.toLowerCase())
    }));
    const fueraVocabulario = valores.filter((v) => !v.conocido).length;

    const anomaliaRows = new Set<number>(
        [...futura, ...inclusionPrevia, ...edadMismatch, ...edadRegistroMenor].map((a) => a.row.id)
    );

    return {
        duplicados,
        q1,
        q2,
        ndCedula: {
            count: ndCount,
            pct: filteredData.length > 0 ? Math.round((ndCount / filteredData.length) * 1000) / 10 : 0,
            rows: ndRows
        },
        anomalias: { totalFilas: anomaliaRows.size, futura, inclusionPrevia, edadMismatch, edadRegistroMenor },
        vocabulario: { valores, fueraVocabulario },
        centinelas: { centro: sentinelCentro, estado: sentinelEstado, provincia: sentinelProvincia, rutaFormativa: sentinelRuta },
        corruptos: {
            count: syncStats.corrupted,
            items: corruptedItems.map((c) => ({ id: c.id, reason: c.reason }))
        }
    };
}
