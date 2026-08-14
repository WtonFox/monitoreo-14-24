# Design: Auditoría de Datos (AuditoriaBoard)

## Technical Approach

Board autónomo `AuditoriaBoard` en `/indicadores/auditoria` (patrón `RegistroDiarioBoard`): ruta lazy en `router.tsx`, const `INDICADORES_AUDITORIA` en `types/routes.ts`, tab "Auditoría" en el grupo "Datos y Calidad" de `IndicadoresLayout`. Toda la lógica es una función pura `computeAuditSignals(filteredData, corruptedItems, syncStats)` en `utils/auditSignals.ts` (nueva) ejecutada en un único `useMemo` sobre `filteredData`; la identidad normalizada vive en `utils/auditIdentity.ts` (nueva). Sin cambios a `computeIndicators` ni `routeBoardMap` (AUD-1, AUD-11).

## Architecture Decisions

| Decisión | Elección | Alternativa | Rationale |
|---|---|---|---|
| AD-1 Clave de identidad | `normalizeIdentity(nombres, apellidos)` = `normalizeNamePart(nombres) + '\u0001' + normalizeNamePart(apellidos)` | concatenar sin separador | "Maria De"+"Leon" y "Maria"+"De Leon" colisionarían sin separador |
| AD-2 Normalización de nombre | trim → toLowerCase → NFD → quitar marcas `[\u0300-\u036f]` → eliminar TODOS los espacios internos | colapsar a un espacio | "María De León" ≡ "maria de leon" → `mariadeleon` (AUD-0) |
| AD-3 Cédula | `normalizeCedula` = `replace(/\D/g,'')`; resultado vacío → `null` | comparar string crudo | `'001-0000001-1'` ≡ `'00100000011'`; `'N/D'`/vacías → null, excluidas del matching por cédula pero NO del nombre (AUD-0) |
| AD-4 Umbral T1 | `DUPLICATE_WINDOW_DAYS = 30` días entre `fechaRegistro` | 7 / 90 días | Evidencia real: re-inscripciones observadas a 8 y 14 meses (240–420 días); una carga duplicada ocurre en el mismo lote/día. 30 días separa con margen 8–14× y absorbe re-cargas de lote corregido |
| AD-5 ids consecutivos | `\|idA − idB\| === 1` (delta exacto 1), usado SOLO cuando las fechas no son parseables | delta ≤ 2 | AUD-2: fechas a 14 meses NO son duplicado — la evidencia temporal manda; ids-consecutivos es refuerzo estructural cuando falta fecha fiable |
| AD-6 Clasificación | Precedencia: ≥2 `rutaFormativa` distintas → Q1 (nunca temporal). Misma ruta → clústeres separados por gap > T1 | clasificar por pares independientes | Grupo mixto (AUD-4): filas a ≤T1 → clúster duplicado; fila aislada → Q2. Un grupo mixto = 1 duplicado + 1 Q2 |
| AD-7 Vocabulario de estados | set efectivo = 8 estados reales de la API (Identificado, Egresado pasantía, Egresado fase lectiva, Desertor, No admitido, Baja, Cancelado, Inactivo) + "Sin Estado" (centinela de AUD-8) | reutilizar `PARTICIPANT_STATUSES` tal cual | El escenario AUD-7 exige marcar "En proceso"; `PARTICIPANT_STATUSES` es vocabulario legacy que la API no emite (lo documenta `normalize.ts`). Comparación case-insensitive |
| AD-8 Anomalías (AUD-6) | 4 sub-checks solo sobre fechas parseables (las corruptas van a AUD-9, nunca aquí); "edad inconsistente" = `edad < edadRegistro` (ambas > 0); edad vs `fechaNacimiento` con tolerancia ±2 años | `\|edad − edadRegistro\| > N` | Edad menor al registro es imposible; diferencias grandes pueden ser legítimas en registros antiguos |
| AD-9 Corruptos (AUD-9) | count = `syncStats.corrupted` (persistido en IndexedDB); drill-down de `corruptedItems` (razones) | count por lista | `corruptedItems` no se persiste — al restaurar cache la lista puede estar vacía aunque el count oficial siga |

## Data Flow

