# Explore: Nuevos Reportes e Indicadores

## Context

Se solicitaron 3 nuevos requerimientos de reportes/indicadores para el panel de monitoreo del programa Oportunidad 14-24. Este documento analiza la viabilidad técnica de cada uno basándose en la arquitectura actual del sistema.

---

## Requerimiento 1: Centros que no tienen menores (14-17 años)

### Data disponible
- `Participant.edad` (number) — edad actual del participante
- `Participant.centro` (string) — centro al que pertenece

### Algoritmo
1. Filtrar `dashboardData` donde `edad >= 14 && edad <= 17`
2. Agrupar por `centro`
3. Identificar centros sin ningún participante en ese rango etario

### Viabilidad: ALTA

Es un cálculo 100% client-side sobre los datos que ya están en memoria. No requiere cambios en la API ni en la estructura de datos.

### Formato recomendado
- **Board de indicador** (ej: `pages/indicadores/CentrosSinMenoresBoard.tsx`)
- Sigue el patrón exacto de los 9 boards existentes (DemograficosBoard, etc.)
- Renderiza tabla con centros sin menores, con filtros por provincia
- Posible KPI: "X centros sin cobertura de menores"

---

## Requerimiento 2: Top 10 centros con mayor deserción (general y por región)

### Data disponible
- `Participant.estado` (string) — valores actuales: "Activo", "Retirado", "Egresado", "Desertor", "Baja", etc.
- `Participant.centro` (string)
- `Participant.provincia` (string) — para agrupación regional

### Lo que SÍ podemos calcular (snapshot actual)
```
tasa_desercion = count(Retirados + Desertores + Bajas) / total_del_centro * 100
```
- Ranking top 10 general
- Ranking top 10 por provincia/región
- KPI de tasa de deserción general del programa

### Lo que NO podemos calcular (sin cambios en API)
- Deserción por período de tiempo (no existe `fechaRetiro`)
- Curva de abandono temporal
- Cohort analysis de retención

### Viabilidad: MEDIA-ALTA

El snapshot es viable hoy. La serie temporal requiere agregar `fechaRetiro` a la API.

### Formato recomendado
- **Board de indicador** (ej: `pages/indicadores/DesercionBoard.tsx`)
- Tabla ordenable con top centros
- Toggle entre vista general y por región
- Preparado para extender cuando la API agregue datos temporales

---

## Requerimiento 3: Registro diario de fichas (monitorear y rankear)

### Data disponible
- `Participant.fechaRegistro` (string, ISO date) — **siempre presente**
- `Participant.centro` (string)

### Algoritmo
1. Agrupar por fecha (`fechaRegistro`)
2. Contar registros por día
3. Calcular estadísticas: hoy, esta semana, este mes
4. Ranking de centros por fichas registradas
5. Línea de tiempo diaria

### Viabilidad: ALTA

No requiere cambios estructurales. Es puro agregado sobre datos existentes.

### Formato recomendado
- **Board de indicador** (ej: `pages/indicadores/RegistroDiarioBoard.tsx`)
- KPI: fichas hoy, esta semana, este mes
- Gráfica de barras/línea: fichas por día (últimos 30 días)
- Tabla: ranking de centros por registros
- Compatible con filtros provincia/municipio/sexo existentes

---

## Análisis transversal

### Patrón a seguir
Los 3 requerimientos se implementan como boards de indicadores siguiendo la misma estructura de `DesempenoCentroBoard.tsx`:

```
1. Crear archivo en pages/indicadores/MiBoard.tsx
2. Consumir useIndicadoresFilters() para obtener filteredData
3. Computar métricas con useMemo
4. Renderizar KPI cards + tabla/gráfica
5. Agregar ruta lazy en router.tsx
6. Agregar tab en IndicadoresLayout.tsx
```

### Lo que NO requiere cambios
- API endpoints
- Tipo Participant
- DashboardContext
- IndexedDB schema
- Sistema de filtros

### Dependencias externas
Ninguna. Todo es client-side sobre `dashboardData` que ya está en memoria.

### Riesgos
1. **Deserción sin temporalidad**: sin `fechaRetiro` en la API, el reporte de deserción es un snapshot, no una serie temporal. Si el negocio necesita evolución mensual, hay que coordinar con el equipo de API.
2. **Rendimiento**: los cálculos son O(n) sobre el dataset completo. Con `useDeferredValue` en los filtros no debería haber bloqueos de UI, pero hay que verificar con la carga completa de datos.

---

## Próximos pasos sugeridos

1. Decidir agrupación de cambios (1 solo cambio o 3 separados)
2. `/sdd-new nuevos-reportes-indicadores` para iniciar proposal formal
3. Implementar boards siguiendo el patrón existente
