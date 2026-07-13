import { useMemo } from 'react';
import type { Participant } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { isWomen, isMen, isActiveStatus, isGraduatedStatus, hasValue } from '../utils/normalize';

export type IndicatorCategory = 'demograficos' | 'territoriales' | 'programa' | 'sociales';

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
      name: '% de participantes en rango 14-17 años',
      category: 'demograficos',
      value: pct(age14_17, total),
      formula: '(Edad 14-17 / Total) × 100',
      description: 'Porcentaje de participantes adolescentes. Mide penetración del programa en el segmento más joven del target.',
      status: 'viable',
    });
    all.push({
      id: 6,
      name: '% de participantes en rango 18-24 años',
      category: 'demograficos',
      value: pct(age18_24, total),
      formula: '(Edad 18-24 / Total) × 100',
      description: 'Porcentaje de participantes jóvenes adultos. Complementa al indicador #5 para cobertura total del target.',
      status: 'viable',
    });
    all.push({
      id: 7,
      name: '% de mujeres entre 14-17 años',
      category: 'demograficos',
      value: pct(women14_17, women),
      formula: '(Mujeres 14-17 / Total Mujeres) × 100',
      description: 'Distribución etaria de las participantes mujeres. Permite identificar si hay sesgo etario por género.',
      status: 'viable',
    });
    all.push({
      id: 8,
      name: '% de mujeres entre 18-24 años',
      category: 'demograficos',
      value: pct(women18_24, women),
      formula: '(Mujeres 18-24 / Total Mujeres) × 100',
      description: 'Proporción de mujeres jóvenes adultas dentro de la población femenina beneficiaria.',
      status: 'viable',
    });
    all.push({
      id: 9,
      name: '% de hombres entre 14-17 años',
      category: 'demograficos',
      value: pct(men14_17, men),
      formula: '(Hombres 14-17 / Total Hombres) × 100',
      description: 'Distribución etaria de los participantes hombres en el rango adolescente.',
      status: 'viable',
    });
    all.push({
      id: 10,
      name: '% de hombres entre 18-24 años',
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
      name: '% de participantes por estado civil',
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
      name: '% de participantes por municipio',
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
      name: '% de participantes por sector',
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
      name: '% de participantes por centro',
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
      name: '% de participantes por curso',
      category: 'territoriales',
      value: topCursos.length > 0 ? `${topCursos[0][0]} (${pct(topCursos[0][1], total)})` : 'Sin datos',
      formula: 'Por rutaFormativa / Total × 100',
      description: 'Participación relativa entre los distintos cursos ofertados.',
      status: 'viable',
    });
    all.push({
      id: 27,
      name: '% de mujeres por municipio (global)',
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
      name: '% de hombres por municipio (global)',
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
      name: '% Participantes seg\u00fan estado',
      category: 'programa',
      value: topEstados.length > 0 ? `${topEstados[0][0]} (${pct(topEstados[0][1], total)})` : 'Sin datos',
      formula: 'Por estado / Total × 100',
      description: 'Distribución porcentual por estado. Facilita el seguimiento de permanencia y egreso.',
      status: 'viable',
    });
    all.push({
      id: 25,
      name: '% de menores con responsable asignado',
      category: 'programa',
      value: minors.length > 0 ? pct(minorsWithTutor.length, minors.length) : '0.0%',
      formula: '(Menores con tutor / Total menores) × 100',
      description: 'Cumplimiento del registro de responsable para participantes menores de edad. Indicador crítico de protección.',
      status: 'viable',
    });
    all.push({
      id: 26,
      name: '% de responsables con teléfono',
      category: 'programa',
      value: pct(tutorsWithPhone.length, tutorsTotal.length),
      formula: '(Responsables con teléfono / Total responsables) × 100',
      description: 'Disponibilidad de contacto de los responsables. Afecta la capacidad de seguimiento.',
      status: 'viable',
    });
    all.push({
      id: 33,
      name: '% de activos por centro (global)',
      category: 'programa',
      value: formatPercentage(rangeActiveByCentro.globalPct),
      formula: rangeFormula(rangeActiveByCentro),
      description: 'Tasa de retención global. Una brecha amplia entre centros sugiere diferencias en calidad o seguimiento.',
      status: 'viable',
    });
    all.push({
      id: 34,
      name: '% de activos por municipio (global)',
      category: 'programa',
      value: formatPercentage(rangeActiveByMun.globalPct),
      formula: rangeFormula(rangeActiveByMun),
      description: 'Tasa de retención global por municipio. Útil para detectar territorios con baja permanencia.',
      status: 'viable',
    });
    all.push({
      id: 35,
      name: '% de egresados por centro (global)',
      category: 'programa',
      value: formatPercentage(rangeGraduatedByCentro.globalPct),
      formula: rangeFormula(rangeGraduatedByCentro),
      description: 'Tasa de finalización global. Centros con baja tasa pueden necesitar revisión de metodología.',
      status: 'viable',
    });
    all.push({
      id: 36,
      name: '% de egresados por municipio (global)',
      category: 'programa',
      value: formatPercentage(rangeGraduatedByMun.globalPct),
      formula: rangeFormula(rangeGraduatedByMun),
      description: 'Tasa de finalización global por municipio. Identifica territorios con mejores resultados.',
      status: 'viable',
    });

    // ── Sociales (23-24, 29-32) ──
    all.push({
      id: 23,
      name: '% de participantes con teléfono',
      category: 'sociales',
      value: pct(withPhone, total),
      formula: '(Con teléfono registrado / Total) × 100',
      description: 'Calidad del dato de contacto. A mayor %, mejor capacidad de seguimiento y comunicación.',
      status: 'viable',
    });
    all.push({
      id: 24,
      name: '% de participantes con dirección',
      category: 'sociales',
      value: pct(withAddress, total),
      formula: '(Con dirección registrada / Total) × 100',
      description: 'Completitud del dato domiciliario. Afecta la capacidad de localización y visitas de campo.',
      status: 'viable',
    });
    all.push({
      id: 29,
      name: '% de mujeres en centros (global)',
      category: 'sociales',
      value: total > 0 ? pct(women, total) : '0.0%',
      formula: '(Mujeres / Total) × 100',
      description: 'Participación femenina global. En el board detallado se muestra el desglose por centro en gráfico de barras.',
      status: 'viable',
    });
    all.push({
      id: 30,
      name: '% de hombres en centros (global)',
      category: 'sociales',
      value: total > 0 ? pct(men, total) : '0.0%',
      formula: '(Hombres / Total) × 100',
      description: 'Participación masculina global. En el board detallado se muestra el desglose por curso en gráfico de barras.',
      status: 'viable',
    });
    all.push({
      id: 31,
      name: '% de grupo etario en centros (global)',
      category: 'sociales',
      value: `14-17: ${pct(age14_17, total)} · 18-24: ${pct(age18_24, total)}`,
      formula: '(Grupo etario / Total) × 100',
      description: 'Distribución etaria global. En el board detallado se muestra el desglose por centro en gráfico.',
      status: 'viable',
    });
    all.push({
      id: 32,
      name: '% de grupo etario en cursos (global)',
      category: 'sociales',
      value: `14-17: ${pct(age14_17, total)} · 18-24: ${pct(age18_24, total)}`,
      formula: '(Grupo etario / Total) × 100',
      description: 'Distribución etaria global. En el board detallado se muestra el desglose por curso en gráfico.',
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
    ];

    return { indicators: all, groups, lastUpdated };
  }, [data]);
}


