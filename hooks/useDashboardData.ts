import { useState, useCallback, useRef, useEffect } from 'react';
import { Participant } from '../types';
import { fetchParticipants, clearApiCache } from '../services/api';
import { sanitizeParticipant } from '../utils/dataUtils';
import {
    getAllParticipants,
    saveParticipants,
    clearAllData,
    saveMetadata,
    getMetadata
} from '../services/database';

interface SyncStats {
    loaded: number;
    errors: number;
    corrupted: number;
    duplicated: number;
    progress: number;
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
    const [syncStats, setSyncStats] = useState<SyncStats>({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0 });
    const [corruptedItems, setCorruptedItems] = useState<CorruptedRecord[]>([]);

    // Estados de error
    const [criticalConnectionError, setCriticalConnectionError] = useState<boolean>(false);
    const [connectionErrorMessage, setConnectionErrorMessage] = useState<string>('');
    const [customToken, setCustomToken] = useState<string>('');
    const [showTokenInput, setShowTokenInput] = useState<boolean>(false);

    const stopSyncRef = useRef<boolean>(false);
    const isSyncingRef = useRef<boolean>(false);
    const existingIdsRef = useRef<Set<number>>(new Set());
    const statsRef = useRef<SyncStats>({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0 });

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

                    const restoredStats = {
                        loaded: storedData.length,
                        errors: 0,
                        corrupted: meta?.corrupted || 0,
                        duplicated: meta?.duplicated || 0,
                        progress: 100
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
                }
            } else {
                const alreadyLoadedCount = dashboardData.length;
                currentPage = Math.floor(alreadyLoadedCount / BATCH_SIZE) + 1;

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
                while (isPaused) {
                    await new Promise(r => setTimeout(r, 500));
                    if (stopSyncRef.current) break;
                }

                try {
                    const result = await fetchParticipants(currentPage, BATCH_SIZE, 0, customToken || undefined);

                    // Actualizar total dinámicamente
                    if (result.totalItems && result.totalItems > totalRecordsInApi) {
                        setTotalRecordsInApi(result.totalItems);
                    }

                    const items = result.items;

                    if (!items || !Array.isArray(items) || items.length === 0) {
                        hasMoreData = false;
                        break;
                    }

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
                        saveParticipants(cleanBatch).catch(err =>
                            console.error('Failed to save batch to IndexedDB:', err)
                        );

                        // Guardar progreso en metadata
                        saveMetadata('syncInfo', {
                            lastSync: Date.now(),
                            totalRecords: result.totalItems || totalRecordsInApi,
                            duplicated: statsRef.current.duplicated,
                            corrupted: statsRef.current.corrupted
                        }).catch(console.error);
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

                    // Persistir metadata actualizada
                    if (cleanBatch.length > 0) {
                        saveMetadata('syncInfo', {
                            lastSync: Date.now(),
                            totalRecords: result.totalItems || totalRecordsInApi,
                            duplicated: statsRef.current.duplicated,
                            corrupted: statsRef.current.corrupted
                        }).catch(console.error);
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

                    if (hasMoreData) {
                        currentPage++;
                    }

                } catch (err) {
                    console.warn(`Error en lote ${currentPage}:`, err);
                    setSyncStats(prev => ({ ...prev, errors: prev.errors + 1 }));
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
    }, [isPaused, dashboardData.length, totalRecordsInApi, customToken]);

    const pollForNewData = useCallback(async () => {
        if (isSyncingRef.current) return;

        try {
            const probe = await fetchParticipants(1, 1, 0, customToken || undefined);
            const apiTotal = probe.totalItems;

            if (apiTotal > totalRecordsInApi) {
                console.log(`[AutoSync] New records detected: ${apiTotal} vs ${totalRecordsInApi}. Resuming sync...`);
                await startSmartSync();
            }
        } catch (err) {
            console.warn('[AutoSync] Poll failed:', err);
        }
    }, [customToken, totalRecordsInApi, startSmartSync]);

    const handleManualRefresh = useCallback(() => {
        clearApiCache();
        stopSyncRef.current = true;

        setDashboardData([]);
        setCorruptedItems([]);
        setSyncStats({ loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0 });
        statsRef.current = { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0 };
        setCriticalConnectionError(false);
        setConnectionErrorMessage('');
        setTotalRecordsInApi(0);
        existingIdsRef.current.clear(); // Limpiar cache de IDs

        // Limpiar BD
        clearAllData().catch(console.error);

        setTimeout(() => {
            isSyncingRef.current = false;
            setIsSyncing(false);
            startSmartSync(1);
        }, 1200);
    }, [startSmartSync]);

    const togglePause = () => {
        setIsPaused(!isPaused);
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

