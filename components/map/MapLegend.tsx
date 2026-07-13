import React from 'react';

// Función auxiliar para formatear números
const formatNumber = (value: number) => value.toLocaleString('en-US');

interface MapLegendProps {
    maxCount: number;
    onInfoClick: () => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({ maxCount, onInfoClick }) => {
    return (
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000] text-xs">
            <div className="flex items-center justify-between mb-2">
                <div className="font-bold">Densidad de Datos</div>
                <button
                    onClick={onInfoClick}
                    className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Información sobre la densidad de datos"
                >
                    <span className="text-xs font-bold">!</span>
                </button>
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#1e40af' }}></div>
                    <span>Mayor: &gt; 80% ({formatNumber(Math.round(maxCount * 0.8))}+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                    <span>Alta: 60-80%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
                    <span>Media: 40-60%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#93c5fd' }}></div>
                    <span>Baja: 20-40%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#dbeafe' }}></div>
                    <span>Menor: &lt; 20%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-4 rounded" style={{ backgroundColor: '#e5e7eb' }}></div>
                    <span>Sin datos seleccionados</span>
                </div>
            </div>
        </div>
    );
};
