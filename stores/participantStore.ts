import { create } from 'zustand';
import type { Participant, PaginationResult } from '../types';
import { fetchParticipants, clearApiCache } from '../services/api';
import { sanitizeParticipant } from '../utils/dataUtils';
import {
    getAllParticipants,
    saveParticipants,
    clearAllData,
    saveMetadata,
    getMetadata
} from '../services/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncStats {
    loaded: number;
    errors: number;
    corrupted: number;
    duplicated: number;
    progress: number;
    erroredPages: number[];
}

export interface CorruptedRecord {
    id: number;
    raw: any;
    reason: string;
}

interface ParticipantState {
    // Data
    dashboardData: Participant[];
    corruptedItems: CorruptedRecord[];
    totalRecordsInApi: number;
    isSyncing: boolean;
    isPaused: boolean;
    syncStats: SyncStats;

    // Error / token UI
    criticalConnectionError: boolean;
    connectionErrorMessage: string;
    customToken: string;
    showTokenInput: boolean;

    // UI-bound setters
    setCustomToken: (token: string) => void;
    setShowTokenInput: (show: boolean) => void;
    setCriticalConnectionError: (error: boolean) => void;
    setConnectionErrorMessage: (message: string) => void;

    // Sync actions
    startSmartSync: (forceStartPage?: number) => Promise<void>;
    pollForNewData: () => Promise<void>;
    handleManualRefresh: () => void;
    togglePause: () => void;

