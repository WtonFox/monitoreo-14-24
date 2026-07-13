# Tasks: Impacto Social Real

## Task 1 — Create hooks/useImpactData.ts

- [x] File created at `hooks/useImpactData.ts`
- [x] `ImpactData` interface with all 7 metric groups
- [x] `programCoverage`: split programasSociales, count unique, top 5
- [x] `healthProfile`: alergias, discapacidades, enfermedades with counts and top items
- [x] `inclusionTime`: days diff with guards, avg, distribution buckets
- [x] `tutorAnalysis`: % with tutor, % with phone, top 10 names
- [x] `dataQuality`: grouped by provincia, phone and address completeness, top 15
- [x] `vulnVsPrograms`: cross between vulnerabilidades × programasSociales
- [x] `ageComparison`: avg edadRegistro (> 0) and avg edad (> 0)
- [x] All memoized via `useMemo`

## Task 2 — Rewrite components/ImpactSection.tsx

- [x] File rewritten at `components/ImpactSection.tsx`
- [x] Uses `useImpactData` hook
- [x] Header with Heart icon + title
- [x] KPI Row: Cobertura Social, Salud, Tiempo Promedio Inclusión, Responsables
- [x] Chart 1: Programas Sociales (bar, top 5)
- [x] Chart 2: Perfil de Salud (3 mini bars: alergias, discapacidades, enfermedades)
- [x] Chart 3: Tiempo Registro → Inclusión (histogram distribution)
- [x] Chart 4: Top Responsables (bar, top 10)
- [x] Chart 5: Calidad de Datos por Provincia (grouped bar, teléfono + dirección)
- [x] Chart 6: Edad al Registro vs Actual (comparison bar)
- [x] Chart 7: Vulnerabilidades × Programas (stacked bar, full width)
- [x] Empty state for no data
- [x] Graceful fallbacks per chart
- [x] Recharts + lucide-react patterns matching codebase
