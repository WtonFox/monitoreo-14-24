import React from 'react';
import { formatNumber } from '../utils/formatters';
import { toTitleCase } from '../utils/geoUtils';
import { X } from 'lucide-react';
import type { LocationStats } from '../hooks/useMapStats';

interface LocationInfoBoxProps {
    locationName: string;
    totalParticipants: number;
    stats: LocationStats;
    level: 'region' | 'province' | 'municipality';
    onClose: () => void;
}

export const LocationInfoBox: React.FC<LocationInfoBoxProps> = ({
    locationName,
    totalParticipants,
    stats,
    level,
    onClose,
}) => {
    const percentage = totalParticipants > 0
        ? ((stats.total / totalParticipants) * 100).toFixed(1)
        : '0.0';

    const isZero = stats.total === 0;

    const genderTotal = stats.genderBreakdown.M + stats.genderBreakdown.F + stats.genderBreakdown.other;
    const malePct = genderTotal > 0 ? ((stats.genderBreakdown.M / genderTotal) * 100).toFixed(1) : '0.0';
    const femalePct = genderTotal > 0 ? ((stats.genderBreakdown.F / genderTotal) * 100).toFixed(1) : '0.0';

    const sortedStatuses = Object.entries(stats.statusBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const topCenters = stats.topCenters.slice(0, 3);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-xl text-blue-600 leading-tight">
                    {toTitleCase(locationName)}
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Cerrar"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Level label */}
            <div className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
                {level === 'region' ? 'Región' : level === 'province' ? 'Provincia' : 'Municipio'}
            </div>

            {isZero ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                    Sin participantes
                </div>
            ) : (
                <div className="text-sm space-y-2">
                    {/* Total participants */}
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">Participantes:</span>
                        <span className="font-semibold text-gray-900">{formatNumber(stats.total)}</span>
                    </div>

                    {/* Percentage */}
                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-gray-600">% del total:</span>
                        <span className="font-semibold text-gray-900">{percentage}%</span>
                    </div>

                    {/* Age range */}
                    {stats.ageRanges.avg > 0 && (
                        <div className="py-1 border-b border-gray-100">
                            <div className="text-gray-600 mb-1">Rango de Edad:</div>
                            <div className="font-semibold text-sm text-gray-900">
                                {stats.ageRanges.min}-{stats.ageRanges.max} años
                                <span className="text-gray-500 ml-2">(promedio: {stats.ageRanges.avg})</span>
                            </div>
                        </div>
                    )}

                    {/* Gender breakdown */}
                    <div className="py-1 border-b border-gray-100">
                        <div className="text-gray-600 mb-1">Género:</div>
                        <div className="flex gap-3 text-xs">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                M: {formatNumber(stats.genderBreakdown.M)} ({malePct}%)
                            </span>
                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">
                                F: {formatNumber(stats.genderBreakdown.F)} ({femalePct}%)
                            </span>
                        </div>
                    </div>

                    {/* Top statuses */}
                    {sortedStatuses.length > 0 && (
                        <div className="py-1 border-b border-gray-100">
                            <div className="text-gray-600 mb-1">Estado:</div>
                            <div className="space-y-1">
                                {sortedStatuses.map(([status, count]) => (
                                    <div key={status} className="flex justify-between text-xs">
                                        <span className="text-gray-700">{status}</span>
                                        <span className="font-semibold text-gray-900">{formatNumber(count)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top centers */}
                    {topCenters.length > 0 && (
                        <div className="py-1">
                            <div className="text-gray-600 mb-1">Top Centros:</div>
                            <div className="space-y-1">
                                {topCenters.map((center, idx) => (
                                    <div key={idx} className="flex justify-between text-xs items-start">
                                        <span className="text-gray-700 flex-1 pr-2" title={center.name}>
                                            {center.name.length > 35 ? center.name.substring(0, 32) + '...' : center.name}
                                        </span>
                                        <span className="font-semibold text-gray-900 whitespace-nowrap">{formatNumber(center.count)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Close button */}
            <button
                onClick={onClose}
                className="w-full mt-4 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
                Cerrar
            </button>
        </div>
    );
};
