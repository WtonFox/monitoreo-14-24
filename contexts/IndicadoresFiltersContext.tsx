import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { PROVINCE_MUNICIPALITIES } from '../constants';

interface FilterState {
  year: string;
  province: string;
  municipio: string;
  sex: string;
}

interface IndicadoresFiltersContextValue extends FilterState {
  setYear: (v: string) => void;
  setProvince: (v: string) => void;
  setMunicipio: (v: string) => void;
  setSex: (v: string) => void;
  availableYears: string[];
  availableMunicipios: string[];
}

const DEFAULT_FILTERS: FilterState = {
  year: 'todos',
  province: 'todos',
  municipio: 'todos',
  sex: 'todos',
};

const IndicadoresFiltersContext = createContext<IndicadoresFiltersContextValue | null>(null);

export const IndicadoresFiltersProvider: React.FC<{ children: ReactNode; allYears: string[] }> = ({
  children,
  allYears,
}) => {
  const [year, setYearState] = useState(DEFAULT_FILTERS.year);
  const [province, setProvinceState] = useState(DEFAULT_FILTERS.province);
  const [municipio, setMunicipioState] = useState(DEFAULT_FILTERS.municipio);
  const [sex, setSexState] = useState(DEFAULT_FILTERS.sex);

  const setProvince = useCallback((v: string) => {
    setProvinceState(v);
    setMunicipioState('todos');
  }, []);

  const availableMunicipios = useMemo(() => {
    if (province === 'todos') return [];
    return PROVINCE_MUNICIPALITIES[province] || [];
  }, [province]);

  const value = useMemo<IndicadoresFiltersContextValue>(() => ({
    year, province, municipio, sex,
    setYear: setYearState,
    setProvince,
    setMunicipio: setMunicipioState,
    setSex: setSexState,
    availableYears: allYears,
    availableMunicipios,
  }), [year, province, municipio, sex, setProvince, allYears, availableMunicipios]);

  return (
    <IndicadoresFiltersContext.Provider value={value}>
      {children}
    </IndicadoresFiltersContext.Provider>
  );
};

export const useIndicadoresFilters = (): IndicadoresFiltersContextValue => {
  const ctx = useContext(IndicadoresFiltersContext);
  if (!ctx) throw new Error('useIndicadoresFilters must be used within IndicadoresFiltersProvider');
  return ctx;
};
