import React, { useMemo } from 'react';
import {
    Activity,
    Database,
    AlertTriangle,
    CheckCircle2,
    Server,
    ShieldAlert,
    Copy,
    FileWarning,
    Info,
    WifiOff
} from 'lucide-react';
import { CorruptedRecord, SyncStats } from '../hooks/useDashboardData';
import { formatNumber } from '../utils/formatters';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';

interface SystemStatusSectionProps {
    syncStats: SyncStats;
    totalRecordsInApi: number;
    corruptedItems: CorruptedRecord[];
    isSyncing: boolean;
}

export const SystemStatusSection: React.FC<SystemStatusSectionProps> = ({
    syncStats,
    totalRecordsInApi,
    corruptedItems,
    isSyncing
}) => {

    // Calcular métricas de discrepancia
    const discrepancyData = useMemo(() => {
        // Calculamos los que faltan para llegar al total reportado
        // Si el usuario considera que la diferencia SON los duplicados, mostramos esa diferencia total.
        const totalValidAndCorrupted = syncStats.loaded + syncStats.corrupted;
        const totalDifference = Math.max(0, totalRecordsInApi - totalValidAndCorrupted);

        return [
            { name: 'Total Detectado', value: totalRecordsInApi, color: '#f3f4f6' }, // Light Gray Backing
            { name: 'Cargados', value: syncStats.loaded, color: '#22c55e' }, // Green
            { name: 'Corruptos', value: syncStats.corrupted, color: '#f97316' }, // Orange
            // Unificamos Duplicados Detectados y Diferencia (No Cargados) en una sola barra si ya no está sincronizando
            {
                name: isSyncing ? 'Pendientes de Carga' : 'No Cargados / Duplicados',
                value: totalDifference,
                color: isSyncing ? '#9ca3af' : '#3b82f6' // Gris cargando, Azul si terminó (considerado duplicado)
            }
        ];
    }, [syncStats, totalRecordsInApi, isSyncing]);

    const healthScore = totalRecordsInApi > 0 ? Math.round((syncStats.loaded / totalRecordsInApi) * 100) : 100;
    const totalDifference = Math.max(0, totalRecordsInApi - (syncStats.loaded + syncStats.corrupted));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Diagnóstico del Sistema
                    </h2>
                    <p className="text-gray-500">Análisis detallado de integridad de datos y conexión</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${healthScore > 98 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                    <span className="text-sm font-bold">Salud de Datos: {healthScore}%</span>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total en API</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(totalRecordsInApi)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Server size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cargados (Válidos)</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{formatNumber(syncStats.loaded)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <Database size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">No Cargados / Duplicados</p>
                            <h3 className="text-2xl font-bold text-blue-600 mt-1">
                                {formatNumber(totalDifference)}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {isSyncing ? 'Pendientes...' : `(Revalidados: ${formatNumber(syncStats.duplicated || 0)})`}
                            </p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Copy size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-orange-600">Corruptos / Inválidos</p>
                            <h3 className="text-2xl font-bold text-orange-600 mt-1">{formatNumber(syncStats.corrupted)}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <ShieldAlert size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Discrepancy Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Info size={18} />
                        Distribución de Registros
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={discrepancyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => formatNumber(Number(value))} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {discrepancyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                    <LabelList dataKey="value" position="right" formatter={(val: unknown) => formatNumber(Number(val))} style={{ fontSize: '11px', fontWeight: 'bold', fill: '#666' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                        <h4 className="font-bold mb-1">¿Por qué difieren los números?</h4>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><b>{formatNumber(totalDifference)} registros</b> no fueron cargados porque sus IDs ya existían (Duplicados) o no fueron devueltos por la API (Omitidos).</li>
                            <li>Registros con estructura JSON inválida son marcados como <b>Corruptos</b>.</li>
                            <li>La suma de Cargados + Corruptos + No Cargados es igual al Total en API.</li>
                        </ul>
                    </div>
                </div>

                {/* Error Log Viewer */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileWarning size={18} />
                            Registro de Errores ({corruptedItems.length + syncStats.errors})
                        </h3>
                        {corruptedItems.length > 0 && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(corruptedItems, null, 2));
                                    alert('JSON copiado');
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                            >
                                Copiar JSON
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg scrollbar-thin scrollbar-thumb-gray-300">
                        {corruptedItems.length === 0 && syncStats.errors === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <CheckCircle2 size={48} className="text-green-500 mb-2 opacity-50" />
                                <p>No se han detectado errores</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-gray-500 w-20">ID</th>
                                        <th className="px-4 py-2 font-medium text-gray-500">Razón</th>
                                        <th className="px-4 py-2 font-medium text-gray-500">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* Renderizar Errores de Red */}
                                    {Array.from({ length: syncStats.errors }).map((_, idx) => (
                                        <tr key={`net-err-${idx}`} className="bg-red-50 hover:bg-red-100">
                                            <td className="px-4 py-3 font-mono text-xs text-red-600">-</td>
                                            <td className="px-4 py-3 text-red-600 font-medium flex items-center gap-2">
                                                <WifiOff size={14} /> Error de Red
                                            </td>
                                            <td className="px-4 py-3 text-xs text-red-500 font-mono">
                                                Fallo al descargar lote de datos. El sistema reintentará automáticamente.
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Renderizar Corruptos */}
                                    {corruptedItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.id}</td>
                                            <td className="px-4 py-3 text-orange-600 font-medium">{item.reason}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                                                {JSON.stringify(item.raw).slice(0, 50)}...
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
