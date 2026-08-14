# Auditoría de Datos — Spec Delta

## Purpose

Nueva capacidad `auditoria-datos`: un board autónomo `AuditoriaBoard` bajo `/indicadores` (patrón `RegistroDiarioBoard`) que audita la calidad del dataset con 8 señales —duplicados de carga, multi-ruta (Q1), re-inscripción candidata (Q2), ND cédula, anomalías fecha/edad, vocabulario de estados, centinelas y corruptos— más un callout para Q3 (egreso repetido, no respondible sin `fechaEgreso`). Extiende R11 de `indicators-board` (ruta + tab) sin tocar `computeIndicators` ni `routeBoardMap`.

Semántica de filas CONFIRMADA (2026-08-13): 1 fila por persona registrada, sin deduplicar (70.283 registros). Q1/Q2 son heurísticas sobre identidad normalizada y SHALL reportarse siempre como listas de **candidatos** con caveats, nunca como afirmaciones.

> Los escenarios Given/When/Then constituyen los criterios de aceptación de cada requerimiento.

## ADDED Requirements

### AUD-0: Identidad normalizada

La clave primaria de detección de grupos repetidos MUST ser `nombres + apellidos` normalizados (trim, case-fold, sin acentos, sin espacios internos). La cédula normalizada (solo dígitos) MUST usarse como confirmación secundaria cuando exista; los valores `'N/D'`/vacíos MUST excluirse del matching por cédula pero NO del matching por nombre.

#### Scenario: Variantes ortográficas coinciden

- GIVEN "María De León" y "maria de leon"
- WHEN se computa la identidad normalizada
- THEN ambas SHALL producir la misma clave de grupo

#### Scenario: Cédula refuerza sin ser requisito

- GIVEN dos filas con mismo nombre y cédulas `'001-0000001-1'` y `'00100000011'`
- WHEN se compara por cédula normalizada
- THEN SHALL coincidir y confirmar el grupo

#### Scenario: Sin cédula no excluye del grupo

- GIVEN una fila con `cedula='N/D'` y otra con cédula válida, mismo nombre
- WHEN se agrupa por identidad
- THEN ambas SHALL pertenecer al mismo grupo candidato

### AUD-1: Board Auditoría

El sistema MUST renderizar `AuditoriaBoard` en `/indicadores/auditoria`, con tab "Auditoría" en el grupo "Datos y Calidad" de `TAB_GROUPS` y acceso con los permisos existentes de `/indicadores`. Extiende R11 de `indicators-board` sin cambios a `computeIndicators` ni `routeBoardMap`.

#### Scenario: Navegación al board

- GIVEN un usuario con permisos de indicadores
- WHEN navega a `/indicadores/auditoria`
- THEN `AuditoriaBoard` SHALL renderizar con shell, KPIs y señales

#### Scenario: Acceso por tab

- GIVEN el menú de indicadores
- WHEN el usuario abre el grupo "Datos y Calidad"
- THEN SHALL existir el tab "Auditoría" junto a "Calidad del Dato"

#### Scenario: Dataset vacío

- GIVEN cero participantes tras filtros
- WHEN el board renderiza
- THEN cada señal SHALL mostrar `0` o "Sin datos" sin errores

#### Scenario: Carga en curso

- GIVEN el sync aún no termina
- WHEN el board renderiza
- THEN SHALL mostrar el estado de carga del shell

### AUD-2: Señal — Duplicados de carga

El sistema MUST detectar duplicados de carga como grupos con identidad normalizada repetida, misma `rutaFormativa` e ids consecutivos o fechas cercanas, y MOSTRAR count + lista candidata.

#### Scenario: Pares con ids consecutivos

- GIVEN dos filas mismo nombre+ruta, ids `1001` y `1002`, fechas iguales
- WHEN se computa la señal
- THEN SHALL contar 1 grupo duplicado y listar ambas filas

#### Scenario: Fechas distantes en misma ruta

- GIVEN mismo nombre+ruta con `fechaRegistro` separada 14 meses
- WHEN se computa la señal
- THEN NO SHALL clasificarse como duplicado de carga (candidato Q2, AUD-4)

### AUD-3: Señal — Multi-ruta (Q1)

El sistema MUST detectar candidatos multi-ruta como identidad repetida con ≥2 `rutaFormativa` distintas, y MOSTRAR count + lista con las rutas.

#### Scenario: Una persona en dos rutas

- GIVEN dos filas mismo nombre, rutas "Programa A" y "Programa B"
- WHEN se computa la señal
- THEN SHALL contar 1 candidato Q1 y listar nombre con ambas rutas

#### Scenario: Homónimos reales

- GIVEN dos personas distintas con idéntico nombre+apellido en rutas distintas
- WHEN se computa la señal
- THEN SHALL listarse como candidato con caveat de homonimia visible

### AUD-4: Señal — Re-inscripción (Q2)

El sistema MUST detectar candidatos re-inscripción como identidad repetida con `fechaRegistro` distante o misma ruta con fechas separadas, y MOSTRAR count + lista candidata.

#### Scenario: Re-inscripción en misma ruta

- GIVEN dos filas mismo nombre+ruta con `fechaRegistro` separadas 8 meses
- WHEN se computa la señal
- THEN SHALL contar 1 candidato Q2 con fechas visibles

#### Scenario: Grupo mixto por cercanía

