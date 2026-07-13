import { useMemo } from 'react';
import type { Participant } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { isWomen, isMen, isActiveStatus, isGraduatedStatus, hasValue } from '../utils/normalize';

export type IndicatorCategory = 'demograficos' | 'territoriales' | 'programa' | 'sociales' | 'calidad-dato' | 'vulnerabilidad' | 'cobertura-temporal' | 'nivel-educativo' | 'desempeno-centro';

export interface Indicator {
  id: number;
  name: string;
  category: IndicatorCategory;
  value: string | number;
  formula: string;
  description: string;
  status: 'viable' | 'pending';
  pendingReason?: string;
}

export interface IndicatorGroup {
  category: IndicatorCategory;
  label: string;
  items: Indicator[];
}

export interface UseIndicatorsResult {
  indicators: Indicator[];
  groups: IndicatorGroup[];
  lastUpdated: Date;
}

/* ---- helpers ---- */

const count = (data: Participant[], predicate: (p: Participant) => boolean): number =>
  data.filter(predicate).length;

const pct = (part: number, total: number): string =>
  total > 0 ? formatPercentage((part / total) * 100) : '0.0%';

const topN = (record: Record<string, number>, n: number): [string, number][] =>
  Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const isEmptyValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' || val === 'N/A' || val === 'N/D';

const completitudStr = (count: number, total: number): string => {
  const nd = total - count;
  return `Con dato: ${formatNumber(count)} (${pct(count, total)}) | N/D: ${formatNumber(nd)} (${pct(nd, total)})`;
};

const top3Str = (record: Record<string, number>): string =>
  topN(record, 3).map(([k, v], i) => `${i + 1}. ${k}: ${formatNumber(v)}`).join(' | ');

/**
 * Compute entity-level percentages and return:
 * - global rate (total numerator / total denominator) — correct aggregate
 * - min% and max% across entities — shows variation
 * - count of entities with data
 */
function entityRange(
  entityKeys: string[],
  numerator: Record<string, number>,
  denominator: Record<string, number>,
): { globalPct: number; minPct: number; maxPct: number; count: number } {
  let totalNum = 0;
  let totalDen = 0;
  let minPct = 100;
  let maxPct = 0;
  let count = 0;

  for (const key of entityKeys) {
    const num = numerator[key] || 0;
    const den = denominator[key] || 0;
    if (den > 0) {
      totalNum += num;
      totalDen += den;
      const p = (num / den) * 100;
      if (p < minPct) minPct = p;
      if (p > maxPct) maxPct = p;
      count++;
    }
  }

  const globalPct = totalDen > 0 ? (totalNum / totalDen) * 100 : 0;
  // If only one entity, min = max = global
  if (count <= 1) {
    minPct = globalPct;
    maxPct = globalPct;
  }

  return { globalPct, minPct, maxPct, count };
}

/**
 * Format range info as a formula string for cross-entity indicators.
 * The global % goes in value (big), the range + count goes in formula (small).
 */
const rangeFormula = (r: { globalPct: number; minPct: number; maxPct: number; count: number }): string =>
  `Brecha territorial: ${formatPercentage(r.minPct)} – ${formatPercentage(r.maxPct)} en ${r.count} entidades`;

/* ---- hook ---- */