    // Lifecycle
    initFromCache: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Module-level refs (replace React useRef — zustand lives outside the
// component lifecycle, so plain variables are stable across renders)
// ---------------------------------------------------------------------------

let _stopSync = false;
let _isSyncing = false;
let _existingIds = new Set<number>();
let _statsRef: SyncStats = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
let _isPaused = false;
let _lastChecksum = '';

function resetRefs(): void {
    _stopSync = false;
    _isSyncing = false;
    _existingIds = new Set<number>();
    _statsRef = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
    _isPaused = false;
    _lastChecksum = '';
}

// ---------------------------------------------------------------------------
// Default SyncStats
// ---------------------------------------------------------------------------

const EMPTY_STATS: SyncStats = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useParticipantStore = create<ParticipantState>((set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────
    dashboardData: [],
    corruptedItems: [],
    totalRecordsInApi: 0,
    isSyncing: false,
    isPaused: false,
    syncStats: { ...EMPTY_STATS },

    criticalConnectionError: false,
    connectionErrorMessage: '',
    customToken: '',
    showTokenInput: false,

    // ── UI-bound setters ───────────────────────────────────────────────
    setCustomToken: (token) => set({ customToken: token }),
    setShowTokenInput: (show) => set({ showTokenInput: show }),
    setCriticalConnectionError: (error) => set({ criticalConnectionError: error }),
    setConnectionErrorMessage: (message) => set({ connectionErrorMessage: message }),

    // ── togglePause ────────────────────────────────────────────────────
    togglePause: () => {
        _isPaused = !_isPaused;
        set({ isPaused: _isPaused });
    },

    // ── initFromCache — load data from IndexedDB on mount ──────────────
    initFromCache: async () => {
        try {
            const storedData = await getAllParticipants();
            if (storedData && storedData.length > 0) {
                // Check if cache has extended fields (DBv2+)
                const sampleSize = Math.min(5, storedData.length);
                let allMissingNewFields = true;
                for (let i = 0; i < sampleSize; i++) {
                    if (storedData[i].edadRegistro > 0 || storedData[i].estadoCivil) {
                        allMissingNewFields = false;
                        break;
                    }
                }

                if (allMissingNewFields && storedData.length > 0) {
                    console.log('Cache sin campos extendidos (DBv1). Limpiando y forzando recarga...');
                    await clearAllData();
                    _existingIds.clear();
                    // Start fresh sync
                    setTimeout(() => get().startSmartSync(1), 500);
                    return;
                }

                console.log(`Loaded ${storedData.length} records from IndexedDB`);

                set({ dashboardData: storedData });

                storedData.forEach(p => _existingIds.add(p.id));

                const meta = await getMetadata('syncInfo');
                const totalRecords = (meta && (meta as any).totalRecords) ? (meta as any).totalRecords : 0;
                if (meta && (meta as any).totalRecords) {
                    set({ totalRecordsInApi: (meta as any).totalRecords });
                }

                if (meta && (meta as any).lastChecksum) {
                    _lastChecksum = (meta as any).lastChecksum as string;
                }

                const restoredStats: SyncStats = {
                    loaded: storedData.length,
                    errors: 0,
                    corrupted: (meta as any)?.corrupted || 0,
                    duplicated: (meta as any)?.duplicated || 0,
                    progress: 100,
                    erroredPages: []
                };

                _statsRef = restoredStats;
                set({ syncStats: restoredStats });
            }
        } catch (error) {
            console.error('Failed to load data from IndexedDB:', error);
        }
    },

    // ── startSmartSync ─────────────────────────────────────────────────
    startSmartSync: async (forceStartPage?: number) => {
        const state = get();

        if (_isSyncing && forceStartPage === undefined) return;

        _isSyncing = true;
        _stopSync = false;
        set({
            isSyncing: true,
            criticalConnectionError: false,
            connectionErrorMessage: ''
        });

        try {
            // Paso 1: Sondeo Inicial (Probe)
            const initialProbe = await fetchParticipants(1, 1, 0, state.customToken || undefined);
            const initialTotalEstimate = initialProbe.totalItems;
            set({ totalRecordsInApi: initialTotalEstimate });

            if (initialTotalEstimate === 0) {
                set({ isSyncing: false });
                _isSyncing = false;
                return;
            }

            // Paso 2: Carga masiva con bucle WHILE
            const BATCH_SIZE = 10000;

            let currentPage = 1;
            if (forceStartPage !== undefined) {
                currentPage = forceStartPage;
                if (forceStartPage === 1) {
                    _existingIds.clear();
                    await saveMetadata('syncInfo', {
                        lastSync: Date.now(),
                        totalRecords: 0,
                        duplicated: 0,
                        corrupted: 0,
                        lastSyncedPage: 1,
                        lastSyncedRecordCount: 0,
                        syncTimestamp: Date.now(),
                        lastChecksum: ''
                    });
                }
            } else {
                const meta = await getMetadata('syncInfo');
                currentPage = (meta as any)?.lastSyncedPage || 1;

                if (_existingIds.size === 0 && get().dashboardData.length > 0) {
                    get().dashboardData.forEach(p => _existingIds.add(p.id));
                }
            }

            let totalLoadedCount = (currentPage - 1) * BATCH_SIZE;

            if (_statsRef.loaded === 0 && get().dashboardData.length > 0) {
                _statsRef.loaded = get().dashboardData.length;
            }
            set(state => ({ syncStats: { ...state.syncStats, loaded: totalLoadedCount } }));

            let pendingBatch: Participant[] = [];
            let lastStateUpdate = Date.now();
            let hasMoreData = true;

            while (hasMoreData && !_stopSync) {
                while (_isPaused) {
                    await new Promise(r => setTimeout(r, 500));
                    if (_stopSync) break;
                }

                let fetchResult: PaginationResult | null = null;

                for (let attempt = 0; attempt < 3 && !fetchResult && !_stopSync; attempt++) {
                    if (attempt > 0) {
                        const backoffDelay = [1000, 2000, 4000][attempt - 1];
                        await new Promise(r => setTimeout(r, backoffDelay));
                    }

                    try {
                        fetchResult = await fetchParticipants(currentPage, BATCH_SIZE, 0, get().customToken || undefined);
                    } catch (err) {
                        console.warn(`Error en lote ${currentPage}, intento ${attempt + 1}/3:`, err);
                    }
                }

                if (!fetchResult && !_stopSync) {
                    const failedPage = currentPage;
                    console.warn(`Página ${failedPage} falló después de 3 intentos. Omitiendo.`);
                    _statsRef.erroredPages = [..._statsRef.erroredPages, failedPage];
                    set(prev => ({
                        syncStats: {
                            ...prev.syncStats,
                            errors: prev.syncStats.errors + 1,
                            erroredPages: [...prev.syncStats.erroredPages, failedPage]
                        }
                    }));
                }

                if (fetchResult && !_stopSync) {
                    const result = fetchResult;

                    if (result.totalItems && result.totalItems > get().totalRecordsInApi) {
                        set({ totalRecordsInApi: result.totalItems });
                    }

                    const items = result.items;

                    if (!items || !Array.isArray(items) || items.length === 0) {
                        hasMoreData = false;
                    }

                    if (items && Array.isArray(items) && items.length > 0) {
                        let localCorruptedCount = 0;
                        let localDuplicatedCount = 0;
                        const cleanBatch: Participant[] = [];
                        const newCorrupted: CorruptedRecord[] = [];

                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            const clean = sanitizeParticipant(item, i);

                            if (clean.estado === 'CRITICALLY_CORRUPT' || clean.estado === 'GENERIC_ERROR') {
                                localCorruptedCount++;
                                newCorrupted.push({
                                    id: clean.id,
                                    raw: item,
                                    reason: clean.estado === 'CRITICALLY_CORRUPT'
                                        ? 'Estructura inválida o datos ilegibles'
                                        : 'Datos corruptos (fechas inválidas)'
                                });
                                continue;
                            }

                            if (!_existingIds.has(clean.id)) {
                                _existingIds.add(clean.id);
                                cleanBatch.push(clean);
                            } else {
                                localDuplicatedCount++;
                            }
                        }

                        if (newCorrupted.length > 0) {
                            set(prev => ({ corruptedItems: [...prev.corruptedItems, ...newCorrupted] }));
                        }

                        pendingBatch.push(...cleanBatch);

                        if (cleanBatch.length > 0) {
                            await saveParticipants(cleanBatch).catch(err => {
                                console.error('Failed to save batch to IndexedDB:', err);
                            });
                        }

                        totalLoadedCount += cleanBatch.length;

                        const currentTotal = result.totalItems || get().totalRecordsInApi || 1;
                        const estimatedProgress = Math.min(100, Math.round((_existingIds.size / currentTotal) * 100));

                        _statsRef.loaded = _existingIds.size;
                        _statsRef.corrupted += localCorruptedCount;
                        _statsRef.duplicated += localDuplicatedCount;
                        _statsRef.progress = estimatedProgress;

                        set({ syncStats: { ..._statsRef } });

                        if (cleanBatch.length > 0) {
                            await saveMetadata('syncInfo', {
                                lastSync: Date.now(),
                                totalRecords: result.totalItems || get().totalRecordsInApi,
                                duplicated: _statsRef.duplicated,
                                corrupted: _statsRef.corrupted,
                                lastSyncedPage: currentPage,
                                lastSyncedRecordCount: _existingIds.size,
                                syncTimestamp: Date.now(),
                                lastChecksum: _lastChecksum || ''
                            }).catch(err => {
                                console.error('Failed to save metadata:', err);
                            });
                        }

                        if (items.length < BATCH_SIZE) {
                            hasMoreData = false;
                        }

                        const timeSinceLastUpdate = Date.now() - lastStateUpdate;

                        if (pendingBatch.length >= 1000 || timeSinceLastUpdate > 3000 || !hasMoreData) {
                            const batchToProcess = pendingBatch;

                            set(prev => ({
                                dashboardData: [...prev.dashboardData, ...batchToProcess]
                            }));

                            pendingBatch = [];
                            lastStateUpdate = Date.now();
                        }
                    }
                }

                if (hasMoreData) {
                    currentPage++;
                }

                await new Promise(r => setTimeout(r, 150));
            }

            // Flush final
            if (pendingBatch.length > 0 && !_stopSync) {
                set(prev => ({ dashboardData: [...prev.dashboardData, ...pendingBatch] }));
            }

        } catch (err: any) {
            console.error('Critical Sync Failed:', err);
            if (get().dashboardData.length === 0) {
                set({
                    criticalConnectionError: true,
                    connectionErrorMessage: err.message || 'Error desconocido'
                });
            }
        } finally {
            set({ isSyncing: false });
            _isSyncing = false;
        }
    },

    // ── pollForNewData ─────────────────────────────────────────────────
    pollForNewData: async () => {
        if (_isSyncing) return;

        const state = get();

        try {
            const probe = await fetchParticipants(1, 1, 0, state.customToken || undefined);
            const apiTotal = probe.totalItems;
            const items = probe.items || [];

            const checksum = JSON.stringify(
                items.slice(0, 5).map(i => `${i.id}:${i.edad}`)
            );

            const hasExistingData = state.totalRecordsInApi > 0;
            const checksumInitialized = _lastChecksum !== '';
            const checksumChanged = checksumInitialized && checksum !== _lastChecksum;

            if (
                apiTotal > state.totalRecordsInApi ||
                (apiTotal < state.totalRecordsInApi && hasExistingData) ||
                (apiTotal === state.totalRecordsInApi && hasExistingData && checksumChanged)
            ) {
                console.log(`[AutoSync] Data change detected (totalItems: ${apiTotal}). Full re-sync from page 1...`);
                _lastChecksum = checksum;

                _stopSync = true;
                _statsRef = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
                _existingIds.clear();

                set({
                    dashboardData: [],
                    corruptedItems: [],
                    syncStats: { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] },
                    totalRecordsInApi: apiTotal,
                });

                await clearAllData();
                await get().startSmartSync(1);
            } else {
                _lastChecksum = checksum;
            }
        } catch (err) {
            console.warn('[AutoSync] Poll failed:', err);
        }
    },

    // ── handleManualRefresh ────────────────────────────────────────────
    handleManualRefresh: () => {
        clearApiCache();
        _stopSync = true;
        _isPaused = false;
        _statsRef = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
        _existingIds.clear();

        set({
            dashboardData: [],
            corruptedItems: [],
            syncStats: { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] },
            criticalConnectionError: false,
            connectionErrorMessage: '',
            totalRecordsInApi: 0,
            isPaused: false,
        });

        saveMetadata('syncInfo', {
            lastSync: Date.now(),
            totalRecords: 0,
            duplicated: 0,
            corrupted: 0,
            lastSyncedPage: 1,
            lastSyncedRecordCount: 0,
            syncTimestamp: Date.now(),
            lastChecksum: ''
        }).catch(err => {
            console.error('Failed to reset checkpoint:', err);
        });

        clearAllData().catch(err => {
            console.error('Failed to clear database:', err);
        });

        setTimeout(() => {
            _isSyncing = false;
            set({ isSyncing: false });
            get().startSmartSync(1);
        }, 1200);
    },
}));

/**
 * Reset all sync refs (useful for testing or full teardown).
 */
export function resetParticipantRefs(): void {
    resetRefs();
}
