import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorScreen } from './components/ErrorScreen';

// Stores
import { useParticipantStore } from './stores/participantStore';
import { useAuthStore } from './stores/authStore';
import { useFilterStore } from './stores/filterStore';
import { useUiStore } from './stores/uiStore';


const App: React.FC = () => {
  // View State
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Store subscriptions (selective slices)
  const dashboardData = useParticipantStore(s => s.dashboardData);
  const corruptedItems = useParticipantStore(s => s.corruptedItems);
  const totalRecordsInApi = useParticipantStore(s => s.totalRecordsInApi);
  const isSyncing = useParticipantStore(s => s.isSyncing);
  const isPaused = useParticipantStore(s => s.isPaused);
  const syncStats = useParticipantStore(s => s.syncStats);
  const criticalConnectionError = useParticipantStore(s => s.criticalConnectionError);
  const connectionErrorMessage = useParticipantStore(s => s.connectionErrorMessage);
  const customToken = useParticipantStore(s => s.customToken);
  const showTokenInput = useParticipantStore(s => s.showTokenInput);

  // UI store
  const isSidebarOpen = useUiStore(s => s.isSidebarOpen);
  const setSidebarOpen = useUiStore(s => s.setSidebarOpen);

  // Get store actions (stable references — no re-render on state change)
  const setCustomToken = useParticipantStore(s => s.setCustomToken);
  const setShowTokenInput = useParticipantStore(s => s.setShowTokenInput);

  // Initialize auth and cache on mount
  useEffect(() => {
    useAuthStore.getState().init();
    useParticipantStore.getState().initFromCache();
    useParticipantStore.getState().startSmartSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync polling: check for new data every 15 minutes
  useEffect(() => {
    const POLL_INTERVAL = 900000;

    const intervalId = setInterval(() => {
      useParticipantStore.getState().pollForNewData();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Sync filter store data whenever dashboardData changes
  useEffect(() => {
    useFilterStore.getState().setData(dashboardData);
  }, [dashboardData]);

  // Update last updated timestamp when sync completes
  useEffect(() => {
    if (!isSyncing && syncStats.progress === 100) {
      setLastUpdated(new Date());
    }
  }, [isSyncing, syncStats.progress]);

  // Refresh Handler
  const handleRefresh = () => {
    useParticipantStore.getState().handleManualRefresh();
    setLastUpdated(new Date());
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-gray-800 bg-gray-50 relative">

      {/* Sidebar — isOpen/onClose from useUiStore inside component */}
      <Sidebar
        syncStats={syncStats}
        totalRecords={totalRecordsInApi}
        isSyncing={isSyncing}
        isPaused={isPaused}
        onTogglePause={() => useParticipantStore.getState().togglePause()}
        criticalConnectionError={criticalConnectionError}
        corruptedItems={corruptedItems}
        onManualRefresh={handleRefresh}
      />

      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-gray-50 w-full min-h-screen">

        {/* Top Header */}
        <Header
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          isSyncing={isSyncing}
          isPaused={isPaused}
          onToggleSidebar={() => useUiStore.getState().toggleSidebar()}
        />

        {/* Dashboard Content / Route Pages */}
        <div className="flex-1 flex flex-col">
          {criticalConnectionError && dashboardData.length === 0 ? (
            <div className="p-6 max-w-7xl mx-auto w-full">
              <ErrorScreen
                errorMessage={connectionErrorMessage}
                onRetry={handleRefresh}
                customToken={customToken}
                onTokenChange={setCustomToken}
                showTokenInput={showTokenInput}
                onToggleTokenInput={() => setShowTokenInput(!showTokenInput)}
              />
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>

    </div>
  );
};

export default App;
