import type { Participant } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { isWomen, isMen, isActiveStatus, isGraduatedStatus, hasValue } from '../utils/normalize';
import type { Indicator, IndicatorCategory, IndicatorGroup, UseIndicatorsResult } from '../hooks/useIndicators';
import { findRegion } from '../utils/geoUtils';

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

/** Estados que indican deserción (case-insensitive) — reutilizado de DesercionBoard */
const isDesertionStatus = (estado: string | null | undefined): boolean => {
  if (!estado) return false;
  const s = estado.trim().toLowerCase();
  return ['retirado', 'desertor', 'baja', 'cancelado', 'inactivo', 'no admitido', 'abandonó', 'abandono'].includes(s);
};

/** Limpia entidades HTML residuales que llegan desde la API (&#x0D;, &#x0A;, etc.) */
const sanitizeValue = (s: string): string =>
  s.replace(/&#x[0-9A-Fa-f]+;/g, '').trim();

const completitudPct = (count: number, total: number): string =>
  `${formatNumber(count)} de ${formatNumber(total)} (${pct(count, total)})`;

function topNAgg(
  record: Record<string, number>,
  n: number = 10
): { top: [string, number][]; resto: number } {
  const sorted = Object.entries(record).sort(([, a], [, b]) => b - a);
  return {
    top: sorted.slice(0, n),
    resto: sorted.slice(n).reduce((sum, [, v]) => sum + v, 0),
  };
}

function formatTopN(
  record: Record<string, number>,
  showPct: boolean = false,
  total?: number
): string {
  const { top, resto } = topNAgg(record, 5);
  if (top.length === 0) return 'Sin datos';
  const parts = top.map(([name, count], i) =>
    `${i + 1}. ${name} (${showPct && total ? pct(count, total) : formatNumber(count)})`
  );
  if (resto > 0) {
    parts.push(`Resto: ${showPct && total ? pct(resto, total) : formatNumber(resto)}`);
  }
  return parts.join(' | ');
}

function buildTopItems(
  record: Record<string, number>,
  total: number,
  n: number = 5
): { name: string; value: number; pct?: number }[] {
  const { top } = topNAgg(record, n);
  return top.map(([name, value]) => ({
    name,
    value,
    pct: total > 0 ? (value / total) * 100 : 0,
  }));
}

/** Calcula el resto (suma de todos los elementos más allá del top N) */
function calcResto(record: Record<string, number>, n: number = 5): number {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(n)
    .reduce((sum, [, v]) => sum + v, 0);
}

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
  if (count <= 1) {
    minPct = globalPct;
    maxPct = globalPct;
  }

  return { globalPct, minPct, maxPct, count };
}

const rangeFormula = (r: { globalPct: number; minPct: number; maxPct: number; count: number }): string =>
  `Brecha territorial: ${formatPercentage(r.minPct)} – ${formatPercentage(r.maxPct)} en ${r.count} entidades`;

