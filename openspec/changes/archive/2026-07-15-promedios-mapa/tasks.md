# Tasks: Promedios Nacionales en LocationInfoBox

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~80-120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
```

## Phase 1: Core Logic — useMapStats

- [x] 1.1 Agregar `genderAcc`, `ageSumAcc`/`ageCountAcc`, `educationAcc`, `statusAcc` junto a `phoneAcc`/`vulnAcc` en el `forEach` de `useMapStats.ts`
- [x] 1.2 Incrementar acumuladores dentro del forEach: género como `phoneAcc`, edad si `>0`, educación con `hasValue`, estado con fallback `'Sin estado'`
- [x] 1.3 Agregar `nationalAvgAge`, `nationalGenderRate`, `nationalEducationRate`, `nationalStatusRate` al objeto `return` del `useMemo`
- [x] 1.4 Agregar los 4 valores al return final del hook

## Phase 2: UI — LocationInfoBox

- [x] 2.1 Agregar 4 nuevos optional props: `nationalAvgAge?`, `nationalGenderRate?`, `nationalEducationRate?`, `nationalStatusRate?`
- [x] 2.2 Edad: bloque "Promedio nacional: X años" + diferencia (detrás de sección edad local)
- [x] 2.3 Género: sección "% nacional" junto al % local para M y F
- [x] 2.4 Educación: dentro del `CollapsibleSection`, comparación nacional para cada nivel local
- [x] 2.5 Estado: en la sección de estado, comparación nacional para cada estado local

## Phase 3: Integration — MapSection

- [x] 3.1 Destructure `nationalAvgAge`, `nationalGenderRate`, `nationalEducationRate`, `nationalStatusRate` del `useMapStats` return
- [x] 3.2 Pasar las 4 nuevas props al `<LocationInfoBox>`

## Phase 4: Testing

- [x] 4.1 Test: `useMapStats` computa `nationalAvgAge` correctamente con datos mixtos (edad válida e inválida)
- [x] 4.2 Test: `useMapStats` computa `nationalGenderRate` con distribución M/F/other
- [x] 4.3 Test: `useMapStats` computa `nationalEducationRate` y `nationalStatusRate`
- [x] 4.4 Test: datos vacíos → todos los nacionales en valores neutros (0, `{}`)
