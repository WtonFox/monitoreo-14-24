import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Download,
  Check
} from 'lucide-react';
import { SheetConfig } from '../services/multiSheetExporter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportSheetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sheets: SheetConfig[];
  defaultSelected?: string[];
  isExporting: boolean;
  exportProgress?: number;
  exportLabel?: string;
  onExport: (selectedSheets: SheetConfig[]) => void;
  description?: string;
}

// ---------------------------------------------------------------------------
// Sheet type visual config
// ---------------------------------------------------------------------------

const SHEET_TYPE_ORDER: Array<'table' | 'chart-data' | 'chart-image'> = [
  'table',
  'chart-data',
  'chart-image'
];

const GROUP_LABELS: Record<string, string> = {
  table: 'Tablas',
  'chart-data': 'Datos de gráficas',
  'chart-image': 'Gráficas'
};

interface TypeMeta {
  icon: React.ElementType<{ size?: number }>;
  label: string;
  color: string;
  badge: string;
  iconBg: string;
}

const TYPE_META: Record<string, TypeMeta> = {
  table: {
    icon: FileSpreadsheet,
    label: 'Tabla',
    color: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100'
  },
  'chart-data': {
    icon: FileText,
    label: 'Datos gráfica',
    color: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    iconBg: 'bg-purple-100'
  },
  'chart-image': {
    icon: BarChart3,
    label: 'Gráfica',
    color: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-100'
  }
};

const FALLBACK_META: TypeMeta = {
  icon: FileSpreadsheet,
  label: 'Hoja',
  color: 'text-gray-600',
  badge: 'bg-gray-100 text-gray-700',
  iconBg: 'bg-gray-100'
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExportSheetSelector: React.FC<ExportSheetSelectorProps> = ({
  isOpen,
  onClose,
  title,
  sheets,
  defaultSelected,
  isExporting,
  exportProgress = 0,
  exportLabel,
  onExport,
  description
}) => {
  // ── Selection state ─────────────────────────────────────────────────
  const [selectedNames, setSelectedNames] = useState<Set<string>>(() => {
    if (defaultSelected) return new Set(defaultSelected);
    return new Set(sheets.map(s => s.name));
  });

  const sheetsKey = useMemo(() => sheets.map(s => s.name).join(','), [sheets]);

  useEffect(() => {
    if (defaultSelected) {
      setSelectedNames(new Set(defaultSelected));
    } else {
      setSelectedNames(new Set(sheets.map(s => s.name)));
    }
  }, [sheetsKey, defaultSelected]);

  // ── Derived ─────────────────────────────────────────────────────────
  const groupedSheets = useMemo(() => {
    const groups: Record<string, SheetConfig[]> = {};
    for (const sheet of sheets) {
      const type = sheet.sheetType ?? 'table';
      if (!groups[type]) groups[type] = [];
      groups[type].push(sheet);
    }
    return groups;
  }, [sheets]);

  const hasSheets = sheets.length > 0;
  const allSelected = selectedNames.size === sheets.length && sheets.length > 0;
  const canExport = selectedNames.size > 0 && !isExporting;

  // ── Handlers ────────────────────────────────────────────────────────
  const toggleSheet = useCallback((name: string) => {
    if (isExporting) return;
    setSelectedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, [isExporting]);

  const toggleAll = useCallback(() => {
    if (isExporting) return;
    if (allSelected) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(sheets.map(s => s.name)));
    }
  }, [allSelected, sheets, isExporting]);

  const handleExport = useCallback(() => {
    if (!canExport) return;
    const selected = sheets.filter(s => selectedNames.has(s.name));
    onExport(selected);
  }, [sheets, selectedNames, onExport, canExport]);

  // ── Render ──────────────────────────────────────────────────────────
  if (!isOpen) return null;

  const getMeta = (type?: string): TypeMeta =>
    TYPE_META[type ?? 'table'] ?? FALLBACK_META;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex justify-between items-center mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2 flex-shrink-0"
              aria-label="Cerrar"
            >
              <X size={24} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!hasSheets && !isExporting && (
          <div className="text-center py-12">
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No hay datos para exportar</p>
          </div>
        )}

        {/* ── Sheet list ──────────────────────────────────────────── */}
        {hasSheets && !isExporting && (
          <>
            {/* Select all / Deselect all toggle */}
            {sheets.length > 3 && (
              <button
                onClick={toggleAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-3 transition-colors"
              >
                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            )}

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 -mr-1">
              {SHEET_TYPE_ORDER.map(type => {
                const typeSheets = groupedSheets[type];
                if (!typeSheets || typeSheets.length === 0) return null;

                const meta = getMeta(type);
                const TypeIcon = meta.icon;

                return (
                  <div key={type}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded-lg ${meta.iconBg}`}>
                        <TypeIcon size={16} className={meta.color} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {GROUP_LABELS[type] ?? type}
                      </h3>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>

                    {/* Sheet rows */}
                    <div className="space-y-0.5">
                      {typeSheets.map(sheet => {
                        const isSelected = selectedNames.has(sheet.name);
                        const sheetMeta = getMeta(sheet.sheetType);
                        const SheetIcon = sheetMeta.icon;

                        return (
                          <label
                            key={sheet.name}
                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {/* Custom checkbox */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isSelected}
                              onClick={() => toggleSheet(sheet.name)}
                              disabled={isExporting}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {isSelected && (
                                <Check size={14} className="text-white" />
                              )}
                            </button>

                            {/* Name + icon */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <SheetIcon
                                size={18}
                                className={`flex-shrink-0 ${sheetMeta.color}`}
                              />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {sheet.name}
                              </span>
                            </div>

                            {/* Type badge */}
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${sheetMeta.badge}`}
                            >
                              {sheetMeta.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Progress bar ────────────────────────────────────────── */}
        {isExporting && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-blue-900">
                {exportLabel || 'Exportando...'}
              </span>
              <span className="text-sm font-bold text-blue-600">
                {exportProgress}%
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            {exportProgress >= 100 && (
              <div className="text-center text-sm font-semibold text-green-600">
                ✓ Generando archivo...
              </div>
            )}
          </div>
        )}

        {/* ── Action buttons ──────────────────────────────────────── */}
        {hasSheets && (
          <div className="flex gap-3 mt-6">
            {!isExporting && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleExport}
              disabled={!canExport}
              className={`flex-1 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                canExport
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download size={18} />
              Exportar selección
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
