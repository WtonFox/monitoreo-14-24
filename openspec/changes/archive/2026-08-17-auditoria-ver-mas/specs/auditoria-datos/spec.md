# Auditoría de Datos — Spec Delta

## Purpose

Este delta modifica la capacidad `auditoria-datos` para: (1) acotar a `VER_MAS_LIMIT = 15` las filas visibles de cada tarjeta con lista y agregar un botón "Ver más" que abre un modal con la lista completa (AUD-13 ADDED); (2) reemplazar el callout estático de Q3 por una tarjeta de candidatos Q3 —identidades con ≥2 registros y ≥1 estado egresado— conservando la nota de limitación (AUD-10 MODIFIED); (3) extender el etiquetado "candidato" + caveat de AUD-12 a la lista Q3 (AUD-12 MODIFIED).

> Los escenarios Given/When/Then constituyen los criterios de aceptación de cada requerimiento.

## ADDED Requirements

### Requirement: Límite visible y "Ver más" (AUD-13)

Cada tarjeta con lista (Duplicados de carga, Multi-ruta Q1, Re-inscripción Q2, ND Cédula, Anomalías fecha/edad, Vocabulario de estados, Corruptos) MUST mostrar a lo sumo `VER_MAS_LIMIT = 15` filas en el board. Cuando la lista supere 15, MUST mostrarse un botón "Ver más" que abre un modal con la lista COMPLETA, con título, count y contenido scrolleable (`max-h-[85vh] overflow-y-auto`). El modal MUST cerrarse por backdrop, tecla Esc y botón de cierre, y MUST cerrarse automáticamente ante un cambio de filtro. La tarjeta Centinelas NO SHALL mostrar lista ni botón "Ver más" (count-only).

#### Scenario: Lista dentro del límite

- GIVEN una señal con lista de 15 o menos filas
- WHEN se renderiza la tarjeta en el board
- THEN SHALL mostrarse la lista sin botón "Ver más"

#### Scenario: Lista sobre el límite

- GIVEN una señal con lista de más de 15 filas
- WHEN se renderiza la tarjeta
- THEN SHALL mostrarse a lo sumo 15 filas y un botón "Ver más"
- AND al pulsarlo SHALL abrirse un modal con la lista completa, título y count

#### Scenario: Cierre ante cambio de filtro

- GIVEN un modal "Ver más" abierto
- WHEN cambia `filteredData` (filtro global activo)
- THEN el modal SHALL cerrarse para no mostrar una lista obsoleta

#### Scenario: Cierre por Esc o backdrop

- GIVEN un modal "Ver más" abierto
- WHEN el usuario pulsa Esc o hace clic en el backdrop
- THEN el modal SHALL cerrarse

## MODIFIED Requirements

### Requirement: Callout Q3 (AUD-10)

El sistema MUST listar candidatos Q3: identidades con ≥2 filas agrupadas Y ≥1 fila con estado egresado (`isGraduatedStatus`), mostrando identidad, N filas, rutas, estados (marcando los egresado) y fechas. Cada candidato SHALL etiquetarse "candidato" con el caveat de AUD-12: sin `fechaEgreso` no se confirma un egreso repetido; posible homonimia. La lista Q3 NO SHALL presentarse como afirmación de doble egreso. La nota de limitación "no respondible sin fecha de egreso" SHALL permanecer visible bajo la tarjeta.
(Previously: callout estático informativo sin lista, con texto "no respondible sin fecha de egreso")

#### Scenario: Nota de limitación visible

- GIVEN el board renderizado
- WHEN se visualiza la sección de señales
- THEN SHALL verse la nota "no respondible sin fecha de egreso" bajo la tarjeta Q3

#### Scenario: Candidato con fila egresado

- GIVEN una identidad con 2 filas y 1 fila con estado "Egresado pasantía"
- WHEN se computa la señal Q3
- THEN SHALL listarse como candidato Q3 con identidad, N filas, rutas, estados y fechas

#### Scenario: Fila única no es candidato

- GIVEN una identidad con 1 sola fila sin estado egresado
- WHEN se computa la señal Q3
- THEN NO SHALL listarse como candidato Q3

#### Scenario: Egresado en fila única

- GIVEN una persona con 1 sola fila con estado "Egresado fase lectiva"
- WHEN se computa la señal Q3
- THEN NO SHALL listarse como candidato Q3 (requiere ≥2 filas)

#### Scenario: Overlap con Q1/Q2

- GIVEN un candidato que cumple Q3 y también Q1 o Q2
- WHEN se renderizan las tarjetas
- THEN SHALL aparecer en ambas listas con etiquetas que desambiguan la pregunta

### Requirement: Etiquetado de candidatos (AUD-12)

Toda lista de duplicados, Q1, Q2 o Q3 MUST etiquetarse como "candidatos" con caveat visible (homonimia posible, clasificación heurística) y NO SHALL presentarse como afirmación. Para Q3, el caveat SHALL aclarar que sin `fechaEgreso` no se confirma un egreso repetido.
(Previously: etiquetado limitado a duplicados, Q1 y Q2)

#### Scenario: Caveat en multi-ruta

- GIVEN una lista de candidatos multi-ruta
- WHEN se renderiza el drill-down
- THEN SHALL mostrar la etiqueta "candidatos" y el caveat

#### Scenario: Caveat en duplicados

- GIVEN una lista de duplicados de carga
- WHEN se renderiza el drill-down
- THEN SHALL aclararse que la clasificación es heurística sin historial en origen

#### Scenario: Caveat en Q3

- GIVEN una lista de candidatos Q3
- WHEN se renderiza la tarjeta Q3
- THEN SHALL mostrar la etiqueta "candidato" y el caveat de no confirmación de egreso repetido