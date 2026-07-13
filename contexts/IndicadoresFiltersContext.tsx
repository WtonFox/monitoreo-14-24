import React, { createContext, useContext, useState, useCallback, useMemo, useDeferredValue, type ReactNode } from 'react';
import type { Participant } from '../types';
import type { BoardData } from '../hooks/useIndicatorBoards';
import { useIndicatorBoards } from '../hooks/useIndicatorBoards';
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
  filteredData: Participant[];
  boardData: BoardData;
  isStale: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  year: 'todos',
  province: 'todos',
  municipio: 'todos',
  sex: 'todos',
};

const IndicadoresFiltersContext = createContext<IndicadoresFiltersContextValue | null>(null);

export const IndicadoresFiltersProvider: React.FC<{
  children: ReactNode;
  allYears: string[];
  rawData: Participant[];
}> = ({ children, allYears, rawData }) => {
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

  const deferredFilters = useDeferredValue({ year, province, municipio, sex });
  const isStale = year !== deferredFilters.year
    || province !== deferredFilters.province
    || municipio !== deferredFilters.municipio
    || sex !== deferredFilters.sex;

  const filteredData = useMemo(() => {
    let data = rawData;
    if (deferredFilters.year !== 'todos') {
      data = data.filter(p =>
        p.fechaRegistro && new Date(p.fechaRegistro).getFullYear().toString() === deferredFilters.year
      );
    }
    if (deferredFilters.province !== 'todos') {
      data = data.filter(p => p.provincia === deferredFilters.province);
    }
    if (deferredFilters.municipio !== 'todos') {
      data = data.filter(p => p.municipio === deferredFilters.municipio);
    }
    if (deferredFilters.sex !== 'todos') {
      data = data.filter(p => p.sexo?.toLowerCase() === deferredFilters.sex);
    }
    return data;
  }, [rawData, deferredFilters]);

  const boardData = useIndicatorBoards(filteredData);

  const value = useMemo<IndicadoresFiltersContextValue>(() => ({
    year, province, municipio, sex,
    setYear: setYearState,
    setProvince,
    setMunicipio: setMunicipioState,
    setSex: setSexState,
    availableYears: allYears,
    availableMunicipios,
    filteredData,
    boardData,
    isStale,
  }), [
    year, province, municipio, sex,
    setProvince, allYears, availableMunicipios,
    filteredData, boardData, isStale,
  ]);

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
