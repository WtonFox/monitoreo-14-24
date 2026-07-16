# Proposal: Promedios Nacionales en Mapa

## Intent

Extender el LocationInfoBox del mapa interactivo con comparación contra promedios nacionales en 4 dimensiones (edad, género, educación, estado), replicando el patrón ya existente para contactabilidad y vulnerabilidad. Esto permite al usuario contextualizar rápidamente si una ubicación está por arriba o debajo de la media nacional.

## Scope

### In Scope
- 4 nuevas métricas nacionales calculadas en single-pass de `useMapStats`
- Display comparativo en LocationInfoBox para edad promedio, % M/F, educación y estado
- Integración vía props desde MapSection

### Out of Scope
- Cambios visuales mayores (solo se agregan filas a secciones existentes)
- Nuevos filtros o interactividad basada en promedios nacionales
- Tabla o vista separada de comparación nacional

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `map-location-info`: Ampliar contenido del info box con 4 comparaciones nacionales

## Approach

1. **useMapStats.ts** — agregar 4 acumuladores nacionales en el mismo single-pass O(n): `nationalAvgAge`, `nationalGenderBreakdown`, `nationalEducationBreakdown`, `nationalStatusBreakdown`. Misma técnica que `nationalPhoneRate`/`nationalVulnerabilityRate`.
2. **MapSection.tsx** — desestructurar y pasar los nuevos valores como props a LocationInfoBox.
3. **LocationInfoBox.tsx** — 4 nuevas secciones/renglones dentro del info box mostrando valor local vs nacional, con flecha indicadora y diferencia porcentual donde aplique.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `hooks/useMapStats.ts` | Modified | +4 national accumulators + return values |
| `components/MapSection.tsx` | Modified | Pass new national props to LocationInfoBox |
| `components/LocationInfoBox.tsx` | Modified | Display 4 new national comparisons |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Education/status keys no coinciden entre local y nacional | Bajo | Display es independiente — cada uno se computa desde el mismo dataset |
| Age avg nacional difiere del avg local cuando hay pocos datos | Bajo | Ya existía pattern con phone/vulnerability; edge cases cubiertos |

## Rollback Plan

Revertir los 3 archivos funcionales. Cada archivo tiene cambios localizados y no hay migración de datos.

## Dependencies

Ninguna.

## Success Criteria

- [ ] LocationInfoBox muestra edad promedio local vs nacional cuando hay datos
- [ ] LocationInfoBox muestra % M/F local vs nacional
- [ ] LocationInfoBox muestra top educación local vs nacional
- [ ] LocationInfoBox muestra top estado local vs nacional
- [ ] Todos los valores nacionales se computan en el mismo single-pass O(n) (sin regresión de performance)
- [ ] Ubicaciones sin datos muestran "N/A" en lugar de valores erróneos
