import { useMemo } from 'react';
import { Participant } from '../types';
import { REGION_PROVINCES, PROVINCE_MUNICIPALITIES } from '../constants';
import {
    normalizeProvinceName,
    normalizeLocationName,
    findRegion
} from '../utils/geoUtils';
import { hasValue } from '../utils/normalize';

export interface LocationStats {
    total: number;
    genderBreakdown: { M: number; F: number; other: number };
    statusBreakdown: Record<string, number>;
    ageRanges: { min: number; max: number; avg: number };
    topCenters: { name: string; count: number }[];
    educationBreakdown: Record<string, number>;
    phoneCount: number;
    vulnerabilityCount: number;
    yearCounts: Record<string, number>;
}

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

    // Calcular estadísticas detalladas — SINGLE PASS (R-perf-3)
    // Also computes national rates inside the same pass (no extra iterations)
    let nationalPhoneRate = 0;
    let nationalVulnerabilityRate = 0;

    const locationStats = useMemo(() => {
        const stats: Record<string, {
            total: number;
            genderBreakdown: { M: number; F: number; other: number };
            statusBreakdown: Record<string, number>;
            ageRanges: { min: number; max: number; avg: number };
            topCenters: { name: string; count: number }[];
            // Accumulator fields (not in final output shape)
            ageSum: number;
            ageCount: number;
            centers: Record<string, number>;
            educationBreakdown: Record<string, number>;
            phoneCount: number;
            vulnerabilityCount: number;
            yearCounts: Record<string, number>;
        }> = {};

        // ── Single pass: O(records) ──
        let phoneAcc = 0;
        let vulnAcc = 0;
        let totalAcc = 0;

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
                    topCenters: [],
                    ageSum: 0,
                    ageCount: 0,
                    centers: {},
                    educationBreakdown: {},
                    phoneCount: 0,
                    vulnerabilityCount: 0,
                    yearCounts: {},
                };
            }

            const s = stats[key];
            s.total++;
            totalAcc++;

            // Gender
            const sex = p.sexo?.toUpperCase();
            if (sex === 'M') s.genderBreakdown.M++;
            else if (sex === 'F') s.genderBreakdown.F++;
            else s.genderBreakdown.other++;

            // Status
            const status = p.estado || 'Sin estado';
            s.statusBreakdown[status] = (s.statusBreakdown[status] || 0) + 1;

            // Age (min/max + accumulator for avg)
            if (p.edad) {
                s.ageRanges.min = Math.min(s.ageRanges.min, p.edad);
                s.ageRanges.max = Math.max(s.ageRanges.max, p.edad);
            }
            if (p.edad > 0) {
                s.ageSum += p.edad;
                s.ageCount++;
            }

            // Centers (accumulated in first pass instead of filtering)
            const center = p.centro || 'Sin asignar';
            s.centers[center] = (s.centers[center] || 0) + 1;

            // Education
            if (p.nivelEstudio && hasValue(p.nivelEstudio)) {
                s.educationBreakdown[p.nivelEstudio] = (s.educationBreakdown[p.nivelEstudio] || 0) + 1;
            }

            // Phone contactability (per-location + national)
            if (hasValue(p.telefonos)) {
                s.phoneCount++;
                phoneAcc++;
            }

            // Vulnerability (any reported, per-location + national)
            if (hasValue(p.discapacidades) || hasValue(p.enfermedades) || hasValue(p.alergias)) {
                s.vulnerabilityCount++;
                vulnAcc++;
            }

            // Year counts (by registro year)
            if (p.fechaRegistro) {
                const y = new Date(p.fechaRegistro).getFullYear().toString();
                s.yearCounts[y] = (s.yearCounts[y] || 0) + 1;
            }
        });

        // Write national rates into outer-scope variables
        nationalPhoneRate = totalAcc > 0 ? phoneAcc / totalAcc : 0;
        nationalVulnerabilityRate = totalAcc > 0 ? vulnAcc / totalAcc : 0;

        // ── Post-process: compute avg age and topCenters from accumulators ──
        Object.keys(stats).forEach(loc => {
            const s = stats[loc];
            s.ageRanges.avg = s.ageCount > 0 ? Math.round(s.ageSum / s.ageCount) : 0;
            s.topCenters = Object.entries(s.centers)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            // Fix infinity if no ages at this location
            if (s.ageRanges.min === Infinity) {
                s.ageRanges.min = 0;
            }
        });

        // Strip accumulator fields before returning
        const result: Record<string, LocationStats> = {};

        Object.keys(stats).forEach(loc => {
            const { ageSum, ageCount, centers: _centers, ...clean } = stats[loc];
            result[loc] = clean;
        });

        return result;
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
        getColor,
        nationalPhoneRate,
        nationalVulnerabilityRate,
    };
};
