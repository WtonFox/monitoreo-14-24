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
    };
  }, [data]);
}
