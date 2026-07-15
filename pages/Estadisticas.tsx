import React, { useState } from 'react';
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
    selectedMunicipio,
    setSelectedProvince,
    setSelectedStatus,
    setSelectedMunicipio,
    clearAllFilters,
    availableStatuses,
    availableMunicipiosForProvince,
    filteredData,
    hasActiveFilters,
    advancedFilters,
    setAdvancedFilters,
    availableYears,
    availableMunicipios,
    availableEstadoCivil,
    availableNivelEstudio
  } = useFiltersContext();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  return (
    <>
      {/* FilterBar — full width, sits above the padded content */}
      <FilterBar
        selectedProvince={selectedProvince}
        selectedStatus={selectedStatus}
        selectedMunicipio={selectedMunicipio}
        onProvinceChange={setSelectedProvince}
        onStatusChange={setSelectedStatus}
        onMunicipioChange={setSelectedMunicipio}
        onClearFilters={clearAllFilters}
        onOpenAdvancedFilters={() => setShowAdvancedFilters(true)}
        availableStatuses={availableStatuses}
        availableMunicipiosForProvince={availableMunicipiosForProvince}
        filteredCount={filteredData.length}
        hasActiveFilters={hasActiveFilters}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(prev => !prev)}
      />

      {/* Main padded content */}
      <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6 flex-1">
        <StatsCards data={filteredData} totalItems={totalRecordsInApi || dashboardData.length} />

        {dashboardData.length > 0 ? (
          <ChartsSection
            data={filteredData}
            selectedProvince={selectedProvince}
            selectedMunicipio={selectedMunicipio}
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
