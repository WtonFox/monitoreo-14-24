import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { DataTable } from '../components/DataTable';
import type { FiltersConfig } from '../components/DataTable';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { useParticipantesFilters } from '../hooks/useParticipantesFilters';
import { useMassExport } from '../hooks/useMassExport';
import { MassExportModal } from '../components/MassExportModal';

const Participantes: React.FC = () => {
  const { dashboardData } = useDashboard();
  const filters = useParticipantesFilters(dashboardData);
  const massExport = useMassExport();

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Resetear a página 1 cuando cambia cualquier filtro
  useEffect(() => {
    setPageIndex(1);
  }, [
    filters.searchTerm,
    filters.filterProvincia,
    filters.filterMunicipio,
    filters.filterCentro,
    filters.filterSexo,
    filters.filterEstado,
    filters.filterAnioIngreso,
    filters.filterAnioInclusion,
    filters.filterAgeGroup,
    filters.filterEstadoCivil,
    filters.filterNivelEstudio,
  ]);

  const totalPages = Math.ceil(filters.filteredData.length / pageSize);
  const startIndex = (pageIndex - 1) * pageSize;
  const pagedData = useMemo(() => {
    return filters.filteredData.slice(startIndex, startIndex + pageSize);
  }, [filters.filteredData, pageIndex, pageSize]);

  const tableFilters: FiltersConfig = useMemo(() => ({
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    filterProvincia: filters.filterProvincia,
    setFilterProvincia: filters.setFilterProvincia,
    filterMunicipio: filters.filterMunicipio,
    setFilterMunicipio: filters.setFilterMunicipio,
    filterCentro: filters.filterCentro,
    setFilterCentro: filters.setFilterCentro,
    filterSexo: filters.filterSexo,
    setFilterSexo: filters.setFilterSexo,
    filterEstado: filters.filterEstado,
    setFilterEstado: filters.setFilterEstado,
    filterAnioIngreso: filters.filterAnioIngreso,
    setFilterAnioIngreso: filters.setFilterAnioIngreso,
    filterAnioInclusion: filters.filterAnioInclusion,
    setFilterAnioInclusion: filters.setFilterAnioInclusion,
    filterAgeGroup: filters.filterAgeGroup,
    setFilterAgeGroup: filters.setFilterAgeGroup,
    filterEstadoCivil: filters.filterEstadoCivil,
    setFilterEstadoCivil: filters.setFilterEstadoCivil,
    filterNivelEstudio: filters.filterNivelEstudio,
    setFilterNivelEstudio: filters.setFilterNivelEstudio,
    availableProvincias: filters.availableProvincias,
    availableMunicipios: filters.availableMunicipios,
    availableCentros: filters.availableCentros,
    availableEstados: filters.availableEstados,
    availableAniosIngreso: filters.availableAniosIngreso,
    availableAniosInclusion: filters.availableAniosInclusion,
    availableEstadoCivil: filters.availableEstadoCivil,
    availableNivelEstudio: filters.availableNivelEstudio,
    activeFilterCount: filters.activeFilterCount,
    hasActiveFilters: filters.hasActiveFilters,
    clearFilter: filters.clearFilter,
    clearAll: filters.clearAll,
  }), [
    filters.searchTerm,
    filters.filterProvincia,
    filters.filterMunicipio,
    filters.filterCentro,
    filters.filterSexo,
    filters.filterEstado,
    filters.filterAnioIngreso,
    filters.filterAnioInclusion,
    filters.filterAgeGroup,
    filters.filterEstadoCivil,
    filters.filterNivelEstudio,
    filters.availableProvincias,
    filters.availableMunicipios,
    filters.availableCentros,
    filters.availableEstados,
    filters.availableAniosIngreso,
    filters.availableAniosInclusion,
    filters.availableEstadoCivil,
    filters.availableNivelEstudio,
    filters.activeFilterCount,
    filters.hasActiveFilters,
    filters.clearFilter,
    filters.clearAll,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in slide-in-from-right-4 duration-300 space-y-4">
      <DataTable
        data={pagedData}
        currentPage={pageIndex}
        pageSize={pageSize}
        totalItems={filters.filteredData.length}
        totalPages={totalPages}
        loading={false}
        isExporting={massExport.isMassExporting}
        exportProgress={massExport.massExportProgress ? {
          current: massExport.massExportProgress.currentPage,
          total: massExport.massExportProgress.totalPages,
          errors: massExport.massExportProgress.error ? 1 : 0,
        } : undefined}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onExport={() => {}}
        onCancelExport={massExport.cancelMassExport}
        onOpenMassExport={massExport.openMassExportModal}
        allFilteredData={filters.filteredData}
        filters={tableFilters}
      />

      <MassExportModal
        isOpen={massExport.showMassExportModal}
        isExporting={massExport.isMassExporting}
        progress={massExport.massExportProgress}
        onExport={massExport.handleMassExport}
        onCancel={massExport.cancelMassExport}
      />
    </div>
  );
};

export default Participantes;
