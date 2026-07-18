# Proposal: Exportación Mejorada — Multi-hoja y Datos Agregados

## Intent

Extender la exportación XLSX actual (una hoja plana "Participantes") para soportar múltiples hojas con datos agregados del mapa interactivo y del tablero de indicadores, más botones contextuales y modal de selección de hojas.

## Scope

### In Scope
- Exportación XLSX multi-hoja con selección dinámica de hojas
- Hojas agregadas del mapa: "Por Provincia", "Por Municipio", "Desglose por Ubicación"
- Hojas de indicadores: una por categoría del tablero con datos tabulares
- Modal `ExportSheetSelector` con checkboxes para elegir hojas
- Botón de exportación contextual en `MapSection` (datos filtrados del mapa)
- Botón de exportación contextual en `IndicatorsBoard` (indicadores actuales)
- Reutilización del pipeline `fetchAllData` existente en `services/exporter.ts`

### Out of Scope
- Exportación de mapas o gráficas como imágenes incrustadas (cubre change 07 — PDF reports)
- Exportación de datos comparativos (cubre change 08 — Modo Comparativo)
- Exportación programada o automática
- Editor de datos previo a exportación

## Capabilities

### New Capabilities
- `multi-sheet-export`: Exportación XLSX con selección dinámica de hojas. Incluye modal de selección y botones contextuales en mapa y tablero de indicadores. Reutiliza `fetchAllData` para descarga masiva y `XLSX.utils.book_new/book_append_sheet` de SheetJS.
- `map-export`: Exportación de datos agregados del mapa a XLSX. Sheets de conteo por provincia, municipio, y desglose completo por ubicación (edad, género, estado, educación, centros top).
- `indicators-export`: Exportación de indicadores del tablero a XLSX. Una hoja por categoría (demográficos, territoriales, programa, etc.) con datos tabulares de cada indicador.

### Modified Capabilities
- None

## Approach

1. **`services/multiSheetExporter.ts`** (nuevo): recibe datos crudos, `mapStats` y `indicatorGroups`. Construye workbook multi-hoja con SheetJS. Llama a `fetchAllData` de `exporter.ts` para descarga masiva. Sheets se agregan condicionalmente según selección del usuario.
2. **`components/ExportSheetSelector.tsx`** (nuevo): modal con checkboxes para seleccionar hojas. Estados: idle → exporting (con barra de progreso reutilizada) → done.
3. **`MapSection.tsx`** (modificado): botón "Exportar Excel" en la barra de herramientas. Pasa `mapData` y `locationStats` de `useMapStats` al selector pre-configurado con sheets de ubicación.
4. **`IndicatorsBoard.tsx`** (modificado): botón "Exportar Excel" en el encabezado. Pasa `groups` de indicadores al selector pre-configurado con sheets de categorías.
5. **`MassExportModal.tsx`** (modificado): agrega opción "Excel Avanzado (multi-hoja)" que abre el selector de hojas.

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `services/multiSheetExporter.ts` | **New** | Constructor de workbook multi-hoja |
| `components/ExportSheetSelector.tsx` | **New** | Modal de selección de hojas |
| `components/MapSection.tsx` | Modified | Botón exportación contextual |
| `components/IndicatorsBoard.tsx` | Modified | Botón exportación contextual |
| `components/MassExportModal.tsx` | Modified | Opción Excel avanzado |
| `services/exporter.ts` | Modified | Exponer `fetchAllData` para reuso |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Workbook >50MB con 67k registros en múltiples sheets | Media | SheetJS maneja hojas separadas eficientemente; datos agregados son mucho más pequeños que crudos |
| Nombres de categorías exceden 31 chars (límite XLSX) | Baja | Truncar nombre de sheet al límite con sufijo único |
| API rate limit al descargar datos para mapa | Baja | MapSection ya opera sobre `dashboardData` en caché, no requiere fetch extra |

## Impacto en cambios existentes

Ninguno. Los changes 07 (PDF reports) y 08 (modo comparativo) no tocan los archivos modificados. `exporter.ts` no es modificado por ningún otro change activo.

## Rollback Plan

Revertir commit (`git revert`). Eliminar `services/multiSheetExporter.ts` y `components/ExportSheetSelector.tsx`. Revertir cambios en MapSection, IndicatorsBoard, MassExportModal y exporter.ts.

## Dependencies

- `xlsx` (SheetJS) — ya instalado como dependencia
- `useMapStats` — ya existe, expone `mapData` y `locationStats`
- `useIndicators` / `computeBoardData` — ya existen, exponen `IndicatorGroup[]`

## Success Criteria

- [ ] Exportación multi-hoja genera XLSX válido con sheets seleccionadas
- [ ] Botón en MapSection descarga XLSX con datos del mapa filtrado
- [ ] Botón en IndicatorsBoard descarga XLSX con indicadores actuales
- [ ] Modal permite elegir subconjunto de hojas
- [ ] Exportación CSV/JSON existente funciona sin regresiones
- [ ] Modal muestra estado empty si no hay datos para cierta hoja
