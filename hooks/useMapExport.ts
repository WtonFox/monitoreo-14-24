import { useMemo } from 'react';
import { Participant } from '../types';
import { SheetConfig } from '../services/multiSheetExporter';
import { LocationStats } from './useMapStats';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseMapExportOptions {
  filteredData: Participant[];
  mapStats: {
    mapData: Record<string, number>;
    locationStats: Record<string, LocationStats>;
    nationalPhoneRate: number;
    nationalVulnerabilityRate: number;
    nationalAvgAge: number;
    nationalGenderRate: { M: number; F: number; other: number };
    nationalEducationRate: Record<string, number>;
    nationalStatusRate: Record<string, number>;
  };
  selectedProvince: string | null;
  selectedLocation: string | null;
  level: 'region' | 'province' | 'municipality';
}

export interface UseMapExportResult {
  sheets: SheetConfig[];
  preselectNames: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count participants per string-keyed field, filtering out unknown keys. */
function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item);
    if (!k) continue;
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMapExport({
  filteredData,
  mapStats,
  selectedProvince,
  selectedLocation,
  level: _level,
}: UseMapExportOptions): UseMapExportResult {
  return useMemo(() => {
    const sheets: SheetConfig[] = [];
    const preselectNames: string[] = [];

    const total = filteredData.length;

    // ── Aggregated counts ──────────────────────────────────────────
    const genderM = filteredData.filter(p => p.sexo?.toUpperCase() === 'M').length;
    const genderF = filteredData.filter(p => p.sexo?.toUpperCase() === 'F').length;
    const genderUnknown = total - genderM - genderF;
    const avgAge =
      total > 0
        ? Math.round(filteredData.reduce((sum, p) => sum + (p.edad || 0), 0) / total)
        : 0;

    const uniqueCenters = new Set(filteredData.map(p => p.centro).filter(Boolean)).size;

    // Phone contactability rate (skip N/D and blank)
    const phoneCount = filteredData.filter(p => {
      const v = p.telefonos?.trim() ?? '';
      return v !== '' && v.toUpperCase() !== 'N/D';
    }).length;

    // Vulnerability rate (any reported condition)
    const vulnCount = filteredData.filter(p => {
      const check = (v: string | null | undefined) => {
        const s = v?.trim() ?? '';
        return s !== '' && s.toUpperCase() !== 'N/D';
      };
      return check(p.discapacidades) || check(p.enfermedades) || check(p.alergias);
    }).length;

    // Province ranking
    const provinceCounts = countBy(filteredData, p => p.provincia || 'Desconocido');
    const sortedProvinces = Object.entries(provinceCounts).sort((a, b) => b[1] - a[1]);
    const topProvince = sortedProvinces[0];

    // Status ranking
    const statusCounts = countBy(filteredData, p => p.estado || 'Sin Estado');
    const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
    const topStatus = sortedStatuses[0];

    // ── 1. Resumen ────────────────────────────────────────────────
    sheets.push({
      name: 'Resumen',
      sheetType: 'table',
      headers: ['Métrica', 'Valor'],
      rows: [
        ['Total Participantes', total],
        ['Masculinos (M)', genderM],
        ['Femeninos (F)', genderF],
        ['Sexo Desconocido', genderUnknown],
        ['Edad Promedio', `${avgAge} años`],
        ['Centros Únicos', uniqueCenters],
        ['Tasa de Telefonía', total > 0 ? `${Math.round((phoneCount / total) * 100)}%` : '0%'],
        ['Tasa de Vulnerabilidad', total > 0 ? `${Math.round((vulnCount / total) * 100)}%` : '0%'],
        ...(topProvince ? [['Provincia Principal', `${topProvince[0]} (${topProvince[1]})`] as [string, string]] : []),
        ...(topStatus ? [['Estado Principal', `${topStatus[0]} (${topStatus[1]})`] as [string, string]] : []),
      ],
      columnWidths: [30, 40],
    });
    preselectNames.push('Resumen');

    // ── 2. Participantes por provincia ────────────────────────────
    if (sortedProvinces.length > 0) {
      sheets.push({
        name: 'Participantes por provincia',
        sheetType: 'table',
        headers: ['Provincia', 'Total', '% del Total'],
        rows: sortedProvinces.map(([prov, count]) => [
          prov,
          count,
          total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
        ]),
        columnWidths: [30, 12, 12],
      });
      preselectNames.push('Participantes por provincia');
    }

    // ── 3. Participantes por municipio (solo si hay provincia seleccionada) ──
    if (selectedProvince) {
      const munCounts = countBy(filteredData, p => p.municipio || 'Desconocido');
      const sortedMunicipalities = Object.entries(munCounts).sort((a, b) => b[1] - a[1]);

      if (sortedMunicipalities.length > 0) {
        sheets.push({
          name: 'Participantes por municipio',
          sheetType: 'table',
          headers: ['Municipio', 'Total', '% del Total'],
          rows: sortedMunicipalities.map(([mun, count]) => [
            mun,
            count,
            total > 0 ? `${Math.round((count / total) * 100)}%` : '0%',
          ]),
          columnWidths: [30, 12, 12],
        });
      }
    }

    // ── 4. Detalle por ubicación (solo si hay ubicación seleccionada) ──
    if (selectedLocation && mapStats.locationStats[selectedLocation]) {
      const stats = mapStats.locationStats[selectedLocation];

      const detailRows: unknown[][] = [
        ['Ubicación', selectedLocation],
        ['Total Participantes', stats.total],
        ['', ''],
        ['GÉNERO', ''],
        ['Masculinos (M)', stats.genderBreakdown.M],
        ['Femeninos (F)', stats.genderBreakdown.F],
        ['Sexo Desconocido', stats.genderBreakdown.other],
        ['', ''],
        ['EDAD', ''],
        ['Mínima', stats.ageRanges.min],
        ['Máxima', stats.ageRanges.max],
        ['Promedio', stats.ageRanges.avg],
        ['', ''],
        ['CONTACTABILIDAD', ''],
        ['Con Teléfono', stats.phoneCount],
        ['Tasa de Telefonía', stats.total > 0 ? `${Math.round((stats.phoneCount / stats.total) * 100)}%` : '0%'],
        ['', ''],
        ['VULNERABILIDAD', ''],
        ['Reportada', stats.vulnerabilityCount],
        ['Tasa de Vulnerabilidad', stats.total > 0 ? `${Math.round((stats.vulnerabilityCount / stats.total) * 100)}%` : '0%'],
      ];

      // Top centers
      if (stats.topCenters.length > 0) {
        detailRows.push(['', ''], ['TOP CENTROS', '']);
        for (const c of stats.topCenters) {
          detailRows.push([c.name, c.count]);
        }
      }

      // Status breakdown
      if (Object.keys(stats.statusBreakdown).length > 0) {
        detailRows.push(['', ''], ['DESGLOSE POR ESTADO', '']);
        for (const [status, count] of Object.entries(stats.statusBreakdown).sort((a, b) => b[1] - a[1])) {
          detailRows.push([status, count]);
        }
      }

      // Education breakdown
      if (Object.keys(stats.educationBreakdown).length > 0) {
        detailRows.push(['', ''], ['NIVEL DE ESTUDIO', '']);
        for (const [edu, count] of Object.entries(stats.educationBreakdown).sort((a, b) => b[1] - a[1])) {
          detailRows.push([edu, count]);
        }
      }

      // Year counts
      if (Object.keys(stats.yearCounts).length > 0) {
        detailRows.push(['', ''], ['AÑOS DE REGISTRO', '']);
        for (const [year, count] of Object.entries(stats.yearCounts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
          detailRows.push([`Año ${year}`, count]);
        }
      }

      sheets.push({
        name: 'Detalle por ubicación',
        sheetType: 'table',
        headers: ['Métrica', 'Valor'],
        rows: detailRows,
        columnWidths: [30, 40],
      });
      preselectNames.push('Detalle por ubicación');
    }

    // ── 5. Participantes (raw) — sin rows; se llenan en export ────
    sheets.push({
      name: 'Participantes (raw)',
      sheetType: 'table',
      headers: [
        'ID', 'Cédula', 'Nombres', 'Apellidos', 'Edad',
        'Fecha Nacimiento', 'Fecha Registro', 'Fecha Inclusión',
        'Tutor', 'Cédula Tutor', 'Vulnerabilidades', 'Estado',
        'Sexo', 'Provincia', 'Municipio', 'Centro', 'Dirección',
        'Ruta Formativa', 'Teléfonos', 'Teléfonos Responsable',
        'Edad Registro', 'Estado Civil', 'Nivel Estudio',
        'Alergias', 'Discapacidades', 'Enfermedades', 'Programas Sociales',
      ],
      rows: [],
      columnWidths: [8, 15, 20, 20, 6, 14, 14, 14, 20, 15, 25, 15, 8, 20, 20, 25, 30, 20, 15, 15, 10, 15, 20, 20, 20, 25, 25],
    });
    // NOTA: raw NO se agrega a preselectNames — el usuario debe elegirlo explícitamente

    return { sheets, preselectNames };
  }, [filteredData, mapStats, selectedProvince, selectedLocation, _level]);
}
