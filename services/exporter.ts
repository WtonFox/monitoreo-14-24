import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { fetchParticipants } from './api';
import { sanitizeParticipant } from '../utils/dataUtils';
import { downloadBlob } from '../utils/exportUtils';

export interface ExportReceipt {
  totalRecordsExpected: number;
  totalRecordsDownloaded: number;
  failedPages: number[];
  partialFailure: boolean;
}

const FORMULA_DANGER_CHARS = new Set(['=', '+', '-', '@']);

export function sanitizeFormula(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) return value;
  return FORMULA_DANGER_CHARS.has(value[0]) ? `'${value}` : value;
}

export interface ExportProgress {
  currentPage: number;
  totalPages: number;
  recordsProcessed: number;
  totalRecords: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
  failedPages?: number[];
  totalRecordsExpected?: number;
  totalRecordsDownloaded?: number;
  partialFailure?: boolean;
  warning?: string;
}

export type ExportFormat = 'csv' | 'xlsx' | 'json';

/**
 * Descargar TODOS los datos de la API en lotes
 */
export async function fetchAllData(
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<{ data: Participant[]; receipt: ExportReceipt }> {
  const allData: Participant[] = [];
  const BATCH_SIZE = 1000;
  let currentPage = 1;
  let hasMore = true;
  let totalRecords = 0;
  const failedPages: number[] = [];

  // Primera petición para obtener el total
  const firstBatch = await fetchParticipants(1, BATCH_SIZE);
  totalRecords = firstBatch.totalItems;
  const totalPages = Math.ceil(totalRecords / BATCH_SIZE);

  allData.push(...firstBatch.items);

  // Reportar progreso inicial
  onProgress?.({
    currentPage: 1,
    totalPages,
    recordsProcessed: firstBatch.items.length,
    totalRecords,
    percentage: Math.round((firstBatch.items.length / totalRecords) * 100),
    isComplete: false
  });

  currentPage = 2;

  // Descargar el resto de páginas
  while (hasMore && currentPage <= totalPages) {
    // Verificar si se canceló
    if (signal?.aborted) {
      throw new Error('Export cancelled by user');
    }

    try {
      const batch = await fetchParticipants(currentPage, BATCH_SIZE);

      if (!batch.items || batch.items.length === 0) {
        hasMore = false;
        break;
      }

      allData.push(...batch.items);

      // Reportar progreso
      onProgress?.({
        currentPage,
        totalPages,
        recordsProcessed: allData.length,
        totalRecords,
        percentage: Math.round((allData.length / totalRecords) * 100),
        isComplete: false
      });

      if (batch.items.length < BATCH_SIZE) {
        hasMore = false;
      }

      currentPage++;

      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error fetching page ${currentPage}:`, error);
      failedPages.push(currentPage);
      currentPage++;
    }
  }

  const partialFailure = failedPages.length > 0;
  const totalRecordsDownloaded = allData.length;

  // Progreso completado con receipt
  onProgress?.({
    currentPage: totalPages,
    totalPages,
    recordsProcessed: totalRecordsDownloaded,
    totalRecords,
    percentage: partialFailure ? Math.round((totalRecordsDownloaded / totalRecords) * 100) : 100,
    isComplete: true,
    failedPages,
    totalRecordsExpected: totalRecords,
    totalRecordsDownloaded,
    partialFailure,
    warning: partialFailure
      ? `Exportación incompleta: se esperaban ${totalRecords} registros, se descargaron ${totalRecordsDownloaded}. Páginas con error: ${failedPages.join(', ')}.`
      : undefined
  });

  return {
    data: allData,
    receipt: { totalRecordsExpected: totalRecords, totalRecordsDownloaded, failedPages, partialFailure }
  };
}

/**
 * Exportar datos a CSV
 */
export async function exportToCSV(
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    // Descargar todos los datos
    const { data, receipt } = await fetchAllData(onProgress, signal);

    // Sanitizar cada registro antes de exportar
    const csvData = data.map((item, idx) => {
      const clean = sanitizeParticipant(item, idx);
      return {
        ID: clean.id,
        'Cédula': clean.cedula || '',
        Nombres: clean.nombres || '',
        Apellidos: clean.apellidos || '',
        Edad: clean.edad,
        'Fecha Nacimiento': clean.fechaNacimiento || '',
        'Fecha Registro': clean.fechaRegistro || '',
        'Fecha Inclusión': clean.fechaInclusion || '',
        Tutor: clean.tutor || '',
        'Cédula Tutor': clean.cedulaTutor || '',
        Vulnerabilidades: clean.vulnerabilidades || '',
        Estado: clean.estado || '',
        Sexo: clean.sexo || '',
        Provincia: clean.provincia || '',
        Municipio: clean.municipio || '',
        Centro: clean.centro || '',
        'Dirección': clean.direccion || '',
        'Ruta Formativa': clean.rutaFormativa || '',
        'Teléfonos': clean.telefonos || '',
        'Teléfonos Responsable': clean.telefonosResponsable || '',
        'Edad Registro': clean.edadRegistro,
        'Estado Civil': clean.estadoCivil || '',
        'Nivel Estudio': clean.nivelEstudio || '',
        'Alergias': clean.alergias || '',
        'Discapacidades': clean.discapacidades || '',
        'Enfermedades': clean.enfermedades || '',
        'Programas Sociales': clean.programasSociales || ''
      };
    });

    // Neutralizar fórmula injection en valores de texto
    const csvRows = csvData.map(row => {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        sanitized[k] = sanitizeFormula(v);
      }
      return sanitized;
    });

    // Generar CSV con papaparse
    const csv = Papa.unparse(csvRows, {
      delimiter: ';',
      header: true
    });

    // Agregar advertencia si la exportación fue parcial
    let content = csv;
    if (receipt.partialFailure) {
      const warn = `# ADVERTENCIA: Exportación incompleta. Se esperaban ${receipt.totalRecordsExpected} registros, se descargaron ${receipt.totalRecordsDownloaded}. Páginas con error: ${receipt.failedPages.join(', ')}.\n`;
      content = warn + content;
    }

    // Agregar BOM para Excel UTF-8
    const csvWithBOM = '\uFEFF' + content;

    // Crear blob y descargar
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const fileName = `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, fileName);

  } catch (error: any) {
    throw new Error(`Error exportando CSV: ${error.message}`);
  }
}

/**
 * Exportar datos a Excel (XLSX)
 */
export async function exportToExcel(
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    // Descargar todos los datos
    const { data, receipt } = await fetchAllData(onProgress, signal);

    // Sanitizar cada registro antes de exportar
    const excelData = data.map((item, idx) => {
      const clean = sanitizeParticipant(item, idx);
      return {
        'ID': clean.id,
        'Cédula': clean.cedula || '',
        'Nombres': clean.nombres || '',
        'Apellidos': clean.apellidos || '',
        'Edad': clean.edad,
        'Fecha Nacimiento': clean.fechaNacimiento || '',
        'Fecha Registro': clean.fechaRegistro || '',
        'Fecha Inclusión': clean.fechaInclusion || '',
        'Tutor': clean.tutor || '',
        'Cédula Tutor': clean.cedulaTutor || '',
        'Vulnerabilidades': clean.vulnerabilidades || '',
        'Estado': clean.estado || '',
        'Sexo': clean.sexo || '',
        'Provincia': clean.provincia || '',
        'Municipio': clean.municipio || '',
        'Centro': clean.centro || '',
        'Dirección': clean.direccion || '',
        'Ruta Formativa': clean.rutaFormativa || '',
        'Teléfonos': clean.telefonos || '',
        'Teléfonos Responsable': clean.telefonosResponsable || '',
        'Edad Registro': clean.edadRegistro,
        'Estado Civil': clean.estadoCivil || '',
        'Nivel Estudio': clean.nivelEstudio || '',
        'Alergias': clean.alergias || '',
        'Discapacidades': clean.discapacidades || '',
        'Enfermedades': clean.enfermedades || '',
        'Programas Sociales': clean.programasSociales || ''
      };
    });

    // Neutralizar fórmula injection en valores de texto
    const excelRows = excelData.map(row => {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        sanitized[k] = sanitizeFormula(v);
      }
      return sanitized;
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();

    // Crear hoja con o sin advertencia de exportación parcial
    let ws: XLSX.WorkSheet;
    if (receipt.partialFailure) {
      const headers = Object.keys(excelRows[0]);
      const warnText = `ADVERTENCIA: Exportación incompleta. Se esperaban ${receipt.totalRecordsExpected} registros, se descargaron ${receipt.totalRecordsDownloaded}. Páginas con error: ${receipt.failedPages.join(', ')}.`;
      const aoa = [
        [warnText],
        headers,
        ...excelRows.map(row => headers.map(h => (row as any)[h]))
      ];
      ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    } else {
      ws = XLSX.utils.json_to_sheet(excelRows);
    }

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 8 },  // ID
      { wch: 15 }, // Cédula
      { wch: 20 }, // Nombres
      { wch: 20 }, // Apellidos
      { wch: 6 },  // Edad
      { wch: 12 }, // Fecha Nacimiento
      { wch: 12 }, // Fecha Registro
      { wch: 12 }, // Fecha Inclusión
      { wch: 20 }, // Tutor
      { wch: 15 }, // Cédula Tutor
      { wch: 25 }, // Vulnerabilidades
      { wch: 15 }, // Estado
      { wch: 8 },  // Sexo
      { wch: 20 }, // Provincia
      { wch: 20 }, // Municipio
      { wch: 25 }, // Centro
      { wch: 30 }, // Dirección
      { wch: 20 }, // Ruta Formativa
      { wch: 15 }, // Teléfonos
      { wch: 15 }, // Teléfonos Responsable
      { wch: 10 }, // Edad Registro
      { wch: 15 }, // Estado Civil
      { wch: 20 }, // Nivel Estudio
      { wch: 20 }, // Alergias
      { wch: 20 }, // Discapacidades
      { wch: 25 }, // Enfermedades
      { wch: 25 }  // Programas Sociales
    ];
    ws['!cols'] = colWidths;

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const fileName = `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.xlsx`;
    downloadBlob(blob, fileName);

  } catch (error: any) {
    throw new Error(`Error exportando Excel: ${error.message}`);
  }
}

/**
 * Exportar datos a JSON
 */
export async function exportToJSON(
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    // Descargar todos los datos
    const { data, receipt } = await fetchAllData(onProgress, signal);

    // Sanitizar cada registro antes de exportar
    const sanitizedData = data.map((item, idx) => sanitizeParticipant(item, idx));

    // Crear estructura JSON con metadata
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: sanitizedData.length,
        version: '1.0',
        ...(receipt.partialFailure ? {
          warning: `Exportación incompleta: se esperaban ${receipt.totalRecordsExpected} registros, se descargaron ${receipt.totalRecordsDownloaded}. Páginas con error: ${receipt.failedPages.join(', ')}.`,
          totalRecordsExpected: receipt.totalRecordsExpected,
          totalRecordsDownloaded: receipt.totalRecordsDownloaded,
          failedPages: receipt.failedPages,
          partialFailure: true
        } : {})
      },
      participants: sanitizedData
    };

    // Convertir a JSON con formato
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Crear blob y descargar
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const fileName = `monitoreo_14-24_${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, fileName);

  } catch (error: any) {
    throw new Error(`Error exportando JSON: ${error.message}`);
  }
}


