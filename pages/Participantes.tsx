import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { DataTable } from '../components/DataTable';
import type { FiltersConfig } from '../components/DataTable';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { useParticipantesFilters } from '../hooks/useParticipantesFilters';
import { useMassExport } from '../hooks/useMassExport';
import { MassExportModal } from '../components/MassExportModal';
import { ParticipantesFiltersModal } from '../components/ParticipantesFiltersModal';
import type { ParticipantesFiltersState } from '../components/ParticipantesFiltersModal';
import { ParticipantDetailModal } from '../components/ParticipantDetailModal';
import type { Participant } from '../types';
import { exportParticipantsPDF } from '../services/pdfExport';

const Participantes: React.FC = () => {
  const dashboardData = useParticipantStore(s => s.dashboardData);
  const filters = useParticipantesFilters(dashboardData);
  const massExport = useMassExport();

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Loading state
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    if (dashboardData.length > 0) setDataLoaded(true);
  }, [dashboardData]);
  const isLoading = !dataLoaded;

  // Modal state
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExportPDF = useCallback(async () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    exportParticipantsPDF(filters.filteredData, `Reporte de Participantes — ${dd}/${mm}/${yyyy}`);
  }, [filters.filteredData]);

  const handleRowClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Keep participant data for fade-out, clear after animation
    setTimeout(() => setSelectedParticipant(null), 200);
  };

  // Resetear a página 1 cuando cambia cualquier filtro o sort
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
    filters.sortColumn,
    filters.sortDirection,
  ]);

  const totalPages = Math.ceil(filters.filteredData.length / pageSize);
  const startIndex = (pageIndex - 1) * pageSize;
  const pagedData = useMemo(() => {
    return filters.filteredData.slice(startIndex, startIndex + pageSize);
  }, [filters.filteredData, pageIndex, pageSize]);

  // ── Modal de filtros avanzados ──
  const modalFilters: ParticipantesFiltersState = {
    filterProvincia: filters.filterProvincia,
    filterMunicipio: filters.filterMunicipio,
    filterCentro: filters.filterCentro,
    filterSexo: filters.filterSexo,
    filterEstado: filters.filterEstado,
    filterAnioIngreso: filters.filterAnioIngreso,
    filterAnioInclusion: filters.filterAnioInclusion,
    filterAgeGroup: filters.filterAgeGroup,
    filterEstadoCivil: filters.filterEstadoCivil,
    filterNivelEstudio: filters.filterNivelEstudio,
  };

  const handleModalFiltersChange = useCallback((newFilters: ParticipantesFiltersState) => {
    if (newFilters.filterProvincia !== filters.filterProvincia) filters.setFilterProvincia(newFilters.filterProvincia);
    if (newFilters.filterMunicipio !== filters.filterMunicipio) filters.setFilterMunicipio(newFilters.filterMunicipio);
    if (newFilters.filterCentro !== filters.filterCentro) filters.setFilterCentro(newFilters.filterCentro);
    if (newFilters.filterSexo !== filters.filterSexo) filters.setFilterSexo(newFilters.filterSexo);
    if (newFilters.filterEstado !== filters.filterEstado) filters.setFilterEstado(newFilters.filterEstado);
    if (newFilters.filterAnioIngreso !== filters.filterAnioIngreso) filters.setFilterAnioIngreso(newFilters.filterAnioIngreso);
    if (newFilters.filterAnioInclusion !== filters.filterAnioInclusion) filters.setFilterAnioInclusion(newFilters.filterAnioInclusion);
    if (newFilters.filterAgeGroup !== filters.filterAgeGroup) filters.setFilterAgeGroup(newFilters.filterAgeGroup);
    if (newFilters.filterEstadoCivil !== filters.filterEstadoCivil) filters.setFilterEstadoCivil(newFilters.filterEstadoCivil);
    if (newFilters.filterNivelEstudio !== filters.filterNivelEstudio) filters.setFilterNivelEstudio(newFilters.filterNivelEstudio);
  }, [filters]);

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
    sortColumn: filters.sortColumn,
    sortDirection: filters.sortDirection,
    setSortColumn: filters.setSortColumn,
    setSortDirection: filters.setSortDirection,
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
    filters.sortColumn,
    filters.sortDirection,
    filters.setSortColumn,
    filters.setSortDirection,
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in slide-in-from-right-4 duration-300 space-y-4">
      <DataTable
        data={pagedData}
        currentPage={pageIndex}
        pageSize={pageSize}
        totalItems={filters.filteredData.length}
        totalPages={totalPages}
        loading={isLoading}
        isExporting={massExport.isMassExporting}
        exportProgress={massExport.massExportProgress ? {
          current: massExport.massExportProgress.currentPage,
          total: massExport.massExportProgress.totalPages,
          errors: massExport.massExportProgress.error ? 1 : 0,
        } : undefined}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onExport={() => {}}
        onExportPDF={handleExportPDF}
        onCancelExport={massExport.cancelMassExport}
        onOpenMassExport={massExport.openMassExportModal}
        onRowClick={handleRowClick}
        onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
        activeAdvancedFilterCount={filters.activeFilterCount}
        allFilteredData={filters.filteredData}
        filters={tableFilters}
      />

      <ParticipantDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        participant={selectedParticipant}
      />

      <MassExportModal
        isOpen={massExport.showMassExportModal}
        isExporting={massExport.isMassExporting}
        progress={massExport.massExportProgress}
        onExport={massExport.handleMassExport}
        onCancel={massExport.cancelMassExport}
        onAdvancedExport={() => alert('Excel Avanzado disponible desde Mapa Interactivo y tableros de Indicadores')}
      />

      <ParticipantesFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={modalFilters}
        onFiltersChange={handleModalFiltersChange}
        availableProvincias={filters.availableProvincias}
        availableMunicipios={filters.availableMunicipios}
        availableCentros={filters.availableCentros}
        availableEstados={filters.availableEstados}
        availableAniosIngreso={filters.availableAniosIngreso}
        availableAniosInclusion={filters.availableAniosInclusion}
        availableEstadoCivil={filters.availableEstadoCivil}
        availableNivelEstudio={filters.availableNivelEstudio}
      />
    </div>
  );
};

export default Participantes;
