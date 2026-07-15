import React from 'react';
import { Participant } from '../../types';

export const renderCell = (item: Participant, columnId: string) => {
  switch (columnId) {
    case 'fullName':
      return (
        <div>
          <div className="font-medium text-gray-900">{item.nombres} {item.apellidos}</div>
          <div className="text-xs text-gray-400">ID: {item.id}</div>
        </div>
      );
    case 'cedula':
      return <span className="font-mono text-xs">{item.cedula || 'N/A'}</span>;
    case 'edad':
      return <span>{item.edad} años</span>;
    case 'edadRegistro':
      return <span>{item.edadRegistro ? `${item.edadRegistro} años` : 'N/A'}</span>;
    case 'sexo':
      return <span>{item.sexo}</span>;
    case 'estadoCivil':
      return <span>{item.estadoCivil || 'N/A'}</span>;
    case 'provincia':
      return <span>{item.provincia || 'N/A'}</span>;
    case 'municipio':
      return <span>{item.municipio || 'N/A'}</span>;
    case 'centro':
      return <div className="max-w-xs truncate" title={item.centro || ''}>{item.centro || 'N/A'}</div>;
    case 'estado':
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full 
          ${item.estado === 'Activo' ? 'bg-green-100 text-green-700' :
            item.estado === 'Retirado' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'}`}>
          {item.estado || 'Desconocido'}
        </span>
      );
    case 'fechaRegistro':
      return <span className="text-xs whitespace-nowrap">{item.fechaRegistro ? new Date(item.fechaRegistro).toLocaleDateString() : 'N/A'}</span>;
    case 'fechaInclusion':
      return <span className="text-xs whitespace-nowrap">{item.fechaInclusion ? new Date(item.fechaInclusion).toLocaleDateString() : 'N/A'}</span>;
    case 'tutor':
      return <span className="text-xs">{item.tutor || 'N/A'}</span>;
    case 'cedulaTutor':
      return <span className="font-mono text-xs">{item.cedulaTutor || 'N/A'}</span>;
    case 'telefonos':
      return <span className="text-xs">{item.telefonos || 'N/A'}</span>;
    case 'telefonosResponsable':
      return <span className="text-xs">{item.telefonosResponsable || 'N/A'}</span>;
    case 'direccion':
      return <div className="max-w-[200px] truncate text-xs" title={item.direccion || ''}>{item.direccion || 'N/A'}</div>;
    case 'nivelEstudio':
      return <span>{item.nivelEstudio || 'N/A'}</span>;
    case 'rutaFormativa':
      return <span>{item.rutaFormativa || 'N/A'}</span>;
    case 'alergias':
      return <span className="text-xs">{item.alergias || 'N/A'}</span>;
    case 'discapacidades':
      return <span className="text-xs">{item.discapacidades || 'N/A'}</span>;
    case 'enfermedades':
      return <span className="text-xs">{item.enfermedades || 'N/A'}</span>;
    case 'programasSociales':
      return <div className="max-w-[200px] truncate text-xs" title={item.programasSociales || ''}>{item.programasSociales || 'N/A'}</div>;
    case 'fechaNacimiento':
      return <span className="text-xs whitespace-nowrap">{item.fechaNacimiento ? new Date(item.fechaNacimiento).toLocaleDateString() : 'N/A'}</span>;
    case 'vulnerabilidades':
      return <div className="max-w-[200px] truncate text-xs" title={item.vulnerabilidades || ''}>{item.vulnerabilidades || 'N/A'}</div>;
    default:
      return null;
  }
};
