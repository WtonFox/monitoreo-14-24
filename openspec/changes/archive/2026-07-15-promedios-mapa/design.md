# Design: Promedios Nacionales en LocationInfoBox

## Technical Approach

Extender el single-pass O(n) de `useMapStats` con 4 acumuladores nacionales (género, edad, educación, estado), mismo patrón que `nationalPhoneRate`/`nationalVulnerabilityRate`. Pasar los nuevos valores como props opcionales desde `MapSection` a `LocationInfoBox`, donde se renderizan comparaciones siguiendo el mismo diseño que "Contactabilidad".

## Architecture Decisions

### Decision: Acumuladores en el single-pass existente

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Acumular dentro del `forEach` actual | Sin regresión de performance; datos ya recorridos | ✅ **Chosen** |
| Segundo `filter`/`reduce` por métrica | 5-6 passes extra O(n*m); duplica tiempo de cómputo | Rejected |

Misma técnica que `phoneAcc`/`vulnAcc`: variables locales fuera del `forEach`, se incrementan dentro, se devuelven en el return del `useMemo`.

### Decision: Raw counts vs pre-computed percentages

**Choice**: Devolver raw counts (ej. `{ M: 45, F: 55 }`) igual que `LocationStats.genderBreakdown`. El componente calcula el % al renderizar.

**Rationale**: Consistencia con el patrón existente — `LocationStats.genderBreakdown` guarda raw counts. Si más adelante se necesita el breakdown en otro lado (export, tooltip), los raw counts son más versátiles.

### Decision: Prop names

**Choice**: `nationalAvgAge`, `nationalGenderBreakdown`, `nationalEducationBreakdown`, `nationalStatusBreakdown`.

**Rationale**: Coinciden con los nombres usados en el spec y con el sufijo `Breakdown` que ya usa `LocationStats`. Evita confusión con `nationalPhoneRate` (que SÍ es una tasa pre-computada 0..1, no un breakdown).

### Decision: Optional props (backward compatible)

**Choice**: Todas las nuevas props son opcionales (`?`), igual que `nationalPhoneRate`.

**Rationale**: LocationInfoBox se usa solo en un lugar (MapSection), pero mantener el patrón opcional protege contra usos futuros y mantiene el tipo consistente.

## Data Flow

```
useMapStats(single-pass forEach)
  │  phoneAcc, vulnAcc, genderAcc, ageSumAcc,
  │  ageCountAcc, educationAcc, statusAcc
  │
  └─→ return { locationStats, nationalPhoneRate, nationalVulnerabilityRate,
                nationalAvgAge, nationalGenderBreakdown,
                nationalEducationBreakdown, nationalStatusBreakdown }

       MapSection (destructure)
         │
         └─→ <LocationInfoBox
                ...existingProps
                nationalPhoneRate={nationalPhoneRate}
                nationalVulnerabilityRate={nationalVulnerabilityRate}
                nationalAvgAge={nationalAvgAge}
                nationalGenderBreakdown={nationalGenderBreakdown}
                nationalEducationBreakdown={nationalEducationBreakdown}
                nationalStatusBreakdown={nationalStatusBreakdown}
              />

              LocationInfoBox
                ├─ Si hay nationalAvgAge → mostrar "Edad promedio: X (nacional: Y)"
                ├─ Si hay nationalGenderBreakdown → mostrar "% local vs nacional"
                ├─ Si hay nationalEducationBreakdown → comparar top educación
                └─ Si hay nationalStatusBreakdown → comparar top estados
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `hooks/useMapStats.ts` | Modify | +4 acumuladores nacionales en el single-pass; +4 valores en return |
| `components/LocationInfoBox.tsx` | Modify | +4 optional props; +4 secciones de UI con comparación nacional |
| `components/MapSection.tsx` | Modify | Destructure + pasar 4 nuevas props al LocationInfoBox |

## Interfaces / Contracts

### Nuevo return type (useMapStats)

```typescript
// El return hook ahora incluye:
return {
    mapData,
    locationStats,
    maxCount, minCount, getColor,
    nationalPhoneRate,       // existing
    nationalVulnerabilityRate, // existing
    nationalAvgAge: number,
    nationalGenderBreakdown: { M: number; F: number; other: number },
    nationalEducationBreakdown: Record<string, number>,
    nationalStatusBreakdown: Record<string, number>,
};
```

### Nuevas props (LocationInfoBox)

```typescript
interface LocationInfoBoxProps {
    // ... existing props ...
    nationalAvgAge?: number;
    nationalGenderBreakdown?: { M: number; F: number; other: number };
    nationalEducationBreakdown?: Record<string, number>;
    nationalStatusBreakdown?: Record<string, number>;
}
```

La rama de render de edad existente (`stats.ageRanges.avg > 0`) se expande para incluir comparación nacional cuando `nationalAvgAge` está presente. Género, educación y estado siguen el mismo patrón que "Contactabilidad": mostrar valor local + "Promedio nacional: X" + diferencia.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | useMapStats devuelve los 4 nuevos valores correctos | RenderHook + validParticipant, verificar counts/avg |
| Unit | empty data → todos los nacionales en 0/vacío | RenderHook con `[]` |
| Unit | mix de datos válidos/inválidos | edad=0, sexo null, nivelEstudio sin hasValue |
| Type-check | Todos los archivos compilan | `tsc --noEmit` |

Nota: el proyecto tiene `vitest` configurado y tests existentes en `useMapStats.spec.ts`, a pesar de que `openspec/config.yaml` reporta `testing.runner: null`.

## Migration / Rollout

No migration required. Las nuevas props son opcionales — si alguien usa LocationInfoBox sin pasarlas, el componente funciona exactamente como antes.

## Open Questions

None.
