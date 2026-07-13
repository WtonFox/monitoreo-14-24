import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { DataTable } from '../components/DataTable';
import { DEFAULT_PAGE_SIZE, PROVINCE_MUNICIPALITIES } from '../constants';
import { useMassExport } from '../hooks/useMassExport';
import { MassExportModal } from '../components/MassExportModal';

const Participantes: React.FC = () => {
  const { dashboardData } = useDashboard();
  const massExport = useMassExport();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvincia, setFilterProvincia] = useState('todas');
  const [filterMunicipio, setFilterMunicipio] = useState('todos');
  const [filterCentro, setFilterCentro] = useState('todos');
  const [filterSexo, setFilterSexo] = useState('todos');

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => { setPageIndex(1); }, [searchTerm, filterProvincia, filterMunicipio, filterCentro, filterSexo]);

  const availableMunicipios = useMemo(() => {
    if (filterProvincia === 'todas') return [];
    return PROVINCE_MUNICIPALITIES[filterProvincia] || [];
  }, [filterProvincia]);

  const handleProvinciaChange = (v: string) => {
    setFilterProvincia(v);
    setFilterMunicipio('todos');
    setFilterCentro('todos');
  };

  const uniqueProvincias = useMemo(() => {
    const set = new Set<string>();
    dashboardData.forEach(p => { if (p.provincia) set.add(p.provincia); });
    return Array.from(set).sort();
  }, [dashboardData]);

  // Mapa: provincia → centros disponibles en esa provincia
  const centrosByProvincia = useMemo(() => {
    const map: Record<string, string[]> = {};
    dashboardData.forEach(p => {
      if (!p.centro || !p.provincia) return;
      if (!map[p.provincia]) map[p.provincia] = [];
      if (!map[p.provincia].includes(p.centro)) map[p.provincia].push(p.centro);
    });
    // Ordenar cada lista
    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }, [dashboardData]);

  // Centros filtrados por provincia seleccionada
  const availableCentros = useMemo(() => {
    if (filterProvincia === 'todas') {
      // Todos los centros únicos del dataset
      const all = new Set<string>();
      dashboardData.forEach(p => { if (p.centro) all.add(p.centro); });
      return Array.from(all).sort();
    }
    return centrosByProvincia[filterProvincia] || [];
  }, [filterProvincia, centrosByProvincia, dashboardData]);

  const filteredData = useMemo(() => {
    let data = dashboardData;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(p =>
        (p.nombres?.toLowerCase().includes(term) || false) ||
        (p.apellidos?.toLowerCase().includes(term) || false) ||
        (p.cedula?.includes(term) || false) ||
        (p.provincia?.toLowerCase().includes(term) || false) ||
        (p.municipio?.toLowerCase().includes(term) || false) ||
        (p.centro?.toLowerCase().includes(term) || false) ||
        (p.estado?.toLowerCase().includes(term) || false) ||
        (p.estadoCivil?.toLowerCase().includes(term) || false) ||
        (p.nivelEstudio?.toLowerCase().includes(term) || false) ||
        (p.rutaFormativa?.toLowerCase().includes(term) || false)
      );
    }

    if (filterProvincia !== 'todas') data = data.filter(p => p.provincia === filterProvincia);
    if (filterMunicipio !== 'todos') data = data.filter(p => p.municipio === filterMunicipio);
    if (filterCentro !== 'todos') data = data.filter(p => p.centro === filterCentro);
    if (filterSexo !== 'todos') data = data.filter(p => p.sexo?.toLowerCase() === filterSexo);

    return data;
  }, [dashboardData, searchTerm, filterProvincia, filterMunicipio, filterCentro, filterSexo]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (pageIndex - 1) * pageSize;
  const pagedData = useMemo(() => {
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  const handleExport = (_format: 'csv' | 'json') => {
    // Exportar datos filtrados — futuro
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in slide-in-from-right-4 duration-300 space-y-4">
      <DataTable
        data={pagedData}
        currentPage={pageIndex}
        pageSize={pageSize}
        totalItems={filteredData.length}
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
        onExport={handleExport}
        onCancelExport={massExport.cancelMassExport}
        onOpenMassExport={massExport.openMassExportModal}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterProvincia={filterProvincia}
        onProvinciaChange={handleProvinciaChange}
        availableMunicipios={availableMunicipios}
        filterMunicipio={filterMunicipio}
        onMunicipioChange={setFilterMunicipio}
        filterCentro={filterCentro}
        onCentroChange={setFilterCentro}
        uniqueCentros={availableCentros}
        filterSexo={filterSexo}
        onSexoChange={setFilterSexo}
        uniqueProvincias={uniqueProvincias}
        allFilteredData={filteredData}
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
