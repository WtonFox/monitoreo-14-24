import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useFiltersContext } from '../contexts/FiltersContext';
import { StatsCards } from '../components/StatsCards';
import { ChartsSection } from '../components/ChartsSection';
import { FilterBar } from '../components/FilterBar';
import { AdvancedFiltersModal } from '../components/AdvancedFiltersModal';

const Estadisticas: React.FC = () => {
  const { dashboardData, totalRecordsInApi } = useDashboard();
  const {
    selectedProvince,
    selectedStatus,
    setSelectedProvince,
    setSelectedStatus,
    clearAllFilters,
    availableStatuses,
    filteredData,
    hasActiveFilters,
    advancedFilters,
    setAdvancedFilters,
    availableYears,
    availableMunicipios,
    availableEstadoCivil,
    availableNivelEstudio,
  } = useFiltersContext();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  // ── Estado local para search + centro ──
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCentro, setSelectedCentro] = useState('');

  // Resetear centro cuando cambia la provincia seleccionada
  useEffect(() => {
    setSelectedCentro('');
  }, [selectedProvince]);

  // ── Badge de filtros avanzados activos ──
  const activeAdvancedFilterCount = useMemo(() => {
    return Object.values(advancedFilters).filter(v => v !== '').length;
  }, [advancedFilters]);

  // ── Centros disponibles (desde dashboardData completo, no post-filtrado) ──
  const availableCentros = useMemo(() => {
    const source = selectedProvince
      ? dashboardData.filter(p => p.provincia === selectedProvince)
      : dashboardData;
    const centros = new Set<string>();
    source.forEach(p => {
      if (p.centro) centros.add(p.centro);
    });
    return Array.from(centros).sort();
  }, [dashboardData, selectedProvince]);

  // ── Post-filtro: contexto → search → centro ──
  const postFilteredData = useMemo(() => {
    let data = filteredData;

    // Filtro por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item =>
        (item.nombres?.toLowerCase().includes(term) || false) ||
        (item.apellidos?.toLowerCase().includes(term) || false) ||
        (item.cedula?.includes(term) || false) ||
        (item.provincia?.toLowerCase().includes(term) || false) ||
        (item.municipio?.toLowerCase().includes(term) || false) ||
        (item.centro?.toLowerCase().includes(term) || false)
      );
    }

    // Filtro por centro
    if (selectedCentro) {
      data = data.filter(item => item.centro === selectedCentro);
    }

    return data;
  }, [filteredData, searchTerm, selectedCentro]);

  // ── Clear handler que también limpia estado local ──
  const handleClearFilters = useCallback(() => {
    clearAllFilters();
    setSearchTerm('');
    setSelectedCentro('');
  }, [clearAllFilters]);

  return (
    <>
      {/* FilterBar — full width, sits above the padded content */}
      <FilterBar
        selectedProvince={selectedProvince}
        selectedStatus={selectedStatus}
        onProvinceChange={setSelectedProvince}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
        onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
        availableStatuses={availableStatuses}
        filteredCount={postFilteredData.length}
        hasActiveFilters={hasActiveFilters}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(prev => !prev)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCentro={selectedCentro}
        onCentroChange={setSelectedCentro}
        availableCentros={availableCentros}
        activeAdvancedFilterCount={activeAdvancedFilterCount}
      />

      {/* Main padded content */}
      <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
        <StatsCards data={postFilteredData} totalItems={totalRecordsInApi || dashboardData.length} />

        {dashboardData.length > 0 ? (
          <ChartsSection
            data={postFilteredData}
            selectedProvince={selectedProvince}
            selectedMunicipio={advancedFilters.municipio}
            showLabels={showLabels}
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <p>Recopilando datos para gráficas...</p>
          </div>
        )}
      </div>

      <AdvancedFiltersModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        availableYears={availableYears}
        availableMunicipios={availableMunicipios}
        availableEstadoCivil={availableEstadoCivil}
        availableNivelEstudio={availableNivelEstudio}
      />
    </>
  );
};

export default Estadisticas;