```
useIndicadoresFilters() ── filteredData (O(n), filtros AUD-11)
useParticipantStore() ─── corruptedItems + syncStats (señal AUD-9, no filtrable)
        │
        └─► useMemo(computeAuditSignals) ──► { duplicados, q1, q2, ndCedula,
             │                                  anomalias, vocabulario, centinelas, corruptos }
             │  ── 1 pasada: Map<identityNormalizada, filas[]>   (excluye corruptos
             │      y identidades sentinel 'N/A'/'N/D'/vacías — evita agrupar
             │      el 42% sin cédula ni los fallbacks de sanitize)
             ├─ clasificar grupos: rutas≥2 → Q1 · clústeres por gap>T1 → dup/Q2
             ├─ ND cédula: count + % sobre filteredData
             ├─ anomalías: 4 sub-checks (fechaNacimiento futura, fechaInclusion<
             │   fechaRegistro, edad vs nacimiento ±2, edad<edadRegistro)
             ├─ vocabulario: enum valores estado ≠ corruptos, marca fuera de set
             ├─ centinelas: isNotAvailable() por campo (centro, estado, provincia, ruta)
             └─ corruptos: syncStats.corrupted + razones de corruptedItems
        │
        └─► AuditoriaBoard: KPIs + callout Q3 + drill-downs con caveats
```

Las señales se computan sobre `filteredData` (AUD-11); el único dato no filtrable es corruptos, porque esos registros nunca entran a `dashboardData` (decisión de diseño del sync, documentada).

## File Changes

| Archivo | Acción | Descripción |
|---|---|---|
| `utils/auditIdentity.ts` | Crear | `normalizeNamePart`, `normalizeIdentity`, `normalizeCedula`, `isSentinelIdentity`, `SENTINEL_WORDS` |
| `utils/auditSignals.ts` | Crear | `computeAuditSignals(filteredData, corruptedItems, syncStats)`: tipos `AuditSignals`, `DuplicateGroup`, `Q1Candidate`, `Q2Candidate`; constantes `DUPLICATE_WINDOW_DAYS=30`, `AGE_MISMATCH_TOLERANCE_YEARS=2`, `AUDIT_STATUS_VOCABULARY` |
| `pages/indicadores/AuditoriaBoard.tsx` | Crear | Board: BoardShell, KPIs ×8, `IndicadoresFilterBar showYear showProvince showMunicipio showSex={false} noContainer`, callout Q3 (AUD-10), drill-downs con etiqueta "candidatos" + caveat (AUD-12), BoardInfo |
| `pages/indicadores/AuditoriaBoard.spec.tsx` | Crear | Tests de componente (mock context + store) |
| `types/routes.ts` | Modificar | `INDICADORES_AUDITORIA: '/indicadores/auditoria'` + `ROUTE_PERMISSIONS` (mismos roles que `/indicadores`) |
| `router.tsx` | Modificar | Lazy import + ruta `auditoria` con `Suspense fallback={<LoadingSkeleton variant="board" />}` |
| `pages/IndicadoresLayout.tsx` | Modificar | Item `{ to: ROUTES.INDICADORES_AUDITORIA, label: 'Auditoría', icon: CheckCircle }` en "Datos y Calidad" (junto a "Calidad del Dato") |
| `utils/auditIdentity.spec.ts`, `utils/auditSignals.spec.ts` | Crear | Tests unitarios de lógica pura (proyecto `unit`, node) |
| `e2e/mockData.ts` | Modificar | Fixtures fijos con identidades repetidas (misma persona en 2 rutas; par duplicado de carga con ids consecutivos; par a 8 meses) |
| `e2e/navigation.spec.ts` | Modificar | Entrada `{ hash: '/indicadores/auditoria', title: 'Auditoría' }` |

## Interfaces / Contracts

