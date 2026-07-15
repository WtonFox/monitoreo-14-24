import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';
import { Participant } from '../types';
import { REGION_PROVINCES, PROVINCE_MUNICIPALITIES } from '../constants';
import { useGeoJSON } from '../hooks/useGeoJSON';
import { useMapStats, type LocationStats } from '../hooks/useMapStats';
import {
    normalizeProvinceName,
    normalizeLocationName,
    toTitleCase,
    PROVINCE_IDS
} from '../utils/geoUtils';
import L from 'leaflet';

// Sub-components
import { MapBoundsController } from './map/MapBoundsController';
import { MapLegend } from './map/MapLegend';
import { MapInfoModal } from './map/MapInfoModal';
import { MapMarkers } from './map/MapMarkers';

interface DominicanRepublicMapProps {
    data: Participant[];
    showLabels: boolean;
    viewMode: 'pin' | 'polygon';
    level?: 'region' | 'province' | 'municipality';
    selectedProvince?: string | null;
    selectedMunicipality?: string | null;
    // NEW optional props — when provided, skip internal useMapStats
    mapData?: Record<string, number>;
    locationStats?: Record<string, LocationStats>;
    getColor?: (count: number, useLocalScale?: boolean) => string;
    maxCount?: number;
    // NEW optional callback
    onLocationSelect?: (locationName: string | null) => void;
}

// Función auxiliar para formatear números
const formatNumber = (value: number) => value.toLocaleString('en-US');

