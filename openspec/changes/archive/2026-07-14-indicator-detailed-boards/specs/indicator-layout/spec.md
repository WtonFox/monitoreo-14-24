# Indicator Layout Specification

## Purpose

Provide a shell with always-visible tab navigation for `/indicadores/*` nested routes, preserving the existing `/indicadores` summary as the index route.

## Requirements

| ID | Requirement | Keyword |
|----|-------------|---------|
| L1 | The system MUST render an `IndicadoresLayout` component with 5 tabs: Resumen, Demográficos, Territoriales, Programa, Sociales | MUST |
| L2 | Tabs MUST be always visible at the top of the layout below the page title, styled like a material dashboard (pill/underline style with active highlight) | MUST |
| L3 | The system MUST use React Router's `<Outlet>` inside `IndicadoresLayout` to render matched child routes | MUST |
| L4 | `/indicadores` MUST render the existing summary page (index route, no redirect) | MUST |
| L5 | `/indicadores/demograficos` MUST render `DemographicBoard` | MUST |
| L6 | `/indicadores/territoriales` MUST render `TerritorialBoard` | MUST |
| L7 | `/indicadores/programa` MUST render `ProgramBoard` | MUST |
| L8 | `/indicadores/sociales` MUST render `SocialBoard` | MUST |
| L9 | Each board component MUST be lazy-loaded via `React.lazy()` wrapped in `<Suspense>` | MUST |
| L10 | The existing `/indicadores` link in `Sidebar` MUST remain unchanged | MUST |
| L11 | `ROUTES` in `types/routes.ts` MUST add `INDICADORES_DEMOGRAFICOS`, `INDICADORES_TERRITORIALES`, `INDICADORES_PROGRAMA`, `INDICADORES_SOCIALES` constants | MUST |
| L12 | Each route path SHOULD inherit the same `ProtectedRoute` permission as `/indicadores` | SHOULD |

### Scenario: Default summary loads at `/indicadores`

- GIVEN the user navigates to `/indicadores`
- WHEN the layout renders
- THEN the "Resumen" tab is active
- AND the existing indicator summary page is shown below the tabs

### Scenario: Tab navigation switches board

- GIVEN the user is on `/indicadores`
- WHEN they click the "Demográficos" tab
- THEN the URL changes to `/indicadores/demograficos`
- AND `DemographicBoard` renders below the tabs
- AND all other tabs remain visible and clickable

### Scenario: Direct URL navigation

- GIVEN the user enters `/indicadores/programa` in the address bar
- WHEN the route resolves
- THEN `ProgramBoard` renders with lazy fallback during load
- AND the "Programa" tab shows as active

### Scenario: Invalid nested route

- GIVEN the user navigates to `/indicadores/invalid`
- WHEN the route does not match any board
- THEN the system SHOULD redirect to `/indicadores`
