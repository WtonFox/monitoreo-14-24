import React from 'react';
import { X, FileSpreadsheet, FileJson, Download } from 'lucide-react';
import { ExportFormat, ExportProgress } from '../services/exporter';

interface MassExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  progress: ExportProgress | null;
  onExport: (format: ExportFormat) => void;
  onCancel: () => void;
}

export const MassExportModal: React.FC<MassExportModalProps> = ({
  isOpen,
  isExporting,
  progress,
  onExport,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exportación Masiva</h2>
            <p className="text-sm text-gray-500 mt-1">
              Descargar TODOS los registros de la base de datos
            </p>
          </div>
          {!isExporting && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Progress Display */}
        {isExporting && progress && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-blue-900">
                Descargando datos...
              </span>
              <span className="text-sm font-bold text-blue-600">
                {progress.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>

            {/* Stats */}
            <div className="flex justify-between text-xs text-blue-700">
              <span>
                Página {progress.currentPage} de {progress.totalPages}
              </span>
              <span>
                {progress.recordsProcessed.toLocaleString()} / {progress.totalRecords.toLocaleString()} registros
              </span>
            </div>

            {progress.isComplete && (
              <div className="mt-3 text-center text-sm font-semibold text-green-600">
                ✓ Descarga completa. Generando archivo...
              </div>
            )}
          </div>
        )}

        {/* Export Options */}
        {!isExporting && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Selecciona el formato de exportación:
            </p>

            {/* CSV Button */}
            <button
              onClick={() => onExport('csv')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileSpreadsheet size={24} className="text-green-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">CSV</h3>
                <p className="text-xs text-gray-500">
                  Compatible con Excel, Google Sheets
                </p>
              </div>
              <Download size={20} className="text-gray-400 group-hover:text-green-600" />
            </button>

            {/* Excel Button */}
            <button
              onClick={() => onExport('xlsx')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileSpreadsheet size={24} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Excel (XLSX)</h3>
                <p className="text-xs text-gray-500">
                  Formato nativo de Microsoft Excel
                </p>
              </div>
              <Download size={20} className="text-gray-400 group-hover:text-blue-600" />
            </button>

            {/* JSON Button */}
            <button
              onClick={() => onExport('json')}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <FileJson size={24} className="text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">JSON</h3>
                <p className="text-xs text-gray-500">
                  Formato para programación y APIs
                </p>
              </div>
              <Download size={20} className="text-gray-400 group-hover:text-purple-600" />
            </button>
          </div>
        )}

        {/* Cancel Button (during export) */}
        {isExporting && (
          <button
            onClick={onCancel}
            className="w-full mt-4 py-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Cancelar Exportación
          </button>
        )}
      </div>
    </div>
  );
};
