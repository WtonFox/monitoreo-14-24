import { useMemo } from 'react';
import type { Participant } from '../types';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { isWomen, isMen, isActiveStatus, isGraduatedStatus, hasValue } from '../utils/normalize';

// ── Types ──

export interface BoardData {
  demographicData: DemographicSlice;
  territorialData: TerritorialSlice;
  programData: ProgramSlice;
  socialData: SocialSlice;
  qualityData: QualitySlice;
  vulnerabilityData: VulnerabilitySlice;
  temporalData: TemporalSlice;
  educationData: EducationSlice;
  centerData: CenterSlice;
}

export interface DemographicSlice {
  total: number;
  women: number;
  men: number;
  womenPct: number;
  menPct: number;
  avgAgeReg: number;
  ageBuckets: { name: string; value: number }[];
  maritalStatus: { name: string; value: number }[];
  genderAgeCross: { name: string; Mujeres: number; Hombres: number }[];
}

export interface TerritorialSlice {
  municipioCount: number;
  centroCount: number;
  cursoCount: number;
  topMunicipios: { name: string; value: number }[];
  topCentros: { name: string; value: number }[];
  topCursos: { name: string; value: number }[];
  genderByMunicipio: { name: string; Mujeres: number; Hombres: number }[];
}

export interface ProgramSlice {
  activePct: number;
  graduatedPct: number;
  minorsWithTutorPct: number;
  tutorsWithPhonePct: number;
  statusDistribution: { name: string; value: number }[];
  activeVsGraduatedByCentro: { name: string; Activos: number; Egresados: number }[];
  activeVsGraduatedByMunicipio: { name: string; Activos: number; Egresados: number }[];
}

export interface SocialSlice {
  phoneCompletenessPct: number;
  addressCompletenessPct: number;
  genderByCentro: { name: string; Mujeres: number; Hombres: number }[];
  genderByCurso: { name: string; Mujeres: number; Hombres: number }[];
  ageByCentro: { name: string; r14_17: number; r18_24: number }[];
  ageByCurso: { name: string; r14_17: number; r18_24: number }[];
}

export interface QualitySlice {
  cedulaPct: number;
  birthDatePct: number;
  educationPct: number;
  allergiesPct: number;
  disabilitiesPct: number;
  diseasesPct: number;
  fieldBreakdown: { name: string; pct: number; total: number; ndCount: number }[];
}

export interface VulnerabilitySlice {
  disabilitiesPct: number;
  diseasesPct: number;
  allergiesPct: number;
  socialProgramsPct: number;
  vulnerabilitiesPct: number;
  topDisabilities: { name: string; value: number }[];
  topDiseases: { name: string; value: number }[];
  topAllergies: { name: string; value: number }[];
  topSocialPrograms: { name: string; value: number }[];
}

export interface TemporalSlice {
  registrationsByYear: { name: string; value: number }[];
  yearGrowth: { name: string; growth: number }[];
  avgAgeAtRegistration: number;
  avgDaysToInclusion: number;
  registrationsByQuarter: { name: string; value: number }[];
}

export interface EducationSlice {
  educationDistribution: { name: string; value: number }[];
  educationByStatus: { name: string; Activos: number; Egresados: number }[];
  educationBySex: { name: string; Mujeres: number; Hombres: number }[];
  topEducationByCenter: { center: string; level: string; count: number }[];
}

export interface CenterSlice {
  totalCenters: number;
  topCenters: { name: string; total: number; activos: number; egresados: number }[];
  genderByCenter: { name: string; Mujeres: number; Hombres: number }[];
  avgAgeByCenter: { name: string; avgAge: number }[];
}

// ── Helpers ──

const count = (data: Participant[], pred: (p: Participant) => boolean): number =>
  data.filter(pred).length;

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const isEmptyValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' || val === 'N/A' || val === 'N/D';

const topNArr = (data: { name: string; value: number }[], n: number) =>
  data.sort((a, b) => b.value - a.value).slice(0, n);

// ── Hook ──

