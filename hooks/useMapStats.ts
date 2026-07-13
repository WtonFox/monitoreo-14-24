import { useMemo } from 'react';
import { Participant } from '../types';
import { REGION_PROVINCES, PROVINCE_MUNICIPALITIES } from '../constants';
import {
    normalizeProvinceName,
    normalizeLocationName,
    findRegion
} from '../utils/geoUtils';

export const useMapStats = (
    data: Participant[],
    level: 'region' | 'province' | 'municipality',
    selectedProvince: string | null
) => {

    // Calcular datos agregados (por provincia o municipio o región)
    const mapData = useMemo(() => {
        const counts: Record<string, number> = {};
        if (!data || !Array.isArray(data)) return counts;

        data.forEach(p => {
            if (!p) return;
            let key = 'Desconocido';

            if (level === 'province') {
                key = p.provincia || 'Desconocido';
            } else if (level === 'municipality') {
                key = normalizeLocationName(p.municipio || 'Desconocido');
            } else if (level === 'region') {
                key = findRegion(p.provincia || '');
            }

            // Normalizar la clave si es provincia para asegurar coincidencia
            if (level === 'province') {
                key = normalizeProvinceName(key);
            }

            if (key !== 'Desconocido') {
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }, [data, level]);

    // Calcular estadísticas detalladas
    const locationStats = useMemo(() => {
        const stats: Record<string, {
            total: number;
            genderBreakdown: { M: number; F: number; other: number };
            statusBreakdown: Record<string, number>;
            ageRanges: { min: number; max: number; avg: number };
            topCenters: { name: string; count: number }[];
        }> = {};

        data.forEach(p => {
            let key = 'Desconocido';
            if (level === 'province') {
                key = normalizeProvinceName(p.provincia || 'Desconocido');
            } else if (level === 'municipality') {
                key = normalizeLocationName(p.municipio || 'Desconocido');
            } else if (level === 'region') {
                key = findRegion(p.provincia || '');
            }

            if (!stats[key]) {
                stats[key] = {
                    total: 0,
                    genderBreakdown: { M: 0, F: 0, other: 0 },
                    statusBreakdown: {},
                    ageRanges: { min: Infinity, max: 0, avg: 0 },
                    topCenters: []
                };
            }

            stats[key].total++;

            // Gender
            const sex = p.sexo?.toUpperCase();
            if (sex === 'M') stats[key].genderBreakdown.M++;
            else if (sex === 'F') stats[key].genderBreakdown.F++;
            else stats[key].genderBreakdown.other++;

            // Status
            const status = p.estado || 'Sin estado';
            stats[key].statusBreakdown[status] = (stats[key].statusBreakdown[status] || 0) + 1;

            // Age
            if (p.edad) {
                stats[key].ageRanges.min = Math.min(stats[key].ageRanges.min, p.edad);
                stats[key].ageRanges.max = Math.max(stats[key].ageRanges.max, p.edad);
            }
        });

        // Calculate averages and top centers
        Object.keys(stats).forEach(loc => {
            // NOTA: Este filtro interno puede ser costoso para conjuntos grandes de datos
            // Se pueden aplicar optimizaciones aquí si es necesario
            const locData = data.filter(p => {
                let pLoc = 'Desconocido';
                if (level === 'province') {
                    pLoc = normalizeProvinceName(p.provincia || 'Desconocido');
                } else if (level === 'municipality') {
                    pLoc = normalizeLocationName(p.municipio || 'Desconocido');
                } else if (level === 'region') {
                    pLoc = findRegion(p.provincia || '');
                }
                return pLoc === loc;
            });

            // Average age
            const totalAge = locData.reduce((sum, p) => sum + (p.edad || 0), 0);
            stats[loc].ageRanges.avg = locData.length > 0 ? Math.round(totalAge / locData.length) : 0;

            // Top centers
            const centerCounts: Record<string, number> = {};
            locData.forEach(p => {
                const center = p.centro || 'Sin asignar';
                centerCounts[center] = (centerCounts[center] || 0) + 1;
            });

            stats[loc].topCenters = Object.entries(centerCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            // Fix infinity if no ages
            if (stats[loc].ageRanges.min === Infinity) {
                stats[loc].ageRanges.min = 0;
            }
        });

        return stats;
    }, [data, level]);

    // Encontrar máximos y mínimos para escala de colores
    const { maxCount, minCount } = useMemo(() => {
        const values = Object.values(mapData).filter(v => typeof v === 'number');
        return {
            maxCount: values.length > 0 ? Math.max(...values) : 1,
            minCount: values.length > 0 ? Math.min(...values) : 0
        };
    }, [mapData]);

    // Calcular máximos y mínimos específicos para municipios de la provincia seleccionada
    const municipalityColorScale = useMemo(() => {
        if (level !== 'municipality' || !selectedProvince) {
            return { maxCount, minCount, counts: mapData };
        }

        // Obtener lista de municipios de la provincia seleccionada
        const provinceMunicipalities = PROVINCE_MUNICIPALITIES[selectedProvince] || [];

        // Filtrar conteos solo para municipios de esta provincia
        const filteredCounts: Record<string, number> = {};

        for (const [key, count] of Object.entries(mapData)) {
            const belongs = provinceMunicipalities.some(m => {
                const normalizedM = normalizeLocationName(m);
                return normalizedM === key ||
                    key.includes(normalizedM) ||
                    normalizedM.includes(key);
            });
            if (belongs) {
                filteredCounts[key] = count as number;
            }
        }

        const values = Object.values(filteredCounts).filter(v => typeof v === 'number') as number[];

        return {
            maxCount: values.length > 0 ? Math.max(...values) : 1,
            minCount: values.length > 0 ? Math.min(...values) : 0,
            counts: filteredCounts
        };
    }, [level, selectedProvince, mapData, maxCount, minCount]);

    // Función de coloración basada en densidad
    const getColor = (count: number, useLocalScale: boolean = false): string => {
        if (count === 0) return '#94a3b8'; // gray

        // Usar escala local para municipios si hay provincia seleccionada
        const localMax = useLocalScale ? municipalityColorScale.maxCount : maxCount;
        const localMin = useLocalScale ? municipalityColorScale.minCount : minCount;

        const ratio = (count - localMin) / (localMax - localMin || 1);

        if (ratio > 0.8) return '#1e40af'; // blue-800
        if (ratio > 0.6) return '#3b82f6'; // blue-600
        if (ratio > 0.4) return '#60a5fa'; // blue-400
        if (ratio > 0.2) return '#93c5fd'; // blue-300
        return '#dbeafe'; // blue-100
    };

    return {
        mapData,
        locationStats,
        maxCount,
        minCount,
        getColor
    };
};
