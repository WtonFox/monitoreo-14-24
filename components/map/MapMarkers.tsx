import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { normalizeLocationName, toTitleCase, PROVINCE_COORDINATES } from '../../utils/geoUtils';
import { PROVINCE_MUNICIPALITIES } from '../../constants';
import { Participant } from '../../types';

interface MapMarkersProps {
    mapData: Record<string, number>;
    locationStats: Record<string, any>;
    level: string;
    selectedProvince: string | null;
    showLabels: boolean;
    municipalityCentroids: Record<string, [number, number]>;
    data: Participant[];
    getColor: (count: number) => string;
    onHover: (name: string | null, position?: { x: number, y: number }) => void;
}

// Función auxiliar para formatear números
const formatNumber = (value: number) => value.toLocaleString('en-US');

export const MapMarkers: React.FC<MapMarkersProps> = ({
    mapData,
    locationStats,
    level,
    selectedProvince,
    showLabels,
    municipalityCentroids,
    data,
    getColor,
    onHover
}) => {

    const createCustomIcon = (name: string, count: number) => {
        const color = getColor(count);

        return L.divIcon({
            html: `
                <div style="
                    position: relative;
                    width: 32px;
                    height: 32px;
                ">
                    <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                              fill="${color}" 
                              stroke="#1f2937" 
                              stroke-width="1.5"/>
                        <circle cx="12" cy="9" r="3" fill="white"/>
                    </svg>
                    ${showLabels ? `<div style="
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%) translateY(-28px);
                        background: rgba(255, 255, 255, 0.95);
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 600;
                        color: #1f2937;
                        white-space: nowrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                        border: 1px solid ${color};
                    ">${name.length > 12 ? name.substring(0, 10) + '...' : name}</div>` : ''}
                </div>
            `,
            className: 'custom-province-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    };

    return (
        <>
            {Object.entries(mapData).map(([name, count]) => {
                let coords: [number, number] | undefined;

                if (level === 'province') {
                    coords = PROVINCE_COORDINATES[name];
                } else if (level === 'municipality') {
                    coords = municipalityCentroids[name];
                }

                const stats = locationStats[name];
                const participantCount = count as number;

                if (!coords || participantCount === 0) return null;

                // Filtrado para modo municipio con provincia seleccionada
                if (level === 'municipality' && selectedProvince) {
                    const provinceMunicipalities = PROVINCE_MUNICIPALITIES[selectedProvince] || [];
                    const normalizedName = normalizeLocationName(name);
                    const belongs = provinceMunicipalities.some(m => {
                        const normalizedM = normalizeLocationName(m);
                        return normalizedM === normalizedName ||
                            normalizedName.includes(normalizedM) ||
                            normalizedM.includes(normalizedName);
                    });

                    // Si hay filtro estricto por ID en el futuro usarlo, por ahora nombre
                    if (!belongs) return null;
                }

                const percentage = data.length > 0 ? ((participantCount / data.length) * 100).toFixed(1) : '0.0';

                return (
                    <Marker
                        key={name}
                        position={coords}
                        icon={createCustomIcon(name, participantCount)}
                        eventHandlers={{
                            mouseover: (e) => onHover(name, e.containerPoint),
                            mouseout: () => onHover(null),
                            click: (e) => onHover(name, e.containerPoint), // Support click for mobile
                        }}
                    >
                        {showLabels && stats && (
                            <Popup>
                                <div style={{ minWidth: '220px', maxWidth: '280px' }}>
                                    <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px', borderBottom: '2px solid #3b82f6', paddingBottom: '4px' }}>
                                        {toTitleCase(name)}
                                    </strong>
                                    <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                                        <div style={{ marginBottom: '6px', background: '#eff6ff', padding: '4px 6px', borderRadius: '4px' }}>
                                            <strong>Total:</strong> {formatNumber(participantCount)} <span style={{ color: '#3b82f6' }}>({percentage}% del total)</span>
                                        </div>
                                        <div style={{ marginBottom: '6px' }}>
                                            <strong>Género:</strong><br />
                                            <span style={{ marginLeft: '8px' }}>• M: {formatNumber(stats.genderBreakdown.M)} ({participantCount > 0 ? ((stats.genderBreakdown.M / participantCount) * 100).toFixed(1) : '0'}%)</span><br />
                                            <span style={{ marginLeft: '8px' }}>• F: {formatNumber(stats.genderBreakdown.F)} ({participantCount > 0 ? ((stats.genderBreakdown.F / participantCount) * 100).toFixed(1) : '0'}%)</span>
                                        </div>
                                        {stats.ageRanges.avg > 0 && (
                                            <div style={{ marginBottom: '6px' }}>
                                                <strong>Edad:</strong> {stats.ageRanges.min}-{stats.ageRanges.max} años <span style={{ color: '#3b82f6' }}>(promedio: {stats.ageRanges.avg})</span>
                                            </div>
                                        )}
                                        {Object.keys(stats.statusBreakdown).length > 0 && (
                                            <div style={{ marginBottom: '6px' }}>
                                                <strong>Estados principales:</strong><br />
                                                {Object.entries(stats.statusBreakdown)
                                                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                                                    .slice(0, 3)
                                                    .map(([status, cnt]) => (
                                                        <span key={status} style={{ marginLeft: '8px', display: 'block' }}>• {status}: {formatNumber(cnt as number)}</span>
                                                    ))
                                                }
                                            </div>
                                        )}
                                        {stats.topCenters.length > 0 && (
                                            <div>
                                                <strong>Top Centros:</strong><br />
                                                {stats.topCenters.slice(0, 2).map((c, idx) => (
                                                    <span key={idx} style={{ marginLeft: '8px', fontSize: '11px', display: 'block' }}>
                                                        • {c.name.length > 30 ? c.name.substring(0, 28) + '...' : c.name} ({formatNumber(c.count)})
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                );
            })}
        </>
    );
};
