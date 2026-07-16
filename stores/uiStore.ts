import { create } from 'zustand';

interface UiState {
    isSidebarOpen: boolean;
    syncNotificationsEnabled: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSyncNotifications: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    isSidebarOpen: false,
    syncNotificationsEnabled: true,

    toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    toggleSyncNotifications: () => set(state => ({ syncNotificationsEnabled: !state.syncNotificationsEnabled })),
}));
