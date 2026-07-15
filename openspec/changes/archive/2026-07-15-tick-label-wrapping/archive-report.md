# Archive Report: tick-label-wrapping

## Summary
Replaced axis label truncation (tickShort "…") with multi-line text wrapping in all 11 indicator board charts using recharts' `<Text>` component. Removed the orphaned "Impacto Social" sidebar link.

## Changes

### Sidebar
- **components/Sidebar.tsx**: Removed `ROUTES.IMPACTO_SOCIAL` entry from `MAIN_NAV_ITEMS` and unused `Globe` import. Route and redirect kept for backward compatibility.

### Chart label wrapping (new pattern)
- **utils/indicadores-tick-components.tsx** (NEW): `YAxisTick` and `XAxisTick` components using recharts' `<Text>` for auto line-wrapping via SVG `<tspan>`.
- **utils/indicadores-helpers.ts**: Updated docs referencing the new tick components.

### Boards updated (YAxis — horizontal bars)
| Board | Width before | Width after |
|---|---|---|
| TerritorialesBoard | 130 | 180 |
| ProgramaBoard | 130 | 180 |
| DesempenoCentroBoard | 130 | 180 |
| VulnerabilidadBoard | 130 | 180 |
| CalidadNdBoard | 90 | 140 |
| DesercionBoard | 160 | 180 |

### Boards updated (XAxis — vertical bars)
- DemograficosBoard
- NivelEducativoBoard (×2 charts)
- CalidadDatoBoard
- VulnerabilidadBoard

## Files Created
| File | Status |
|---|---|
| `utils/indicadores-tick-components.tsx` | ✅ Created |
| `openspec/changes/archive/2026-07-15-tick-label-wrapping/archive-report.md` | ✅ This file |

## Files Modified
| File | Status |
|---|---|
| `components/Sidebar.tsx` | ✅ Modified |
| `utils/indicadores-helpers.ts` | ✅ Modified |
| `pages/indicadores/TerritorialesBoard.tsx` | ✅ Modified |
| `pages/indicadores/ProgramaBoard.tsx` | ✅ Modified |
| `pages/indicadores/DesempenoCentroBoard.tsx` | ✅ Modified |
| `pages/indicadores/VulnerabilidadBoard.tsx` | ✅ Modified |
| `pages/indicadores/CalidadNdBoard.tsx` | ✅ Modified |
| `pages/indicadores/DesercionBoard.tsx` | ✅ Modified |
| `pages/indicadores/DemograficosBoard.tsx` | ✅ Modified |
| `pages/indicadores/NivelEducativoBoard.tsx` | ✅ Modified |
| `pages/indicadores/CalidadDatoBoard.tsx` | ✅ Modified |

## Verification
- ✅ TypeScript compilation: `tsc --noEmit` — 0 errors
- ✅ Production build: `vite build` — 0 errors, 1.81s
