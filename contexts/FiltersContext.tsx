import React, { createContext, useContext, type ReactNode } from 'react';
import { useFilters } from '../hooks/useFilters';
import { useDashboard } from './DashboardContext';
import type { Participant, AdvancedFilterState } from '../types';

interface FiltersContextValue {
  selectedProvince: string;
  selectedStatus: string;
  selectedMunicipio: string;
  advancedFilters: AdvancedFilterState;
  setSelectedProvince: (province: string) => void;
  setSelectedStatus: (status: string) => void;
  setSelectedMunicipio: (municipio: string) => void;
  setAdvancedFilters: (filters: AdvancedFilterState) => void;
  clearAllFilters: () => void;
  availableStatuses: string[];
  availableYears: { ingreso: string[]; inclusion: string[] };
  availableEstadoCivil: string[];
  availableNivelEstudio: string[];
  availableMunicipios: string[];
  availableMunicipiosForProvince: string[];
  filteredData: Participant[];
  hasActiveFilters: boolean;
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

interface FiltersProviderProps {
  children: ReactNode;
}

export const FiltersProvider: React.FC<FiltersProviderProps> = ({ children }) => {
  const { dashboardData } = useDashboard();
  const filtersValue = useFilters(dashboardData);

  return (
    <FiltersContext.Provider value={filtersValue}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFiltersContext = (): FiltersContextValue => {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error('useFiltersContext must be used within a FiltersProvider');
  }
  return ctx;
};
