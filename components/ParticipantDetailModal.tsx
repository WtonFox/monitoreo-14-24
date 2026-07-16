import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
}

type FieldSection = {
  title: string;
  fields: { label: string; value: string | number | null }[];
};

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  isOpen,
  onClose,
  participant,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !participant) return null;

  const fullName = [participant.nombres, participant.apellidos]
    .filter(Boolean)
    .join(' ') || 'Sin nombre';

  const sections: FieldSection[] = [
    {
      title: 'Información Personal',
      fields: [
        { label: 'Nombres', value: participant.nombres },
        { label: 'Apellidos', value: participant.apellidos },
        { label: 'Cédula', value: participant.cedula },
        { label: 'Edad', value: participant.edad },
        { label: 'Fecha de Nacimiento', value: participant.fechaNacimiento },
        { label: 'Sexo', value: participant.sexo },
        { label: 'Estado Civil', value: participant.estadoCivil },
      ],
    },
    {
      title: 'Contacto y Ubicación',
      fields: [
        { label: 'Provincia', value: participant.provincia },
        { label: 'Municipio', value: participant.municipio },
        { label: 'Dirección', value: participant.direccion },
        { label: 'Teléfonos', value: participant.telefonos },
        { label: 'Tel. Responsable', value: participant.telefonosResponsable },
      ],
    },
    {
      title: 'Programa',
      fields: [
        { label: 'Estado', value: participant.estado },
        { label: 'Ruta Formativa', value: participant.rutaFormativa },
        { label: 'Fecha de Registro', value: participant.fechaRegistro },
        { label: 'Fecha de Inclusión', value: participant.fechaInclusion },
        { label: 'Centro', value: participant.centro },
      ],
    },
    {
      title: 'Salud y Social',
      fields: [
        { label: 'Alergias', value: participant.alergias },
        { label: 'Discapacidades', value: participant.discapacidades },
        { label: 'Enfermedades', value: participant.enfermedades },
        { label: 'Programas Sociales', value: participant.programasSociales },
        { label: 'Vulnerabilidades', value: participant.vulnerabilidades },
      ],
    },
    {
      title: 'Tutor',
      fields: [
        { label: 'Tutor', value: participant.tutor },
        { label: 'Cédula del Tutor', value: participant.cedulaTutor },
      ],
    },
    {
      title: 'Otros',
      fields: [
        { label: 'Edad de Registro', value: participant.edadRegistro },
        { label: 'Nivel de Estudio', value: participant.nivelEstudio },
      ],
    },
  ];

  const renderValue = (val: string | number | null) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-300">&mdash;</span>;
    }
    return <span className="text-gray-800">{val}</span>;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del Participante"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{fullName}</h2>
            <p className="text-xs text-blue-100">Detalles del participante</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3 pb-1 border-b border-gray-200">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {section.fields.map((field) => (
                  <div key={field.label}>
                    <span className="block text-xs font-medium text-gray-500">{field.label}</span>
                    <span className="block text-sm mt-0.5">{renderValue(field.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
