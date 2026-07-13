import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { SystemStatusSection } from '../components/SystemStatusSection';

const Diagnostico: React.FC = () => {
  const { syncStats, totalRecordsInApi, corruptedItems, isSyncing } = useDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <SystemStatusSection
        syncStats={syncStats}
        totalRecordsInApi={totalRecordsInApi}
        corruptedItems={corruptedItems}
        isSyncing={isSyncing}
      />
    </div>
  );
};

export default Diagnostico;
