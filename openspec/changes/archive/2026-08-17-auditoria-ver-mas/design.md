# Design: Auditoría — límite visible 15, modal "Ver más" y heurística Q3

## Technical Approach

Tres frentes sin tocar el pipeline de datos:

1. **UI (AUD-13)**: `VER_MAS_LIMIT = 15` reemplaza `LIST_LIMIT = 50` en `AuditoriaBoard.tsx`. Cada tarjeta con lista muestra `slice(0, VER_MAS_LIMIT)` y un botón **"Ver más"** solo cuando `list.length > VER_MAS_LIMIT`; el botón abre `components/AuditListModal.tsx` (genérico, flat en `components/`) con la lista COMPLETA sin `.slice()`. Las arrays ya llegan sin tope desde `computeAuditSignals` — cero cambios de datos.
2. **Q3 (AUD-10, Opción A)**: en `computeAuditSignals` (pura), una rama sobre el `groups` Map existente — identidad con ≥2 filas Y ≥1 fila con `isGraduatedStatus(estado)` → `q3: Q3Candidate[]`. Sin pasada extra sobre `filteredData` (O(n) total), respeta filtros automáticamente, no cambia la semántica de Q1/Q2/duplicados.
3. **Board**: el callout AUD-10 se reemplaza IN SITU (misma posición, full-width, bajo el grid de drill-downs) por una SignalCard Q3: badge "candidatos", caveat Q3 específico (AUD-12), lista `slice(VER_MAS_LIMIT)`, botón "Ver más", y nota info "no respondible sin fecha de egreso" bajo la tarjeta (escenario AUD-10, preserva el test existente que busca esa frase). Sin KPI nuevo para Q3 (fuera de alcance).

## Architecture Decisions

| Decisión | Elección | Alternativa | Rationale |
|---|---|---|---|
| AD-1 Modal | **Un modal genérico único** `AuditListModal { title, icon, tone, count?, caveat?, onClose, children }` en `components/` flat | un modal por señal; inline en el board | Convención flat del repo (`IndicatorModal`, `ParticipantDetailModal`); `components/auditoria/` no existe. Inline engordaría el board (+~100) y rompería el slicing. El modal es tonto/presentacional: el board construye `children` por señal |
| AD-2 Contenido por señal | El board arma `children` (markup `<li>` por señal) y lo pasa al modal; la duplicación de ~7 bloques de fila se acepta | extraer componentes de fila compartidos tarjeta/modal | Mantiene el diff de cada tarjeta mínimo (solo slice + botón); la extracción compartida sería un refactor más grande y arriesgado. Único helper compartido: `flattenAnomalias()` (merge de los 4 sub-checks), usado por tarjeta y modal |
| AD-3 Stale-guard | `useEffect(() => setOpenModal(null), [filteredData])` en el board | keyear el modal por señal y resetear derivado | Mínimo estado; el modal es presentacional y se desmonta. El effect (y el `useState`) van ANTES de los early-returns de loading/empty (regla de hooks, hoy líneas 113–119) |
| AD-4 Cierre | Render condicional `{openModal && <AuditListModal…>}`; Esc vía `window` keydown en mount/unmount + backdrop (`e.target === e.currentTarget`) + botón X + body scroll-lock (`overflow: hidden`, restaurado) | prop `isOpen` con listener persistente | El montaje/desmontaje gestiona el listener sin lógica extra; receta IndicatorModal + a11y de ParticipantDetailModal (`role="dialog"`, `aria-modal`, foco en botón cerrar, backdrop `bg-black/50`) |
| AD-5 Caveat Q3 | `SignalCard` gana prop opcional `caveatText?: string` (default `CANDIDATE_CAVEAT`); la tarjeta Q3 pasa texto propio (homonimia + "sin `fechaEgreso` no se confirma un egreso repetido"). `AuditListModal` gana `caveat?: React.ReactNode` como footer (AUD-12 exige el caveat en el drill-down, y el modal ES el drill-down) | reutilizar el caveat genérico | El texto genérico no cubre la limitación Q3; el footer del modal mantiene el requisito AUD-12 en el drill-down para dup/Q1/Q2/Q3 |
| AD-6 Q3 en el loop | La rama Q3 es **independiente** del branch Q1/`classifySameRoute` dentro del loop de `groups`: `rows.some(isGraduatedStatus)` se evalúa para todo grupo ≥2 filas | evaluar solo grupos que no entraron en Q1/Q2 | Overlap Q3↔Q1/Q2 es requisito explícito (escenario); `routes` se calcula una vez y se reutiliza en ambas ramas |
| AD-7 Posición Q3 | La tarjeta Q3 reemplaza el callout en su lugar (bloque full-width bajo el grid), con la nota de limitación como `<p>` hermano bajo la tarjeta | agregarla al grid de 2 columnas | Diff mínimo (reemplazo local, sin reflow del grid); la nota "no respondible sin fecha de egreso" queda visible siempre, incluso con lista vacía |
| AD-8 Corruptos | Se conserva el best-effort: si `items` está vacío y `count > 0`, la tarjeta muestra la nota existente y NO hay botón "Ver más" (no hay lista que mostrar) | fabricar filas | `corruptedItems` no se persiste en caché (AD-9 original); el modal solo aplica cuando hay items |

