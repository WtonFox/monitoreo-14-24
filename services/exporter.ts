import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Participant, PaginationResult } from '../types';
import { fetchParticipants } from './api';

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

    // Preparar datos para CSV (campos planos)
    const csvData = data.map(item => ({
      ID: item.id,
      'Cédula': item.cedula || '',
      Nombres: item.nombres || '',
      Apellidos: item.apellidos || '',
      Edad: item.edad,
      'Fecha Nacimiento': item.fechaNacimiento,
      'Fecha Registro': item.fechaRegistro,
      'Fecha Inclusión': item.fechaInclusion || '',
      Tutor: item.tutor || '',
      'Cédula Tutor': item.cedulaTutor || '',
      Vulnerabilidades: item.vulnerabilidades || '',
      Estado: item.estado || '',
      Sexo: item.sexo || '',
      Provincia: item.provincia || '',
      Municipio: item.municipio || '',
      Centro: item.centro || '',
      'Dirección': item.direccion || '',
      'Ruta Formativa': item.rutaFormativa || '',
      'Teléfonos': item.telefonos || '',
      'Teléfonos Responsable': item.telefonosResponsable || '',
      'Edad Registro': item.edadRegistro,
      'Estado Civil': item.estadoCivil || '',
      'Nivel Estudio': item.nivelEstudio || '',
      'Alergias': item.alergias || '',
      'Discapacidades': item.discapacidades || '',
      'Enfermedades': item.enfermedades || '',
      'Programas Sociales': item.programasSociales || ''
    }));

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

    // Preparar datos para Excel
    const excelData = data.map(item => ({
      'ID': item.id,
      'Cédula': item.cedula || '',
      'Nombres': item.nombres || '',
      'Apellidos': item.apellidos || '',
      'Edad': item.edad,
      'Fecha Nacimiento': item.fechaNacimiento,
      'Fecha Registro': item.fechaRegistro,
      'Fecha Inclusión': item.fechaInclusion || '',
      'Tutor': item.tutor || '',
      'Cédula Tutor': item.cedulaTutor || '',
      'Vulnerabilidades': item.vulnerabilidades || '',
      'Estado': item.estado || '',
      'Sexo': item.sexo || '',
      'Provincia': item.provincia || '',
      'Municipio': item.municipio || '',
      'Centro': item.centro || '',
      'Dirección': item.direccion || '',
      'Ruta Formativa': item.rutaFormativa || '',
      'Teléfonos': item.telefonos || '',
      'Teléfonos Responsable': item.telefonosResponsable || '',
      'Edad Registro': item.edadRegistro,
      'Estado Civil': item.estadoCivil || '',
      'Nivel Estudio': item.nivelEstudio || '',
      'Alergias': item.alergias || '',
      'Discapacidades': item.discapacidades || '',
      'Enfermedades': item.enfermedades || '',
      'Programas Sociales': item.programasSociales || ''
    }));

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

    // Crear estructura JSON con metadata
    const jsonData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        version: '1.0'
      },
      participants: data
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