export function useIndicators(data: Participant[]): UseIndicatorsResult {
  return useMemo(() => {
    const lastUpdated = new Date();
    const total = data.length;

    /* --- pre-computed slices --- */

    const women = count(data, p => isWomen(p.sexo));
    const men = count(data, p => isMen(p.sexo));

    // #4: Usar edadRegistro para medir edad AL MOMENTO DEL REGISTRO (más relevante)
    const totalAgeReg = data.reduce((sum, p) => sum + (p.edadRegistro || 0), 0);
    const totalAgeNow = data.reduce((sum, p) => sum + (p.edad || 0), 0);
    const countAgeReg = data.filter(p => p.edadRegistro > 0).length;
    const avgAgeReg = countAgeReg > 0 ? (totalAgeReg / countAgeReg).toFixed(1) : 'N/A';
    const avgAgeNow = total > 0 ? (totalAgeNow / total).toFixed(1) : 'N/A';

    const age14_17 = count(data, p => p.edad >= 14 && p.edad <= 17);
    const age18_24 = count(data, p => p.edad >= 18 && p.edad <= 24);
    const women14_17 = count(data, p => p.edad >= 14 && p.edad <= 17 && isWomen(p.sexo));
    const women18_24 = count(data, p => p.edad >= 18 && p.edad <= 24 && isWomen(p.sexo));
    const men14_17 = count(data, p => p.edad >= 14 && p.edad <= 17 && isMen(p.sexo));
    const men18_24 = count(data, p => p.edad >= 18 && p.edad <= 24 && isMen(p.sexo));

    /* --- counts per dimension (single pass) --- */

    const estadoCivilCounts: Record<string, number> = {};
    const municipioCounts: Record<string, number> = {};
    const centroCounts: Record<string, number> = {};
    const cursoCounts: Record<string, number> = {};
    const estadoCounts: Record<string, number> = {};

    const womenByMunicipio: Record<string, number> = {};
    const menByMunicipio: Record<string, number> = {};

    const activeByCentro: Record<string, number> = {};
    const graduatedByCentro: Record<string, number> = {};
    const activeByMunicipio: Record<string, number> = {};
    const graduatedByMunicipio: Record<string, number> = {};

    let totalActive = 0;
    let totalGraduated = 0;

    // Calidad del Dato
    let qualityCedula = 0, qualityBirthDate = 0, qualityEducation = 0;
    let qualityAllergies = 0, qualityDisabilities = 0, qualityDiseases = 0;

    // Vulnerabilidad
    const vulnerabilityCounts: Record<string, number> = { discapacidades: 0, enfermedades: 0, alergias: 0, programasSociales: 0, vulnerabilidades: 0 };
    const disabilityTypes: Record<string, number> = {};
    const diseaseTypes: Record<string, number> = {};
    const allergyTypes: Record<string, number> = {};
    const socialProgramTypes: Record<string, number> = {};

    // Cobertura Temporal
    const yearCounts: Record<string, number> = {};
    const quarterCounts: Record<string, number> = {};
    let totalDaysToInclusion = 0;
    let countWithInclusion = 0;

    // Nivel Educativo
    const educationCounts: Record<string, number> = {};
    const educationActive: Record<string, number> = {};
    const educationGraduated: Record<string, number> = {};
    const educationWomen: Record<string, number> = {};
    const educationMen: Record<string, number> = {};
    const centroEducationCounts: Record<string, Record<string, number>> = {};

    // Desempeño por Centro
    const womenByCentro: Record<string, number> = {};
    const menByCentro: Record<string, number> = {};
    const centroAgeSum: Record<string, number> = {};
    const centroAgeCount: Record<string, number> = {};

    for (const p of data) {
      // estadoCivil
      if (p.estadoCivil && !isEmptyValue(p.estadoCivil)) {
        estadoCivilCounts[p.estadoCivil] = (estadoCivilCounts[p.estadoCivil] || 0) + 1;
      }

      // municipio
      if (p.municipio) {
        municipioCounts[p.municipio] = (municipioCounts[p.municipio] || 0) + 1;
        if (isWomen(p.sexo)) womenByMunicipio[p.municipio] = (womenByMunicipio[p.municipio] || 0) + 1;
        if (isMen(p.sexo)) menByMunicipio[p.municipio] = (menByMunicipio[p.municipio] || 0) + 1;
      }

      // centro
      const hasCentro = !!p.centro;
      if (hasCentro) {
        centroCounts[p.centro!] = (centroCounts[p.centro!] || 0) + 1;
        if (isWomen(p.sexo)) womenByCentro[p.centro!] = (womenByCentro[p.centro!] || 0) + 1;
        if (isMen(p.sexo)) menByCentro[p.centro!] = (menByCentro[p.centro!] || 0) + 1;
        centroAgeSum[p.centro!] = (centroAgeSum[p.centro!] || 0) + (p.edadRegistro || 0);
        centroAgeCount[p.centro!] = (centroAgeCount[p.centro!] || 0) + (p.edadRegistro > 0 ? 1 : 0);
      }

      // curso
      if (p.rutaFormativa) {
        cursoCounts[p.rutaFormativa] = (cursoCounts[p.rutaFormativa] || 0) + 1;
      }

      // estado
      const status = p.estado;
      if (status) {
        estadoCounts[status] = (estadoCounts[status] || 0) + 1;
        if (isActiveStatus(status)) {
          totalActive++;
          if (p.centro) activeByCentro[p.centro] = (activeByCentro[p.centro] || 0) + 1;
          if (p.municipio) activeByMunicipio[p.municipio] = (activeByMunicipio[p.municipio] || 0) + 1;
        }
        if (isGraduatedStatus(status)) {
          totalGraduated++;
          if (p.centro) graduatedByCentro[p.centro] = (graduatedByCentro[p.centro] || 0) + 1;
          if (p.municipio) graduatedByMunicipio[p.municipio] = (graduatedByMunicipio[p.municipio] || 0) + 1;
        }
      }

      // Calidad del Dato
      if (hasValue(p.cedula)) qualityCedula++;
      if (hasValue(p.fechaNacimiento)) qualityBirthDate++;
      if (hasValue(p.nivelEstudio)) qualityEducation++;
      if (hasValue(p.alergias)) qualityAllergies++;
      if (hasValue(p.discapacidades)) qualityDisabilities++;
      if (hasValue(p.enfermedades)) qualityDiseases++;

      // Vulnerabilidad
      if (hasValue(p.discapacidades)) {
        vulnerabilityCounts.discapacidades++;
        p.discapacidades!.split(',').forEach(d => {
          const s = d.trim();
          if (s && !isEmptyValue(s)) disabilityTypes[s] = (disabilityTypes[s] || 0) + 1;
        });
      }
      if (hasValue(p.enfermedades)) {
        vulnerabilityCounts.enfermedades++;
        p.enfermedades!.split(',').forEach(e => {
          const s = e.trim();
          if (s && !isEmptyValue(s)) diseaseTypes[s] = (diseaseTypes[s] || 0) + 1;
        });
      }
      if (hasValue(p.alergias)) {
        vulnerabilityCounts.alergias++;
        p.alergias!.split(',').forEach(a => {
          const s = a.trim();
          if (s && !isEmptyValue(s)) allergyTypes[s] = (allergyTypes[s] || 0) + 1;
        });
      }
      if (hasValue(p.programasSociales)) {
        vulnerabilityCounts.programasSociales++;
        p.programasSociales!.split(',').forEach(pr => {
          const s = pr.trim();
          if (s && !isEmptyValue(s)) socialProgramTypes[s] = (socialProgramTypes[s] || 0) + 1;
        });
      }
      if (hasValue(p.vulnerabilidades)) {
        vulnerabilityCounts.vulnerabilidades++;
      }

      // Cobertura Temporal
      if (p.fechaRegistro) {
        const d = new Date(p.fechaRegistro);
        const y = d.getFullYear();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
        const q = Math.floor(d.getMonth() / 3) + 1;
        quarterCounts[`Q${q}`] = (quarterCounts[`Q${q}`] || 0) + 1;
      }
      if (p.fechaRegistro && p.fechaInclusion) {
        const diff = (new Date(p.fechaInclusion).getTime() - new Date(p.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0) { totalDaysToInclusion += diff; countWithInclusion++; }
      }

      // Nivel Educativo
      if (p.nivelEstudio && !isEmptyValue(p.nivelEstudio)) {
        educationCounts[p.nivelEstudio] = (educationCounts[p.nivelEstudio] || 0) + 1;
        const se = p.estado;
        if (se) {
          if (isActiveStatus(se)) educationActive[p.nivelEstudio] = (educationActive[p.nivelEstudio] || 0) + 1;
          if (isGraduatedStatus(se)) educationGraduated[p.nivelEstudio] = (educationGraduated[p.nivelEstudio] || 0) + 1;
        }
        if (isWomen(p.sexo)) educationWomen[p.nivelEstudio] = (educationWomen[p.nivelEstudio] || 0) + 1;
        if (isMen(p.sexo)) educationMen[p.nivelEstudio] = (educationMen[p.nivelEstudio] || 0) + 1;
        if (p.centro) {
          if (!centroEducationCounts[p.centro]) centroEducationCounts[p.centro] = {};
          centroEducationCounts[p.centro][p.nivelEstudio] = (centroEducationCounts[p.centro][p.nivelEstudio] || 0) + 1;
        }
      }
    }

    /* --- derived values --- */

    const minors = data.filter(p => p.edad < 18);
    const minorsWithTutor = minors.filter(p => p.tutor && !isEmptyValue(p.tutor));
    const tutorsTotal = data.filter(p => p.tutor && !isEmptyValue(p.tutor));
    const tutorsWithPhone = tutorsTotal.filter(p => p.telefonosResponsable && !isEmptyValue(p.telefonosResponsable));
    const withPhone = count(data, p => !isEmptyValue(p.telefonos));
    const withAddress = count(data, p => !isEmptyValue(p.direccion));

    /* --- ranges for cross-entity indicators --- */

    const municipioKeys = Object.keys(municipioCounts);
    const centroKeys = Object.keys(centroCounts);

    const rangeWomenByMun = entityRange(municipioKeys, womenByMunicipio, municipioCounts);
    const rangeActiveByCentro = entityRange(centroKeys, activeByCentro, centroCounts);
    const rangeActiveByMun = entityRange(municipioKeys, activeByMunicipio, municipioCounts);
    const rangeGraduatedByCentro = entityRange(centroKeys, graduatedByCentro, centroCounts);
    const rangeGraduatedByMun = entityRange(municipioKeys, graduatedByMunicipio, municipioCounts);

    /* --- tops --- */

    const topMunicipios = topN(municipioCounts, 1);
    const topCentros = topN(centroCounts, 1);
    const topCursos = topN(cursoCounts, 1);
    const topEstados = topN(estadoCounts, 1);
    const topEstadoCivil = topN(estadoCivilCounts, 1);

    /* --- build all 34 indicators --- */

    const all: Indicator[] = [];

    // ── Demográficos (1-10, 21-22) ──
    all.push({
      id: 1,
      name: 'Total de participantes inscritos',
      category: 'demograficos',
      value: formatNumber(total),
      formula: 'Σ Personas inscritas',
      description: 'Cobertura total del programa. Línea base para todos los demás indicadores.',
      status: 'viable',
    });
    all.push({
      id: 2,
      name: 'Porcentaje de mujeres inscritas',
      category: 'demograficos',
      value: pct(women, total),
      formula: '(Mujeres / Total) × 100',
      description: 'Participación femenina en el programa. Indicador clave de equidad de género.',
      status: 'viable',
    });
    all.push({
      id: 3,
      name: 'Porcentaje de hombres inscritos',
      category: 'demograficos',
      value: pct(men, total),
      formula: '(Hombres / Total) × 100',
      description: 'Participación masculina en el programa. Permite analizar composición por sexo.',
      status: 'viable',
    });
    all.push({
      id: 4,
      name: 'Edad promedio de los participantes',
      category: 'demograficos',
      value: `Al registro: ${avgAgeReg} · Actual: ${avgAgeNow}`,
      formula: 'Σ Edad / Total',
      description: 'Edad promedio al momento del registro (edadRegistro) y edad actual. La edad al registro es más relevante para evaluar cobertura del target 14-24.',
      status: 'viable',
    });
    all.push({
      id: 5,
      name: 'Porcentaje de participantes en rango 14-17 años',
      category: 'demograficos',
      value: pct(age14_17, total),
      formula: '(Edad 14-17 / Total) × 100',
      description: 'Porcentaje de participantes adolescentes. Mide penetración del programa en el segmento más joven del target.',
      status: 'viable',
    });
    all.push({
      id: 6,
      name: 'Porcentaje de participantes en rango 18-24 años',
      category: 'demograficos',
      value: pct(age18_24, total),
      formula: '(Edad 18-24 / Total) × 100',
      description: 'Porcentaje de participantes jóvenes adultos. Complementa al indicador #5 para cobertura total del target.',
      status: 'viable',
    });
    all.push({
      id: 7,
      name: 'Porcentaje de mujeres entre 14-17 años',
      category: 'demograficos',
      value: pct(women14_17, women),
      formula: '(Mujeres 14-17 / Total Mujeres) × 100',
      description: 'Distribución etaria de las participantes mujeres. Permite identificar si hay sesgo etario por género.',
      status: 'viable',
    });
    all.push({
      id: 8,
      name: 'Porcentaje de mujeres entre 18-24 años',
      category: 'demograficos',
      value: pct(women18_24, women),
      formula: '(Mujeres 18-24 / Total Mujeres) × 100',
      description: 'Proporción de mujeres jóvenes adultas dentro de la población femenina beneficiaria.',
      status: 'viable',
    });
    all.push({
      id: 9,
      name: 'Porcentaje de hombres entre 14-17 años',
      category: 'demograficos',
      value: pct(men14_17, men),
      formula: '(Hombres 14-17 / Total Hombres) × 100',
      description: 'Distribución etaria de los participantes hombres en el rango adolescente.',
      status: 'viable',
    });
    all.push({
      id: 10,
      name: 'Porcentaje de hombres entre 18-24 años',
      category: 'demograficos',
      value: pct(men18_24, men),
      formula: '(Hombres 18-24 / Total Hombres) × 100',
      description: 'Proporción de hombres jóvenes adultos dentro de la población masculina beneficiaria.',
      status: 'viable',
    });
    all.push({
      id: 21,
      name: 'Distribución por estado civil',
      category: 'demograficos',
      value:
        topEstadoCivil.length > 0
          ? `${topEstadoCivil[0][0]} (${formatNumber(topEstadoCivil[0][1])})`
          : 'Sin datos',
      formula: 'Conteo por valor de estadoCivil',
      description: 'Distribución por estado civil. Mayoritariamente solteros por el rango etario del programa.',
      status: 'viable',
    });
    all.push({
      id: 22,
      name: 'Porcentaje de participantes por estado civil',
      category: 'demograficos',
      value:
        topEstadoCivil.length > 0
          ? `${topEstadoCivil[0][0]} (${pct(topEstadoCivil[0][1], total)})`
          : 'Sin datos',
      formula: 'Por estadoCivil / Total × 100',
      description: 'Distribución porcentual por estado civil.',
      status: 'viable',
    });

    // ── Territoriales (11-18, 27-28) ──
    all.push({
      id: 11,
      name: 'Número de participantes por municipio',
      category: 'territoriales',
      value: topMunicipios.length > 0 ? `${topMunicipios[0][0]} (${formatNumber(topMunicipios[0][1])})` : 'Sin datos',
      formula: 'Conteo por municipio',
      description: 'Distribución territorial de participantes. Permite identificar concentraciones y apoyar planificación de intervenciones.',
      status: 'viable',
    });
    all.push({
      id: 12,
      name: 'Porcentaje de participantes por municipio',
      category: 'territoriales',
      value: topMunicipios.length > 0 ? `${topMunicipios[0][0]} (${pct(topMunicipios[0][1], total)})` : 'Sin datos',
      formula: 'Por municipio / Total × 100',
      description: 'Distribución porcentual por municipio. Facilita comparación entre territorios.',
      status: 'viable',
    });
    all.push({
      id: 13,
      name: 'Por sector',
      category: 'territoriales',
      value: 'N/D',
      formula: 'Conteo por sector',
      description: 'Distribución de participantes por sector.',
      status: 'pending',
      pendingReason: 'Falta campo: sector (no disponible en API)',
    });
    all.push({
      id: 14,
      name: 'Porcentaje de participantes por sector',
      category: 'territoriales',
      value: 'N/D',
      formula: 'Por sector / Total × 100',
      description: 'Distribución porcentual por sector.',
      status: 'pending',
      pendingReason: 'Falta campo: sector (no disponible en API)',
    });
    all.push({
      id: 15,
      name: 'Número de participantes por centro',
      category: 'territoriales',
      value: topCentros.length > 0 ? `${topCentros[0][0]} (${formatNumber(topCentros[0][1])})` : 'Sin datos',
      formula: 'Conteo por centro',
      description: 'Carga operativa por centro de formación. Útil para asignación de recursos.',
      status: 'viable',
    });
    all.push({
      id: 16,
      name: 'Porcentaje de participantes por centro',
      category: 'territoriales',
      value: topCentros.length > 0 ? `${topCentros[0][0]} (${pct(topCentros[0][1], total)})` : 'Sin datos',
      formula: 'Por centro / Total × 100',
      description: 'Distribución porcentual de la matrícula entre centros participantes.',
      status: 'viable',
    });
    all.push({
      id: 17,
      name: 'Número de participantes por curso',
      category: 'territoriales',
      value: topCursos.length > 0 ? `${topCursos[0][0]} (${formatNumber(topCursos[0][1])})` : 'Sin datos',
      formula: 'Conteo por rutaFormativa',
      description: 'Demanda de oferta formativa. Permite identificar los cursos con mayor interés.',
      status: 'viable',
    });
    all.push({
      id: 18,
      name: 'Porcentaje de participantes por curso',
      category: 'territoriales',
      value: topCursos.length > 0 ? `${topCursos[0][0]} (${pct(topCursos[0][1], total)})` : 'Sin datos',
      formula: 'Por rutaFormativa / Total × 100',
      description: 'Participación relativa entre los distintos cursos ofertados.',
      status: 'viable',
    });
    all.push({
      id: 27,
      name: 'Porcentaje de mujeres por municipio (global)',
      category: 'territoriales',
      value: formatPercentage(rangeWomenByMun.globalPct),
      formula: rangeFormula(rangeWomenByMun),
      description: 'Participación femenina global. Una brecha amplia indica desigualdad de género entre territorios.',
      status: 'viable',
    });
    const rangeMenByMun = {
      globalPct: 100 - rangeWomenByMun.globalPct,
      minPct: 100 - rangeWomenByMun.maxPct,
      maxPct: 100 - rangeWomenByMun.minPct,
      count: rangeWomenByMun.count,
    };
    all.push({
      id: 28,
      name: 'Porcentaje de hombres por municipio (global)',
      category: 'territoriales',
      value: formatPercentage(rangeMenByMun.globalPct),
      formula: rangeFormula(rangeMenByMun),
      description: 'Participación masculina global. Complementa la lectura de equidad de género territorial.',
      status: 'viable',
    });

    // ── Estado del Programa (19-20, 25-26, 33-36) ──
    all.push({
      id: 19,
      name: 'Número de participantes por estado',
      category: 'programa',
      value: topEstados.length > 0 ? `${topEstados[0][0]} (${formatNumber(topEstados[0][1])})` : 'Sin datos',
      formula: 'Conteo por valor de estado',
      description: 'Situación actual de los participantes dentro del programa (Activo, Egresado, Retirado, etc.).',
      status: 'viable',
    });
    all.push({
      id: 20,
      name: 'Porcentaje de participantes seg\u00fan estado',
      category: 'programa',
      value: topEstados.length > 0 ? `${topEstados[0][0]} (${pct(topEstados[0][1], total)})` : 'Sin datos',
      formula: 'Por estado / Total × 100',
      description: 'Distribución porcentual por estado. Facilita el seguimiento de permanencia y egreso.',
      status: 'viable',
    });
    all.push({
      id: 25,
      name: 'Porcentaje de menores con responsable asignado',
      category: 'programa',
      value: minors.length > 0 ? pct(minorsWithTutor.length, minors.length) : '0.0%',
      formula: '(Menores con tutor / Total menores) × 100',
      description: 'Cumplimiento del registro de responsable para participantes menores de edad. Indicador crítico de protección.',
      status: 'viable',
    });
    all.push({
      id: 26,
      name: 'Porcentaje de responsables con teléfono',
      category: 'programa',
      value: pct(tutorsWithPhone.length, tutorsTotal.length),
      formula: '(Responsables con teléfono / Total responsables) × 100',
      description: 'Disponibilidad de contacto de los responsables. Afecta la capacidad de seguimiento.',
      status: 'viable',
    });
    all.push({
      id: 33,
      name: 'Porcentaje de activos por centro (global)',
      category: 'programa',
      value: formatPercentage(rangeActiveByCentro.globalPct),
      formula: rangeFormula(rangeActiveByCentro),
      description: 'Tasa de retención global. Una brecha amplia entre centros sugiere diferencias en calidad o seguimiento.',
      status: 'viable',
    });
    all.push({
      id: 34,
      name: 'Porcentaje de activos por municipio (global)',
      category: 'programa',
      value: formatPercentage(rangeActiveByMun.globalPct),
      formula: rangeFormula(rangeActiveByMun),
      description: 'Tasa de retención global por municipio. Útil para detectar territorios con baja permanencia.',
      status: 'viable',
    });
    all.push({
      id: 35,
      name: 'Porcentaje de egresados por centro (global)',
      category: 'programa',
      value: formatPercentage(rangeGraduatedByCentro.globalPct),
      formula: rangeFormula(rangeGraduatedByCentro),
      description: 'Tasa de finalización global. Centros con baja tasa pueden necesitar revisión de metodología.',
      status: 'viable',
    });
    all.push({
      id: 36,
      name: 'Porcentaje de egresados por municipio (global)',
      category: 'programa',
      value: formatPercentage(rangeGraduatedByMun.globalPct),
      formula: rangeFormula(rangeGraduatedByMun),
      description: 'Tasa de finalización global por municipio. Identifica territorios con mejores resultados.',
      status: 'viable',
    });

    // ── Sociales (23-24, 29-32) ──
    all.push({
      id: 23,
      name: 'Porcentaje de participantes con teléfono',
      category: 'sociales',
      value: pct(withPhone, total),
      formula: '(Con teléfono registrado / Total) × 100',
      description: 'Calidad del dato de contacto. A mayor %, mejor capacidad de seguimiento y comunicación.',
      status: 'viable',
    });
    all.push({
      id: 24,
      name: 'Porcentaje de participantes con dirección',
      category: 'sociales',
      value: pct(withAddress, total),
      formula: '(Con dirección registrada / Total) × 100',
      description: 'Completitud del dato domiciliario. Afecta la capacidad de localización y visitas de campo.',
      status: 'viable',
    });
    all.push({
      id: 29,
      name: 'Porcentaje de mujeres en centros (global)',
      category: 'sociales',
      value: total > 0 ? pct(women, total) : '0.0%',
      formula: '(Mujeres / Total) × 100',
      description: 'Participación femenina global. En el board detallado se muestra el desglose por centro en gráfico de barras.',
      status: 'viable',
    });
    all.push({
      id: 30,
      name: 'Porcentaje de hombres en centros (global)',
      category: 'sociales',
      value: total > 0 ? pct(men, total) : '0.0%',
      formula: '(Hombres / Total) × 100',
      description: 'Participación masculina global. En el board detallado se muestra el desglose por curso en gráfico de barras.',
      status: 'viable',
    });
    all.push({
      id: 31,
      name: 'Porcentaje de grupo etario en centros (global)',
      category: 'sociales',
      value: `Rango 14-17: ${pct(age14_17, total)} | Rango 18-24: ${pct(age18_24, total)}`,
      formula: '(Grupo etario / Total) × 100',
      description: 'Distribución etaria global. En el board detallado se muestra el desglose por centro en gráfico.',
      status: 'viable',
    });
    all.push({
      id: 32,
      name: 'Porcentaje de grupo etario en cursos (global)',
      category: 'sociales',
      value: `Rango 14-17: ${pct(age14_17, total)} | Rango 18-24: ${pct(age18_24, total)}`,
      formula: '(Grupo etario / Total) × 100',
      description: 'Distribución etaria global. En el board detallado se muestra el desglose por curso en gráfico.',
      status: 'viable',
    });

    // ── Calidad del Dato (37-42) ──
    all.push({
      id: 37,
      name: 'Porcentaje de registros con c\u00e9dula v\u00e1lida',
      category: 'calidad-dato',
      value: completitudStr(qualityCedula, total),
      formula: '(C\u00e9dula no vac\u00eda / Total) \u00d7 100',
      description: 'Mide la completitud del documento de identidad. Afecta la capacidad de identificar un\u00edvocamente a los participantes.',
      status: 'viable',
    });
    all.push({
      id: 38,
      name: 'Porcentaje de registros con fecha de nacimiento',
      category: 'calidad-dato',
      value: completitudStr(qualityBirthDate, total),
      formula: '(Fecha de nacimiento registrada / Total) \u00d7 100',
      description: 'Mide la completitud de la fecha de nacimiento. Afecta la capacidad de calcular edad exacta y hacer cruces demogr\u00e1ficos.',
      status: 'viable',
    });
    all.push({
      id: 39,
      name: 'Porcentaje de registros con nivel de estudio',
      category: 'calidad-dato',
      value: completitudStr(qualityEducation, total),
      formula: '(Nivel de estudio registrado / Total) \u00d7 100',
      description: 'Mide la completitud del nivel educativo. Afecta el an\u00e1lisis de perfil acad\u00e9mico de los participantes.',
      status: 'viable',
    });
    all.push({
      id: 40,
      name: 'Porcentaje de registros con alergias documentadas',
      category: 'calidad-dato',
      value: completitudStr(qualityAllergies, total),
      formula: '(Alergias documentadas / Total) \u00d7 100',
      description: 'Mide la completitud del registro de alergias. Afecta la capacidad de atenci\u00f3n en salud y prevenci\u00f3n de riesgos.',
      status: 'viable',
    });
    all.push({
      id: 41,
      name: 'Porcentaje de registros con discapacidades documentadas',
      category: 'calidad-dato',
      value: completitudStr(qualityDisabilities, total),
      formula: '(Discapacidades documentadas / Total) \u00d7 100',
      description: 'Mide la completitud del registro de discapacidades. Afecta la identificaci\u00f3n de necesidades de inclusi\u00f3n.',
      status: 'viable',
    });
    all.push({
      id: 42,
      name: 'Porcentaje de registros con enfermedades documentadas',
      category: 'calidad-dato',
      value: completitudStr(qualityDiseases, total),
      formula: '(Enfermedades documentadas / Total) \u00d7 100',
      description: 'Mide la completitud del registro de enfermedades. Afecta la capacidad de seguimiento m\u00e9dico de los participantes.',
      status: 'viable',
    });

    // ── Salud y Vulnerabilidad (43-49) ──
    all.push({
      id: 43,
      name: 'Porcentaje de participantes con discapacidades reportadas',
      category: 'vulnerabilidad',
      value: vulnerabilityCounts.discapacidades > 0 ? pct(vulnerabilityCounts.discapacidades, total) : '0.0%',
      formula: '(Con discapacidad / Total) \u00d7 100',
      description: 'Proporci\u00f3n de participantes que reportan al menos una discapacidad. Indicador de inclusi\u00f3n y necesidades de apoyo.',
      status: 'viable',
    });
    all.push({
      id: 44,
      name: 'Top discapacidades m\u00e1s frecuentes',
      category: 'vulnerabilidad',
      value: Object.keys(disabilityTypes).length > 0 ? top3Str(disabilityTypes) : 'Sin datos',
      formula: 'Conteo por tipo de discapacidad',
      description: 'Las tres discapacidades m\u00e1s reportadas entre los participantes. \u00datil para planificar recursos de apoyo.',
      status: 'viable',
    });
    all.push({
      id: 45,
      name: 'Porcentaje de participantes con enfermedades reportadas',
      category: 'vulnerabilidad',
      value: vulnerabilityCounts.enfermedades > 0 ? pct(vulnerabilityCounts.enfermedades, total) : '0.0%',
      formula: '(Con enfermedad / Total) \u00d7 100',
      description: 'Proporci\u00f3n de participantes que reportan al menos una enfermedad. Indicador de perfil de salud de la poblaci\u00f3n atendida.',
      status: 'viable',
    });
    all.push({
      id: 46,
      name: 'Top enfermedades m\u00e1s frecuentes',
      category: 'vulnerabilidad',
      value: Object.keys(diseaseTypes).length > 0 ? top3Str(diseaseTypes) : 'Sin datos',
      formula: 'Conteo por tipo de enfermedad',
      description: 'Las tres enfermedades m\u00e1s reportadas entre los participantes. \u00datil para planificar servicios de salud.',
      status: 'viable',
    });
    all.push({
      id: 47,
      name: 'Porcentaje de participantes con alergias reportadas',
      category: 'vulnerabilidad',
      value: vulnerabilityCounts.alergias > 0 ? pct(vulnerabilityCounts.alergias, total) : '0.0%',
      formula: '(Con alergia / Total) \u00d7 100',
      description: 'Proporci\u00f3n de participantes que reportan al menos una alergia. Importante para la atenci\u00f3n m\u00e9dica y prevenci\u00f3n.',
      status: 'viable',
    });
    all.push({
      id: 48,
      name: 'Porcentaje de participantes en programas sociales del gobierno',
      category: 'vulnerabilidad',
      value: vulnerabilityCounts.programasSociales > 0 ? pct(vulnerabilityCounts.programasSociales, total) : '0.0%',
      formula: '(En programa social / Total) \u00d7 100',
      description: 'Proporci\u00f3n de participantes que reciben otros beneficios sociales. Ayuda a medir la vulnerabilidad socioecon\u00f3mica de la poblaci\u00f3n.',
      status: 'viable',
    });
    all.push({
      id: 49,
      name: 'Porcentaje de participantes con vulnerabilidades reportadas',
      category: 'vulnerabilidad',
      value: vulnerabilityCounts.vulnerabilidades > 0 ? pct(vulnerabilityCounts.vulnerabilidades, total) : '0.0%',
      formula: '(Con vulnerabilidad / Total) \u00d7 100',
      description: 'Proporci\u00f3n de participantes que reportan alguna condici\u00f3n de vulnerabilidad. Indicador compuesto de riesgo social.',
      status: 'viable',
    });

    // ── Cobertura Temporal (50-54) ──
    const yearsSorted = Object.keys(yearCounts).sort();
    const yearGrowthParts: string[] = [];
    for (let i = 1; i < yearsSorted.length; i++) {
      const prev = yearCounts[yearsSorted[i - 1]];
      const curr = yearCounts[yearsSorted[i]];
      const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      yearGrowthParts.push(`${yearsSorted[i]}: ${growth >= 0 ? '+' : ''}${formatPercentage(growth)}`);
    }

    const centroTopEd = Object.entries(centroEducationCounts).map(([centro, levels]) => {
      const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
      return { centro, level: top[0], count: top[1] };
    }).sort((a, b) => b.count - a.count).slice(0, 1);

    const totalWomenWithCentro = Object.values(womenByCentro).reduce((s, v) => s + v, 0);
    const totalMenWithCentro = Object.values(menByCentro).reduce((s, v) => s + v, 0);
    const totalWithCentro = totalWomenWithCentro + totalMenWithCentro;
    const totalAgeSumCentro = Object.values(centroAgeSum).reduce((s, v) => s + v, 0);
    const totalAgeCountCentro = Object.values(centroAgeCount).reduce((s, v) => s + v, 0);

    all.push({
      id: 50,
      name: 'Distribuci\u00f3n de registros por a\u00f1o',
      category: 'cobertura-temporal',
      value: Object.entries(yearCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([k, v]) => `${k}: ${formatNumber(v)}`).join(' | '),
      formula: 'Conteo por a\u00f1o de fechaRegistro',
      description: 'Cantidad de participantes registrados por a\u00f1o. Muestra la evoluci\u00f3n de la cobertura del programa en el tiempo.',
      status: 'viable',
    });
    all.push({
      id: 51,
      name: 'Crecimiento anual de registros',
      category: 'cobertura-temporal',
      value: yearGrowthParts.length > 0 ? yearGrowthParts.join(' | ') : 'Sin datos',
      formula: '((A\u00f1o actual - A\u00f1o anterior) / A\u00f1o anterior) \u00d7 100',
      description: 'Variaci\u00f3n porcentual interanual en la cantidad de registros. Valores negativos indican disminuci\u00f3n en la captaci\u00f3n.',
      status: 'viable',
    });
    all.push({
      id: 52,
      name: 'Edad promedio al momento del registro',
      category: 'cobertura-temporal',
      value: avgAgeReg,
      formula: '\u03a3 edadRegistro / Total con edadRegistro',
      description: 'Edad promedio de los participantes en el momento de su registro en el programa.',
      status: 'viable',
    });
    all.push({
      id: 53,
      name: 'Tiempo promedio entre registro e inclusi\u00f3n',
      category: 'cobertura-temporal',
      value: countWithInclusion > 0 ? (totalDaysToInclusion / countWithInclusion).toFixed(0) + ' d\u00edas' : 'N/A',
      formula: '\u03a3 (fechaInclusi\u00f3n - fechaRegistro) / Total con fechaInclusi\u00f3n',
      description: 'D\u00edas promedio transcurridos entre el registro del participante y su inclusi\u00f3n efectiva en el programa.',
      status: 'viable',
    });
    all.push({
      id: 54,
      name: 'Distribuci\u00f3n por trimestre de registro',
      category: 'cobertura-temporal',
      value: Object.entries(quarterCounts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}: ${formatNumber(v)}`).join(' | '),
      formula: 'Conteo por trimestre de fechaRegistro',
      description: 'Registros agrupados por trimestre del a\u00f1o. Permite identificar estacionalidad en las inscripciones.',
      status: 'viable',
    });

    // ── Nivel Educativo (55-59) ──
    const topEd = topN(educationCounts, 1);
    const topEdName = topEd.length > 0 ? topEd[0][0] : null;
    const totalEducActive = Object.values(educationActive).reduce((s, v) => s + v, 0);
    const totalEducGraduated = Object.values(educationGraduated).reduce((s, v) => s + v, 0);

    all.push({
      id: 55,
      name: 'Distribuci\u00f3n por nivel de estudio',
      category: 'nivel-educativo',
      value: Object.keys(educationCounts).length > 0
        ? topN(educationCounts, 3).map(([k, v]) => `${k}: ${formatNumber(v)}`).join(' | ')
        : 'Sin datos',
      formula: 'Conteo por valor de nivelEstudio',
      description: 'Cantidad de participantes por cada nivel educativo reportado. Muestra la composici\u00f3n acad\u00e9mica de la poblaci\u00f3n atendida.',
      status: 'viable',
    });
    all.push({
      id: 56,
      name: 'Porcentaje de participantes por nivel de estudio',
      category: 'nivel-educativo',
      value: Object.keys(educationCounts).length > 0
        ? topN(educationCounts, 3).map(([k, v]) => `${k}: ${pct(v, total)}`).join(' | ')
        : 'Sin datos',
      formula: 'Por nivelEstudio / Total \u00d7 100',
      description: 'Distribuci\u00f3n porcentual de participantes por nivel educativo. Facilita la comparaci\u00f3n entre niveles.',
      status: 'viable',
    });
    all.push({
      id: 57,
      name: 'Relaci\u00f3n nivel educativo y estado del programa',
      category: 'nivel-educativo',
      value: qualityEducation > 0
        ? `Activos: ${pct(totalEducActive, qualityEducation)} | Egresados: ${pct(totalEducGraduated, qualityEducation)}`
        : 'Sin datos',
      formula: 'Por nivelEstudio / Total \u00d7 100',
      description: 'Proporci\u00f3n de participantes activos y egresados entre quienes tienen nivel educativo registrado.',
      status: 'viable',
    });
    all.push({
      id: 58,
      name: 'Relaci\u00f3n nivel educativo y sexo',
      category: 'nivel-educativo',
      value: topEdName
        ? `Mujeres: ${pct(educationWomen[topEdName] || 0, educationCounts[topEdName])} | Hombres: ${pct(educationMen[topEdName] || 0, educationCounts[topEdName])}`
        : 'Sin datos',
      formula: 'Por nivelEstudio y sexo / Total del nivel \u00d7 100',
      description: 'Distribuci\u00f3n por sexo en el nivel educativo predominante. Muestra si hay brechas de g\u00e9nero por nivel acad\u00e9mico.',
      status: 'viable',
    });
    all.push({
      id: 59,
      name: 'Nivel educativo predominante por centro',
      category: 'nivel-educativo',
      value: centroTopEd.length > 0 ? `${centroTopEd[0].centro}: ${centroTopEd[0].level} (${formatNumber(centroTopEd[0].count)})` : 'Sin datos',
      formula: 'Conteo por centro y nivelEstudio',
      description: 'Centro con mayor concentraci\u00f3n y el nivel educativo que predomina en \u00e9l. \u00datil para planificaci\u00f3n de oferta acad\u00e9mica.',
      status: 'viable',
    });

    // ── Desempe\u00f1o por Centro (60-65) ──
    all.push({
      id: 60,
      name: 'Total de centros activos',
      category: 'desempeno-centro',
      value: formatNumber(Object.keys(centroCounts).length),
      formula: 'Conteo de centros distintos',
      description: 'N\u00famero total de centros de formaci\u00f3n con al menos un participante registrado en el programa.',
      status: 'viable',
    });
    all.push({
      id: 61,
      name: 'Participantes por centro (top)',
      category: 'desempeno-centro',
      value: Object.keys(centroCounts).length > 0
        ? topN(centroCounts, 3).map(([k, v]) => `${k}: ${formatNumber(v)}`).join(' | ')
        : 'Sin datos',
      formula: 'Conteo por centro',
      description: 'Los tres centros con mayor cantidad de participantes. \u00datil para identificar centros con mayor carga operativa.',
      status: 'viable',
    });
    all.push({
      id: 62,
      name: 'Tasa de retenci\u00f3n por centro (global)',
      category: 'desempeno-centro',
      value: formatPercentage(rangeActiveByCentro.globalPct),
      formula: rangeFormula(rangeActiveByCentro),
      description: 'Porcentaje global de participantes activos en los centros. Una brecha amplia sugiere diferencias en calidad o seguimiento.',
      status: 'viable',
    });
    all.push({
      id: 63,
      name: 'Tasa de egreso por centro (global)',
      category: 'desempeno-centro',
      value: formatPercentage(rangeGraduatedByCentro.globalPct),
      formula: rangeFormula(rangeGraduatedByCentro),
      description: 'Porcentaje global de egresados en los centros. Centros con baja tasa pueden necesitar revisi\u00f3n de metodolog\u00eda.',
      status: 'viable',
    });
    all.push({
      id: 64,
      name: 'Distribuci\u00f3n de g\u00e9nero por centro (global)',
      category: 'desempeno-centro',
      value: totalWithCentro > 0
        ? `% Mujeres: ${pct(totalWomenWithCentro, totalWithCentro)} | % Hombres: ${pct(totalMenWithCentro, totalWithCentro)}`
        : 'Sin datos',
      formula: 'Por sexo / Total con centro \u00d7 100',
      description: 'Distribuci\u00f3n global de g\u00e9nero entre participantes con centro asignado.',
      status: 'viable',
    });
    all.push({
      id: 65,
      name: 'Edad promedio por centro',
      category: 'desempeno-centro',
      value: totalAgeCountCentro > 0 ? (totalAgeSumCentro / totalAgeCountCentro).toFixed(1) : 'N/A',
      formula: '\u03a3 edadRegistro por centro / Total con edadRegistro por centro',
      description: 'Edad promedio al registro de los participantes que tienen un centro asignado.',
      status: 'viable',
    });

    /* --- build groups --- */

    const buildGroup = (category: IndicatorCategory, label: string): IndicatorGroup => ({
      category,
      label,
      items: all.filter(i => i.category === category),
    });

    const groups: IndicatorGroup[] = [
      buildGroup('demograficos', 'Demográficos'),
      buildGroup('territoriales', 'Territoriales'),
      buildGroup('programa', 'Estado del Programa'),
      buildGroup('sociales', 'Sociales'),
      buildGroup('calidad-dato', 'Calidad del Dato'),
      buildGroup('vulnerabilidad', 'Salud y Vulnerabilidad'),
      buildGroup('cobertura-temporal', 'Cobertura Temporal'),
      buildGroup('nivel-educativo', 'Nivel Educativo'),
      buildGroup('desempeno-centro', 'Desempe\u00f1o por Centro'),
    ];

    return { indicators: all, groups, lastUpdated };
  }, [data]);
}


