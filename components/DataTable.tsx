import React, { useState, useEffect, useRef } from 'react';
import { Participant } from '../types';
import {
  Download, Search, ChevronLeft, ChevronRight, ChevronDown,
  FileJson, FileSpreadsheet, FileText, X, XCircle, Settings
} from 'lucide-react';
import { ColumnSelector, ColumnConfig } from './ColumnSelector';
import { formatNumber } from '../utils/formatters';
import { renderCell } from './table/TableCellRenderer';
import { handleLocalJSON, handleLocalExport, handleLocalXLSX } from './table/tableExportHelpers';
import { AGE_GROUPS } from '../constants';

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
  onPageChange, onPageSizeChange, onExport, onCancelExport,
  onOpenMassExport,
  allFilteredData,
  filters,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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

      {/* ── Search bar + column selector + page size ── */}
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

      {/* ── Filtros Avanzados (collapsible) ── */}
      <div className="px-4 border-b border-gray-100">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-3">
          <button
            onClick={() => setShowAdvancedFilters(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 transition-colors rounded-xl"
          >
            <span>
              Filtros Avanzados
              {filters.activeFilterCount > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">
                  {filters.activeFilterCount}
                </span>
              )}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showAdvancedFilters ? '' : '-rotate-90'}`}
            />
          </button>

          {showAdvancedFilters && (
            <div className="border-t border-gray-100 px-4 py-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Provincia */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
                  <select
                    value={filters.filterProvincia}
                    onChange={e => filters.setFilterProvincia(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todas">Todas</option>
                    {filters.availableProvincias.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Municipio (dependiente de provincia) */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Municipio</label>
                  <select
                    value={filters.filterMunicipio}
                    onChange={e => filters.setFilterMunicipio(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={filters.filterProvincia === 'todas'}
                  >
                    <option value="todos">Todos</option>
                    {filters.availableMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Centro */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Centro</label>
                  <select
                    value={filters.filterCentro}
                    onChange={e => filters.setFilterCentro(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos</option>
                    {filters.availableCentros.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sexo</label>
                  <select
                    value={filters.filterSexo}
                    onChange={e => filters.setFilterSexo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="f">Femenino</option>
                    <option value="m">Masculino</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                  <select
                    value={filters.filterEstado}
                    onChange={e => filters.setFilterEstado(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filters.availableEstados.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                </div>

                {/* Año Ingreso */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Año Ingreso</label>
                  <select
                    value={filters.filterAnioIngreso}
                    onChange={e => filters.setFilterAnioIngreso(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filters.availableAniosIngreso.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Año Inclusión */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Año Inclusión</label>
                  <select
                    value={filters.filterAnioInclusion}
                    onChange={e => filters.setFilterAnioInclusion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filters.availableAniosInclusion.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Grupo Edad */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Grupo Edad</label>
                  <select
                    value={filters.filterAgeGroup}
                    onChange={e => filters.setFilterAgeGroup(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {AGE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                {/* Estado Civil */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estado Civil</label>
                  <select
                    value={filters.filterEstadoCivil}
                    onChange={e => filters.setFilterEstadoCivil(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filters.availableEstadoCivil.map(ec => <option key={ec} value={ec}>{ec}</option>)}
                  </select>
                </div>

                {/* Nivel Estudio */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nivel Estudio</label>
                  <select
                    value={filters.filterNivelEstudio}
                    onChange={e => filters.setFilterNivelEstudio(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filters.availableNivelEstudio.map(ne => <option key={ne} value={ne}>{ne}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Export section ── */}
      <div className="px-4 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
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
    </div>
  );
};
