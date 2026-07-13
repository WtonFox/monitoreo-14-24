# Explore: Nuevos Reportes e Indicadores

## Context

Se solicitaron 5 nuevos requerimientos de reportes/indicadores para el panel de monitoreo del programa Oportunidad 14-24. Este documento analiza la viabilidad técnica de cada uno basándose en la arquitectura actual del sistema.

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

## Requerimiento 4: Calidad del Dato — Casos con "nd" / información no verificable

### Data disponible
- Múltiples campos de `Participant` que pueden contener valores "nd", vacíos o no verificables:
  - `telefonos`, `telefonosResponsable`, `cedulaTutor` — contacto
  - `alergias`, `discapacidades`, `enfermedades` — perfil de salud
  - `programasSociales`, `nivelEstudio`, `estadoCivil` — perfil social
  - `direccion`, `sector` — ubicación
  - `nombreTutor`, `apellidoTutor` — tutor

### Algoritmo
1. Por cada campo relevante, contar registros donde el valor sea `null`, `undefined`, `""`, `"nd"`, `"N/D"`, o `"No Disponible"`
2. Expresar como porcentaje del total: `% nd = count(nd) / total * 100`
3. Ranking de campos con peor calidad de dato (mayor % nd)
4. Desglose por provincia/centro para detectar patrones geográficos

### Viabilidad: ALTA

Todo es client-side. Los valores "nd" ya existen en los datos; solo falta contarlos. No requiere cambios en la API.

### Formato recomendado
- **Board de indicador** (ej: `pages/indicadores/CalidadNdBoard.tsx`)
- Similar al `CalidadDatoBoard.tsx` existente pero enfocado en nd values
- KPI: % general de datos no disponibles
- Tabla: campos rankeados por % nd
- Gráfica de barras: top campos con más nd
- Desglose por provincia: mapa de calor de calidad por región
- Filtro por provincia/centro
- **Importante**: esto es DISTINTO del `CalidadDatoBoard.tsx` existente (que mide completitud teléfono/dirección). Este mide la presencia de valores "nd" en TODOS los campos del participante.

---

## Requerimiento 5: Verificar y pulir visualmente todos los boards

### Alcance
No es un board nuevo, sino una revisión integral de los 9 boards existentes + los que se creen nuevos.

### Checklist de verificación
- [ ] **Consistencia visual**: todos los boards usan el mismo padding, colores, tipografía y espaciado
- [ ] **KPIs coherentes**: mismo formato de números, colores de badges, tarjetas con mismo shadow/border
- [ ] **Gráficas**: tamaños de fuente uniformes en ejes, leyendas consistentes, colores de la paleta del proyecto
- [ ] **Responsive**: boards se ven bien en pantallas chicas (stack columns, textos no rotos)
- [ ] **Estados vacío**: todos los boards muestran "Sin datos" o loader cuando filteredData está vacío
- [ ] **Carga inicial**: ningún board se rompe durante la carga inicial de datos
- [ ] **Filtros**: los filtros locales (año, provincia, sexo) funcionan y limpian estados anteriores al cambiar

### Formato recomendado
- Revisión manual board por board + lista de ajustes
- Posible refactor a un wrapper `<BoardShell>` si hay mucha duplicación de layout

---

## Análisis transversal

### Patrón a seguir
Los 5 requerimientos se implementan como boards de indicadores siguiendo la misma estructura de `DesempenoCentroBoard.tsx`:

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

1. Decidir agrupación de cambios (1 solo cambio o separados: 4 boards + 1 revisión)
2. `/sdd-new nuevos-reportes-indicadores` para iniciar proposal formal
3. Implementar boards siguiendo el patrón existente
4. Ejecutar revisión visual (#5) al final, después de tener todos los boards