export function computeIndicators(data: Participant[]): UseIndicatorsResult {
  const lastUpdated = new Date();
  const total = data.length;

  const women = count(data, p => isWomen(p.sexo));
  const men = count(data, p => isMen(p.sexo));
  const knownSexTotal = women + men;

  const totalAgeReg = data.reduce((sum, p) => sum + (p.edadRegistro || 0), 0);
  const totalAgeNow = data.reduce((sum, p) => sum + (p.edad || 0), 0);
  const countAgeReg = data.filter(p => p.edadRegistro > 0).length;
  const countAgeNow = data.filter(p => p.edad > 0).length;
  const avgAgeReg = countAgeReg > 0 ? (totalAgeReg / countAgeReg).toFixed(1) : 'N/A';
  const avgAgeNow = countAgeNow > 0 ? (totalAgeNow / countAgeNow).toFixed(1) : 'N/A';

  const age14_17 = count(data, p => p.edad >= 14 && p.edad <= 17);
  const age18_24 = count(data, p => p.edad >= 18 && p.edad <= 24);
  const women14_17 = count(data, p => p.edad >= 14 && p.edad <= 17 && isWomen(p.sexo));
  const women18_24 = count(data, p => p.edad >= 18 && p.edad <= 24 && isWomen(p.sexo));
  const men14_17 = count(data, p => p.edad >= 14 && p.edad <= 17 && isMen(p.sexo));
  const men18_24 = count(data, p => p.edad >= 18 && p.edad <= 24 && isMen(p.sexo));

  // New age-bucket computations for expansion (IDs 66, 67, 76)
  const age18_20 = count(data, p => p.edad >= 18 && p.edad <= 20);
  const age21_24 = count(data, p => p.edad >= 21 && p.edad <= 24);
  const age25Plus = count(data, p => p.edad >= 25);
  const women18_20 = count(data, p => p.edad >= 18 && p.edad <= 20 && isWomen(p.sexo));
  const women21_24 = count(data, p => p.edad >= 21 && p.edad <= 24 && isWomen(p.sexo));
  const women25Plus = count(data, p => p.edad >= 25 && isWomen(p.sexo));
  const men18_20 = count(data, p => p.edad >= 18 && p.edad <= 20 && isMen(p.sexo));
  const men21_24 = count(data, p => p.edad >= 21 && p.edad <= 24 && isMen(p.sexo));
  const men25Plus = count(data, p => p.edad >= 25 && isMen(p.sexo));

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

  let qualityCedula = 0, qualityBirthDate = 0, qualityEducation = 0;
  let qualityAllergies = 0, qualityDisabilities = 0, qualityDiseases = 0;

  const vulnerabilityCounts: Record<string, number> = { discapacidades: 0, enfermedades: 0, alergias: 0, programasSociales: 0, vulnerabilidades: 0 };
  const vulnerabilityUniverse: Record<string, number> = { discapacidades: 0, enfermedades: 0, alergias: 0, programasSociales: 0, vulnerabilidades: 0 };
  const disabilityTypes: Record<string, number> = {};
  const diseaseTypes: Record<string, number> = {};
  const allergyTypes: Record<string, number> = {};
  const socialProgramTypes: Record<string, number> = {};

  const yearCounts: Record<string, number> = {};
  const quarterCounts: Record<string, number> = {};
  let totalDaysToInclusion = 0;
  let countWithInclusion = 0;

  const educationCounts: Record<string, number> = {};
  const educationActive: Record<string, number> = {};
  const educationGraduated: Record<string, number> = {};
  const educationWomen: Record<string, number> = {};
  const educationMen: Record<string, number> = {};
  const centroEducationCounts: Record<string, Record<string, number>> = {};

  const womenByCentro: Record<string, number> = {};
  const menByCentro: Record<string, number> = {};
  const centroAgeSum: Record<string, number> = {};
  const centroAgeCount: Record<string, number> = {};

  // ---- Expansion accumulators (IDs 66-83) ----
  const maritalSexCounts: Record<string, { women: number; men: number; unknown: number }> = {};
  const regionCounts: Record<string, number> = {};
  const womenByRegion: Record<string, number> = {};
  const menByRegion: Record<string, number> = {};
  const regionAge14_17: Record<string, number> = {};
  const regionAge18_24: Record<string, number> = {};
  const centersByRegion: Record<string, Set<string>> = {};
  const centersWith14_17ByRegion: Record<string, Set<string>> = {};
  const centersByProvince: Record<string, Set<string>> = {};
  const centersWith14_17ByProvince: Record<string, Set<string>> = {};
  const yearCenters: Record<number, Set<string>> = {};
  const yearCentersWith14_17: Record<number, Set<string>> = {};
  const courseDesertion: Record<string, { total: number; desertion: number }> = {};
  const regionDesertion: Record<string, { total: number; desertion: number }> = {};
  const yearDesertionTotals: Record<number, { total: number; desertion: number }> = {};
  const provinceEducationCounts: Record<string, Record<string, number>> = {};
  const regionEducationCounts: Record<string, Record<string, number>> = {};
  const educationDesertion: Record<string, { total: number; desertion: number }> = {};
  const yearEducationCounts: Record<number, Record<string, number>> = {};

  for (const p of data) {
    if (p.estadoCivil && !isEmptyValue(p.estadoCivil)) {
      estadoCivilCounts[p.estadoCivil] = (estadoCivilCounts[p.estadoCivil] || 0) + 1;
    }

    if (p.municipio) {
      municipioCounts[p.municipio] = (municipioCounts[p.municipio] || 0) + 1;
      if (isWomen(p.sexo)) womenByMunicipio[p.municipio] = (womenByMunicipio[p.municipio] || 0) + 1;
      if (isMen(p.sexo)) menByMunicipio[p.municipio] = (menByMunicipio[p.municipio] || 0) + 1;
    }

    const hasCentro = !!p.centro;
    if (hasCentro) {
      centroCounts[p.centro!] = (centroCounts[p.centro!] || 0) + 1;
      if (isWomen(p.sexo)) womenByCentro[p.centro!] = (womenByCentro[p.centro!] || 0) + 1;
      if (isMen(p.sexo)) menByCentro[p.centro!] = (menByCentro[p.centro!] || 0) + 1;
      centroAgeSum[p.centro!] = (centroAgeSum[p.centro!] || 0) + (p.edadRegistro || 0);
      centroAgeCount[p.centro!] = (centroAgeCount[p.centro!] || 0) + (p.edadRegistro > 0 ? 1 : 0);
    }

    if (p.rutaFormativa) {
      cursoCounts[p.rutaFormativa] = (cursoCounts[p.rutaFormativa] || 0) + 1;
    }

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

    if (hasValue(p.cedula)) qualityCedula++;
    if (hasValue(p.fechaNacimiento)) qualityBirthDate++;
    if (hasValue(p.nivelEstudio)) qualityEducation++;
    if (hasValue(p.alergias)) qualityAllergies++;
    if (hasValue(p.discapacidades)) qualityDisabilities++;
    if (hasValue(p.enfermedades)) qualityDiseases++;

    if (!isEmptyValue(p.discapacidades)) {
      vulnerabilityUniverse.discapacidades++;
      if (hasValue(p.discapacidades)) {
        vulnerabilityCounts.discapacidades++;
        p.discapacidades!.split(',').forEach(d => {
          const s = sanitizeValue(d);
          if (s && !isEmptyValue(s)) disabilityTypes[s] = (disabilityTypes[s] || 0) + 1;
        });
      }
    }
    if (!isEmptyValue(p.enfermedades)) {
      vulnerabilityUniverse.enfermedades++;
      if (hasValue(p.enfermedades)) {
        vulnerabilityCounts.enfermedades++;
        p.enfermedades!.split(',').forEach(e => {
          const s = sanitizeValue(e);
          if (s && !isEmptyValue(s)) diseaseTypes[s] = (diseaseTypes[s] || 0) + 1;
        });
      }
    }
    if (!isEmptyValue(p.alergias)) {
      vulnerabilityUniverse.alergias++;
      if (hasValue(p.alergias)) {
        vulnerabilityCounts.alergias++;
        p.alergias!.split(',').forEach(a => {
          const s = sanitizeValue(a);
          if (s && !isEmptyValue(s)) allergyTypes[s] = (allergyTypes[s] || 0) + 1;
        });
      }
    }
    if (!isEmptyValue(p.programasSociales)) {
      vulnerabilityUniverse.programasSociales++;
      if (hasValue(p.programasSociales)) {
        vulnerabilityCounts.programasSociales++;
        p.programasSociales!.split(',').forEach(pr => {
          const s = sanitizeValue(pr);
          if (s && !isEmptyValue(s)) socialProgramTypes[s] = (socialProgramTypes[s] || 0) + 1;
        });
      }
    }
    if (!isEmptyValue(p.vulnerabilidades)) {
      vulnerabilityUniverse.vulnerabilidades++;
      if (hasValue(p.vulnerabilidades)) {
        vulnerabilityCounts.vulnerabilidades++;
      }
    }

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

    // ---- Expansion in-loop accumulators (IDs 66-83) ----
    if (p.estadoCivil && !isEmptyValue(p.estadoCivil)) {
      if (!maritalSexCounts[p.estadoCivil]) {
        maritalSexCounts[p.estadoCivil] = { women: 0, men: 0, unknown: 0 };
      }
      if (isWomen(p.sexo)) maritalSexCounts[p.estadoCivil].women++;
      else if (isMen(p.sexo)) maritalSexCounts[p.estadoCivil].men++;
      else maritalSexCounts[p.estadoCivil].unknown++;
    }

    const region = findRegion(p.provincia || '');
    regionCounts[region] = (regionCounts[region] || 0) + 1;
    if (isWomen(p.sexo)) womenByRegion[region] = (womenByRegion[region] || 0) + 1;
    if (isMen(p.sexo)) menByRegion[region] = (menByRegion[region] || 0) + 1;
    if (p.edad >= 14 && p.edad <= 17) regionAge14_17[region] = (regionAge14_17[region] || 0) + 1;
    if (p.edad >= 18 && p.edad <= 24) regionAge18_24[region] = (regionAge18_24[region] || 0) + 1;

    if (p.centro) {
      const reg = region;
      if (!centersByRegion[reg]) centersByRegion[reg] = new Set();
      centersByRegion[reg].add(p.centro);
      if (!centersByProvince[p.provincia || 'Desconocido']) centersByProvince[p.provincia || 'Desconocido'] = new Set();
      centersByProvince[p.provincia || 'Desconocido'].add(p.centro);
      if (p.edad >= 14 && p.edad <= 17) {
        if (!centersWith14_17ByRegion[reg]) centersWith14_17ByRegion[reg] = new Set();
        centersWith14_17ByRegion[reg].add(p.centro);
        if (!centersWith14_17ByProvince[p.provincia || 'Desconocido']) centersWith14_17ByProvince[p.provincia || 'Desconocido'] = new Set();
        centersWith14_17ByProvince[p.provincia || 'Desconocido'].add(p.centro);
      }
      const y = p.fechaRegistro ? new Date(p.fechaRegistro).getFullYear() : 0;
      if (y > 0) {
        if (!yearCenters[y]) yearCenters[y] = new Set();
        yearCenters[y].add(p.centro);
        if (p.edad >= 14 && p.edad <= 17) {
          if (!yearCentersWith14_17[y]) yearCentersWith14_17[y] = new Set();
          yearCentersWith14_17[y].add(p.centro);
        }
      }
    }

    if (p.rutaFormativa) {
      if (!courseDesertion[p.rutaFormativa]) courseDesertion[p.rutaFormativa] = { total: 0, desertion: 0 };
      courseDesertion[p.rutaFormativa].total++;
      if (isDesertionStatus(p.estado)) courseDesertion[p.rutaFormativa].desertion++;
    }

    if (!regionDesertion[region]) regionDesertion[region] = { total: 0, desertion: 0 };
    regionDesertion[region].total++;
    if (isDesertionStatus(p.estado)) regionDesertion[region].desertion++;

    const yr = p.fechaRegistro ? new Date(p.fechaRegistro).getFullYear() : 0;
    if (yr > 0) {
      if (!yearDesertionTotals[yr]) yearDesertionTotals[yr] = { total: 0, desertion: 0 };
      yearDesertionTotals[yr].total++;
      if (isDesertionStatus(p.estado)) yearDesertionTotals[yr].desertion++;
    }

    if (p.nivelEstudio && !isEmptyValue(p.nivelEstudio)) {
      if (p.provincia) {
        if (!provinceEducationCounts[p.provincia]) provinceEducationCounts[p.provincia] = {};
        provinceEducationCounts[p.provincia][p.nivelEstudio] = (provinceEducationCounts[p.provincia][p.nivelEstudio] || 0) + 1;
      }
      if (!regionEducationCounts[region]) regionEducationCounts[region] = {};
      regionEducationCounts[region][p.nivelEstudio] = (regionEducationCounts[region][p.nivelEstudio] || 0) + 1;
      if (!educationDesertion[p.nivelEstudio]) educationDesertion[p.nivelEstudio] = { total: 0, desertion: 0 };
      educationDesertion[p.nivelEstudio].total++;
      if (isDesertionStatus(p.estado)) educationDesertion[p.nivelEstudio].desertion++;
      if (yr > 0) {
        if (!yearEducationCounts[yr]) yearEducationCounts[yr] = {};
        yearEducationCounts[yr][p.nivelEstudio] = (yearEducationCounts[yr][p.nivelEstudio] || 0) + 1;
      }
    }
  }

  const minors = data.filter(p => p.edad > 0 && p.edad < 18);
  const minorsWithTutor = minors.filter(p => p.tutor && !isEmptyValue(p.tutor));
  const tutorsTotal = data.filter(p => p.tutor && !isEmptyValue(p.tutor));
  const tutorsWithPhone = tutorsTotal.filter(p => p.telefonosResponsable && !isEmptyValue(p.telefonosResponsable));
  const withPhone = count(data, p => !isEmptyValue(p.telefonos));
  const withAddress = count(data, p => !isEmptyValue(p.direccion));

  const municipioKeys = Object.keys(municipioCounts);
  const centroKeys = Object.keys(centroCounts);

  const rangeWomenByMun = entityRange(municipioKeys, womenByMunicipio, municipioCounts);
  const rangeActiveByCentro = entityRange(centroKeys, activeByCentro, centroCounts);
  const rangeActiveByMun = entityRange(municipioKeys, activeByMunicipio, municipioCounts);
  const rangeGraduatedByCentro = entityRange(centroKeys, graduatedByCentro, centroCounts);
  const rangeGraduatedByMun = entityRange(municipioKeys, graduatedByMunicipio, municipioCounts);

  const all: Indicator[] = [];

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
    value: pct(women, knownSexTotal),
    formula: '(Mujeres / Con sexo conocido) × 100',
    description: 'Participación femenina en el programa sobre registros con sexo conocido.',
    status: 'viable',
  });
  all.push({
    id: 3,
    name: 'Porcentaje de hombres inscritos',
    category: 'demograficos',
    value: pct(men, knownSexTotal),
    formula: '(Hombres / Con sexo conocido) × 100',
    description: 'Participación masculina en el programa sobre registros con sexo conocido.',
    status: 'viable',
  });
  all.push({
    id: 4,
    name: 'Edad promedio de los participantes',
    category: 'demograficos',
    value: `Al registro: ${avgAgeReg} · Actual: ${avgAgeNow}`,
    topItems: [
      { name: 'Al registro', value: safeDiv(totalAgeReg, countAgeReg) },
      { name: 'Actual', value: safeDiv(totalAgeNow, countAgeNow) },
    ],
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
    name: 'Cantidad de participantes por estado civil',
    category: 'demograficos',
    value: formatTopN(estadoCivilCounts),
    topItems: buildTopItems(estadoCivilCounts, total),
    resto: calcResto(estadoCivilCounts),
    formula: 'Conteo por valor de estadoCivil',
    description: 'Distribuci\u00f3n por estado civil. Mayoritariamente solteros por el rango etario del programa.',
    status: 'viable',
  });
  all.push({
    id: 22,
    name: 'Porcentaje de participantes por estado civil',
    category: 'demograficos',
    value: formatTopN(estadoCivilCounts, true, total),
    topItems: buildTopItems(estadoCivilCounts, total),
    resto: calcResto(estadoCivilCounts),
    formula: 'Por estadoCivil / Total × 100',
    description: 'Distribución porcentual por estado civil.',
    status: 'viable',
  });

  all.push({
    id: 11,
    name: 'Cantidad de participantes por municipio',
    category: 'territoriales',
    value: formatTopN(municipioCounts),
    topCount: 10,
    topItems: buildTopItems(municipioCounts, total, 10),
    resto: calcResto(municipioCounts, 10),
    formula: 'Conteo por municipio',
    description: 'Distribución territorial de participantes. Top municipios con mayor concentración.',
    status: 'viable',
  });
  all.push({
    id: 12,
    name: 'Porcentaje de participantes por municipio',
    category: 'territoriales',
    value: formatTopN(municipioCounts, true, total),
    topCount: 10,
    topItems: buildTopItems(municipioCounts, total, 10),
    resto: calcResto(municipioCounts, 10),
    formula: 'Por municipio / Total × 100',
    description: 'Distribución porcentual por municipio. Top municipios con mayor participación relativa.',
    status: 'viable',
  });
  all.push({
    id: 13,
    name: 'Cantidad de participantes por sector',
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
    name: 'Cantidad de participantes por centro',
    category: 'territoriales',
    value: formatTopN(centroCounts),
    topCount: 10,
    topItems: buildTopItems(centroCounts, total, 10),
    resto: calcResto(centroCounts, 10),
    formula: 'Conteo por centro',
    description: 'Carga operativa por centro de formación. Top centros con mayor cantidad de participantes.',
    status: 'viable',
  });
  all.push({
    id: 16,
    name: 'Porcentaje de participantes por centro',
    category: 'territoriales',
    value: formatTopN(centroCounts, true, total),
    topCount: 10,
    topItems: buildTopItems(centroCounts, total, 10),
    resto: calcResto(centroCounts, 10),
    formula: 'Por centro / Total × 100',
    description: 'Distribución porcentual de la matrícula. Top centros con mayor participación relativa.',
    status: 'viable',
  });
  all.push({
    id: 17,
    name: 'Cantidad de participantes por curso',
    category: 'territoriales',
    value: formatTopN(cursoCounts),
    topCount: 10,
    topItems: buildTopItems(cursoCounts, total, 10),
    resto: calcResto(cursoCounts, 10),
    formula: 'Conteo por rutaFormativa',
    description: 'Demanda de oferta formativa. Top cursos con mayor interés.',
    status: 'viable',
  });
  all.push({
    id: 18,
    name: 'Porcentaje de participantes por curso',
    category: 'territoriales',
    value: formatTopN(cursoCounts, true, total),
    topCount: 10,
    topItems: buildTopItems(cursoCounts, total, 10),
    resto: calcResto(cursoCounts, 10),
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

  all.push({
    id: 19,
    name: 'Cantidad de participantes por estado',
    category: 'programa',
    value: formatTopN(estadoCounts),
    topItems: buildTopItems(estadoCounts, total),
    resto: calcResto(estadoCounts),
    formula: 'Conteo por valor de estado',
    description: 'Situación actual de los participantes dentro del programa (Activo, Egresado, Retirado, etc.).',
    status: 'viable',
  });
  all.push({
    id: 20,
    name: 'Porcentaje de participantes seg\u00fan estado',
    category: 'programa',
    value: formatTopN(estadoCounts, true, total),
    topItems: buildTopItems(estadoCounts, total),
    resto: calcResto(estadoCounts),
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
    category: 'calidad-dato',
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

  all.push({
    id: 23,
    name: 'Porcentaje de participantes con teléfono',
    category: 'calidad-dato',
    value: pct(withPhone, total),
    formula: '(Con teléfono registrado / Total) × 100',
    description: 'Calidad del dato de contacto. A mayor %, mejor capacidad de seguimiento y comunicación.',
    status: 'viable',
  });
  all.push({
    id: 24,
    name: 'Porcentaje de participantes con dirección',
    category: 'calidad-dato',
    value: pct(withAddress, total),
    formula: '(Con dirección registrada / Total) × 100',
    description: 'Completitud del dato domiciliario. Afecta la capacidad de localización y visitas de campo.',
    status: 'viable',
  });
  all.push({
    id: 29,
    name: 'Porcentaje de mujeres en centros (global)',
    category: 'demograficos',
    value: total > 0 ? pct(women, total) : '0.0%',
    formula: '(Mujeres / Total) × 100',
    description: 'Participación femenina global. En el board detallado se muestra el desglose por centro en gráfico de barras.',
    status: 'viable',
  });
  all.push({
    id: 30,
    name: 'Porcentaje de hombres en centros (global)',
    category: 'demograficos',
    value: total > 0 ? pct(men, total) : '0.0%',
    formula: '(Hombres / Total) × 100',
    description: 'Participación masculina global. En el board detallado se muestra el desglose por curso en gráfico de barras.',
    status: 'viable',
  });
  const groupEtarioTopItems = total > 0
    ? [
        { name: 'Rango 14-17', value: age14_17, pct: (age14_17 / total) * 100 },
        { name: 'Rango 18-24', value: age18_24, pct: (age18_24 / total) * 100 },
      ]
    : [];
  const groupEtarioResto = Math.max(0, total - age14_17 - age18_24);
  all.push({
    id: 31,
    name: 'Porcentaje de grupo etario en centros (global)',
    category: 'demograficos',
    value: `Rango 14-17: ${pct(age14_17, total)} | Rango 18-24: ${pct(age18_24, total)}`,
    topItems: groupEtarioTopItems,
    resto: groupEtarioResto,
    formula: '(Grupo etario / Total) × 100',
    description: 'Distribución etaria global. En el board detallado se muestra el desglose por centro en gráfico.',
    status: 'viable',
  });
  all.push({
    id: 32,
    name: 'Porcentaje de grupo etario en cursos (global)',
    category: 'demograficos',
    value: `Rango 14-17: ${pct(age14_17, total)} | Rango 18-24: ${pct(age18_24, total)}`,
    topItems: groupEtarioTopItems,
    resto: groupEtarioResto,
    formula: '(Grupo etario / Total) × 100',
    description: 'Distribución etaria global. En el board detallado se muestra el desglose por curso en gráfico.',
    status: 'viable',
  });

  all.push({
    id: 37,
    name: 'Porcentaje de registros con c\u00e9dula v\u00e1lida',
    category: 'calidad-dato',
    value: completitudPct(qualityCedula, total),
    formula: '(C\u00e9dula no vac\u00eda / Total) \u00d7 100',
    description: 'Mide la completitud del documento de identidad. Afecta la capacidad de identificar un\u00edvocamente a los participantes.',
    status: 'viable',
  });
  all.push({
    id: 38,
    name: 'Porcentaje de registros con fecha de nacimiento',
    category: 'calidad-dato',
    value: completitudPct(qualityBirthDate, total),
    formula: '(Fecha de nacimiento registrada / Total) \u00d7 100',
    description: 'Mide la completitud de la fecha de nacimiento. Afecta la capacidad de calcular edad exacta y hacer cruces demogr\u00e1ficos.',
    status: 'viable',
  });
  all.push({
    id: 39,
    name: 'Porcentaje de registros con nivel de estudio',
    category: 'calidad-dato',
    value: completitudPct(qualityEducation, total),
    formula: '(Nivel de estudio registrado / Total) \u00d7 100',
    description: 'Mide la completitud del nivel educativo. Afecta el an\u00e1lisis de perfil acad\u00e9mico de los participantes.',
    status: 'viable',
  });
  all.push({
    id: 40,
    name: 'Porcentaje de registros con alergias documentadas',
    category: 'calidad-dato',
    value: completitudPct(qualityAllergies, total),
    formula: '(Alergias documentadas / Total) \u00d7 100',
    description: 'Mide la completitud del registro de alergias. Afecta la capacidad de atenci\u00f3n en salud y prevenci\u00f3n de riesgos.',
    status: 'viable',
  });
  all.push({
    id: 41,
    name: 'Porcentaje de registros con discapacidades documentadas',
    category: 'calidad-dato',
    value: completitudPct(qualityDisabilities, total),
    formula: '(Discapacidades documentadas / Total) \u00d7 100',
    description: 'Mide la completitud del registro de discapacidades. Afecta la identificaci\u00f3n de necesidades de inclusi\u00f3n.',
    status: 'viable',
  });
  all.push({
    id: 42,
    name: 'Porcentaje de registros con enfermedades documentadas',
    category: 'calidad-dato',
    value: completitudPct(qualityDiseases, total),
    formula: '(Enfermedades documentadas / Total) \u00d7 100',
    description: 'Mide la completitud del registro de enfermedades. Afecta la capacidad de seguimiento m\u00e9dico de los participantes.',
    status: 'viable',
  });

  const pctUniverse = (count: number, universe: number): string =>
    universe > 0 ? pct(count, universe) + ` (s/${formatNumber(universe)} con dato)` : '0.0%';
  const sinDato = (total: number, universe: number): string =>
    total - universe > 0 ? `${formatNumber(total - universe)} s/dato` : '';

  all.push({
    id: 43,
    name: 'Porcentaje de participantes con discapacidades reportadas',
    category: 'vulnerabilidad',
    value: [
      pctUniverse(vulnerabilityCounts.discapacidades, vulnerabilityUniverse.discapacidades),
      sinDato(total, vulnerabilityUniverse.discapacidades),
    ].filter(Boolean).join(' · '),
    topItems: [
      { name: 'Con discapacidad', value: vulnerabilityCounts.discapacidades, pct: vulnerabilityUniverse.discapacidades > 0 ? (vulnerabilityCounts.discapacidades / vulnerabilityUniverse.discapacidades) * 100 : 0 },
      { name: 'Sin dato', value: total - vulnerabilityUniverse.discapacidades },
    ],
    formula: '(Con discapacidad / Total con dato) × 100',
    description: 'Proporción de participantes que reportan discapacidad, calculada solo sobre registros con dato (excluye N/A).',
    status: 'viable',
  });
  const sinDatoDiscapacidades = total - vulnerabilityUniverse.discapacidades;
  all.push({
    id: 44,
    name: 'Top discapacidades m\u00e1s frecuentes',
    category: 'vulnerabilidad',
    value: Object.keys(disabilityTypes).length > 0 ? formatTopN(disabilityTypes) : 'Sin datos',
    topItems: Object.keys(disabilityTypes).length > 0 ? buildTopItems(disabilityTypes, total) : undefined,
    resto: Object.keys(disabilityTypes).length > 0 ? calcResto(disabilityTypes) : undefined,
    topDataNote: sinDatoDiscapacidades > 0
      ? `Los valores reflejan solo participantes con discapacidades documentadas. ${formatNumber(sinDatoDiscapacidades)} participantes sin dato no est\u00e1n representados.`
      : undefined,
    formula: 'Conteo por tipo de discapacidad',
    description: 'Las discapacidades más reportadas entre los participantes. Top 5 + agregación del resto.',
    status: 'viable',
  });
  all.push({
    id: 45,
    name: 'Porcentaje de participantes con enfermedades reportadas',
    category: 'vulnerabilidad',
    value: [
      pctUniverse(vulnerabilityCounts.enfermedades, vulnerabilityUniverse.enfermedades),
      sinDato(total, vulnerabilityUniverse.enfermedades),
    ].filter(Boolean).join(' · '),
    topItems: [
      { name: 'Con enfermedad', value: vulnerabilityCounts.enfermedades, pct: vulnerabilityUniverse.enfermedades > 0 ? (vulnerabilityCounts.enfermedades / vulnerabilityUniverse.enfermedades) * 100 : 0 },
      { name: 'Sin dato', value: total - vulnerabilityUniverse.enfermedades },
    ],
    formula: '(Con enfermedad / Total con dato) × 100',
    description: 'Proporción de participantes que reportan enfermedad, calculada solo sobre registros con dato (excluye N/A).',
    status: 'viable',
  });
  const sinDatoEnfermedades = total - vulnerabilityUniverse.enfermedades;
  all.push({
    id: 46,
    name: 'Top enfermedades m\u00e1s frecuentes',
    category: 'vulnerabilidad',
    value: Object.keys(diseaseTypes).length > 0 ? formatTopN(diseaseTypes) : 'Sin datos',
    topItems: Object.keys(diseaseTypes).length > 0 ? buildTopItems(diseaseTypes, total) : undefined,
    resto: Object.keys(diseaseTypes).length > 0 ? calcResto(diseaseTypes) : undefined,
    topDataNote: sinDatoEnfermedades > 0
      ? `Los valores reflejan solo participantes con enfermedades documentadas. ${formatNumber(sinDatoEnfermedades)} participantes sin dato no est\u00e1n representados.`
      : undefined,
    formula: 'Conteo por tipo de enfermedad',
    description: 'Las enfermedades más reportadas entre los participantes. Top 5 + agregación del resto.',
    status: 'viable',
  });
  all.push({
    id: 47,
    name: 'Porcentaje de participantes con alergias reportadas',
    category: 'vulnerabilidad',
    value: [
      pctUniverse(vulnerabilityCounts.alergias, vulnerabilityUniverse.alergias),
      sinDato(total, vulnerabilityUniverse.alergias),
    ].filter(Boolean).join(' · '),
    topItems: [
      { name: 'Con alergia', value: vulnerabilityCounts.alergias, pct: vulnerabilityUniverse.alergias > 0 ? (vulnerabilityCounts.alergias / vulnerabilityUniverse.alergias) * 100 : 0 },
      { name: 'Sin dato', value: total - vulnerabilityUniverse.alergias },
    ],
    formula: '(Con alergia / Total con dato) × 100',
    description: 'Proporción de participantes que reportan alergia, calculada solo sobre registros con dato (excluye N/A).',
    status: 'viable',
  });
  all.push({
    id: 48,
    name: 'Porcentaje de participantes en programas sociales del gobierno',
    category: 'vulnerabilidad',
    value: [
      pctUniverse(vulnerabilityCounts.programasSociales, vulnerabilityUniverse.programasSociales),
      sinDato(total, vulnerabilityUniverse.programasSociales),
    ].filter(Boolean).join(' · '),
    topItems: [
      { name: 'En programa social', value: vulnerabilityCounts.programasSociales, pct: vulnerabilityUniverse.programasSociales > 0 ? (vulnerabilityCounts.programasSociales / vulnerabilityUniverse.programasSociales) * 100 : 0 },
      { name: 'Sin dato', value: total - vulnerabilityUniverse.programasSociales },
    ],
    formula: '(En programa social / Total con dato) × 100',
    description: 'Proporción de participantes en programas sociales, calculada solo sobre registros con dato (excluye N/A).',
    status: 'viable',
  });
  all.push({
    id: 49,
    name: 'Porcentaje de participantes con vulnerabilidades reportadas',
    category: 'vulnerabilidad',
    value: [
      pctUniverse(vulnerabilityCounts.vulnerabilidades, vulnerabilityUniverse.vulnerabilidades),
      sinDato(total, vulnerabilityUniverse.vulnerabilidades),
    ].filter(Boolean).join(' · '),
    topItems: [
      { name: 'Con vulnerabilidad', value: vulnerabilityCounts.vulnerabilidades, pct: vulnerabilityUniverse.vulnerabilidades > 0 ? (vulnerabilityCounts.vulnerabilidades / vulnerabilityUniverse.vulnerabilidades) * 100 : 0 },
      { name: 'Sin dato', value: total - vulnerabilityUniverse.vulnerabilidades },
    ],
    formula: '(Con vulnerabilidad / Total con dato) × 100',
    description: 'Proporción de participantes con vulnerabilidad, calculada solo sobre registros con dato (excluye N/A).',
    status: 'viable',
  });

  const yearsSorted = Object.keys(yearCounts).sort();
  const yearGrowthParts: string[] = [];
  for (let i = 1; i < yearsSorted.length; i++) {
    const prev = yearCounts[yearsSorted[i - 1]];
    const curr = yearCounts[yearsSorted[i]];
    const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    yearGrowthParts.push(`${yearsSorted[i]}: ${growth >= 0 ? '+' : ''}${formatPercentage(growth)}`);
  }

  const centroTopLevels = Object.entries(centroEducationCounts).map(([centro, levels]) => {
    const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
    return { centro, level: top[0], count: top[1] };
  }).sort((a, b) => b.count - a.count);

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
    topItems: buildTopItems(yearCounts, total),
    resto: calcResto(yearCounts),
    formula: 'Conteo por a\u00f1o de fechaRegistro',
    description: 'Cantidad de participantes registrados por a\u00f1o. Muestra la evoluci\u00f3n de la cobertura del programa en el tiempo.',
    status: 'viable',
  });
  all.push({
    id: 51,
    name: 'Crecimiento anual de registros',
    category: 'cobertura-temporal',
    value: yearGrowthParts.length > 0 ? yearGrowthParts.join(' | ') : 'Sin datos',
    topItems: Object.entries(yearCounts).sort(([a], [b]) => Number(a) - Number(b)).map(([year, count]) => ({ name: year, value: count })),
    formula: '((A\u00f1o actual - A\u00f1o anterior) / A\u00f1o anterior) \u00d7 100',
    description: 'Variaci\u00f3n porcentual interanual en la cantidad de registros. Valores negativos indican disminuci\u00f3n en la captaci\u00f3n.',
    status: 'viable',
  });
  all.push({
    id: 52,
    name: 'Edad de ingreso al programa',
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
    topItems: buildTopItems(quarterCounts, total),
    resto: calcResto(quarterCounts),
    formula: 'Conteo por trimestre de fechaRegistro',
    description: 'Registros agrupados por trimestre del a\u00f1o. Permite identificar estacionalidad en las inscripciones.',
    status: 'viable',
  });

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
    topItems: buildTopItems(educationCounts, total),
    resto: calcResto(educationCounts),
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
    topItems: buildTopItems(educationCounts, total),
    resto: calcResto(educationCounts),
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
    topItems: [
      { name: 'Activos', value: totalEducActive, pct: qualityEducation > 0 ? (totalEducActive / qualityEducation) * 100 : 0 },
      { name: 'Egresados', value: totalEducGraduated, pct: qualityEducation > 0 ? (totalEducGraduated / qualityEducation) * 100 : 0 },
    ],
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
    topItems: [
      { name: 'Mujeres', value: topEdName ? (educationWomen[topEdName] || 0) : 0, pct: topEdName && educationCounts[topEdName] > 0 ? ((educationWomen[topEdName] || 0) / educationCounts[topEdName]) * 100 : 0 },
      { name: 'Hombres', value: topEdName ? (educationMen[topEdName] || 0) : 0, pct: topEdName && educationCounts[topEdName] > 0 ? ((educationMen[topEdName] || 0) / educationCounts[topEdName]) * 100 : 0 },
    ],
    formula: 'Por nivelEstudio y sexo / Total del nivel \u00d7 100',
    description: 'Distribuci\u00f3n por sexo en el nivel educativo predominante. Muestra si hay brechas de g\u00e9nero por nivel acad\u00e9mico.',
    status: 'viable',
  });
  const formatCentroTopLevels = () => {
    if (centroTopLevels.length === 0) return 'Sin datos';
    const top5 = centroTopLevels.slice(0, 5);
    const resto = centroTopLevels.slice(5).reduce((s, c) => s + c.count, 0);
    const parts = top5.map((c, i) => `${i + 1}. ${c.centro}: ${c.level} (${formatNumber(c.count)})`);
    if (resto > 0) parts.push(`Resto: ${formatNumber(resto)}`);
    return parts.join(' | ');
  };

  const sinDatoCentrosEducativos = Object.keys(centroCounts).length - Object.keys(centroEducationCounts).length;
  all.push({
    id: 59,
    name: 'Nivel educativo predominante por centro',
    category: 'nivel-educativo',
    value: formatCentroTopLevels(),
    topItems: centroTopLevels.slice(0, 5).map(c => ({
      name: `${c.centro}: ${c.level}`,
      value: c.count,
    })),
    resto: centroTopLevels.slice(5).reduce((s, c) => s + c.count, 0),
    topDataNote: sinDatoCentrosEducativos > 0
      ? `${formatNumber(sinDatoCentrosEducativos)} centros no tienen datos de nivel educativo registrados y no est\u00e1n representados.`
      : undefined,
    formula: 'Conteo por centro y nivelEstudio',
    description: 'Centros con su nivel educativo predominante. Top 5 + agregaci\u00f3n del resto.',
    status: 'viable',
  });

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
    value: formatTopN(centroCounts),
    topCount: 10,
    topItems: buildTopItems(centroCounts, total, 10),
    resto: calcResto(centroCounts, 10),
    formula: 'Conteo por centro',
    description: 'Top 5 centros con mayor cantidad de participantes. Útil para identificar centros con mayor carga operativa.',
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
      ? `M: ${pct(totalWomenWithCentro, totalWithCentro)}  ·  H: ${pct(totalMenWithCentro, totalWithCentro)}`
      : 'Sin datos',
    topItems: [
      { name: 'Mujeres', value: totalWomenWithCentro, pct: totalWithCentro > 0 ? (totalWomenWithCentro / totalWithCentro) * 100 : 0 },
      { name: 'Hombres', value: totalMenWithCentro, pct: totalWithCentro > 0 ? (totalMenWithCentro / totalWithCentro) * 100 : 0 },
    ],
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

  // ── Phase 2: 18 new indicators (IDs 66–83) ──

  // ID 66 — Age-bucket distribution (14-17, 18-20, 21-24, 25+)
  all.push({
    id: 66,
    name: 'Distribución por grupo etario detallado',
    category: 'demograficos',
    value: [
      `14-17: ${formatNumber(age14_17)} (${pct(age14_17, total)})`,
      `18-20: ${formatNumber(age18_20)} (${pct(age18_20, total)})`,
      `21-24: ${formatNumber(age21_24)} (${pct(age21_24, total)})`,
      `25+: ${formatNumber(age25Plus)} (${pct(age25Plus, total)})`,
    ].join(' | '),
    topItems: [
      { name: '14-17', value: age14_17, pct: total > 0 ? (age14_17 / total) * 100 : 0 },
      { name: '18-20', value: age18_20, pct: total > 0 ? (age18_20 / total) * 100 : 0 },
      { name: '21-24', value: age21_24, pct: total > 0 ? (age21_24 / total) * 100 : 0 },
      { name: '25+', value: age25Plus, pct: total > 0 ? (age25Plus / total) * 100 : 0 },
    ],
    formula: 'Por grupo etario / Total × 100',
    description: 'Distribución detallada en 4 grupos etarios. Desglosa el rango 18-24 en 18-20 y 21-24, y captura participantes mayores de 24.',
    status: 'viable',
  });

  // ID 67 — Sex ratio per age bucket
  all.push({
    id: 67,
    name: 'Proporción mujeres:hombres por grupo etario',
    category: 'demograficos',
    value: [
      `14-17: ${women14_17}:${men14_17} (${men14_17 > 0 ? (women14_17 / men14_17).toFixed(1) : '∞'}:1)`,
      `18-20: ${women18_20}:${men18_20} (${men18_20 > 0 ? (women18_20 / men18_20).toFixed(1) : '∞'}:1)`,
      `21-24: ${women21_24}:${men21_24} (${men21_24 > 0 ? (women21_24 / men21_24).toFixed(1) : '∞'}:1)`,
      `25+: ${women25Plus}:${men25Plus} (${men25Plus > 0 ? (women25Plus / men25Plus).toFixed(1) : '∞'}:1)`,
    ].join(' | '),
    topItems: [
      { name: '14-17', value: men14_17 > 0 ? women14_17 / men14_17 : 0 },
      { name: '18-20', value: men18_20 > 0 ? women18_20 / men18_20 : 0 },
      { name: '21-24', value: men21_24 > 0 ? women21_24 / men21_24 : 0 },
      { name: '25+', value: men25Plus > 0 ? women25Plus / men25Plus : 0 },
    ],
    formula: '(Mujeres del grupo / Hombres del grupo) : 1',
    description: 'Razón de género por grupo etario. Valores > 1 indican más mujeres que hombres. ∞ cuando no hay hombres en el grupo.',
    status: 'viable',
  });

  // ID 68 — Marital status × sex cross-tabulation
  const maritalSexItems: { name: string; value: number }[] = [];
  for (const [status, counts] of Object.entries(maritalSexCounts)) {
    if (counts.women > 0) maritalSexItems.push({ name: `${status} (Mujeres)`, value: counts.women });
    if (counts.men > 0) maritalSexItems.push({ name: `${status} (Hombres)`, value: counts.men });
    if (counts.unknown > 0) maritalSexItems.push({ name: `${status} (Sexo desconocido)`, value: counts.unknown });
  }
  maritalSexItems.sort((a, b) => b.value - a.value);
  all.push({
    id: 68,
    name: 'Cruce de estado civil y sexo',
    category: 'demograficos',
    value: maritalSexItems.length > 0
      ? topN(Object.fromEntries(maritalSexItems.map(i => [i.name, i.value])), 5)
          .map(([k, v]) => `${k}: ${formatNumber(v)}`).join(' | ')
      : 'Sin datos',
    topItems: maritalSexItems.slice(0, 10),
    resto: maritalSexItems.slice(10).reduce((s, i) => s + i.value, 0),
    formula: 'Conteo por cruce de estadoCivil × sexo',
    description: 'Distribución por combinación de estado civil y sexo. Participantes con sexo no determinado se agrupan como "Sexo desconocido".',
    status: 'viable',
  });

  // ID 69 — Participation by planning region (findRegion)
  all.push({
    id: 69,
    name: 'Participación por región de planificación',
    category: 'territoriales',
    value: formatTopN(regionCounts, true, total),
    topCount: 10,
    topItems: buildTopItems(regionCounts, total, 10),
    resto: calcResto(regionCounts, 10),
    formula: 'findRegion(provincia) → Σ por región',
    description: 'Distribución de participantes por región de planificación. Provincias no mapeadas se agrupan como "Desconocido".',
    status: 'viable',
  });

  // ID 70 — Sex distribution per planning region
  const regionSexItems = Object.keys(regionCounts)
    .map(region => ({
      name: region,
      value: regionCounts[region],
      womenPct: regionCounts[region] > 0 ? ((womenByRegion[region] || 0) / regionCounts[region]) * 100 : 0,
      menPct: regionCounts[region] > 0 ? ((menByRegion[region] || 0) / regionCounts[region]) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  all.push({
    id: 70,
    name: 'Distribución de sexo por región de planificación',
    category: 'territoriales',
    value: regionSexItems.length > 0
      ? regionSexItems.slice(0, 5)
          .map(r => `${r.name}: M ${formatPercentage(r.womenPct)} / H ${formatPercentage(r.menPct)}`).join(' | ')
      : 'Sin datos',
    topItems: regionSexItems.map(r => ({ name: r.name, value: r.value, pct: r.womenPct })),
    formula: 'Por región: (Mujeres / Total de la región) × 100',
    description: 'Participación femenina por región de planificación. El porcentaje de hombres es el complemento.',
    status: 'viable',
  });

  // ID 71 — Age distribution per region (14-17% / 18-24%)
  const regionAgeItems = Object.keys(regionCounts)
    .filter(r => regionCounts[r] > 0)
    .map(region => ({
      name: region,
      value: regionCounts[region],
      pct14_17: regionCounts[region] > 0 ? ((regionAge14_17[region] || 0) / regionCounts[region]) * 100 : 0,
      pct18_24: regionCounts[region] > 0 ? ((regionAge18_24[region] || 0) / regionCounts[region]) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
  all.push({
    id: 71,
    name: 'Distribución etaria por región de planificación',
    category: 'territoriales',
    value: regionAgeItems.length > 0
      ? regionAgeItems.slice(0, 5)
          .map(r => `${r.name}: 14-17 ${formatPercentage(r.pct14_17)} / 18-24 ${formatPercentage(r.pct18_24)}`).join(' | ')
      : 'Sin datos',
    topItems: regionAgeItems.map(r => ({ name: r.name, value: r.value, pct: r.pct14_17 })),
    formula: 'Por región: (Edad 14-17 / Total región) × 100',
    description: 'Proporción de adolescentes (14-17) por región. Regiones con 0 participantes se omiten.',
    status: 'viable',
  });

  // ID 72 — Centers without 14-17 participants per planning region
  const regionGapItems = Object.keys(centersByRegion)
    .map(region => {
      const totalC = centersByRegion[region].size;
      const withMinors = (centersWith14_17ByRegion[region] || new Set()).size;
      const without = totalC - withMinors;
      return { name: region, value: without, total: totalC, pct: totalC > 0 ? (without / totalC) * 100 : 0 };
    })
    .sort((a, b) => b.pct - a.pct);
  all.push({
    id: 72,
    name: 'Centros sin menores (14-17) por región',
    category: 'centros-sin-menores',
    value: regionGapItems.length > 0
      ? regionGapItems.slice(0, 5)
          .map(r => `${r.name}: ${r.value}/${r.total} (${formatPercentage(r.pct)})`).join(' | ')
      : 'Sin centros',
    topItems: regionGapItems.map(r => ({ name: r.name, value: r.value, pct: r.pct })),
    formula: 'Centros sin 14-17 / Total centros de la región × 100',
    description: 'Cobertura de menores por región. Regiones con alto % necesitan intervención focalizada.',
    status: 'viable',
  });

  // ID 73 — YoY trend in centers without minors
  const gapTrendYears = Object.keys(yearCenters).map(Number).sort();
  const gapTrendData = gapTrendYears.map(y => {
    const totalC = (yearCenters[y] || new Set()).size;
    const withMinors = (yearCentersWith14_17[y] || new Set()).size;
    return { year: y, without: totalC - withMinors };
  });
  let gapTrendDirection = 'Sin tendencia disponible';
  if (gapTrendData.length >= 2) {
    const first = gapTrendData[0].without;
    const last = gapTrendData[gapTrendData.length - 1].without;
    if (last < first) gapTrendDirection = 'Mejorando';
    else if (last > first) gapTrendDirection = 'Empeorando';
    else gapTrendDirection = 'Estable';
  }
  all.push({
    id: 73,
    name: 'Tendencia anual de centros sin menores',
    category: 'centros-sin-menores',
    value: gapTrendData.length > 0
      ? gapTrendData.map(d => `${d.year}: ${formatNumber(d.without)} centros`).join(' → ')
      : 'Sin datos',
    topItems: gapTrendData.map(d => ({ name: String(d.year), value: d.without })),
    formula: 'Conteo anual de centros sin participantes 14-17',
    description: `Evolución interanual de centros sin cobertura de menores. Tendencia: ${gapTrendDirection}`,
    status: 'viable',
  });

  // ID 74 — Province-level gap detail per region
  const provinceGapItems = Object.keys(centersByProvince)
    .map(prov => {
      const totalC = (centersByProvince[prov] || new Set()).size;
      const withMinors = (centersWith14_17ByProvince[prov] || new Set()).size;
      return { name: prov, value: totalC - withMinors, total: totalC, pct: totalC > 0 ? ((totalC - withMinors) / totalC) * 100 : 0 };
    })
    .sort((a, b) => b.value - a.value);
  all.push({
    id: 74,
    name: 'Brecha de centros sin menores por provincia',
    category: 'centros-sin-menores',
    value: provinceGapItems.length > 0
      ? provinceGapItems.slice(0, 5)
          .map(p => `${p.name}: ${p.value}/${p.total} (${formatPercentage(p.pct)})`).join(' | ')
      : 'Sin datos',
    topItems: provinceGapItems.map(p => ({ name: p.name, value: p.value, pct: p.pct })),
    resto: provinceGapItems.slice(5).reduce((s, p) => s + p.value, 0),
    formula: 'Centros sin 14-17 / Total centros de la provincia × 100',
    description: 'Desglose provincial de brecha de cobertura de menores.',
    status: 'viable',
  });

  // ID 75 — Desertion rate per rutaFormativa (course)
  const courseDesertionItems = Object.entries(courseDesertion)
    .map(([course, { total: t, desertion: d }]) => ({
      name: course,
      value: d,
      total: t,
      rate: t > 0 ? (d / t) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  all.push({
    id: 75,
    name: 'Tasa de deserción por ruta formativa',
    category: 'desercion',
    value: courseDesertionItems.length > 0
      ? courseDesertionItems.slice(0, 5)
          .map(c => `${c.name}: ${formatPercentage(c.rate)} (${formatNumber(c.value)}/${formatNumber(c.total)})`).join(' | ')
      : 'Sin datos',
    topItems: courseDesertionItems.map(c => ({ name: c.name, value: c.value, pct: c.rate })),
    resto: courseDesertionItems.slice(5).reduce((s, c) => s + c.value, 0),
    formula: '(Desertores del curso / Total del curso) × 100',
    description: 'Ranking de rutas formativas con mayor tasa de deserción. Ordenado descendente.',
    status: 'viable',
  });

  // ID 76 — Desertion rate by age bucket
  const ageDesertionBuckets = [
    { name: '14-17', min: 14, max: 17 },
    { name: '18-20', min: 18, max: 20 },
    { name: '21-24', min: 21, max: 24 },
    { name: '25+', min: 25, max: 999 },
  ];
  const ageDesertionItems = ageDesertionBuckets
    .map(b => {
      const total = count(data, p => p.edad >= b.min && p.edad <= b.max);
      const desertion = count(data, p => p.edad >= b.min && p.edad <= b.max && isDesertionStatus(p.estado));
      return { name: b.name, value: desertion, total, rate: total > 0 ? (desertion / total) * 100 : -1 };
    })
    .filter(b => b.total > 0);
  all.push({
    id: 76,
    name: 'Tasa de deserción por grupo etario',
    category: 'desercion',
    value: ageDesertionItems.length > 0
      ? ageDesertionItems.map(a => `${a.name}: ${formatPercentage(a.rate)} (${formatNumber(a.value)}/${formatNumber(a.total)})`).join(' | ')
      : 'Sin datos',
    topItems: ageDesertionItems.map(a => ({ name: a.name, value: a.value, pct: a.rate })),
    formula: '(Desertores del grupo / Total del grupo) × 100',
    description: 'Tasa de deserción desglosada por grupo etario. Grupos sin participantes se omiten.',
    status: 'viable',
  });

  // ID 77 — Desertion rate by sex
  const sexDesertionMap: Record<string, { total: number; desertion: number }> = {};
  for (const p of data) {
    let sexKey = 'Otro';
    if (isWomen(p.sexo)) sexKey = 'Mujeres';
    else if (isMen(p.sexo)) sexKey = 'Hombres';
    if (!sexDesertionMap[sexKey]) sexDesertionMap[sexKey] = { total: 0, desertion: 0 };
    sexDesertionMap[sexKey].total++;
    if (isDesertionStatus(p.estado)) sexDesertionMap[sexKey].desertion++;
  }
  const sexDesertionItems = Object.entries(sexDesertionMap)
    .map(([sex, { total: t, desertion: d }]) => ({
      name: sex,
      value: d,
      total: t,
      rate: t > 0 ? (d / t) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  all.push({
    id: 77,
    name: 'Tasa de deserción por sexo',
    category: 'desercion',
    value: sexDesertionItems.map(s => `${s.name}: ${formatPercentage(s.rate)} (${formatNumber(s.value)}/${formatNumber(s.total)})`).join(' | '),
    topItems: sexDesertionItems.map(s => ({ name: s.name, value: s.value, pct: s.rate })),
    formula: '(Desertores del grupo / Total del grupo) × 100',
    description: 'Tasa de deserción por sexo. Participantes con sexo no determinado se agrupan como "Otro".',
    status: 'viable',
  });

  // ID 78 — Desertion rate per planning region
  const regionDesertionItems = Object.entries(regionDesertion)
    .map(([reg, { total: t, desertion: d }]) => ({
      name: reg,
      value: d,
      total: t,
      rate: t > 0 ? (d / t) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  all.push({
    id: 78,
    name: 'Tasa de deserción por región de planificación',
    category: 'desercion',
    value: regionDesertionItems.length > 0
      ? regionDesertionItems.slice(0, 5)
          .map(r => `${r.name}: ${formatPercentage(r.rate)} (${formatNumber(r.value)}/${formatNumber(r.total)})`).join(' | ')
      : 'Sin datos',
    topItems: regionDesertionItems.map(r => ({ name: r.name, value: r.value, pct: r.rate })),
    resto: regionDesertionItems.slice(5).reduce((s, r) => s + r.value, 0),
    formula: 'findRegion(provincia) → (Desertores / Total región) × 100',
    description: 'Deserción por región de planificación. Regiones no mapeadas aparecen como "Desconocido".',
    status: 'viable',
  });

  // ID 79 — YoY aggregate desertion rate trend
  const yoyYears = Object.keys(yearDesertionTotals).map(Number).sort();
  const desertionTrendData = yoyYears.map(y => ({
    year: y,
    value: yearDesertionTotals[y].desertion,
    total: yearDesertionTotals[y].total,
    rate: yearDesertionTotals[y].total > 0 ? (yearDesertionTotals[y].desertion / yearDesertionTotals[y].total) * 100 : 0,
  }));
  let desertionTrendDirection = 'Sin tendencia disponible';
  if (desertionTrendData.length >= 2) {
    const firstRate = desertionTrendData[0].rate;
    const lastRate = desertionTrendData[desertionTrendData.length - 1].rate;
    if (lastRate < firstRate) desertionTrendDirection = 'Mejorando';
    else if (lastRate > firstRate) desertionTrendDirection = 'Empeorando';
    else desertionTrendDirection = 'Estable';
  }
  all.push({
    id: 79,
    name: 'Tendencia anual de deserción',
    category: 'desercion',
    value: desertionTrendData.length > 0
      ? desertionTrendData.map(d => `${d.year}: ${formatPercentage(d.rate)} (${formatNumber(d.value)}/${formatNumber(d.total)})`).join(' → ')
      : 'Sin datos',
    topItems: desertionTrendData.map(d => ({ name: String(d.year), value: d.value, pct: d.rate })),
    formula: '(Desertores / Total) × 100 por año',
    description: `Evolución interanual de la tasa de deserción global. Tendencia: ${desertionTrendDirection}`,
    status: 'viable',
  });

  // ID 80 — Top education level per province
  const provTopEdu = Object.entries(provinceEducationCounts)
    .map(([prov, levels]) => {
      const totalProv = Object.values(levels).reduce((s, v) => s + v, 0);
      const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
      return {
        name: prov,
        value: top ? top[1] : 0,
        level: top ? top[0] : 'Sin datos',
        total: totalProv,
        pct: totalProv > 0 && top ? (top[1] / totalProv) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
  all.push({
    id: 80,
    name: 'Nivel educativo predominante por provincia',
    category: 'nivel-educativo',
    value: provTopEdu.length > 0
      ? provTopEdu.slice(0, 5).map(p => `${p.name}: ${p.level} (${formatPercentage(p.pct)}, ${formatNumber(p.value)}/${formatNumber(p.total)})`).join(' | ')
      : 'Sin datos',
    topItems: provTopEdu.map(p => ({ name: p.name, value: p.value, pct: p.pct })),
    resto: provTopEdu.slice(5).reduce((s, p) => s + p.value, 0),
    formula: 'Por provincia: nivelEstudio más frecuente / Total provincia × 100',
    description: 'Nivel educativo predominante en cada provincia, ordenado por cantidad de participantes.',
    status: 'viable',
  });

  // ID 81 — Education level distribution per planning region
  const regTopEdu = Object.entries(regionEducationCounts)
    .map(([reg, levels]) => {
      const totalReg = Object.values(levels).reduce((s, v) => s + v, 0);
      const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
      return {
        name: reg,
        value: totalReg,
        level: top ? top[0] : 'Sin datos',
        topCount: top ? top[1] : 0,
        pct: totalReg > 0 && top ? (top[1] / totalReg) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
  all.push({
    id: 81,
    name: 'Distribución de nivel educativo por región',
    category: 'nivel-educativo',
    value: regTopEdu.length > 0
      ? regTopEdu.slice(0, 5).map(r => `${r.name}: ${r.level} (${formatPercentage(r.pct)})`).join(' | ')
      : 'Sin datos',
    topItems: regTopEdu.map(r => ({ name: r.name, value: r.value, pct: r.pct })),
    resto: regTopEdu.slice(5).reduce((s, r) => s + r.value, 0),
    formula: 'findRegion(provincia) → nivelEstudio más frecuente por región',
    description: 'Nivel educativo predominante en cada región de planificación.',
    status: 'viable',
  });

  // ID 82 — Desertion rate per nivelEstudio (education level)
  const eduDesertionItems = Object.entries(educationDesertion)
    .map(([level, { total: t, desertion: d }]) => ({
      name: level,
      value: d,
      total: t,
      rate: t > 0 ? (d / t) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
  all.push({
    id: 82,
    name: 'Correlación deserción y nivel educativo',
    category: 'nivel-educativo',
    value: eduDesertionItems.length > 0
      ? eduDesertionItems.slice(0, 5)
          .map(e => `${e.name}: ${formatPercentage(e.rate)} (${formatNumber(e.value)}/${formatNumber(e.total)})`).join(' | ')
      : 'Sin datos',
    topItems: eduDesertionItems.map(e => ({ name: e.name, value: e.value, pct: e.rate })),
    resto: eduDesertionItems.slice(5).reduce((s, e) => s + e.value, 0),
    formula: '(Desertores del nivel / Total del nivel) × 100',
    description: 'Tasa de deserción por nivel educativo. Niveles con mayor abandono requieren atención.',
    status: 'viable',
  });

  // ID 83 — YoY trend of education level distribution
  const eduTrendYears = Object.keys(yearEducationCounts).map(Number).sort();
  const eduTrendData = eduTrendYears.map(y => {
    const levels = yearEducationCounts[y];
    const totalYr = Object.values(levels).reduce((s, v) => s + v, 0);
    const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
    return {
      year: y,
      topLevel: top ? top[0] : 'N/A',
      topCount: top ? top[1] : 0,
      total: totalYr,
      pct: totalYr > 0 && top ? (top[1] / totalYr) * 100 : 0,
    };
  });
  let eduTrendDirection = 'Sin tendencia disponible';
  if (eduTrendData.length >= 2) {
    const firstLevel = eduTrendData[0].topLevel;
    const lastLevel = eduTrendData[eduTrendData.length - 1].topLevel;
    if (firstLevel !== lastLevel) eduTrendDirection = `Cambió de "${firstLevel}" a "${lastLevel}"`;
    else eduTrendDirection = `Se mantiene en "${firstLevel}"`;
  }
  all.push({
    id: 83,
    name: 'Tendencia anual de nivel educativo',
    category: 'nivel-educativo',
    value: eduTrendData.length > 0
      ? eduTrendData.map(d => `${d.year}: ${d.topLevel} (${formatPercentage(d.pct)})`).join(' → ')
      : 'Sin datos',
    topItems: eduTrendData.map(d => ({ name: String(d.year), value: d.topCount, pct: d.pct })),
    formula: 'Por año: nivelEstudio más frecuente',
    description: `Evolución del nivel educativo predominante por año. ${eduTrendDirection}`,
    status: 'viable',
  });

  const evaluateStatus = (indicator: Indicator): Indicator['status'] => {
    if (indicator.status === 'pending') return 'pending';
    if (total === 0) return 'no-viable';
    const val = String(indicator.value);
    if (val === 'N/A' || val === 'Sin datos' || val === 'N/D') return 'no-viable';
    return 'viable';
  };

  all.forEach(indicator => {
    (indicator as any).status = evaluateStatus(indicator);
  });

  const buildGroup = (category: IndicatorCategory, label: string): IndicatorGroup => ({
    category,
    label,
    items: all.filter(i => i.category === category),
  });

  const groups: IndicatorGroup[] = [
    buildGroup('demograficos', 'Demográficos'),
    buildGroup('territoriales', 'Territoriales'),
    buildGroup('programa', 'Estado del Programa'),
    buildGroup('calidad-dato', 'Calidad del Dato'),
    buildGroup('vulnerabilidad', 'Salud y Vulnerabilidad'),
    buildGroup('cobertura-temporal', 'Cobertura Temporal'),
    buildGroup('nivel-educativo', 'Nivel Educativo'),
    buildGroup('desempeno-centro', 'Desempe\u00f1o por Centro'),
    buildGroup('centros-sin-menores', 'Centros Sin Menores'),
    buildGroup('desercion', 'Deserción'),
  ];

  return { indicators: all, groups, lastUpdated };
}
