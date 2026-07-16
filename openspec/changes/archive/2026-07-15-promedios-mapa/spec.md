# Spec: Promedios Nacionales en LocationInfoBox

> **Delta spec** para `map-location-info`. Agrega 4 nuevas métricas de comparación nacional al LocationInfoBox. No modifica requisitos existentes.

## ADDED Requirements

### R6: Edad Promedio Local vs Nacional

Cuando el LocationInfoBox muestra edad promedio local y hay datos nacionales, el sistema MUST mostrar el promedio local, el promedio nacional, y la diferencia.

#### Scenario: Edad local vs nacional

- GIVEN un LocationInfoBox con `ageRanges.avg = 18` y `nationalAvgAge = 20`
- WHEN el box se renderiza
- THEN SHALL mostrar "Edad promedio: 18 años (nacional: 20)"
- AND SHALL indicar "2 años menos que el nacional"

#### Scenario: Edad local igual a nacional

- GIVEN un LocationInfoBox con `ageRanges.avg = 20` y `nationalAvgAge = 20`
- WHEN el box se renderiza
- THEN SHALL mostrar "Edad promedio: 20 años (nacional: 20)"
- AND SHALL indicar "Igual al promedio nacional"

#### Scenario: Sin datos de edad local

- GIVEN un LocationInfoBox con `ageRanges.avg = 0`
- WHEN el box se renderiza
- THEN la sección de edad SHALL omitirse (mismo comportamiento actual)

### R7: Género Local vs Nacional

Cuando el LocationInfoBox muestra breakdown de género y hay datos nacionales, el sistema MUST mostrar % M/F local junto al % M/F nacional.

#### Scenario: Género local vs nacional

- GIVEN un LocationInfoBox con `genderBreakdown = { M: 60, F: 40 }` y `nationalGenderBreakdown = { M: 50, F: 50 }`
- AND genderTotal = 100
- WHEN el box se renderiza
- THEN SHALL mostrar "M: 60 (60.0%) — Nacional: 50.0%"
- AND SHALL mostrar "F: 40 (40.0%) — Nacional: 50.0%"

#### Scenario: Todos del mismo género

- GIVEN un LocationInfoBox con `genderBreakdown = { M: 100, F: 0 }` y `nationalGenderBreakdown = { M: 55, F: 45 }`
- WHEN el box se renderiza
- THEN SHALL mostrar "M: 100 (100.0%) — Nacional: 55.0%"
- AND SHALL mostrar "F: 0 (0.0%) — Nacional: 45.0%"

#### Scenario: Sin dato nacional

- GIVEN un LocationInfoBox sin `nationalGenderBreakdown`
- WHEN el box se renderiza
- THEN la comparación nacional SHALL omitirse
- AND el breakdown local SHALL mostrarse normalmente

### R8: Nivel Educativo Local vs Nacional

Cuando el LocationInfoBox muestra nivel educativo y hay datos nacionales, el sistema MUST mostrar los top N niveles locales con comparación contra el mismo nivel a nivel nacional.

#### Scenario: Educación local vs nacional

- GIVEN un LocationInfoBox con top 3 educación local: `["Bachiller": 50, "Primaria": 30, "Universitario": 20]`
- AND `nationalEducationBreakdown = { "Bachiller": 100, "Primaria": 60, "Técnico": 40, "Universitario": 30 }`
- WHEN el box se renderiza
- THEN cada nivel local SHALL mostrar su % local y su % nacional
- AND si un nivel local no existe en national, el % nacional SHALL mostrar "N/A"

#### Scenario: Educación local vacía

- GIVEN un LocationInfoBox sin `educationBreakdown`
- WHEN el box se renderiza
- THEN la sección educativa SHALL omitirse (mismo comportamiento actual)

### R9: Estado Local vs Nacional

Cuando el LocationInfoBox muestra breakdown de estado y hay datos nacionales, el sistema MUST mostrar los top N estados locales con comparación contra el mismo estado a nivel nacional.

#### Scenario: Estado local vs nacional

- GIVEN un LocationInfoBox con top 3 estados locales: `["Activo": 80, "Egresado": 15, "Suspendido": 5]`
- AND `nationalStatusBreakdown = { "Activo": 200, "Egresado": 50, "Inactivo": 30, "Suspendido": 10 }`
- WHEN el box se renderiza
- THEN cada estado local SHALL mostrar su % local
- AND el % nacional para ese mismo estado SHALL mostrarse
- AND "Activo" SHALL mostrar "80 (80.0%) — Nacional: 200 (66.7%)"

#### Scenario: Estado local con entrada sin datos nacional

- GIVEN un estado local "Suspendido" no presente en `nationalStatusBreakdown`
- WHEN el box se renderiza
- THEN el % nacional SHALL mostrar "N/A"
- AND el valor local SHALL mostrarse sin interrupción
