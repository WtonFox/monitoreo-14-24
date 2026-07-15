import React, { useState, useEffect, useMemo } from 'react';
import { Participant } from '../types';
import { Download, Search, ChevronLeft, ChevronRight, ChevronDown, FileJson, FileSpreadsheet, FileText, XCircle, Settings } from 'lucide-react';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { formatNumber } from '../utils/formatters';
import { renderCell } from './table/TableCellRenderer';
import { handleLocalJSON, handleLocalExport, handleLocalXLSX } from './table/tableExportHelpers';

interface ExportProgressDisplay {
  current: number;
  total: number;
  errors: number;
  warning?: string;
  failedPages?: number[];
  partialFailure?: boolean;
}

interface DataTableProps {
  data: Participant[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  loading: boolean;
  isExporting: boolean;
  exportProgress?: ExportProgressDisplay;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onExport: (format: 'csv' | 'json') => void;
  onCancelExport: () => void;
  onOpenMassExport?: () => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterProvincia: string;
  onProvinciaChange: (v: string) => void;
  availableMunicipios: string[];
  filterMunicipio: string;
  onMunicipioChange: (v: string) => void;
  filterCentro: string;
  onCentroChange: (v: string) => void;
  uniqueCentros: string[];
  filterSexo: string;
  onSexoChange: (v: string) => void;
  uniqueProvincias: string[];
  allFilteredData?: Participant[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'fullName', label: 'Nombre Completo', visible: true, required: true },
  { id: 'cedula', label: 'Cédula', visible: true },
  { id: 'edad', label: 'Edad', visible: true },
  { id: 'edadRegistro', label: 'Edad Registro', visible: false },
  { id: 'sexo', label: 'Sexo', visible: true },
  { id: 'estadoCivil', label: 'Estado Civil', visible: true },
  { id: 'provincia', label: 'Provincia', visible: true },
  { id: 'municipio', label: 'Municipio', visible: false },
  { id: 'centro', label: 'Centro', visible: true },
  { id: 'estado', label: 'Estado', visible: true },
  { id: 'nivelEstudio', label: 'Nivel Estudio', visible: false },
  { id: 'rutaFormativa', label: 'Ruta Formativa', visible: false },
  { id: 'fechaRegistro', label: 'Fecha Registro', visible: false },
  { id: 'fechaInclusion', label: 'Fecha Inclusión', visible: false },
  { id: 'tutor', label: 'Tutor', visible: false },
  { id: 'cedulaTutor', label: 'Cédula Tutor', visible: false },
  { id: 'telefonos', label: 'Teléfonos', visible: false },
  { id: 'telefonosResponsable', label: 'Tel. Responsable', visible: false },
  { id: 'direccion', label: 'Dirección', visible: false },
  { id: 'alergias', label: 'Alergias', visible: false },
  { id: 'discapacidades', label: 'Discapacidades', visible: false },
  { id: 'enfermedades', label: 'Enfermedades', visible: false },
  { id: 'programasSociales', label: 'Programas Sociales', visible: true },
  { id: 'fechaNacimiento', label: 'Fecha Nacimiento', visible: false },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades', visible: false },
];

export const DataTable: React.FC<DataTableProps> = ({
  data, currentPage, totalPages, totalItems, pageSize, loading,
  isExporting, exportProgress,
  onPageChange, onPageSizeChange, onExport, onCancelExport,
  onOpenMassExport,
  searchTerm, onSearchChange,
  filterProvincia, onProvinciaChange, availableMunicipios,
  filterMunicipio, onMunicipioChange,
  filterCentro, onCentroChange, uniqueCentros,
  filterSexo, onSexoChange, uniqueProvincias,
  allFilteredData
}) => {
  const [showExportSection, setShowExportSection] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('table_columns_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = DEFAULT_COLUMNS.map(def => {
          const savedCol = parsed.find((p: ColumnConfig) => p.id === def.id);
          return savedCol ? { ...def, visible: savedCol.visible } : def;
        });
        setColumns(merged);
      }
    } catch (e) {
      console.error('Error loading column preferences', e);
    }
  }, []);

  const saveColumns = (newCols: ColumnConfig[]) => {
    setColumns(newCols);
    localStorage.setItem('table_columns_v1', JSON.stringify(newCols));
  };

  const handleToggleColumn = (id: string) => {
    const newCols = columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    saveColumns(newCols);
  };

  const handleResetColumns = () => {
    saveColumns(DEFAULT_COLUMNS);
  };

  const visibleColumns = columns.filter(c => c.visible);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min((currentPage - 1) * pageSize + data.length, totalItems);

  return (
    <div className="space-y-4">

      {/* ── Filters + Datos panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

      {isExporting && exportProgress && (
        <div className="absolute inset-0 z-50 bg-white/90 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl border border-gray-200">
            <h4 className="text-lg font-bold text-gray-800 mb-2">Descargando Base de Datos...</h4>
            <p className="text-sm text-gray-500 mb-4">
              Esto puede tomar unos minutos debido a la seguridad de la API.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mb-6">
              <span>Progreso: {Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
              <span>Lote {exportProgress.current} de {exportProgress.total}</span>
            </div>
            {exportProgress.errors > 0 && (
              <div className="mb-4 text-xs bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{exportProgress.errors}</span> lote(s) omitido(s) por error en API (Data Nula).
                </div>
                {exportProgress.warning && (
                  <div className="mt-1 text-yellow-800">{exportProgress.warning}</div>
                )}
                {exportProgress.partialFailure && (
                  <div className="mt-1 font-semibold">La exportación generada contiene datos incompletos.</div>
                )}
              </div>
            )}
            <button
              onClick={onCancelExport}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <XCircle size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 h-10 bg-white border border-gray-300 rounded-lg w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 h-10 rounded-lg text-sm transition-colors border border-gray-300 shadow-sm"
              title="Configurar Columnas"
            >
              <Settings size={16} />
            </button>
            {showColumnSelector && (
              <ColumnSelector
                columns={columns}
                onToggleColumn={handleToggleColumn}
                onReset={handleResetColumns}
                onClose={() => setShowColumnSelector(false)}
              />
            )}
          </div>

          <select
            className="bg-white border border-gray-300 rounded-lg px-3 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer flex-shrink-0"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setShowExportSection(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors"
          >
            <span>Filtros y Datos</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showExportSection ? '' : '-rotate-90'}`}
            />
          </button>

          {showExportSection && (
            <div className="border-t border-gray-100">
              {/* Filtros */}
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    value={filterProvincia}
                    onChange={e => onProvinciaChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todas">Provincia: Todas</option>
                    {uniqueProvincias.map(p => (<option key={p} value={p}>{p}</option>))}
                  </select>

                  <select
                    value={filterMunicipio}
                    onChange={e => onMunicipioChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    disabled={filterProvincia === 'todas'}
                  >
                    <option value="todos">Municipio: Todos</option>
                    {availableMunicipios.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>

                  <select
                    value={filterCentro}
                    onChange={e => onCentroChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Centro: Todos</option>
                    {uniqueCentros.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>

                  <select
                    value={filterSexo}
                    onChange={e => onSexoChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Sexo: Todos</option>
                    <option value="f">Femenino</option>
                    <option value="m">Masculino</option>
                  </select>
                </div>
              </div>

              {/* Exportar */}
              <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowFormatDropdown(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download size={16} />
                    Exportar
                    <ChevronDown size={14} />
                  </button>

                  {showFormatDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowFormatDropdown(false)} />
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[180px]">
                        <button
                          onClick={() => { setShowFormatDropdown(false); handleLocalExport(allFilteredData || data); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileText size={16} className="text-green-600" />
                          CSV (Vista actual)
                        </button>
                        <button
                          onClick={() => { setShowFormatDropdown(false); handleLocalXLSX(allFilteredData || data); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileSpreadsheet size={16} className="text-blue-600" />
                          Excel (XLSX)
                        </button>
                        <button
                          onClick={() => { setShowFormatDropdown(false); handleLocalJSON(allFilteredData || data); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileJson size={16} className="text-purple-600" />
                          JSON
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {onOpenMassExport && (
                  <button
                    onClick={onOpenMassExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Download size={16} />
                    Exportar Todos
                    {totalItems > 0 && (
                      <span className="text-[10px] bg-blue-500 px-1.5 py-0.5 rounded-full">
                        {formatNumber(totalItems)}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── Table panel ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              {visibleColumns.map(col => (
                <th key={col.id} className="p-4 border-b border-gray-200 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length} className="p-8 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    Cargando datos...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="p-8 text-center text-gray-500">No se encontraron registros.</td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors text-sm text-gray-700">
                  {visibleColumns.map(col => (
                    <td key={`${item.id}-${col.id}`} className="p-4">
                      {renderCell(item, col.id)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="text-sm text-gray-500">
          Mostrando <span className="font-medium text-gray-900">{formatNumber(startItem)} - {formatNumber(endItem)}</span> de <span className="font-medium text-gray-900">{formatNumber(totalItems)}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2 min-w-[3rem] text-center whitespace-nowrap">
              Pág {formatNumber(currentPage)} de {formatNumber(totalPages)}
            </span>
            <button
              disabled={loading || currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
