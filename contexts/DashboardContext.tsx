import React, { createContext, useContext, type ReactNode } from 'react';
import { useDashboardData, type CorruptedRecord } from '../hooks/useDashboardData';
import type { Participant } from '../types';

interface SyncStats {
  loaded: number;
  errors: number;
  corrupted: number;
  duplicated: number;
  progress: number;
}

interface DashboardContextValue {
  dashboardData: Participant[];
  corruptedItems: CorruptedRecord[];
  totalRecordsInApi: number;
  isSyncing: boolean;
  isPaused: boolean;
  syncStats: SyncStats;
  criticalConnectionError: boolean;
  connectionErrorMessage: string;
  customToken: string;
  showTokenInput: boolean;
  setCustomToken: (token: string) => void;
  setShowTokenInput: (show: boolean) => void;
  setCriticalConnectionError: (error: boolean) => void;
  setConnectionErrorMessage: (message: string) => void;
  startSmartSync: (forceStartPage?: number) => Promise<void>;
  handleManualRefresh: () => void;
  togglePause: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
  value?: DashboardContextValue;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, value: externalValue }) => {
  const hookValue = useDashboardData();
  const value = externalValue ?? hookValue;

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return ctx;
};
