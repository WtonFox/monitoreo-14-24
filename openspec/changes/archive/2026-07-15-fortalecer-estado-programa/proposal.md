# Proposal: Fortalecer Estado del Programa

## Intent

Fortalecer el board "Estado del Programa" con nuevos indicadores unidimensionales que reflejen la salud operativa del programa, aprovechando datos ya computados en `computeBoardData.ts` y datos disponibles del modelo `Participant`. NO fusionar con Impacto — mantener la separación conceptual: Estado del Programa = "qué está pasando" (operativo), Impacto = "por qué está pasando" (análisis dimensional).

## Current State

Estado del Programa (`ProgramaBoard.tsx`) tiene solo:
- 4 KPIs (% Activos, % Egresados, % Menores con Tutor, % Tutores con Teléfono)
- 3 charts: Distribución por Estado, Activos vs Egresados por Centro, Activos vs Egresados por Municipio

Es el board más débil del subsistema de indicadores, con solo 3 visualizaciones. Su nombre promete más de lo que entrega.

## Scope

Agregar 5 indicadores nuevos + 1 mejora visual:

1. **Evolución del Programa por Año** — Barras agrupadas de Activos/Egresados/Retirados por año (cruza fechaRegistro + estado)
2. **Estado por Ruta Formativa** — Barras horizontales de Activos vs Egresados por curso (cruza rutaFormativa + estado)
3. **Contactabilidad por Centro** — Tabla con % de tutores con teléfono válido por centro
4. **Menores con Tutor por Centro** — Tabla con % de menores con tutor asignado por centro
5. **Promedio de Edad de Activos vs Egresados** — KPI dual o tabla comparativa
6. **Distribución por Estado (mejorado)** — Colores por estado + tooltips con %

## Exclusions

- NO se modifican boards existentes (Impacto, NivelEducativo, Territoriales, etc.)
- NO se fusiona con Impacto
- NO se agregan indicadores que dupliquen funcionalidad existente (verificamos cada uno)
- NO se modifica el modelo de datos Participant

## Approach

- Expandir `ProgramSlice` en `computeBoardData.ts` para exponer nuevos campos ya computados
- Implementar lógica nueva solo donde sea necesario (evolución por año, contactabilidad por centro, menores por centro)
- Actualizar `ProgramaBoard.tsx` con nuevos componentes visuales
- Reutilizar patrones existentes (BoardShell, Recharts, tablas con barras de %)
