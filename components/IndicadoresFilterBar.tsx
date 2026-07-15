import React from 'react';
import { useIndicadoresFilters } from '../contexts/IndicadoresFiltersContext';
import { DOMINICAN_PROVINCES } from '../constants';

interface FilterBarProps {
  showYear?: boolean;
  showProvince?: boolean;
  showMunicipio?: boolean;
  showSex?: boolean;
  noContainer?: boolean;
}

export const IndicadoresFilterBar: React.FC<FilterBarProps> = ({
  showYear = true,
  showProvince = true,
  showMunicipio = true,
  showSex = true,
  noContainer = false,
}) => {
  const filters = useIndicadoresFilters();

  const filterControls = (
    <>
      {showYear && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Año:</label>
          <select value={filters.year} onChange={e => filters.setYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            {filters.availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      )}
      {showProvince && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Provincia:</label>
          <select value={filters.province} onChange={e => filters.setProvince(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todas</option>
            {DOMINICAN_PROVINCES.map(p => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
      )}
      {showMunicipio && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Municipio:</label>
          <select value={filters.municipio} onChange={e => filters.setMunicipio(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500"
            disabled={filters.province === 'todos'}>
            <option value="todos">Todos</option>
            {filters.availableMunicipios.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>
      )}
      {showSex && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Sexo:</label>
          <select value={filters.sex} onChange={e => filters.setSex(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="todos">Todos</option>
            <option value="f">Femenino</option>
            <option value="m">Masculino</option>
          </select>
        </div>
      )}
    </>
  );

  if (noContainer) return filterControls;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
      {filterControls}
    </div>
  );
};
