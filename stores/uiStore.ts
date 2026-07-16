import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WIDGET_CATALOG } from '../constants/widgets';

const DEFAULT_VISIBLE_IDS = WIDGET_CATALOG.map(w => w.id);

interface UiState {
    isSidebarOpen: boolean;
    syncNotificationsEnabled: boolean;
    visibleWidgetIds: string[];
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSyncNotifications: () => void;
    toggleWidget: (id: string) => void;
    resetWidgets: () => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            isSidebarOpen: false,
            syncNotificationsEnabled: true,
            visibleWidgetIds: DEFAULT_VISIBLE_IDS,

            toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),

            setSidebarOpen: (open) => set({ isSidebarOpen: open }),

            toggleSyncNotifications: () => set(state => ({ syncNotificationsEnabled: !state.syncNotificationsEnabled })),

            toggleWidget: (id) => set(state => {
                const exists = state.visibleWidgetIds.includes(id);
                // Minimum 1 widget guard — never hide the last visible widget
                if (exists && state.visibleWidgetIds.length <= 1) {
                    return state;
                }
                return {
                    visibleWidgetIds: exists
                        ? state.visibleWidgetIds.filter(wid => wid !== id)
                        : [...state.visibleWidgetIds, id]
                };
            }),

            resetWidgets: () => set({ visibleWidgetIds: DEFAULT_VISIBLE_IDS }),
        }),
        {
            name: 'ui-store',
            // Persist only visibleWidgetIds, not the entire store
            partialize: (state) => ({ visibleWidgetIds: state.visibleWidgetIds }),
        }
    )
);
