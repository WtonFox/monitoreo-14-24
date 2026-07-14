import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Participant } from '../types';
import { fetchParticipants } from './api';
import { sanitizeParticipant } from '../utils/dataUtils';

export interface ExportProgress {
  currentPage: number;
  totalPages: number;
  recordsProcessed: number;
  totalRecords: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
}

export type ExportFormat = 'csv' | 'xlsx' | 'json';

/**
 * Descargar TODOS los datos de la API en lotes
 */
async function fetchAllData(
  onProgress?: (progress: ExportProgress) => void,
  signal?: AbortSignal
): Promise<Participant[]> {
  const allData: Participant[] = [];
  const BATCH_SIZE = 1000;
  let currentPage = 1;
  let hasMore = true;
  let totalRecords = 0;

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
      // Continuar con la siguiente página en caso de error
      currentPage++;
    }
  }

  // Progreso completado
  onProgress?.({
    currentPage: totalPages,
    totalPages,
    recordsProcessed: allData.length,
    totalRecords: allData.length,
    percentage: 100,
    isComplete: true
  });

  return allData;
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
    const data = await fetchAllData(onProgress, signal);

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

    // Generar CSV con papaparse
    const csv = Papa.unparse(csvData, {
      delimiter: ';',
      header: true
    });

    // Agregar BOM para Excel UTF-8
    const csvWithBOM = '\uFEFF' + csv;

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
    const data = await fetchAllData(onProgress, signal);

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

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

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
    const data = await fetchAllData(onProgress, signal);

    // Sanitizar cada registro antes de exportar
    const sanitizedData = data.map((item, idx) => sanitizeParticipant(item, idx));

    // Crear estructura JSON con metadata
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: sanitizedData.length,
        version: '1.0'
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

/**
 * Helper para descargar blob como archivo
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpiar objeto URL después de un tiempo
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}
