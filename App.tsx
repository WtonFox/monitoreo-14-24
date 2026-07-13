import React, { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorScreen } from './components/ErrorScreen';

// Hooks
import { useDashboardData } from './hooks/useDashboardData';

// Contexts
import { DashboardProvider } from './contexts/DashboardContext';
import { AuthProvider } from './contexts/AuthContext';
import { FiltersProvider } from './contexts/FiltersContext';

// Utils
import { exportCSV, exportJSON } from './utils/exportUtils';

const App: React.FC = () => {
  // View State
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dashboard Data Hook
  const {
    dashboardData,
    corruptedItems,
    totalRecordsInApi,
    isSyncing,
    isPaused,
    syncStats,
    criticalConnectionError,
    connectionErrorMessage,
    customToken,
    showTokenInput,
    setCustomToken,
    setShowTokenInput,
    setCriticalConnectionError,
    setConnectionErrorMessage,
    startSmartSync,
    pollForNewData,
    handleManualRefresh,
    togglePause
  } = useDashboardData();

  // Sidebar State for Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initial Data Sync
  useEffect(() => {
    startSmartSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-sync polling: check for new data every 15 minutes
  useEffect(() => {
    const POLL_INTERVAL = 900000;

    const intervalId = setInterval(() => {
      pollForNewData();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [pollForNewData]);

  // Update last updated timestamp when sync completes
  useEffect(() => {
    if (!isSyncing && syncStats.progress === 100) {
      setLastUpdated(new Date());
    }
  }, [isSyncing, syncStats.progress]);

  // Export Format Handler — exports dashboardData in selected format
  const handleExportFormat = useCallback((format: 'csv' | 'xlsx' | 'json') => {
    if (dashboardData.length === 0) return;

    if (format === 'csv') {
      exportCSV(dashboardData);
    } else if (format === 'xlsx') {
      // For XLSX, we use exportToExcel from exporter which fetches fresh
      // For now, fall back to CSV since full XLSX requires the mass export flow
      exportCSV(dashboardData);
    } else if (format === 'json') {
      exportJSON(dashboardData);
    }
  }, [dashboardData]);

  // Refresh Handler
  const handleRefresh = () => {
    handleManualRefresh();
    setLastUpdated(new Date());
  };

  return (
    <DashboardProvider value={{
      dashboardData,
      corruptedItems,
      totalRecordsInApi,
      isSyncing,
      isPaused,
      syncStats,
      criticalConnectionError,
      connectionErrorMessage,
      customToken,
      showTokenInput,
      setCustomToken,
      setShowTokenInput,
      setCriticalConnectionError,
      setConnectionErrorMessage,
      startSmartSync,
      handleManualRefresh,
      togglePause
    }}>
      <AuthProvider>
        <FiltersProvider>
          <div className="min-h-screen flex flex-col md:flex-row font-sans text-gray-800 bg-gray-50 relative">

            {/* Sidebar */}
            <Sidebar
              syncStats={syncStats}
              totalRecords={totalRecordsInApi}
              isSyncing={isSyncing}
              isPaused={isPaused}
              onTogglePause={togglePause}
              criticalConnectionError={criticalConnectionError}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              corruptedItems={corruptedItems}
              onManualRefresh={handleRefresh}
            />

            {/* Mobile Overlay Backdrop */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in duration-200"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-gray-50 w-full min-h-screen">

              {/* Top Header */}
              <Header
                lastUpdated={lastUpdated}
                onRefresh={handleRefresh}
                onExportFormat={handleExportFormat}
                totalRecords={totalRecordsInApi}
                isSyncing={isSyncing}
                isPaused={isPaused}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
        </FiltersProvider>
      </AuthProvider>
    </DashboardProvider>
  );
};

export default App;