- GIVEN un grupo de 3 filas en misma ruta: dos cercanas y una distante
- WHEN se computa la señal
- THEN las cercanas SHALL ir a duplicados (AUD-2) y la distante a Q2

### AUD-5: Señal — ND cédula

El sistema MUST mostrar count y porcentaje de registros sin cédula válida (`'N/D'`, vacía o solo no-dígitos) sobre el universo filtrado, y listar los registros afectados.

#### Scenario: Muestra con 42% sin cédula

- GIVEN 2.000 filas, 840 sin cédula válida
- WHEN se computa la señal
- THEN SHALL mostrar count `840` y `42.0%`

#### Scenario: Universo sin ND

- GIVEN todas las filas con cédula válida
- WHEN se computa la señal
- THEN SHALL mostrar `0` y `0.0%` con lista vacía

### AUD-6: Señal — Anomalías fecha/edad

El sistema MUST detectar y contar: `fechaNacimiento` futura, `fechaInclusion < fechaRegistro`, edad que no coincide con `fechaNacimiento`, y `edadRegistro` inconsistente con `edad`.

#### Scenario: Fecha de nacimiento futura

- GIVEN una fila con `fechaNacimiento` posterior a hoy
- WHEN se computa la señal
- THEN SHALL contarse 1 anomalía y listarse la fila

#### Scenario: Inclusión previa al registro

- GIVEN una fila con `fechaInclusion` anterior a `fechaRegistro`
- WHEN se computa la señal
- THEN SHALL contarse 1 anomalía

#### Scenario: Fechas corruptas excluidas

- GIVEN una fila con fecha no parseable
- WHEN se computa la señal
- THEN NO SHALL contar como anomalía lógica (ya contada como corrupta, AUD-9)

### AUD-7: Señal — Vocabulario de estados

El sistema MUST enumerar los valores distintos de `estado` con su count y MARCAR los que no pertenecen al vocabulario conocido (`PARTICIPANT_STATUSES` y estados conocidos: Identificado, Egresado pasantía, Egresado fase lectiva, Desertor, No admitido, Baja, Cancelado, Inactivo).

#### Scenario: Valor fuera de vocabulario

- GIVEN un `estado` "En proceso" presente en 5 filas
- WHEN se computa la señal
- THEN SHALL listarlo como valor fuera de vocabulario con count 5

#### Scenario: Vocabulario íntegro

- GIVEN estados dentro del vocabulario conocido
- WHEN se computa la señal
- THEN SHALL mostrarse la enumeración sin valores marcados

### AUD-8: Señal — Centinelas

El sistema MUST contar valores centinela (`n/d`, `n/a`, `s/d`, "sin centro", "sin estado", "sin provincia", case-insensitive) en `centro`, `estado`, `provincia` y `rutaFormativa`, reutilizando los clasificadores de `utils/normalize.ts`.

#### Scenario: Centinela en centro

- GIVEN 12 filas con `centro='Sin Centro'`
- WHEN se computa la señal
- THEN SHALL mostrar count 12 para el campo `centro`

#### Scenario: Sin centinelas

- GIVEN ningún valor centinela en campos clave
- WHEN se computa la señal
- THEN SHALL mostrar 0 en cada campo

### AUD-9: Señal — Corruptos

El sistema MUST mostrar counts de registros corruptos del sync (`corruptedItems` y `syncStats.corrupted`, estados `GENERIC_ERROR`/`CRITICALLY_CORRUPT`) con drill-down de razones.

#### Scenario: Sync con corruptos

- GIVEN `syncStats.corrupted=3` con 3 items
- WHEN se computa la señal
- THEN SHALL mostrar count 3 y lista con razones

#### Scenario: Sin corruptos

- GIVEN `syncStats.corrupted=0`
- WHEN se computa la señal
- THEN SHALL mostrar 0 y lista vacía

### AUD-10: Callout Q3

El sistema MUST mostrar un callout informativo: el egreso repetido (Q3) NO es respondible porque el modelo no expone `fechaEgreso` (confirmado en Swagger).

#### Scenario: Callout visible

- GIVEN el board renderizado
- WHEN se visualiza la sección de señales
- THEN SHALL verse el texto "no respondible sin fecha de egreso"

### AUD-11: Filtros globales

El board MUST computar todas las señales sobre `filteredData` de `useIndicadoresFilters()`, respetando los filtros globales existentes (año/provincia/municipio/sexo/estado).

#### Scenario: Filtro por provincia

- GIVEN filtro provincia="Santiago"
- WHEN el board computa las señales
- THEN todos los counts y listas SHALL reflejar solo Santiago

#### Scenario: Recalculo ante cambio de filtro

- GIVEN un cambio de filtro activo
- WHEN el board re-renderiza
- THEN las señales SHALL recalcularse sobre el nuevo universo

### AUD-12: Etiquetado de candidatos

Toda lista de duplicados, Q1 o Q2 MUST etiquetarse como "candidatos" con caveat visible (homonimia posible, clasificación heurística) y NO SHALL presentarse como afirmación.

#### Scenario: Caveat en multi-ruta

- GIVEN una lista de candidatos multi-ruta
- WHEN se renderiza el drill-down
- THEN SHALL mostrar la etiqueta "candidatos" y el caveat

#### Scenario: Caveat en duplicados

- GIVEN una lista de duplicados de carga
- WHEN se renderiza el drill-down
- THEN SHALL aclararse que la clasificación es heurística sin historial en origen
