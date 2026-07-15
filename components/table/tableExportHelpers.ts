import { Participant } from '../../types';
import * as XLSX from 'xlsx';

const sanitizeVal = (v: unknown): unknown => {
  if (typeof v !== 'string' || v.length === 0) return v;
  return '=+-@'.includes(v[0]) ? `'${v}` : v;
};

const generateLocalCSV = (items: Participant[]) => {
  const headers = [
    'ID', 'Nombres', 'Apellidos', 'Cédula', 'Edad', 'Edad Registro',
    'Fecha Nacimiento', 'Fecha Registro', 'Fecha Inclusión',
    'Tutor', 'Cédula Tutor', 'Teléfono Responsable',
    'Vulnerabilidades', 'Alergias', 'Discapacidades', 'Enfermedades',
    'Programas Sociales',
    'Estado', 'Sexo', 'Estado Civil', 'Nivel Estudio', 'Provincia',
    'Municipio', 'Centro', 'Dirección', 'Ruta Formativa'
  ];

  const rows = items.map(item => [
    item.id,
    `"${sanitizeVal(item.nombres || '')}"`,
    `"${sanitizeVal(item.apellidos || '')}"`,
    `"${sanitizeVal(item.cedula || '')}"`,
    item.edad,
    item.edadRegistro || '',
    item.fechaNacimiento,
    item.fechaRegistro,
    item.fechaInclusion || '',
    `"${sanitizeVal(item.tutor || '')}"`,
    `"${sanitizeVal(item.cedulaTutor || '')}"`,
    `"${sanitizeVal(item.telefonosResponsable || '')}"`,
    `"${sanitizeVal(item.vulnerabilidades || '')}"`,
    `"${sanitizeVal(item.alergias || '')}"`,
    `"${sanitizeVal(item.discapacidades || '')}"`,
    `"${sanitizeVal(item.enfermedades || '')}"`,
    `"${sanitizeVal(item.programasSociales || '')}"`,
    item.estado,
    item.sexo,
    `"${sanitizeVal(item.estadoCivil || '')}"`,
    `"${sanitizeVal(item.nivelEstudio || '')}"`,
    `"${sanitizeVal(item.provincia || '')}"`,
    `"${sanitizeVal(item.municipio || '')}"`,
    `"${sanitizeVal(item.centro || '')}"`,
    `"${sanitizeVal(item.direccion || '')}"`,
    `"${sanitizeVal(item.rutaFormativa || '')}"`
  ].join(';'));

  return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
};

export const handleLocalJSON = (exportData: Participant[]) => {
  if (exportData.length === 0) return;
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `oportunidad1424_datos_${new Date().toISOString().slice(0, 10)}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleLocalExport = (exportData: Participant[]) => {
  if (exportData.length === 0) return;
  const csvContent = generateLocalCSV(exportData);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `oportunidad1424_vista_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleLocalXLSX = (exportData: Participant[]) => {
  if (exportData.length === 0) return;

  const excelRow = (item: Participant) => ({
    'ID': item.id,
    'Nombres': sanitizeVal(item.nombres || ''),
    'Apellidos': sanitizeVal(item.apellidos || ''),
    'Cédula': sanitizeVal(item.cedula || ''),
    'Edad': item.edad,
    'Edad Registro': item.edadRegistro || '',
    'Fecha Nacimiento': item.fechaNacimiento || '',
    'Fecha Registro': item.fechaRegistro || '',
    'Fecha Inclusión': item.fechaInclusion || '',
    'Tutor': sanitizeVal(item.tutor || ''),
    'Cédula Tutor': sanitizeVal(item.cedulaTutor || ''),
    'Teléfono Responsable': sanitizeVal(item.telefonosResponsable || ''),
    'Vulnerabilidades': sanitizeVal(item.vulnerabilidades || ''),
    'Alergias': sanitizeVal(item.alergias || ''),
    'Discapacidades': sanitizeVal(item.discapacidades || ''),
    'Enfermedades': sanitizeVal(item.enfermedades || ''),
    'Programas Sociales': sanitizeVal(item.programasSociales || ''),
    'Estado': sanitizeVal(item.estado || ''),
    'Sexo': sanitizeVal(item.sexo || ''),
    'Estado Civil': sanitizeVal(item.estadoCivil || ''),
    'Nivel Estudio': sanitizeVal(item.nivelEstudio || ''),
    'Provincia': sanitizeVal(item.provincia || ''),
    'Municipio': sanitizeVal(item.municipio || ''),
    'Centro': sanitizeVal(item.centro || ''),
    'Dirección': sanitizeVal(item.direccion || ''),
    'Ruta Formativa': sanitizeVal(item.rutaFormativa || ''),
  });

  const excelData = exportData.map(excelRow);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
    { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
    { wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 15 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
    { wch: 30 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `oportunidad1424_vista_${new Date().toISOString().slice(0, 10)}.xlsx`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
