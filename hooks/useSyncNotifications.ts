import { useEffect } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { useUiStore } from '../stores/uiStore';

// ---------------------------------------------------------------------------
// useSyncNotifications
//
// Subscribes to isSyncing transitions (true → false) and fires a browser
// Notification when the tab is backgrounded and a sync just finished.
// Progressive enhancement: no crash if Notification API is unavailable.
// ---------------------------------------------------------------------------

let _permissionRequested = false;

export function useSyncNotifications(): void {
    useEffect(() => {
        const unsub = useParticipantStore.subscribe((state, prevState) => {
            // ── Detect sync completion: true → false ──
            if (!prevState.isSyncing || state.isSyncing) return;

            // ── Opt-out gate ──
            if (!useUiStore.getState().syncNotificationsEnabled) return;

            // ── Visibility guard: only fire if tab is in background ──
            if (document.visibilityState !== 'hidden') return;

            // ── Progressive enhancement: Notification API unavailable? skip ──
            if (typeof Notification === 'undefined') return;

            // ── Permission lifecycle ──
            if (Notification.permission === 'denied') return;

            if (Notification.permission === 'default' && !_permissionRequested) {
                _permissionRequested = true;
                // Request permission and fire on grant
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        fireNotification(state.syncStats.loaded);
                    }
                });
                return;
            }

            if (Notification.permission === 'granted') {
                fireNotification(state.syncStats.loaded);
            }
        });

        return () => {
            unsub();
        };
    }, []);
}

function fireNotification(loadedCount: number): void {
    const body = loadedCount === 1
        ? '1 registro sincronizado'
        : `${loadedCount} registros sincronizados`;

    new Notification('Sincronización completa', { body });
}
