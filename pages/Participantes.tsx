import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';
import { useTableData } from '../hooks/useTableData';
import { useMassExport } from '../hooks/useMassExport';
import { MassExportModal } from '../components/MassExportModal';
import { DataTable } from '../components/DataTable';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { formatNumber } from '../utils/formatters';

const Participantes: React.FC = () => {
  const { customToken } = useDashboard();

  // Local pagination state
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Local table data hook
  const {
    tableData,
    tableTotalItems,
    isTableLoading,
    tableError,
    loadTableData
  } = useTableData(customToken, 0);

  // Initial data load
  useEffect(() => {
    loadTableData(pageIndex, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload on pagination change
  useEffect(() => {
    loadTableData(pageIndex, pageSize);
  }, [pageIndex, pageSize, loadTableData]);

  const massExport = useMassExport();

  const handleExport = (_format: 'csv' | 'json') => {
    // The DataTable provides its own local export via handleLocalExport.
    // This stub covers the full-export button for future enhancement.
    if (tableData.length === 0) return;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in slide-in-from-right-4 duration-300">
      {tableError ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-700 border border-red-200 mb-4">
          Error cargando tabla: {tableError}
        </div>
      ) : null}

      {/* Acciones superiores */}
      <div className="flex justify-end mb-4">
        <button
          onClick={massExport.openMassExportModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-md"
        >
          <Download size={16} />
          Exportar Todos
          {tableTotalItems > 0 && (
            <span className="text-[10px] bg-blue-500 px-1.5 py-0.5 rounded-full">
              {formatNumber(tableTotalItems)}
            </span>
          )}
        </button>
      </div>

      <DataTable
        data={tableData}
        currentPage={pageIndex}
        pageSize={pageSize}
        totalItems={tableTotalItems}
        totalPages={Math.ceil(tableTotalItems / pageSize)}
        loading={isTableLoading}
        isExporting={false}
        exportProgress={{ current: 0, total: 0, errors: 0 }}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onExport={handleExport}
        onCancelExport={() => {}}
      />

      {/* Mass Export Modal */}
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
