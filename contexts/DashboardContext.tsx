import React, { createContext, useContext, type ReactNode } from 'react';
import type { Participant } from '../types';
import type { CorruptedRecord } from '../hooks/useDashboardData';

interface SyncStats {
  loaded: number;
  errors: number;
  corrupted: number;
  duplicated: number;
  progress: number;
}

export interface DashboardContextValue {
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
  value: DashboardContextValue;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children, value }) => {
  if (typeof value === 'undefined') {
    throw new Error(
      'DashboardProvider requires a value prop — call useDashboardData in the parent and pass it down.',
    );
  }

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
