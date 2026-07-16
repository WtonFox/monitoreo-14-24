import React from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { SystemStatusSection } from '../components/SystemStatusSection';

const Diagnostico: React.FC = () => {
  const syncStats = useParticipantStore(s => s.syncStats);
  const totalRecordsInApi = useParticipantStore(s => s.totalRecordsInApi);
  const corruptedItems = useParticipantStore(s => s.corruptedItems);
  const isSyncing = useParticipantStore(s => s.isSyncing);

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
