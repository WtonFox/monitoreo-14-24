import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { normalizeProvinceName, normalizeLocationName, PROVINCE_IDS } from '../../utils/geoUtils';

interface MapBoundsControllerProps {
    geoData: GeoJsonObject | null;
    province: string | null;
    municipality: string | null;
    currentLevel: string;
}

export const MapBoundsController: React.FC<MapBoundsControllerProps> = ({
    geoData,
    province,
    municipality,
    currentLevel
}) => {
    const map = useMap();

    useEffect(() => {
        // Si no hay GeoJSON o no hay selección, mostrar toda RD
        if (!geoData || (!province && !municipality)) {
            map.setView([18.735693, -70.162651], 8);
            return;
        }

        const features = (geoData as any).features;
        if (!features || features.length === 0) return;

        // Determinar qué buscar
        const searchTerm = municipality || province;
        if (!searchTerm) return;

        // Buscar el feature que coincide
        const matchingFeature = features.find((f: any) => {
            const rawFeatureName = f?.properties?.TOPO2 || f?.properties?.TOPONIMIA || f?.properties?.NAME_1 || f?.properties?.name || '';

            if (currentLevel === 'municipality' && municipality) {
                const normalizedFeatureName = normalizeLocationName(rawFeatureName);
                return normalizedFeatureName === normalizeLocationName(municipality) ||
                    normalizedFeatureName.includes(normalizeLocationName(municipality));
            }

            if (currentLevel === 'province' && province) {
                // Intentar coincidencia por ID primero
                if (f?.properties?.PROV && PROVINCE_IDS[province] && f.properties.PROV === PROVINCE_IDS[province]) {
                    return true;
                }
                // Fallback a nombre
                const normalizedFeatureName = normalizeProvinceName(rawFeatureName);
                return normalizedFeatureName.toLowerCase() === province.toLowerCase() ||
                    normalizeProvinceName(normalizedFeatureName).toLowerCase() === province.toLowerCase();
            }

            return false;
        });

        if (matchingFeature) {
            try {
                const bounds = L.geoJSON(matchingFeature).getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
                }
            } catch (e) {
                console.error('Error fitting bounds:', e);
            }
        } else if (province && currentLevel === 'municipality') {
            // Si estamos en nivel municipio pero no encontramos el municipio específico (o solo hay provincia),
            // buscar todos los municipios de esa provincia y hacer zoom al grupo
            const targetProvId = province ? PROVINCE_IDS[province] : null;

            if (targetProvId) {
                const provinceFeatures = features.filter((f: any) => f?.properties?.PROV === targetProvId);

                if (provinceFeatures.length > 0) {
                    try {
                        const group = L.featureGroup(provinceFeatures.map((f: any) => L.geoJSON(f)));
                        const bounds = group.getBounds();
                        if (bounds.isValid()) {
                            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
                        }
                    } catch (e) {
                        console.error('Error fitting bounds to province group:', e);
                    }
                } else {
                    // Fallback si no hay IDs
                    map.setView([18.735693, -70.162651], 9);
                }
            } else {
                // Zoom intermedio genérico
                map.setView([18.735693, -70.162651], 9);
            }
        }
    }, [geoData, province, municipality, currentLevel, map]);

    return null;
};
