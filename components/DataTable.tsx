import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';
import {
  Download, Search, ChevronLeft, ChevronRight, ChevronDown,
  FileJson, FileSpreadsheet, FileText, X, XCircle, Settings, Eye, Sliders
} from 'lucide-react';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { formatNumber } from '../utils/formatters';
import { renderCell } from './table/TableCellRenderer';
import { handleLocalJSON, handleLocalExport, handleLocalXLSX } from './table/tableExportHelpers';
import { AGE_GROUPS } from '../constants';
import { ParticipantStatsBar } from './ParticipantStatsBar';

interface ExportProgressDisplay {
  current: number;
  total: number;
  errors: number;
  warning?: string;
  failedPages?: number[];
  partialFailure?: boolean;
}

export interface FiltersConfig {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterProvincia: string;
  setFilterProvincia: (v: string) => void;
  filterMunicipio: string;
  setFilterMunicipio: (v: string) => void;
  filterCentro: string;
  setFilterCentro: (v: string) => void;
  filterSexo: string;
  setFilterSexo: (v: string) => void;
  filterEstado: string;
  setFilterEstado: (v: string) => void;
  filterAnioIngreso: string;
  setFilterAnioIngreso: (v: string) => void;
  filterAnioInclusion: string;
  setFilterAnioInclusion: (v: string) => void;
  filterAgeGroup: string;
  setFilterAgeGroup: (v: string) => void;
  filterEstadoCivil: string;
  setFilterEstadoCivil: (v: string) => void;
  filterNivelEstudio: string;
  setFilterNivelEstudio: (v: string) => void;
  availableProvincias: string[];
  availableMunicipios: string[];
  availableCentros: string[];
  availableEstados: string[];
  availableAniosIngreso: string[];
  availableAniosInclusion: string[];
  availableEstadoCivil: string[];
  availableNivelEstudio: string[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  setSortColumn: (col: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
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
  onExportPDF?: () => void;
  onCancelExport: () => void;
  onOpenMassExport?: () => void;
  onRowClick?: (participant: Participant) => void;
  onOpenAdvancedFilters?: () => void;
  activeAdvancedFilterCount?: number;
  allFilteredData?: Participant[];
  filters: FiltersConfig;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'fullName', label: 'Nombre Completo', visible: true, required: true },
  { id: 'cedula', label: 'Cédula', visible: true },
  { id: 'edad', label: 'Edad', visible: true },
  { id: 'edadRegistro', label: 'Edad Registro', visible: false },
  { id: 'sexo', label: 'Sexo', visible: true },
  { id: 'estadoCivil', label: 'Estado Civil', visible: true },
  { id: 'provincia', label: 'Provincia', visible: true },
  { id: 'municipio', label: 'Municipio', visible: true },
  { id: 'centro', label: 'Centro', visible: true },
  { id: 'estado', label: 'Estado', visible: true },
  { id: 'nivelEstudio', label: 'Nivel Estudio', visible: false },
  { id: 'rutaFormativa', label: 'Ruta Formativa', visible: true },
  { id: 'fechaRegistro', label: 'Fecha Registro', visible: true },
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
  { id: 'acciones', label: 'Acciones', visible: true, required: false },
  { id: 'fechaNacimiento', label: 'Fecha Nacimiento', visible: false },
  { id: 'vulnerabilidades', label: 'Vulnerabilidades', visible: false },
];

function getActiveFilterPills(f: FiltersConfig) {
  const pills: { key: string; label: string; value: string }[] = [];
  if (f.searchTerm) pills.push({ key: 'searchTerm', label: 'Búsqueda', value: f.searchTerm });
  if (f.filterProvincia !== 'todas') pills.push({ key: 'filterProvincia', label: 'Provincia', value: f.filterProvincia });
  if (f.filterMunicipio !== 'todos') pills.push({ key: 'filterMunicipio', label: 'Municipio', value: f.filterMunicipio });
  if (f.filterCentro !== 'todos') pills.push({ key: 'filterCentro', label: 'Centro', value: f.filterCentro });
  if (f.filterSexo !== 'todos') pills.push({ key: 'filterSexo', label: 'Sexo', value: f.filterSexo === 'f' ? 'Femenino' : 'Masculino' });
  if (f.filterEstado) pills.push({ key: 'filterEstado', label: 'Estado', value: f.filterEstado });
  if (f.filterAnioIngreso) pills.push({ key: 'filterAnioIngreso', label: 'Año Ingreso', value: f.filterAnioIngreso });
  if (f.filterAnioInclusion) pills.push({ key: 'filterAnioInclusion', label: 'Año Inclusión', value: f.filterAnioInclusion });
  if (f.filterAgeGroup) {
    const g = AGE_GROUPS.find(ag => ag.value === f.filterAgeGroup);
    pills.push({ key: 'filterAgeGroup', label: 'Grupo Edad', value: g?.label || f.filterAgeGroup });
  }
  if (f.filterEstadoCivil) pills.push({ key: 'filterEstadoCivil', label: 'Estado Civil', value: f.filterEstadoCivil });
  if (f.filterNivelEstudio) pills.push({ key: 'filterNivelEstudio', label: 'Nivel Estudio', value: f.filterNivelEstudio });
  return pills;
}

export const DataTable: React.FC<DataTableProps> = ({
  data, currentPage, totalPages, totalItems, pageSize, loading,
  isExporting, exportProgress,
  onPageChange, onPageSizeChange, onExport, onExportPDF, onCancelExport,
  onOpenMassExport, onRowClick, onOpenAdvancedFilters,
  activeAdvancedFilterCount = 0,
  allFilteredData,
  filters,
}) => {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // ── Debounced search ──
  const [localSearch, setLocalSearch] = useState(filters.searchTerm);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from external clear/reset
  useEffect(() => {
    setLocalSearch(filters.searchTerm);
  }, [filters.searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      filters.setSearchTerm(value);
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

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
  const activeFilterPills = getActiveFilterPills(filters);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min((currentPage - 1) * pageSize + data.length, totalItems);

  return (
    <div className="space-y-4">

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

      {/* ── Top card: search, filters, export, stats ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

        {/* ── Search bar + buttons row ── */}
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
                value={localSearch}
                onChange={handleSearchChange}
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

            {/* Botón Filtros Avanzados */}
            <div className="flex-shrink-0">
              <button
                onClick={onOpenAdvancedFilters}
                className="flex items-center gap-1.5 px-3 h-10 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200 shadow-sm"
                title="Abrir filtros avanzados"
              >
                <Sliders size={16} />
                <span className="hidden sm:inline">Avanzado</span>
                {activeAdvancedFilterCount !== undefined && activeAdvancedFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-500 rounded-full">
                    {activeAdvancedFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Page size */}
            <select
              className="bg-white border border-gray-300 rounded-lg px-3 h-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer flex-shrink-0"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={250}>250</option>
            </select>

            {/* Export dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowFormatDropdown(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                <Download size={16} />
                Exportar
                <ChevronDown size={14} />
              </button>

              {showFormatDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFormatDropdown(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[200px]">
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
                    {onExportPDF && (
                      <button
                        onClick={() => { setShowFormatDropdown(false); onExportPDF(); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <FileText size={16} className="text-red-600" />
                        PDF
                      </button>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { setShowFormatDropdown(false); onOpenMassExport?.(); }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 font-medium"
                    >
                      <Download size={16} className="text-blue-600" />
                      Base de Datos Completa
                      {totalItems > 0 && (
                        <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          {formatNumber(totalItems)}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Active filter pills ── */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterPills.map(pill => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                <span className="font-semibold">{pill.label}:</span> {pill.value}
                <button
                  onClick={() => filters.clearFilter(pill.key)}
                  className="ml-0.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  title={`Quitar filtro ${pill.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {filters.hasActiveFilters && activeFilterPills.length > 0 && (
              <button
                onClick={filters.clearAll}
                className="text-xs text-red-600 hover:text-red-800 font-medium ml-1 transition-colors"
              >
                Limpiar todos
              </button>
            )}
            {!filters.hasActiveFilters && (
              <span className="text-xs text-gray-400">Sin filtros activos</span>
            )}
          </div>
        </div>

        {/* ── Stats Bar ── */}
        {allFilteredData && <ParticipantStatsBar data={allFilteredData} />}

      </div>

      {/* ── Table panel (separado) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
              {visibleColumns.map(col => (
                <th
                  key={col.id}
                  className="p-4 border-b border-gray-200 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (filters.sortColumn === col.id) {
                      filters.setSortDirection(filters.sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      filters.setSortColumn(col.id);
                      filters.setSortDirection('asc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {filters.sortColumn === col.id ? (
                      <span className="text-blue-600 text-[10px]">{filters.sortDirection === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                      <span className="text-gray-300 text-[10px]">⇅</span>
                    )}
                  </div>
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
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/50 transition-colors text-sm text-gray-700 cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                >
                  {visibleColumns.map(col => (
                    <td key={`${item.id}-${col.id}`} className="p-4">
                      {col.id === 'acciones' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRowClick?.(item); }}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </button>
                      ) : (
                        renderCell(item, col.id)
                      )}
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