export const DominicanRepublicMap: React.FC<DominicanRepublicMapProps> = ({
    data,
    showLabels,
    viewMode,
    level = 'province',
    selectedProvince = null,
    selectedMunicipality = null,
    // NEW optional props
    mapData: externalMapData,
    locationStats: externalLocationStats,
    getColor: externalGetColor,
    maxCount: externalMaxCount,
    onLocationSelect,
}) => {
    // State
    const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);
    const [municipalityCentroids, setMunicipalityCentroids] = useState<Record<string, [number, number]>>({});
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Hooks
    const { geoJSON, isLoading } = useGeoJSON(level as 'region' | 'province' | 'municipality', viewMode);

    const internalStats = useMapStats(data, level as 'region' | 'province' | 'municipality', selectedProvince);

    // Use external props when provided (optional override), fallback to internal stats
    const mapData = externalMapData ?? internalStats.mapData;
    const locationStats = externalLocationStats ?? internalStats.locationStats;
    const getColor = externalGetColor ?? internalStats.getColor;
    const maxCount = externalMaxCount ?? internalStats.maxCount;

    // Calcular centroides cuando cargue el GeoJSON de municipios
    // TODO: Esto podría moverse a otro hook o dentro de useGeoJSON si se generaliza
    useEffect(() => {
        if (level === 'municipality' && geoJSON) {
            const centroids: Record<string, [number, number]> = {};
            const features = (geoJSON as any).features || [];

            features.forEach((f: any) => {
                const rawName = f?.properties?.TOPO2 || f?.properties?.TOPONIMIA || f?.properties?.NAME_1 || f?.properties?.name || '';
                const name = normalizeLocationName(rawName);

                try {
                    const layer = L.geoJSON(f);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        const center = bounds.getCenter();
                        centroids[name] = [center.lat, center.lng];
                    }
                } catch (e) {
                    console.error('Error calculating centroid for:', name, e);
                }
            });
            setMunicipalityCentroids(centroids);
        }
    }, [geoJSON, level]);

    // Estilo para polígonos (modo polygon)
    const polygonStyle = (feature: any): PathOptions => {
        const rawName = feature?.properties?.REG_ID || feature?.properties?.TOPONIMIA || feature?.properties?.NAME_1 || feature?.properties?.name || feature?.id || '';

        let normalizedName = rawName;
        // Use normalize helper only for provinces or if needed
        if (level === 'province') {
            normalizedName = normalizeProvinceName(rawName);
        } else if (level === 'region') {
            // Normalización específica para regiones del GeoJSON
            let cleanName = rawName.replace(/^REGION\s+/i, '');
            cleanName = toTitleCase(cleanName);
            const regionKeys = Object.keys(REGION_PROVINCES);
            const match = regionKeys.find(k => k.toLowerCase() === cleanName.toLowerCase());
            normalizedName = match || cleanName;
        } else if (level === 'municipality') {
            normalizedName = normalizeLocationName(rawName);
        } else {
            normalizedName = rawName.trim();
        }

        const count = mapData[normalizedName] || 0;
        const isHovered = normalizedName === hoveredLocation;

        // LÓGICA DE FILTRADO Y SELECCIÓN
        const hasActiveFilter = Boolean(selectedProvince || selectedMunicipality);
        let isSelectedPolygon = false;
        let belongsToSelectedProvince = false;

        if (hasActiveFilter) {
            if (level === 'municipality') {
                if (selectedProvince) {
                    const provinceMunicipalities = PROVINCE_MUNICIPALITIES[selectedProvince] || [];
                    // Filtrado estricto por ID de provincia si está disponible
                    const featureProvId = feature?.properties?.PROV;
                    const selectedProvId = PROVINCE_IDS[selectedProvince];

                    if (featureProvId && selectedProvId) {
                        belongsToSelectedProvince = featureProvId === selectedProvId;
                    } else {
                        belongsToSelectedProvince = provinceMunicipalities.some(m => {
                            const normalizedM = normalizeLocationName(m);
                            return normalizedM === normalizedName ||
                                normalizedName.includes(normalizedM) ||
                                normalizedM.includes(normalizedName);
                        });
                    }
                }

                if (selectedMunicipality) {
                    isSelectedPolygon = normalizedName.toLowerCase() === selectedMunicipality.toLowerCase();
                } else if (selectedProvince && belongsToSelectedProvince) {
                    isSelectedPolygon = true;
                }
            } else if (level === 'province' && selectedProvince) {
                isSelectedPolygon = normalizedName.toLowerCase() === selectedProvince.toLowerCase() ||
                    normalizeProvinceName(normalizedName).toLowerCase() === selectedProvince.toLowerCase();
            }
        }

        if (level === 'municipality' && selectedProvince && !belongsToSelectedProvince) {
            return { fillColor: 'transparent', weight: 0, opacity: 0, color: 'transparent', fillOpacity: 0 };
        }

        if (level === 'province' && hasActiveFilter && !isSelectedPolygon) {
            return { fillColor: '#e5e7eb', weight: 0.5, opacity: 0.5, color: '#9ca3af', fillOpacity: 0.3 };
        }

        return {
            fillColor: getColor(count, level === 'municipality' && Boolean(selectedProvince)),
            weight: isHovered || isSelectedPolygon ? 3 : 1,
            opacity: 1,
            color: isHovered || isSelectedPolygon ? '#1d4ed8' : '#ffffff',
            fillOpacity: isSelectedPolygon ? 0.85 : 0.7
        };
    };

    // Eventos para polígonos (modo polygon)
    const onEachFeature = (feature: any, layer: any) => {
        const rawName = feature?.properties?.TOPO2 || feature?.properties?.TOPONIMIA || feature?.properties?.NAME_1 || feature?.properties?.name || '';

        // Normalize name based on level
        let locationName = rawName;
        if (level === 'province') {
            locationName = normalizeProvinceName(rawName);
        } else if (level === 'region') {
            let cleanName = rawName.replace(/^REGION\s+/i, '');
            cleanName = toTitleCase(cleanName);
            const regionKeys = Object.keys(REGION_PROVINCES);
            const match = regionKeys.find(k => k.toLowerCase() === cleanName.toLowerCase());
            locationName = match || cleanName;
        } else if (level === 'municipality') {
            locationName = normalizeLocationName(rawName);
        } else {
            locationName = rawName.trim();
        }

        layer.on({
            mouseover: (e: any) => {
                setHoveredLocation(locationName);
                if (e.containerPoint) setTooltipPosition(e.containerPoint);
            },
            mousemove: (e: any) => {
                if (e.containerPoint) setTooltipPosition(e.containerPoint);
            },
            mouseout: () => {
                setHoveredLocation(null);
                setTooltipPosition(null);
            },
            click: () => {
                if (onLocationSelect) {
                    onLocationSelect(locationName);
                }
            },
        });
    };

    // Componente para manejar efectos del mapa (Resize)
    const MapEffect = ({ level, viewMode }: { level: 'region' | 'province' | 'municipality', viewMode: 'pin' | 'polygon' }) => {
        const map = useMap();
        useEffect(() => { map.invalidateSize(); }, [level, viewMode, map]);
        return null;
    };

    return (
        <div className="relative w-full h-full" style={{ zIndex: 1 }}>
            <MapContainer
                key={viewMode}
                center={[18.735693, -70.162651]}
                zoom={8}
                style={{ height: '100%', width: '100%', minHeight: '400px', zIndex: 1 }}
                scrollWheelZoom={true}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEffect level={level as 'region' | 'province' | 'municipality'} viewMode={viewMode} />

                <MapBoundsController
                    geoData={geoJSON}
                    province={selectedProvince}
                    municipality={selectedMunicipality}
                    currentLevel={level}
                />

                {viewMode === 'pin' && (
                    <MapMarkers
                        mapData={mapData}
                        locationStats={locationStats}
                        level={level}
                        selectedProvince={selectedProvince}
                        showLabels={showLabels}
                        municipalityCentroids={municipalityCentroids}
                        data={data}
                        getColor={getColor}
                        onHover={(name, position) => {
                            setHoveredLocation(name);
                            if (position) setTooltipPosition(position);
                            else if (!name) setTooltipPosition(null);
                        }}
                    />
                )}

                {viewMode === 'polygon' && geoJSON && (
                    <GeoJSON
                        key={`${level}-${viewMode}-${selectedProvince || ''}-${selectedMunicipality || ''}`}
                        data={geoJSON}
                        style={polygonStyle}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>

            <MapLegend
                maxCount={maxCount}
                onInfoClick={() => setShowInfoModal(true)}
            />

            {showInfoModal && (
                <MapInfoModal onClose={() => setShowInfoModal(false)} />
            )}

            {/* Tooltip personalizado (hover) */}
            {hoveredLocation && locationStats[hoveredLocation] && (tooltipPosition || window.innerWidth < 768) && (
                <div
                    className="fixed bottom-0 left-0 right-0 w-full p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[1000] md:absolute md:w-auto md:min-w-[280px] md:max-w-sm md:rounded-lg md:border md:shadow-2xl md:bottom-auto md:left-auto md:right-auto pointer-events-auto"
                    style={
                        window.innerWidth >= 768 && tooltipPosition ? {
                            top: Math.min(tooltipPosition.y + 20, window.innerHeight - 300),
                            left: tooltipPosition.x > window.innerWidth / 2 ? 'auto' : tooltipPosition.x + 20,
                            right: tooltipPosition.x > window.innerWidth / 2 ? window.innerWidth - tooltipPosition.x + 20 : 'auto',
                        } : {}
                    }
                >
                    <div className="font-bold text-xl mb-2 text-blue-600">{toTitleCase(hoveredLocation)}</div>

                    <div className="text-sm space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">Participantes:</span>
                            <span className="font-semibold text-gray-900">{formatNumber(mapData[hoveredLocation] || 0)}</span>
                        </div>
                    </div>

                    <div className="text-sm space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                            <span className="text-gray-600">% del total:</span>
                            <span className="font-semibold text-gray-900">
                                {data.length > 0 ? ((mapData[hoveredLocation] || 0) / data.length * 100).toFixed(1) : 0}%
                            </span>
                        </div>

                        {level === 'region' && REGION_PROVINCES[hoveredLocation] && (
                            <div className="py-1 border-b border-gray-100">
                                <div className="text-gray-600 mb-1 font-semibold">Provincias de la Región:</div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {REGION_PROVINCES[hoveredLocation].map(prov => {
                                        const provCount = data.filter(p => normalizeProvinceName(p.provincia || '') === normalizeProvinceName(prov)).length;
                                        return (
                                            <div key={prov} className="flex justify-between text-xs">
                                                <span className="text-gray-700">{prov}</span>
                                                <span className="font-medium text-gray-900">{provCount}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {locationStats[hoveredLocation].ageRanges.avg > 0 && (
                            <div className="py-1 border-b border-gray-100">
                                <div className="text-gray-600 mb-1">Rango de Edad:</div>
                                <div className="font-semibold text-sm text-gray-900">
                                    {locationStats[hoveredLocation].ageRanges.min}-{locationStats[hoveredLocation].ageRanges.max} años
                                    <span className="text-gray-500 ml-2">(promedio: {locationStats[hoveredLocation].ageRanges.avg})</span>
                                </div>
                            </div>
                        )}

                        <div className="py-1 border-b border-gray-100">
                            <div className="text-gray-600 mb-1">Género:</div>
                            <div className="flex gap-3 text-xs">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    M: {formatNumber(locationStats[hoveredLocation].genderBreakdown.M)} ({data.length > 0 && mapData[hoveredLocation] ? ((locationStats[hoveredLocation].genderBreakdown.M / mapData[hoveredLocation]) * 100).toFixed(1) : 0}%)
                                </span>
                                <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">
                                    F: {formatNumber(locationStats[hoveredLocation].genderBreakdown.F)} ({data.length > 0 && mapData[hoveredLocation] ? ((locationStats[hoveredLocation].genderBreakdown.F / mapData[hoveredLocation]) * 100).toFixed(1) : 0}%)
                                </span>
                            </div>
                        </div>

                        {Object.keys(locationStats[hoveredLocation].statusBreakdown).length > 0 && (
                            <div className="py-1 border-b border-gray-100">
                                <div className="text-gray-600 mb-1">Estado:</div>
                                <div className="space-y-1">
                                    {Object.entries(locationStats[hoveredLocation].statusBreakdown)
                                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                                        .slice(0, 3)
                                        .map(([status, count]) => (
                                            <div key={status} className="flex justify-between text-xs">
                                                <span className="text-gray-700">{status}</span>
                                                <span className="font-semibold text-gray-900">{formatNumber(count as number)}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                        {locationStats[hoveredLocation].topCenters.length > 0 && (
                            <div className="py-1">
                                <div className="text-gray-600 mb-1">Top Centros:</div>
                                <div className="space-y-1">
                                    {locationStats[hoveredLocation].topCenters.map((center, idx) => (
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
                </div>
            )}
        </div>
    );
};