export function useIndicatorBoards(data: Participant[]): BoardData {
  return useMemo(() => {
    const total = data.length;

    // ── Demographics ──
    const women = count(data, p => isWomen(p.sexo));
    const men = total - women;
    const womenPct = safeDiv(women, total) * 100;
    const menPct = safeDiv(men, total) * 100;

    const ageRegData = data.filter(p => p.edadRegistro > 0);
    const avgAgeReg = ageRegData.length > 0
      ? ageRegData.reduce((s, p) => s + p.edadRegistro, 0) / ageRegData.length
      : 0;

    const buckets: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0 };
    const womenBucket: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0 };
    const menBucket: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0 };
    const maritalCount: Record<string, number> = {};
    const municipioCount: Record<string, number> = {};
    const centroCount: Record<string, number> = {};
    const cursoCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};

    const womenByMuni: Record<string, number> = {};
    const activeByCentro: Record<string, number> = {};
    const graduatedByCentro: Record<string, number> = {};
    const activeByMuni: Record<string, number> = {};
    const graduatedByMuni: Record<string, number> = {};
    const womenByCentro: Record<string, number> = {};
    const menByCentro: Record<string, number> = {};
    const womenByCurso: Record<string, number> = {};
    const menByCurso: Record<string, number> = {};
    const age14_17ByCentro: Record<string, number> = {};
    const age18_24ByCentro: Record<string, number> = {};
    const age14_17ByCurso: Record<string, number> = {};
    const age18_24ByCurso: Record<string, number> = {};

    let totalActive = 0;
    let totalGraduated = 0;
    const minors: number[] = [];

    // Calidad del Dato
    let qualityCedula = 0, qualityBirthDate = 0, qualityEducation = 0;
    let qualityAllergies = 0, qualityDisabilities = 0, qualityDiseases = 0;

    // Vulnerabilidad
    const disabledCountMap: Record<string, number> = {};
    const diseaseCountMap: Record<string, number> = {};
    const allergyCountMap: Record<string, number> = {};
    const socialProgramCountMap: Record<string, number> = {};
    let vulnerabilityDisabilities = 0, vulnerabilityDiseases = 0, vulnerabilityAllergies = 0;
    let vulnerabilitySocialPrograms = 0, vulnerabilityVulnerabilities = 0;

    // Cobertura Temporal
    const yearCounts: Record<string, number> = {};
    const quarterCounts: Record<string, number> = {};
    let totalDaysToInclusion = 0, countWithInclusion = 0;

    // Nivel Educativo
    const educationCounts: Record<string, number> = {};
    const educationActiveStatus: Record<string, number> = {};
    const educationGraduatedStatus: Record<string, number> = {};
    const educationWomenCount: Record<string, number> = {};
    const educationMenCount: Record<string, number> = {};
    const centroEducationLevelCounts: Record<string, Record<string, number>> = {};

    // Desempeño por Centro
    const centroAgeSum: Record<string, number> = {};
    const centroAgeCount: Record<string, number> = {};

    for (const p of data) {
      const age = p.edad || 0;
      const esMujer = isWomen(p.sexo);
      const esHombre = isMen(p.sexo);

      // Age buckets
      let bucketKey = '25+';
      if (age >= 14 && age <= 17) bucketKey = '14-17';
      else if (age >= 18 && age <= 20) bucketKey = '18-20';
      else if (age >= 21 && age <= 24) bucketKey = '21-24';
      buckets[bucketKey]++;
      if (esMujer) womenBucket[bucketKey]++;
      if (esHombre) menBucket[bucketKey]++;

      // Marital status
      if (p.estadoCivil && !isEmptyValue(p.estadoCivil))
        maritalCount[p.estadoCivil] = (maritalCount[p.estadoCivil] || 0) + 1;

      // Municipio
      if (p.municipio) {
        municipioCount[p.municipio] = (municipioCount[p.municipio] || 0) + 1;
        if (esMujer) womenByMuni[p.municipio] = (womenByMuni[p.municipio] || 0) + 1;
      }

      // Centro
      if (p.centro) {
        centroCount[p.centro] = (centroCount[p.centro] || 0) + 1;
        if (esMujer) womenByCentro[p.centro] = (womenByCentro[p.centro] || 0) + 1;
        if (esHombre) menByCentro[p.centro] = (menByCentro[p.centro] || 0) + 1;
        if (age >= 14 && age <= 17) age14_17ByCentro[p.centro] = (age14_17ByCentro[p.centro] || 0) + 1;
        if (age >= 18 && age <= 24) age18_24ByCentro[p.centro] = (age18_24ByCentro[p.centro] || 0) + 1;
        centroAgeSum[p.centro] = (centroAgeSum[p.centro] || 0) + (p.edadRegistro || 0);
        centroAgeCount[p.centro] = (centroAgeCount[p.centro] || 0) + (p.edadRegistro > 0 ? 1 : 0);
      }

      // Curso
      if (p.rutaFormativa) {
        cursoCount[p.rutaFormativa] = (cursoCount[p.rutaFormativa] || 0) + 1;
        if (esMujer) womenByCurso[p.rutaFormativa] = (womenByCurso[p.rutaFormativa] || 0) + 1;
        if (esHombre) menByCurso[p.rutaFormativa] = (menByCurso[p.rutaFormativa] || 0) + 1;
        if (age >= 14 && age <= 17) age14_17ByCurso[p.rutaFormativa] = (age14_17ByCurso[p.rutaFormativa] || 0) + 1;
        if (age >= 18 && age <= 24) age18_24ByCurso[p.rutaFormativa] = (age18_24ByCurso[p.rutaFormativa] || 0) + 1;
      }

      // Status
      const st = p.estado;
      if (st) {
        statusCount[st] = (statusCount[st] || 0) + 1;
        if (isActiveStatus(st)) {
          totalActive++;
          if (p.centro) activeByCentro[p.centro] = (activeByCentro[p.centro] || 0) + 1;
          if (p.municipio) activeByMuni[p.municipio] = (activeByMuni[p.municipio] || 0) + 1;
        }
        if (isGraduatedStatus(st)) {
          totalGraduated++;
          if (p.centro) graduatedByCentro[p.centro] = (graduatedByCentro[p.centro] || 0) + 1;
          if (p.municipio) graduatedByMuni[p.municipio] = (graduatedByMuni[p.municipio] || 0) + 1;
        }
      }

      // Minors tracking
      if (age < 18) minors.push(p.edad);

      // Calidad del Dato
      if (hasValue(p.cedula)) qualityCedula++;
      if (hasValue(p.fechaNacimiento)) qualityBirthDate++;
      if (hasValue(p.nivelEstudio)) qualityEducation++;
      if (hasValue(p.alergias)) qualityAllergies++;
      if (hasValue(p.discapacidades)) qualityDisabilities++;
      if (hasValue(p.enfermedades)) qualityDiseases++;

      // Vulnerabilidad
      if (hasValue(p.discapacidades)) {
        vulnerabilityDisabilities++;
        p.discapacidades!.split(',').forEach(d => {
          const s = d.trim();
          if (s && !isEmptyValue(s)) disabledCountMap[s] = (disabledCountMap[s] || 0) + 1;
        });
      }
      if (hasValue(p.enfermedades)) {
        vulnerabilityDiseases++;
        p.enfermedades!.split(',').forEach(e => {
          const s = e.trim();
          if (s && !isEmptyValue(s)) diseaseCountMap[s] = (diseaseCountMap[s] || 0) + 1;
        });
      }
      if (hasValue(p.alergias)) {
        vulnerabilityAllergies++;
        p.alergias!.split(',').forEach(a => {
          const s = a.trim();
          if (s && !isEmptyValue(s)) allergyCountMap[s] = (allergyCountMap[s] || 0) + 1;
        });
      }
      if (hasValue(p.programasSociales)) {
        vulnerabilitySocialPrograms++;
        p.programasSociales!.split(',').forEach(pr => {
          const s = pr.trim();
          if (s && !isEmptyValue(s)) socialProgramCountMap[s] = (socialProgramCountMap[s] || 0) + 1;
        });
      }
      if (hasValue(p.vulnerabilidades)) {
        vulnerabilityVulnerabilities++;
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
          if (isActiveStatus(se)) educationActiveStatus[p.nivelEstudio] = (educationActiveStatus[p.nivelEstudio] || 0) + 1;
          if (isGraduatedStatus(se)) educationGraduatedStatus[p.nivelEstudio] = (educationGraduatedStatus[p.nivelEstudio] || 0) + 1;
        }
        if (esMujer) educationWomenCount[p.nivelEstudio] = (educationWomenCount[p.nivelEstudio] || 0) + 1;
        if (esHombre) educationMenCount[p.nivelEstudio] = (educationMenCount[p.nivelEstudio] || 0) + 1;
        if (p.centro) {
          if (!centroEducationLevelCounts[p.centro]) centroEducationLevelCounts[p.centro] = {};
          centroEducationLevelCounts[p.centro][p.nivelEstudio] = (centroEducationLevelCounts[p.centro][p.nivelEstudio] || 0) + 1;
        }
      }
    }

    const minorsCount = minors.length;
    const minorsWithTutor = count(data, p => (p.edad || 0) < 18 && !!p.tutor && !isEmptyValue(p.tutor));
    const tutorsTotal = data.filter(p => !!p.tutor && !isEmptyValue(p.tutor));
    const tutorsWithPhone = tutorsTotal.filter(p => p.telefonosResponsable && !isEmptyValue(p.telefonosResponsable));
    const withPhone = count(data, p => !isEmptyValue(p.telefonos));
    const withAddress = count(data, p => !isEmptyValue(p.direccion));

    // ── Build Chart Data ──

    const ageBuckets = Object.entries(buckets).map(([name, value]) => ({ name, value }));
    const maritalStatus = Object.entries(maritalCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const genderAgeCross = Object.keys(buckets).map(key => ({
      name: key,
      Mujeres: womenBucket[key],
      Hombres: menBucket[key],
    }));

    const topMunicipios = topNArr(
      Object.entries(municipioCount).map(([name, value]) => ({ name, value })),
      10
    );
    const topCentros = topNArr(
      Object.entries(centroCount).map(([name, value]) => ({ name, value })),
      10
    );
    const topCursos = topNArr(
      Object.entries(cursoCount).map(([name, value]) => ({ name, value })),
      10
    );
    const genderByMunicipio = topMunicipios.map(m => ({
      name: m.name,
      Mujeres: womenByMuni[m.name] || 0,
      Hombres: m.value - (womenByMuni[m.name] || 0),
    }));

    const statusDistribution = Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const activeVsGraduatedByCentro = topCentros.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
      Activos: activeByCentro[c.name] || 0,
      Egresados: graduatedByCentro[c.name] || 0,
    }));
    const activeVsGraduatedByMunicipio = topMunicipios.map(m => ({
      name: m.name,
      Activos: activeByMuni[m.name] || 0,
      Egresados: graduatedByMuni[m.name] || 0,
    }));

    const genderByCentro = topCentros.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
      Mujeres: womenByCentro[c.name] || 0,
      Hombres: menByCentro[c.name] || 0,
    }));
    const genderByCurso = topCursos.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
      Mujeres: womenByCurso[c.name] || 0,
      Hombres: menByCurso[c.name] || 0,
    }));
    const ageByCentro = topCentros.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
      r14_17: age14_17ByCentro[c.name] || 0,
      r18_24: age18_24ByCentro[c.name] || 0,
    }));
    const ageByCurso = topCursos.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '…' : c.name,
      r14_17: age14_17ByCurso[c.name] || 0,
      r18_24: age18_24ByCurso[c.name] || 0,
    }));

    // ── Quality Data ──
    const qualityFieldBreakdown = [
      { name: 'C\u00e9dula', pct: safeDiv(qualityCedula, total) * 100, total: qualityCedula, ndCount: total - qualityCedula },
      { name: 'Fecha de nacimiento', pct: safeDiv(qualityBirthDate, total) * 100, total: qualityBirthDate, ndCount: total - qualityBirthDate },
      { name: 'Nivel de estudio', pct: safeDiv(qualityEducation, total) * 100, total: qualityEducation, ndCount: total - qualityEducation },
      { name: 'Alergias', pct: safeDiv(qualityAllergies, total) * 100, total: qualityAllergies, ndCount: total - qualityAllergies },
      { name: 'Discapacidades', pct: safeDiv(qualityDisabilities, total) * 100, total: qualityDisabilities, ndCount: total - qualityDisabilities },
      { name: 'Enfermedades', pct: safeDiv(qualityDiseases, total) * 100, total: qualityDiseases, ndCount: total - qualityDiseases },
    ];

    // ── Vulnerability Data ──
    const topDisArr = (map: Record<string, number>, n: number): { name: string; value: number }[] =>
      Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, n);

    // ── Temporal Data ──
    const yearsSorted = Object.keys(yearCounts).sort();
    const registrationsByYear = yearsSorted.map(y => ({ name: y, value: yearCounts[y] }));
    const yearGrowth = yearsSorted.slice(1).map(y => {
      const prevIdx = yearsSorted.indexOf(String(Number(y) - 1));
      if (prevIdx < 0) return { name: y, growth: 0 };
      const prev = yearCounts[yearsSorted[prevIdx]];
      const curr = yearCounts[y];
      return { name: y, growth: prev > 0 ? ((curr - prev) / prev) * 100 : 0 };
    });
    const avgAgeAtRegistration = ageRegData.length > 0
      ? ageRegData.reduce((s, p) => s + p.edadRegistro, 0) / ageRegData.length
      : 0;
    const avgDaysToInclusion = countWithInclusion > 0 ? totalDaysToInclusion / countWithInclusion : 0;
    const registrationsByQuarter = Object.entries(quarterCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));

    // ── Education Data ──
    const educationDistribution = Object.entries(educationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const eduKeys = educationDistribution.map(e => e.name);
    const educationByStatus = eduKeys.map(name => ({
      name,
      Activos: educationActiveStatus[name] || 0,
      Egresados: educationGraduatedStatus[name] || 0,
    }));
    const educationBySex = eduKeys.map(name => ({
      name,
      Mujeres: educationWomenCount[name] || 0,
      Hombres: educationMenCount[name] || 0,
    }));

    const topEducationByCenter = Object.entries(centroEducationLevelCounts)
      .map(([centro, levels]) => {
        const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
        return { center: centro, level: top[0], count: top[1] };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Center Data ──
    const topCenters = Object.entries(centroCount)
      .map(([name, totalVal]) => ({
        name: name.length > 20 ? name.substring(0, 18) + '…' : name,
        total: totalVal,
        activos: activeByCentro[name] || 0,
        egresados: graduatedByCentro[name] || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const genderByCenter = topCenters.map(c => ({
      name: c.name,
      Mujeres: womenByCentro[c.name] || (() => {
        const orig = Object.entries(centroCount).find(([k]) => (k.length > 20 ? k.substring(0, 18) + '…' : k) === c.name)?.[0];
        return orig ? (womenByCentro[orig] || 0) : 0;
      })(),
      Hombres: menByCentro[c.name] || (() => {
        const orig = Object.entries(centroCount).find(([k]) => (k.length > 20 ? k.substring(0, 18) + '…' : k) === c.name)?.[0];
        return orig ? (menByCentro[orig] || 0) : 0;
      })(),
    }));

    const avgAgeByCenter = Object.entries(centroCount)
      .map(([name]) => {
        const aSum = centroAgeSum[name] || 0;
        const aCnt = centroAgeCount[name] || 0;
        return {
          name: name.length > 20 ? name.substring(0, 18) + '…' : name,
          avgAge: aCnt > 0 ? aSum / aCnt : 0,
        };
      })
      .sort((a, b) => b.avgAge - a.avgAge)
      .slice(0, 10);

    return {
      demographicData: {
        total, women, men, womenPct, menPct, avgAgeReg,
        ageBuckets, maritalStatus, genderAgeCross,
      },
      territorialData: {
        municipioCount: Object.keys(municipioCount).length,
        centroCount: Object.keys(centroCount).length,
        cursoCount: Object.keys(cursoCount).length,
        topMunicipios, topCentros, topCursos, genderByMunicipio,
      },
      programData: {
        activePct: safeDiv(totalActive, total) * 100,
        graduatedPct: safeDiv(totalGraduated, total) * 100,
        minorsWithTutorPct: minorsCount > 0 ? safeDiv(minorsWithTutor, minorsCount) * 100 : 0,
        tutorsWithPhonePct: tutorsTotal.length > 0 ? safeDiv(tutorsWithPhone.length, tutorsTotal.length) * 100 : 0,
        statusDistribution, activeVsGraduatedByCentro, activeVsGraduatedByMunicipio,
      },
      socialData: {
        phoneCompletenessPct: safeDiv(withPhone, total) * 100,
        addressCompletenessPct: safeDiv(withAddress, total) * 100,
        genderByCentro, genderByCurso, ageByCentro, ageByCurso,
      },
      qualityData: {
        cedulaPct: safeDiv(qualityCedula, total) * 100,
        birthDatePct: safeDiv(qualityBirthDate, total) * 100,
        educationPct: safeDiv(qualityEducation, total) * 100,
        allergiesPct: safeDiv(qualityAllergies, total) * 100,
        disabilitiesPct: safeDiv(qualityDisabilities, total) * 100,
        diseasesPct: safeDiv(qualityDiseases, total) * 100,
        fieldBreakdown: qualityFieldBreakdown,
      },
      vulnerabilityData: {
        disabilitiesPct: safeDiv(vulnerabilityDisabilities, total) * 100,
        diseasesPct: safeDiv(vulnerabilityDiseases, total) * 100,
        allergiesPct: safeDiv(vulnerabilityAllergies, total) * 100,
        socialProgramsPct: safeDiv(vulnerabilitySocialPrograms, total) * 100,
        vulnerabilitiesPct: safeDiv(vulnerabilityVulnerabilities, total) * 100,
        topDisabilities: topDisArr(disabledCountMap, 3),
        topDiseases: topDisArr(diseaseCountMap, 3),
        topAllergies: topDisArr(allergyCountMap, 3),
        topSocialPrograms: topDisArr(socialProgramCountMap, 3),
      },
      temporalData: {
        registrationsByYear,
        yearGrowth,
        avgAgeAtRegistration,
        avgDaysToInclusion,
        registrationsByQuarter,
      },
      educationData: {
        educationDistribution,
        educationByStatus,
        educationBySex,
        topEducationByCenter,
      },
      centerData: {
        totalCenters: Object.keys(centroCount).length,
        topCenters,
        genderByCenter,
        avgAgeByCenter,
      },
    };
  }, [data]);
}
