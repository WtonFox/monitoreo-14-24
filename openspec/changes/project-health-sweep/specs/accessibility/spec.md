# Accessibility Requirements — M10 (Project Health Sweep)

Fix six confirmed M6 keyboard/dialog/name/route issues so indicator boards, modals,
dropdowns, icon buttons, and page titles are keyboard-accessible and screen-reader
friendly.

## Requirements

### R-a11y-1 — Indicator tiles are natively keyboard-accessible

**Files**: `components/IndicatorsBoard.tsx`

Each clickable indicator tile (`IndicatorTile`) must be reachable and operable via
keyboard alone.

| Criterion | Value |
|-----------|-------|
| `tabIndex` | `0` |
| `role` | `button` |
| `onKeyDown` | Enter/Space trigger `onClick` |
| `aria-label` | indicator name (short description) |

**Scenario**: Tab to first tile → indicator name announced → Enter → modal opens →
Shift+Tab returns to tile.

### R-a11y-2 — BoardInfo is a proper modal dialog

**File**: `components/BoardInfo.tsx`

The info overlay must behave as a modal dialog: correct role, ESC close, focus entry
and return.

| Criterion | Value |
|-----------|-------|
| Container role | `dialog` |
| `aria-modal` | `true` |
| `aria-label` | Board title |
| ESC key | Closes via `onKeyDown` |
| Focus on open | First focusable element (close button) |
| Focus on close | Returns to the trigger button |

**Scenario**: Tab to Info button → Enter → dialog opens, close button focused → ESC
→ dialog closes, Info button refocused.

### R-a11y-3 — AdvancedFiltersModal is a proper modal dialog

**File**: `components/AdvancedFiltersModal.tsx`

Same dialog semantics as R-a11y-2.

| Criterion | Value |
|-----------|-------|
| Container role | `dialog` |
| `aria-modal` | `true` |
| `aria-label` | "Filtros Avanzados" |
| ESC key | Closes via `onKeyDown` |
| Focus on open | First focusable element inside modal |
| Focus on close | Returns to the trigger button |

**Scenario**: Tab to filter trigger → Enter → dialog opens, close button or first
field focused → ESC → dialog closes, trigger refocused.

### R-a11y-4 — "More" dropdown announces expanded state

**File**: `pages/IndicadoresLayout.tsx`

The "Más indicadores" dropdown button must communicate expanded/collapsed state.

| Criterion | Value |
|-----------|-------|
| `aria-haspopup` | `true` |
| `aria-expanded` | `showMore` boolean |
| ESC key | Closes dropdown and refocuses trigger |

**Scenario**: Tab to "Más indicadores" → NVDA announces "Más indicadores, submenu,
collapsed" → Enter → "expanded" → Escape → "collapsed", trigger focused.

### R-a11y-5 — Icon-only buttons have accessible labels

**Files**: `components/Header.tsx`, `components/Sidebar.tsx`

Every `<button>` that displays only an icon must have an explicit `aria-label`.

| Button | `aria-label` |
|--------|-------------|
| Header — Menu toggle | `"Abrir menú"` |
| Header — Refresh | `"Recargar datos"` |
| Sidebar — Close mobile | `"Cerrar menú"` |
| Sidebar — Pause/Resume | `"Pausar sincronización"` / `"Reanudar sincronización"` |
| Sidebar — Reiniciar | `"Reiniciar sincronización"` |

**Scenario**: Focus each icon button → screen reader announces the label instead
of "unlabeled button" or the SVG contents.

### R-a11y-6 — Nested board routes have specific header titles

**File**: `components/Header.tsx`

All 13 indicator board routes must appear in `PAGE_TITLES` so nested boards don't
fall back to the generic "Monitoreo 14-24".

| Route | Title |
|-------|-------|
| `/indicadores` | Panel de Indicadores |
| `/indicadores/demograficos` | Indicadores Demográficos |
| `/indicadores/territoriales` | Indicadores Territoriales |
| `/indicadores/programa` | Indicadores — Estado del Programa |
| `/indicadores/sociales` | Indicadores Sociales |
| `/indicadores/calidad-dato` | Indicadores — Calidad del Dato |
| `/indicadores/vulnerabilidad` | Indicadores — Vulnerabilidad |
| `/indicadores/cobertura-temporal` | Indicadores — Cobertura Temporal |
| `/indicadores/nivel-educativo` | Indicadores — Nivel Educativo |
| `/indicadores/desempeno-centro` | Indicadores — Desempeño Centro |
| `/indicadores/centros-sin-menores` | Indicadores — Centros sin Menores |
| `/indicadores/desercion` | Indicadores — Deserción |
| `/indicadores/registro-diario` | Indicadores — Registro Diario |
| `/indicadores/calidad-nd` | Indicadores — Calidad ND |

**Scenario**: Navigate to `/indicadores/calidad-nd` → `<h2>` reads "Indicadores —
Calidad ND" instead of "Monitoreo 14-24".

## Verification

| Gate | Command |
|------|---------|
| TypeScript | `npm run typecheck` |
| Build | `npm run build` |
| Keyboard walkthrough | Manual: Tab through all interactive elements on indicators, modals, dropdowns |
