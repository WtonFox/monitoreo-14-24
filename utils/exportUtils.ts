import { Participant } from '../types';

/**
 * Helper para descargar un Blob como archivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(link.href), 100);
}

/**
 * Exporta datos de participantes a formato CSV
 */
export const exportCSV = (data: Participant[], filename?: string) => {
    const headers = ['ID', 'Nombres', 'Apellidos', 'Cédula', 'Edad', 'Sexo', 'Provincia', 'Estado', 'Centro', 'Vulnerabilidades', 'Edad Registro', 'Estado Civil', 'Nivel Estudio', 'Alergias', 'Discapacidades', 'Enfermedades', 'Programas Sociales'];
    const rows = data.map(i =>
        [i.id, i.nombres, i.apellidos, i.cedula, i.edad, i.sexo, i.provincia, i.estado, i.centro, i.vulnerabilidades, i.edadRegistro, i.estadoCivil, i.nivelEstudio, i.alergias, i.discapacidades, i.enfermedades, i.programasSociales]
            .map(f => `"${String(f || '').replace(/"/g, '""')}"`)
            .join(';')
    );
    const csv = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const finalFilename = filename || `oportunidad1424_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, finalFilename);
};

/**
 * Exporta datos de participantes a formato JSON
 */
export const exportJSON = (data: Participant[], filename?: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

    const finalFilename = filename || `oportunidad1424_${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, finalFilename);
};
