import React, { useState } from 'react';
import { AlertCircle, Loader, Pause, Play, RefreshCw, Database } from 'lucide-react';
import { CorruptedRecord } from '../hooks/useDashboardData';

interface SyncStatusProps {
    isSyncing: boolean;
    isPaused: boolean;
    syncStats: {
        loaded: number;
        errors: number;
        corrupted: number;
        progress: number;
    };
    corruptedItems: CorruptedRecord[];
    onPauseToggle: () => void;
    onManualRefresh: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
    isSyncing,
    isPaused,
    syncStats,
    corruptedItems,
    onPauseToggle,
    onManualRefresh
}) => {
    const [showErrors, setShowErrors] = useState(false);

    if (!isSyncing && syncStats.corrupted === 0 && syncStats.errors === 0) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 z-50 flex flex-col gap-3 min-w-[300px] animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${isSyncing ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {isSyncing ? <Loader className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {isSyncing ? 'Sincronizando...' : 'Sincronización Completada'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {syncStats.loaded.toLocaleString()} registros cargados
                            </p>
                        </div>
                    </div>
                </div>

                {/* Barra de progreso */}
                {isSyncing && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${syncStats.progress}%` }}
                        />
                    </div>
                )}

                {/* Estadísticas de Error */}
                {(syncStats.errors > 0 || syncStats.corrupted > 0) && (
                    <div className="flex items-center gap-2 text-xs">
                        {syncStats.errors > 0 && (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {syncStats.errors} errores de red
                            </span>
                        )}
                        {syncStats.corrupted > 0 && (
                            <button
                                onClick={() => setShowErrors(true)}
                                className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-orange-100 transition-colors"
                            >
                                <AlertCircle className="w-3 h-3" />
                                {syncStats.corrupted} registros corruptos
                            </button>
                        )}
                    </div>
                )}

                {/* Controles */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                        onClick={onPauseToggle}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    >
                        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {isPaused ? 'Reanudar' : 'Pausar'}
                    </button>
                    <button
                        onClick={onManualRefresh}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Modal de Errores */}
            {showErrors && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in scale-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                    Registros Corruptos Detectados
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Estos registros fueron omitidos debido a problemas de integridad.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowErrors(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                            {corruptedItems.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                            ID: {item.id}
                                        </span>
                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                            {item.reason}
                                        </span>
                                    </div>
                                    <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                                        {JSON.stringify(item.raw, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-white rounded-b-2xl">
                            <button
                                onClick={() => {
                                    const text = JSON.stringify(corruptedItems, null, 2);
                                    navigator.clipboard.writeText(text);
                                    alert('JSON copiado al portapapeles');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors"
                            >
                                Copiar Todo (JSON)
                            </button>
                            <button
                                onClick={() => setShowErrors(false)}
                                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