## Data Flow

```
Filtros ── filteredData ──► useMemo(computeAuditSignals) ──► signals
                                 │  loop groups: q1/dup/q2 (igual que hoy)
                                 │               └─ rama q3 (≥2 filas ∧ isGraduatedStatus)
                                 ▼
   tarjeta (slice 15) ◄── signals.q3 / duplicados / … / corruptos
        │ list.length > 15
        ▼
   setOpenModal('q3') ──► AuditListModal(children = lista COMPLETA sin slice)
        ▲
        └── cierra: backdrop · Esc · X · useEffect[filteredData] → setOpenModal(null)
```

## File Changes

| Archivo | Acción | Descripción |
|---|---|---|
| `utils/auditSignals.ts` | Modificar | `import { isGraduatedStatus, isNotAvailable }`; interface `Q3Candidate`; rama `q3` en el loop de `groups`; campo `q3: Q3Candidate[]` en `AuditSignals` |
| `utils/auditSignals.spec.ts` | Modificar | `describe('… — Q3 egreso repetido (AUD-10)')`: casos unit |
| `components/AuditListModal.tsx` | Crear | Modal genérico de lista (receta overlay; props AD-1/AD-5) |
| `pages/indicadores/AuditoriaBoard.tsx` | Modificar | `VER_MAS_LIMIT = 15`; estado `openModal` + effect stale-guard; componente `VerMasButton`; edición mínima de las 7 tarjetas (slice + botón); bloque de render del modal (mapa `MODAL_META` + switch de contenido); tarjeta Q3 reemplaza callout; `caveatText` en `SignalCard` |
| `pages/indicadores/AuditoriaBoard.spec.tsx` | Modificar | Extensions: botón/abrir modal, cierre Esc/backdrop/filtro, tarjeta Q3 |

## Interfaces / Contracts

```typescript
// utils/auditSignals.ts
export interface Q3Candidate {
    identity: string;
    rows: Participant[];
    rutas: string[];
    estados: string[];          // por fila, en orden de rows
    fechas: string[];           // fechaRegistro ?? ''
    cedulaConfirmada?: boolean; // desambigua homonimia (como Q1)
}
// AuditSignals gana: q3: Q3Candidate[]

// componentes/AuditListModal.tsx
interface AuditListModalProps {
    title: string;
    icon: React.ReactNode;
    tone: string;              // chip del header, ej. 'bg-cyan-50 text-cyan-600'
    count?: string;            // ya formateado (formatNumber)
    caveat?: React.ReactNode;  // footer AUD-12, solo listas candidatas
    onClose: () => void;
    children: React.ReactNode; // lista COMPLETA sin slice
}
```

**Contenido del modal por señal** (el switch del board arma `children`):

| Signal | Filas del modal (lista completa, mismo orden que la tarjeta) |
|---|---|
| duplicados | por grupo: `personName(rows)` + "N filas", `Ruta: {ruta}`, `IDs: {rows.map(id).join(', ')}`, `Fechas: {fechas.join(' · ')}` |
| q1 | `personName(rows)` + "N filas", `Rutas: {rutas.join(' · ')}`, `cedulaConfirmada ? 'Cédula coincide entre rutas' : 'Sin cédula que confirme — posible homonimia'` |
| q2 | `personName(rows)` + "N filas", `Ruta: {ruta}`, `Fechas: {fechas.join(' · ')}` |
| ndCedula | por fila: `#{id} {personName([r])}` + `{cedula \|\| '—'}` |
| anomalias | `flattenAnomalias()` (merge 4 sub-checks) → `#{id} {personName([row])}` + reason |
| vocabulario | solo `!conocido`: `{valor}` + `{count} filas` |
| corruptos | `items` best-effort → `#{id} {reason}`; si vacío con count>0, sin modal |
| q3 | `personName(rows)` + "N filas", `Rutas`, `estados` (egresado destacado: `isGraduatedStatus` → `text-emerald-600 font-semibold`), `Fechas` |

