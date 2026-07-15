import { useState, useCallback, useRef, useEffect } from 'react';
import { Participant, PaginationResult } from '../types';
import { fetchParticipants, clearApiCache } from '../services/api';
import { sanitizeParticipant } from '../utils/dataUtils';
import {
    getAllParticipants,
    saveParticipants,
    clearAllData,
    saveMetadata,
    getMetadata
} from '../services/database';

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

interface UseDashboardDataResult {
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
    pollForNewData: () => Promise<void>;
    handleManualRefresh: () => void;
    togglePause: () => void;
}

/**
 * Hook para gestionar la sincronización y carga de datos del dashboard
 */
export const useDashboardData = (): UseDashboardDataResult => {
    const [dashboardData, setDashboardData] = useState<Participant[]>([]);
    const [totalRecordsInApi, setTotalRecordsInApi] = useState<number>(0);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [syncStats, setSyncStats] = useState<SyncStats>({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] });
    const [corruptedItems, setCorruptedItems] = useState<CorruptedRecord[]>([]);

    // Estados de error
    const [criticalConnectionError, setCriticalConnectionError] = useState<boolean>(false);
    const [connectionErrorMessage, setConnectionErrorMessage] = useState<string>('');
    const [customToken, setCustomToken] = useState<string>('');
    const [showTokenInput, setShowTokenInput] = useState<boolean>(false);

    const stopSyncRef = useRef<boolean>(false);
    const isSyncingRef = useRef<boolean>(false);
    const existingIdsRef = useRef<Set<number>>(new Set());
    const statsRef = useRef<SyncStats>({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] });
    const isPausedRef = useRef<boolean>(false);
    const lastChecksumRef = useRef<string>('');

    // Cargar datos desde IndexedDB al iniciar
    useEffect(() => {
        const loadFromDB = async () => {
            try {
                const storedData = await getAllParticipants();
                if (storedData && storedData.length > 0) {
                    // Verificar si la caché tiene los campos nuevos (DBv2+)
                    // Si el primer registro tiene edadRegistro === 0 y hay datos,
                    // es caché vieja sin los campos extendidos → limpiar y refrescar
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
                        existingIdsRef.current.clear();
                        // Iniciar sync fresco
                        setTimeout(() => startSmartSync(1), 500);
                        return;
                    }

                    console.log(`Loaded ${storedData.length} records from IndexedDB`);

                    // Restaurar datos en estado
                    setDashboardData(storedData);

                    // Restaurar IDs para evitar duplicados
                    storedData.forEach(p => existingIdsRef.current.add(p.id));

                    // Restaurar estadísticas completas
                    const meta = await getMetadata('syncInfo');
                    if (meta && meta.totalRecords) {
                        setTotalRecordsInApi(meta.totalRecords);
                    }

                    if (meta && meta.lastChecksum) {
                        lastChecksumRef.current = meta.lastChecksum as string;
                    }

                    const restoredStats = {
                        loaded: storedData.length,
                        errors: 0,
                        corrupted: meta?.corrupted || 0,
                        duplicated: meta?.duplicated || 0,
                        progress: 100,
                        erroredPages: []
                    };

                    setSyncStats(restoredStats);
                    statsRef.current = restoredStats;
                }
            } catch (error) {
                console.error('Failed to load data from IndexedDB:', error);
            }
        };

        loadFromDB();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const startSmartSync = useCallback(async (forceStartPage?: number) => {
        // Prevent double execution if already syncing and not a force restart
        if (isSyncingRef.current && forceStartPage === undefined) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        setCriticalConnectionError(false);
        setConnectionErrorMessage('');
        stopSyncRef.current = false;

        try {
            // Paso 1: Sondeo Inicial (Probe)
            const initialProbe = await fetchParticipants(1, 1, 0, customToken || undefined);
            const initialTotalEstimate = initialProbe.totalItems;
            setTotalRecordsInApi(initialTotalEstimate);

            if (initialTotalEstimate === 0) {
                setIsSyncing(false);
                isSyncingRef.current = false;
                return;
            }

            // Paso 2: Carga masiva con bucle WHILE
            const BATCH_SIZE = 10000;

            let currentPage = 1;
            if (forceStartPage !== undefined) {
                currentPage = forceStartPage;
                // Si forzamos reinicio, limpiamos el set de IDs
                if (forceStartPage === 1) {
                    existingIdsRef.current.clear();
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
                currentPage = meta?.lastSyncedPage || 1;

                // Reconstruir Set si es necesario (solo al inicio de una reanudación)
                if (existingIdsRef.current.size === 0 && dashboardData.length > 0) {
                    dashboardData.forEach(p => existingIdsRef.current.add(p.id));
                }
            }

            // Usar contador local para progreso preciso
            let totalLoadedCount = (currentPage - 1) * BATCH_SIZE;

            // Inicializar statsRef si es la primera carga y no viene de DB
            if (statsRef.current.loaded === 0 && dashboardData.length > 0) {
                statsRef.current.loaded = dashboardData.length;
            }
            // Aseguramos que syncStats esté sincronizado
            setSyncStats(prev => ({ ...prev, loaded: totalLoadedCount }));

            let pendingBatch: Participant[] = [];
            let lastStateUpdate = Date.now();
            let hasMoreData = true;

            while (hasMoreData && !stopSyncRef.current) {
                // Manejo de Pausa interactiva
                while (isPausedRef.current) {
                    await new Promise(r => setTimeout(r, 500));
                    if (stopSyncRef.current) break;
                }

                let fetchResult: PaginationResult | null = null;

                for (let attempt = 0; attempt < 3 && !fetchResult && !stopSyncRef.current; attempt++) {
                    if (attempt > 0) {
                        const backoffDelay = [1000, 2000, 4000][attempt - 1];
                        await new Promise(r => setTimeout(r, backoffDelay));
                    }

                    try {
                        fetchResult = await fetchParticipants(currentPage, BATCH_SIZE, 0, customToken || undefined);
                    } catch (err) {
                        console.warn(`Error en lote ${currentPage}, intento ${attempt + 1}/3:`, err);
                    }
                }

                if (!fetchResult && !stopSyncRef.current) {
                    // All 3 retries exhausted — record and skip this page
                    const failedPage = currentPage;
                    console.warn(`Página ${failedPage} falló después de 3 intentos. Omitiendo.`);
                    statsRef.current.erroredPages = [...statsRef.current.erroredPages, failedPage];
                    setSyncStats(prev => ({ ...prev, errors: prev.errors + 1, erroredPages: [...prev.erroredPages, failedPage] }));
                }

                if (fetchResult && !stopSyncRef.current) {
                    const result = fetchResult;

                    // Actualizar total dinámicamente
                    if (result.totalItems && result.totalItems > totalRecordsInApi) {
                        setTotalRecordsInApi(result.totalItems);
                    }

                    const items = result.items;

                    if (!items || !Array.isArray(items) || items.length === 0) {
                        hasMoreData = false;
                    }

                    if (items && Array.isArray(items) && items.length > 0) {
                        // Procesar lote
                        let localCorruptedCount = 0;
                        let localDuplicatedCount = 0;
                        const cleanBatch: Participant[] = [];
                        const newCorrupted: CorruptedRecord[] = [];

                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            const clean = sanitizeParticipant(item, i);

                            // Quarantine corrupt records — exclude from dashboardData
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

                            // Check duplicados O(1)
                            if (!existingIdsRef.current.has(clean.id)) {
                                existingIdsRef.current.add(clean.id);
                                cleanBatch.push(clean);
                            } else {
                                localDuplicatedCount++;
                            }
                        }

                        if (newCorrupted.length > 0) {
                            setCorruptedItems(prev => [...prev, ...newCorrupted]);
                        }

                        pendingBatch.push(...cleanBatch);

                        // Guardar en DB asíncronamente (no bloqueante)
                        if (cleanBatch.length > 0) {
                            await saveParticipants(cleanBatch).catch(err => {
                                console.error('Failed to save batch to IndexedDB:', err);
                            });
                        }

                        // Actualizar contador local
                        totalLoadedCount += cleanBatch.length; // Solo los nuevos reales

                        const currentTotal = result.totalItems || totalRecordsInApi || 1;
                        // Usar contador local en lugar de syncStats.loaded
                        const estimatedProgress = Math.min(100, Math.round((existingIdsRef.current.size / currentTotal) * 100));

                        // Actualizar Refs y guardarlos
                        statsRef.current.loaded = existingIdsRef.current.size;
                        statsRef.current.corrupted += localCorruptedCount;
                        statsRef.current.duplicated += localDuplicatedCount;
                        statsRef.current.progress = estimatedProgress;

                        // Update UI
                        setSyncStats({ ...statsRef.current });

                        // Persistir metadata actualizada con checkpoint (WU4)
                        if (cleanBatch.length > 0) {
                        await saveMetadata('syncInfo', {
                            lastSync: Date.now(),
                            totalRecords: result.totalItems || totalRecordsInApi,
                            duplicated: statsRef.current.duplicated,
                            corrupted: statsRef.current.corrupted,
                            lastSyncedPage: currentPage,
                            lastSyncedRecordCount: existingIdsRef.current.size,
                            syncTimestamp: Date.now(),
                            lastChecksum: lastChecksumRef.current || ''
                        }).catch(err => {
                            console.error('Failed to save metadata:', err);
                        });
                        }

                        if (items.length < BATCH_SIZE) {
                            hasMoreData = false;
                        }

                        // Estrategia de Actualización Diferida
                        const timeSinceLastUpdate = Date.now() - lastStateUpdate;

                        if (pendingBatch.length >= 1000 || timeSinceLastUpdate > 3000 || !hasMoreData) {
                            const batchToProcess = pendingBatch;

                            setDashboardData(prev => {
                                // Ya hemos filtrado duplicados antes de meter en pendingBatch usando el Ref
                                return [...prev, ...batchToProcess];
                            });

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
            if (pendingBatch.length > 0 && !stopSyncRef.current) {
                setDashboardData(prev => [...prev, ...pendingBatch]);
            }

        } catch (err: any) {
            console.error('Critical Sync Failed:', err);
            if (dashboardData.length === 0) {
                setCriticalConnectionError(true);
                const msg = err.message || 'Error desconocido';
                setConnectionErrorMessage(msg);
            }
        } finally {
            setIsSyncing(false);
            isSyncingRef.current = false;
        }
    }, [dashboardData.length, totalRecordsInApi, customToken]);

    const pollForNewData = useCallback(async () => {
        if (isSyncingRef.current) return;

        try {
            const probe = await fetchParticipants(1, 1, 0, customToken || undefined);
            const apiTotal = probe.totalItems;
            const items = probe.items || [];

            // Lightweight checksum: first few record IDs + edad as change discriminator
            const checksum = JSON.stringify(
                items.slice(0, 5).map(i => `${i.id}:${i.edad}`)
            );

            const hasExistingData = totalRecordsInApi > 0;
            const checksumInitialized = lastChecksumRef.current !== '';
            const checksumChanged = checksumInitialized && checksum !== lastChecksumRef.current;

            if (
                apiTotal > totalRecordsInApi ||
                (apiTotal < totalRecordsInApi && hasExistingData) ||
                (apiTotal === totalRecordsInApi && hasExistingData && checksumChanged)
            ) {
                console.log(`[AutoSync] Data change detected (totalItems: ${apiTotal}). Full re-sync from page 1...`);
                lastChecksumRef.current = checksum;

                // Full re-verify: stop current state, clear persistence, restart fresh
                stopSyncRef.current = true;
                setDashboardData([]);
                setCorruptedItems([]);
                setSyncStats({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] });
                statsRef.current = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
                existingIdsRef.current.clear();
                setTotalRecordsInApi(apiTotal);
                await clearAllData();
                await startSmartSync(1);
            } else {
                // Store checksum even when no change detected
                lastChecksumRef.current = checksum;
            }
        } catch (err) {
            console.warn('[AutoSync] Poll failed:', err);
        }
    }, [customToken, totalRecordsInApi, startSmartSync]);

    const handleManualRefresh = useCallback(async () => {
        clearApiCache();
        stopSyncRef.current = true;
        isPausedRef.current = false;

        setDashboardData([]);
        setCorruptedItems([]);
        setSyncStats({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] });
        statsRef.current = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0, erroredPages: [] };
        setCriticalConnectionError(false);
        setConnectionErrorMessage('');
        setTotalRecordsInApi(0);
        existingIdsRef.current.clear(); // Limpiar cache de IDs

        // Reset checkpoint before clearing
        await saveMetadata('syncInfo', {
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

        // Clear DB before restart
        await clearAllData().catch(err => {
            console.error('Failed to clear database:', err);
        });

        setTimeout(() => {
            isSyncingRef.current = false;
            setIsSyncing(false);
            startSmartSync(1);
        }, 1200);
    }, [startSmartSync]);

    const togglePause = () => {
        isPausedRef.current = !isPausedRef.current;
        setIsPaused(isPausedRef.current);
    };

    return {
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
    };
};

