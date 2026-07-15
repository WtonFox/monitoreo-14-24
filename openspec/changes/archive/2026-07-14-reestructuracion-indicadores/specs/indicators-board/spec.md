# Indicators Board — Delta Spec

> Delta sobre `openspec/specs/indicators-board/spec.md`.
> Cambio: `reestructuracion-indicadores` — reorganización de categorías, renombres, eliminación de Sociales, formato completitud calidad-dato.

---

## MODIFIED Requirements

### R1: Route & Navigation

Router MUST register `/indicadores`. Sidebar SHALL include "Indicadores" link.

- GIVEN the app sidebar
- WHEN the route is added
- THEN an "Indicadores" link SHALL appear
- AND navigating to `/indicadores` SHALL render the indicator board

#### Scenario: `/indicadores/sociales` is no longer a valid route

- GIVEN a user navigating to `/indicadores/sociales`
- WHEN the route resolves
- THEN the app SHALL redirect to `/indicadores`
- OR SHALL show a 404 page
- AND `INDICADORES_SOCIALES` SHALL NOT exist in `ROUTES`

### R2: Indicator Display

Page SHALL display 65 indicators in 8 groups: Demográficos, Territoriales, Estado del Programa, Calidad del Dato, Salud y Vulnerabilidad, Cobertura Temporal, Nivel Educativo, Desempeño por Centro. Each card SHALL show name, computed value, formula, description.

- GIVEN participant data in DashboardContext
- WHEN `/indicadores` opens
- THEN 65 cards SHALL render in 8 sections
- AND each SHALL display name, value, formula, description

---

## ADDED Requirements

### R8: Calidad-Dato Completeness Format

Indicators with IDs 37–42 (calidad-dato completitud) SHALL display their value as `"X de Y (Z%)"` where X is the count of records with data, Y is the total population, and Z% is the percentage. This is a presentation-format change only — no structural or computational change.

- GIVEN an indicator with ID in [37, 38, 39, 40, 41, 42]
- WHEN the indicator card renders
- THEN the value SHALL display as `"{count} de {total} ({percentage}%)"`
- AND the `completitudPct` function SHALL return both count and total alongside the percentage

#### Scenario: zero records with data

- GIVEN `qualityCedula = 0` and `total = 100`
- WHEN indicator ID 37 renders
- THEN value SHALL display `"0 de 100 (0.0%)"`

#### Scenario: all records have data

- GIVEN `qualityEducation = 200` and `total = 200`
- WHEN indicator ID 39 renders
- THEN value SHALL display `"200 de 200 (100.0%)"`

---

## REMOVED Requirements

### R2: Sociales group removed

- The group `Sociales` is REMOVED from IndicatorDisplay (R2).
- The category `'sociales'` is REMOVED from `IndicatorCategory` type.
- The category `'social'` is REMOVED from `BoardCategory` type.
- `socialData` is REMOVED from `BoardData` interface.
- `SocialesBoard` page component is REMOVED.
- `INDICADORES_SOCIALES` route is REMOVED from `ROUTES`.
- `ROUTE_PERMISSIONS` entry for `INDICADORES_SOCIALES` is REMOVED.
- Sidebar/navigation link to Sociales is REMOVED.
- Tabs/Layout references to `'sociales'` are REMOVED.
- `'sociales'` entry in `CATEGORY_META` (IndicatorModal) is REMOVED.
- `'sociales'` entry in `OVERVIEW_CATEGORIES` (IndicatorModal) is REMOVED.

  (Reason: Los indicadores previamente en Sociales se redistribuyeron a Calidad del Dato e Indicadores Demográficos. La categoría no tiene indicadores propios restantes.)

  (Migration: IDs 23, 24 → calidad-dato; IDs 29–32 → demograficos. La ruta `/indicadores/sociales` redirige a `/indicadores`. No hay datos persistentes asociados a la categoría.)

---

## RENAMED Requirements

### Indicator name renames

The following indicator names SHALL change (display-name change only; IDs, formulas, and computations remain identical):

| ID | Old Name | New Name |
|----|----------|----------|
| 11 | Número de participantes por municipio | Cantidad de participantes por municipio |
| 13 | Número de participantes por sector | Cantidad de participantes por sector |
| 15 | Número de participantes por centro | Cantidad de participantes por centro |
| 17 | Número de participantes por curso | Cantidad de participantes por curso |
| 19 | Número de participantes por estado | Cantidad de participantes por estado |
| 21 | Número de participantes por estado civil | Cantidad de participantes por estado civil |
| 52 | Edad promedio al momento del registro | Edad de ingreso al programa |

- GIVEN the indicators board with participant data
- WHEN the board renders
- THEN IDs 11, 13, 15, 17, 19, 21 SHALL display `"Cantidad de participantes..."` (not `"Número de participantes..."`)
- AND ID 52 SHALL display `"Edad de ingreso al programa"` (not `"Edad promedio al momento del registro"`)