Footer caveat en modal para duplicados, q1, q2, q3. `VER_MAS_LIMIT = 15` como const módulo en el board (exportada; único consumidor).

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Unit (node) | Q3 heurística | `auditSignals.spec.ts`: (1) 2 filas + 1 "Egresado pasantía" → 1 candidato con identity/rows/rutas/estados/fechas; (2) 2 filas sin egresado → vacío; (3) 1 fila egresado → vacío (requiere ≥2); (4) 1 fila sin egresado → vacío; (5) overlap: 2 rutas + egresado → presente en q1 Y q3; (6) overlap: misma ruta, fechas distantes, egresado → q2 Y q3; (7) `estados` mapea `rows` en orden; (8) corruptos excluidos del agrupamiento (ya cubierto, reafirmar q3=0); fixtures con `row()` existente |
| Component (jsdom) | `AuditListModal` | `AuditListModal.spec.tsx` (nuevo, proyecto integration): renderiza title/count/children; cierra por backdrop click, Esc (`fireEvent.keyDown(window, {key:'Escape'})`), botón X; restaura scroll-lock del body |
| Integration (jsdom) | Board (AUD-13/10/12) | Extensions en `AuditoriaBoard.spec.tsx`: (a) 15 filas ND → sin botón; (b) 16 filas ND → botón + modal con las 16 (assert fila 16 no visible en tarjeta, sí en modal) + título + count; (c) cierre por Esc y backdrop; (d) rerender con `filteredData` nueva (otra identidad de array) → modal desmonta (effect, `waitFor`); (e) fixture con fila egresado → tarjeta Q3 lista candidato + nota "no respondible sin fecha de egreso" + caveat Q3 |

## Threat Matrix

N/A — no hay frontera de routing, shell, subprocess, VCS/PR automation, clasificación de ejecutables ni integración de procesos en este change.

## Migration / Rollout

No migration (sin datos persistidos ni rutas nuevas). Rollback: `git revert` de los commits del change (`utils/auditSignals.ts`, `pages/indicadores/AuditoriaBoard.tsx`, specs) + `git rm components/AuditListModal.tsx`.

## Slices (auto-chain · feature-branch-chain · presupuesto 400)

El presupuesto cuenta el diff authored (additions + deletions). Los edits por tarjeta en S2 son de ~2 líneas (slice + botón), por lo que el diff del board es contenido en lugar de proporcional a sus 506 líneas.

| Slice | Contenido | Δ aprox. |
|---|---|---|
| S1 | Heurística Q3 en `auditSignals.ts` (tipo + import + rama) + unit specs | ~100–120 ✓ |
| S2 | `AuditListModal.tsx` (~110) + `VER_MAS_LIMIT` + `VerMasButton` + estado/effect + 7 tarjetas + bloque modal (`MODAL_META` + switch) + specs board open/close/filtro | ~300–360 ✓; si excede 400 → S2a dup/Q1/Q2, S2b resto (fallback del proposal) |
| S3 | Tarjeta Q3 (reemplaza callout) + `caveatText` en `SignalCard` + nota de limitación + specs board Q3 | ~120–150 ✓ |

## Performance

Modal ND Cédula puede renderizar ~29,5k filas: `<li>` simples en un scroll único son viables (O(n) DOM, sin O(n²) en ningún punto). Follow-up anotado: paginación/virtualización si el board crece. El Q3 agrega O(n) amortizado vía el Map existente; el modal solo monta la lista completa al abrirse (cero costo en el render del board).

## Open Questions

- [ ] ¿`VerMasButton` muestra el conteo sobrante ("Ver más (N)") o texto plano? Default: texto plano "Ver más" (consistente con el spec).
- [ ] ¿Exportar `VER_MAS_LIMIT` del board para los specs o hardcodear 15? Default: exportar (única fuente).