```typescript
// utils/auditIdentity.ts
normalizeNamePart(v: string | null): string;        // trim→lower→NFD→sin marcas→sin espacios
normalizeIdentity(nombres: string|null, apellidos: string|null): string | null; // null si sentinel
normalizeCedula(cedula: string | null): string | null; // solo dígitos; ''→null
isSentinelIdentity(key: string | null): boolean;      // 'N/A','N/D','S/D','', etc.

// utils/auditSignals.ts
interface AuditSignals {
  duplicados: DuplicateGroup[];        // { identity, ruta, rows[], fechas[], cedulaConfirmada }
  q1: Q1Candidate[];                   // { identity, rutas[], rows[] }
  q2: Q2Candidate[];                   // { identity, ruta, rows[], fechas[] }
  ndCedula: { count: number; pct: number; rows: Participant[] };
  anomalias: { totalFilas: number; futura: Anomalia[]; inclusionPrevia: Anomalia[];
               edadMismatch: Anomalia[]; edadRegistroMenor: Anomalia[] };
  vocabulario: { valores: { valor: string; count: number; conocido: boolean }[];
                 fueraVocabulario: number };
  centinelas: { centro: number; estado: number; provincia: number; rutaFormativa: number };
  corruptos: { count: number; items: { id: number; reason: string }[] };
}
computeAuditSignals(filteredData: Participant[], corruptedItems: CorruptedRecord[],
                    syncStats: SyncStats): AuditSignals;
```

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Unit | `normalizeIdentity`/`normalizeCedula` | Variantes ortográficas (María De León ≡ maria de leon), acentos, cédulas con/sin guiones, N/D excluida, separador anti-colisión, sentinel → null |
| Unit | Clasificación (AUD-2/3/4) | Pares ids 1001/1002 fechas iguales → 1 duplicado; 8 meses → Q2; 14 meses → NO duplicado; grupo mixto 3 filas → 1 dup + 1 Q2; homónimos en rutas distintas → Q1 con `cedulaConfirmada=false`; 2 rutas → Q1 (precedencia, nunca temporal) |
| Unit | Señales AUD-5..9 | ND 840/2000 → 42.0%; 4 sub-checks de anomalías (incl. fecha no parseable → NO cuenta); "En proceso" fuera de vocabulario count 5; 12 `Sin Centro`; corruptos count + razones |
| Integration | AuditoriaBoard | Mock `useIndicadoresFilters` + `useParticipantStore` (patrón `RegistroDiarioBoard.spec.tsx`): KPIs renderizan, callout Q3 visible, etiqueta "candidatos" + caveat (AUD-12), empty → `BoardShell empty`, loading → `BoardShell loading` |
| E2E | Navegación + fixtures | Ruta en `navigation.spec.ts`; `mockData.ts` con identidades repetidas |

## Slice Boundaries (force-chained, 400 líneas/PR)

| Slice | Contenido | Est. líneas | Verificación |
|---|---|---|---|
| S1 | `types/routes.ts` + `router.tsx` + `IndicadoresLayout.tsx` + `utils/auditIdentity.ts` + `utils/auditSignals.ts` + sus specs unit | ~300 | `npm run test:unit`, typecheck |
| S2 | `AuditoriaBoard.tsx`: shell + KPIs ×8 + filter bar + callout Q3 + empty/loading (sin drill-downs) | ~260 | `npm run test:int` (smoke), build |
| S3 | Drill-downs + caveats (AUD-12) + `AuditoriaBoard.spec.tsx` | ~220 | `npm run test:int` |
| S4 | `e2e/mockData.ts` + `e2e/navigation.spec.ts` | ~150 | `npm run test:e2e` |

## Performance

Un solo pasada O(n) construye `Map<identidad, filas[]>` (filas únicas descartadas al instante). Solo los grupos con ≥2 filas se ordenan por fecha (O(k log k), k acotado por grupos repetidos reales — 51 en la muestra de 2.000). Sin bucles anidados por fila; sin per-row O(n²). `useMemo` recalcula solo ante cambios de `filteredData`/store.

## Threat Matrix

N/A — el cambio toca el router de React (client-side SPA, rutas declarativas sin ejecución de comandos), sin boundaries de shell, subprocesos, VCS, PR automation ni clasificación de ejecutables.

## Migration / Rollout

No migration. Rollback: quitar ruta + tab + `AuditoriaBoard.tsx`, revertir router/rutas/layout; los IDs 1–83 de `computeIndicators` quedan intactos (nada se modifica en `indicator-computations.ts`).

## Open Questions

- [ ] T1=30 días y tolerancia ±2 años quedan como constantes exportadas para calibración posterior con el dataset completo (70.283), no con la muestra de 2.000.
