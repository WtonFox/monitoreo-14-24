import React, { useEffect, useRef } from 'react';
import { X, Sliders, RotateCcw } from 'lucide-react';
import { WIDGET_CATALOG } from '../constants/widgets';

interface DashboardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  visibleWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  onReset: () => void;
}

export const DashboardEditor: React.FC<DashboardEditorProps> = ({
  isOpen,
  onClose,
  visibleWidgetIds,
  onToggleWidget,
  onReset,
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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configurar Dashboard"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Configurar Dashboard</h2>
              <p className="text-xs text-blue-100">Elige qué gráficas mostrar</p>
            </div>
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
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">
            Activa o desactiva los widgets que quieres ver en el dashboard. Los cambios se aplican al instante.
          </p>
          <div className="space-y-2">
            {WIDGET_CATALOG.map(widget => {
              const isVisible = visibleWidgetIds.includes(widget.id);
              const Icon = widget.icon;
              return (
                <button
                  key={widget.id}
                  onClick={() => onToggleWidget(widget.id)}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isVisible
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isVisible ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="flex-1 text-sm font-medium">{widget.label}</span>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      isVisible ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                        isVisible ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onReset}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            <RotateCcw size={16} />
            Restablecer widgets
          </button>
          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
