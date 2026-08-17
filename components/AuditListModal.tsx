import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal genérico de lista (AD-1, AD-4, AUD-13).
 *
 * Es un modal tonto/presentacional: el board construye `children` (la lista
 * COMPLETA, sin `.slice()`) y se lo pasa. El cierre se gestiona por backdrop
 * (`e.target === e.currentTarget`), tecla Esc (listener en `window`, mount/
 * unmount) y botón X; además bloquea el scroll del body mientras está abierto.
 * Sigue la receta de overlay de IndicatorModal + a11y de ParticipantDetailModal
 * (`role="dialog"`, `aria-modal`, foco en el botón cerrar).
 */
interface AuditListModalProps {
  title: string;
  icon: React.ReactNode;
  tone: string; // chip del header, ej. 'bg-cyan-50 text-cyan-600'
  count?: string; // ya formateado (formatNumber)
  caveat?: React.ReactNode; // footer AUD-12, solo listas candidatas
  onClose: () => void;
  children: React.ReactNode; // lista COMPLETA sin slice
}

export const AuditListModal: React.FC<AuditListModalProps> = ({
  title,
  icon,
  tone,
  count,
  caveat,
  onClose,
  children,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc + foco en el botón cerrar (AD-4): mount/unmount gestiona el listener.
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Scroll-lock del body, restaurado al desmontar (AD-4).
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className={`flex items-start justify-between px-6 py-4 border-b ${tone} rounded-t-2xl`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl ${tone}`}>{icon}</div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
              {count !== undefined && (
                <p className="text-2xl font-bold text-gray-800 leading-tight">{count}</p>
              )}
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {caveat && (
          <div className="px-6 py-3 border-t border-gray-100">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              {caveat}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditListModal;
