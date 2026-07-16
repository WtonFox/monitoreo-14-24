import React from 'react';
import { formatNumber } from '../utils/formatters';
import { toTitleCase } from '../utils/geoUtils';
import { X, ChevronDown } from 'lucide-react';
import type { LocationStats } from '../hooks/useMapStats';

interface LocationInfoBoxProps {
    locationName: string;
    totalParticipants: number;
    stats: LocationStats;
    level: 'region' | 'province' | 'municipality';
    onClose: () => void;
    nationalPhoneRate?: number;
    nationalVulnerabilityRate?: number;
    nationalAvgAge?: number;
    nationalGenderRate?: { M: number; F: number; other: number };
    nationalEducationRate?: Record<string, number>;
    nationalStatusRate?: Record<string, number>;
}

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <details className="group py-1 border-b border-gray-100">
        <summary className="text-gray-600 mb-1 cursor-pointer list-none flex items-center justify-between">
            <span className="font-medium">{title}</span>
            <ChevronDown size={14} className="text-gray-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-1 space-y-1">
            {children}
        </div>
    </details>
);

export const LocationInfoBox: React.FC<LocationInfoBoxProps> = ({
    locationName,
    totalParticipants,
    stats,
    level,
    onClose,
    nationalPhoneRate,
    nationalVulnerabilityRate,
    nationalAvgAge,
    nationalGenderRate,
    nationalEducationRate,
    nationalStatusRate,
}) => {
    const percentage = totalParticipants > 0
        ? ((stats.total / totalParticipants) * 100).toFixed(1)
        : '0.0';

    const isZero = stats.total === 0;

    const genderTotal = stats.genderBreakdown.M + stats.genderBreakdown.F + stats.genderBreakdown.other;
    const natGenderTotal = nationalGenderRate ? nationalGenderRate.M + nationalGenderRate.F + nationalGenderRate.other : 0;
    const malePct = genderTotal > 0 ? ((stats.genderBreakdown.M / genderTotal) * 100).toFixed(1) : '0.0';
    const femalePct = genderTotal > 0 ? ((stats.genderBreakdown.F / genderTotal) * 100).toFixed(1) : '0.0';

    const sortedStatuses = Object.entries(stats.statusBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const topCenters = stats.topCenters.slice(0, 3);

    // Education
    const sortedEducation = Object.entries(stats.educationBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
    const educationTotal = stats.educationBreakdown
        ? Object.values(stats.educationBreakdown).reduce((s, v) => s + v, 0)
        : 0;

    // Phone rate
    const phoneRate = stats.total > 0 ? (stats.phoneCount / stats.total) * 100 : 0;
    const nationalPhonePct = nationalPhoneRate !== undefined ? (nationalPhoneRate * 100).toFixed(1) : null;
    const phoneComparison = nationalPhoneRate !== undefined
        ? (phoneRate - nationalPhoneRate * 100) > 0
            ? `${(phoneRate - nationalPhoneRate * 100).toFixed(1)}% más que el nacional`
            : `${(nationalPhoneRate * 100 - phoneRate).toFixed(1)}% menos que el nacional`
        : null;

    // Vulnerability rate
    const vulnerabilityRate = stats.total > 0 ? (stats.vulnerabilityCount / stats.total) * 100 : 0;
    const nationalVulnPct = nationalVulnerabilityRate !== undefined ? (nationalVulnerabilityRate * 100).toFixed(1) : null;

    // Year counts
    const sortedYears = Object.entries(stats.yearCounts)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 3);

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

                    {/* Edad — Promedio nacional */}
                    {nationalAvgAge !== undefined && stats.ageRanges.avg > 0 && (
                        <div className="py-1 border-b border-gray-100">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Promedio nacional:</span>
                                <span>{nationalAvgAge} años</span>
                            </div>
                            <div className="text-xs text-gray-500 italic">
                                {stats.ageRanges.avg > nationalAvgAge
                                    ? `${(stats.ageRanges.avg - nationalAvgAge).toFixed(1)} años más que el nacional`
                                    : stats.ageRanges.avg < nationalAvgAge
                                        ? `${(nationalAvgAge - stats.ageRanges.avg).toFixed(1)} años menos que el nacional`
                                        : 'Igual al promedio nacional'}
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

                    {/* Género — Promedio nacional */}
                    {nationalGenderRate && genderTotal > 0 && (
                        <div className="py-1 border-b border-gray-100">
                            <div className="text-gray-500 text-xs mb-1">Promedio nacional:</div>
                            <div className="flex gap-2 text-xs text-gray-500">
                                <span>M: {natGenderTotal > 0 ? ((nationalGenderRate.M / natGenderTotal) * 100).toFixed(1) : '0.0'}%</span>
                                <span>F: {natGenderTotal > 0 ? ((nationalGenderRate.F / natGenderTotal) * 100).toFixed(1) : '0.0'}%</span>
                            </div>
                        </div>
                    )}

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
                            {nationalStatusRate && Object.keys(nationalStatusRate).length > 0 && (
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Promedio nacional:</div>
                                    {sortedStatuses.map(([status]) => {
                                        const hasNational = status in nationalStatusRate;
                                        const natCount = hasNational ? nationalStatusRate[status] : null;
                                        const natTotal = Object.values(nationalStatusRate).reduce((s, v) => s + v, 0);
                                        const natPct = natCount !== null && natTotal > 0 ? ((natCount / natTotal) * 100).toFixed(1) : null;
                                        const localCount = stats.statusBreakdown[status] || 0;
                                        const localTotal = Object.values(stats.statusBreakdown).reduce((s, v) => s + v, 0);
                                        const localPct = localTotal > 0 ? ((localCount / localTotal) * 100).toFixed(1) : '0.0';
                                        return (
                                            <div key={status} className="flex justify-between text-xs text-gray-500">
                                                <span>{status}</span>
                                                <span>{localPct}% local — {natPct !== null ? `${natPct}% nacional` : 'N/A'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top centers */}
                    {topCenters.length > 0 && (
                        <div className="py-1 border-b border-gray-100">
                            <div className="text-gray-600 mb-1">Centros:</div>
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

                    {/* ── Collapsible extra sections ── */}

                    {/* Education */}
                    {sortedEducation.length > 0 && (
                        <CollapsibleSection title="Nivel Educativo">
                            {sortedEducation.map(([level, count]) => {
                                const pct = educationTotal > 0 ? ((count / educationTotal) * 100).toFixed(1) : '0.0';
                                return (
                                    <div key={level} className="flex justify-between text-xs">
                                        <span className="text-gray-700">{level}</span>
                                        <span className="font-semibold text-gray-900">{formatNumber(count)} ({pct}%)</span>
                                    </div>
                                );
                            })}
                            {nationalEducationRate && Object.keys(nationalEducationRate).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Promedio nacional:</div>
                                    {sortedEducation.map(([level]) => {
                                        const hasNational = level in nationalEducationRate;
                                        const natCount = hasNational ? nationalEducationRate[level] : null;
                                        const natTotal = Object.values(nationalEducationRate).reduce((s, v) => s + v, 0);
                                        const natPct = natCount !== null && natTotal > 0 ? ((natCount / natTotal) * 100).toFixed(1) : null;
                                        const localCount = stats.educationBreakdown[level] || 0;
                                        const localPct = educationTotal > 0 ? ((localCount / educationTotal) * 100).toFixed(1) : '0.0';
                                        return (
                                            <div key={level} className="flex justify-between text-xs text-gray-500">
                                                <span>{level}</span>
                                                <span>{localPct}% local — {natPct !== null ? `${natPct}% nacional` : 'N/A'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {/* Phone contactability */}
                    <CollapsibleSection title="Contactabilidad">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-700">Con teléfono:</span>
                            <span className="font-semibold text-gray-900">
                                {formatNumber(stats.phoneCount)} de {formatNumber(stats.total)} ({phoneRate.toFixed(1)}%)
                            </span>
                        </div>
                        {nationalPhonePct && (
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Promedio nacional:</span>
                                <span>{nationalPhonePct}%</span>
                            </div>
                        )}
                        {phoneComparison && (
                            <div className="text-xs text-gray-500 italic">
                                {phoneComparison}
                            </div>
                        )}
                    </CollapsibleSection>

                    {/* Vulnerability */}
                    <CollapsibleSection title="Vulnerabilidades">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-700">Con alguna reportada:</span>
                            <span className="font-semibold text-gray-900">
                                {formatNumber(stats.vulnerabilityCount)} de {formatNumber(stats.total)} ({vulnerabilityRate.toFixed(1)}%)
                            </span>
                        </div>
                        {nationalVulnPct && (
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Promedio nacional:</span>
                                <span>{nationalVulnPct}%</span>
                            </div>
                        )}
                    </CollapsibleSection>

                    {/* Year evolution */}
                    {sortedYears.length > 0 && (
                        <CollapsibleSection title="Registros por Año">
                            {sortedYears.map(([year, count]) => (
                                <div key={year} className="flex justify-between text-xs">
                                    <span className="text-gray-700">{year}</span>
                                    <span className="font-semibold text-gray-900">{formatNumber(count)}</span>
                                </div>
                            ))}
                        </CollapsibleSection>
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
