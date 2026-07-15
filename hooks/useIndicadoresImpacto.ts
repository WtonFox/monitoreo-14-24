import { useMemo } from 'react';
import type { Participant } from '../types';
import { hasValue, isActiveStatus, isGraduatedStatus } from '../utils/normalize';

// ── Types ──

export interface GroupedValue {
  group: string;
  value: number;
  pct: number;
  status?: 'viable' | 'no-viable';
}

export interface CompositeIndicator {
  id: string;
  label: string;
  status: 'viable' | 'no-viable';
  groups: GroupedValue[];
}

export interface RankedItem {
  name: string;
  value: number;
  pct?: number;
  isNa?: boolean;
}

export interface CompositeIndicators {
  vulnByProgramStatus: CompositeIndicator;
  programsByGraduation: CompositeIndicator;
  genderByRetention: CompositeIndicator;
  ageByGraduation: CompositeIndicator & { counts: GroupedValue[] };
  inclusionTimeByCenter: RankedItem[];
  educationByPrograms: CompositeIndicator;
  multiVulnConcentration: CompositeIndicator;
  provinceSuccessRate: RankedItem[];
  coverageByVulnerability: { pct: number; status: 'viable' | 'no-viable' };
  tutorByRetention: CompositeIndicator;
}

// ── Helpers ──

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const splitAndFilter = (val: string | null | undefined): string[] => {
  if (!hasValue(val)) return [];
  return val!
    .split(',')
    .map(v => v.trim())
    .filter(v => v && v !== 'N/D' && v !== 'N/A' && v !== 'Ninguna');
};

const makeComposite = (
  id: string,
  label: string,
  groups: GroupedValue[],
  hasKeyData: boolean,
): CompositeIndicator => ({
  id,
  label,
  status: hasKeyData ? 'viable' : 'no-viable',
  groups,
});

// ── Hook ──

export function useIndicadoresImpacto(data: Participant[]): CompositeIndicators {
  return useMemo(() => {
    const total = data.length;

    // ── R1: Vulnerability × Program Status ──
    let vulnActive = 0, vulnGrad = 0, vulnTotal = 0;
    let nonVulnActive = 0, nonVulnGrad = 0, nonVulnTotal = 0;
    for (const p of data) {
      const isVuln = hasValue(p.vulnerabilidades);
      if (isVuln) {
        vulnTotal++;
        if (isActiveStatus(p.estado)) vulnActive++;
        if (isGraduatedStatus(p.estado)) vulnGrad++;
      } else {
        nonVulnTotal++;
        if (isActiveStatus(p.estado)) nonVulnActive++;
        if (isGraduatedStatus(p.estado)) nonVulnGrad++;
      }
    }
    const vulnByProgramStatus = makeComposite(
      'vuln-by-status',
      'Vulnerabilidad × Estado del Programa',
      [
        { group: 'Vulnerable — Activo', value: vulnActive, pct: safeDiv(vulnActive, vulnTotal) * 100 },
        { group: 'Vulnerable — Egresado', value: vulnGrad, pct: safeDiv(vulnGrad, vulnTotal) * 100 },
        { group: 'No vulnerable — Activo', value: nonVulnActive, pct: safeDiv(nonVulnActive, nonVulnTotal) * 100 },
        { group: 'No vulnerable — Egresado', value: nonVulnGrad, pct: safeDiv(nonVulnGrad, nonVulnTotal) * 100 },
      ],
      vulnTotal > 0,
    );

    // ── R2: Social Programs × Graduation Rate ──
    let withProgGrad = 0, withProgTotal = 0;
    let withoutProgGrad = 0, withoutProgTotal = 0;
    for (const p of data) {
      const hasProg = hasValue(p.programasSociales);
      if (hasProg) {
        withProgTotal++;
        if (isGraduatedStatus(p.estado)) withProgGrad++;
      } else {
        withoutProgTotal++;
        if (isGraduatedStatus(p.estado)) withoutProgGrad++;
      }
    }
    const programsByGraduation = makeComposite(
      'programs-by-graduation',
      'Programas Sociales × Tasa de Egreso',
      [
        { group: 'Con programas', value: withProgTotal, pct: safeDiv(withProgGrad, withProgTotal) * 100 },
        { group: 'Sin programas', value: withoutProgTotal, pct: safeDiv(withoutProgGrad, withoutProgTotal) * 100 },
      ],
      withProgTotal > 0,
    );

    // ── R3: Gender × Retention ──
    let mActive = 0, mTotal = 0;
    let fActive = 0, fTotal = 0;
    let nullActive = 0, nullTotal = 0;
    for (const p of data) {
      const sex = p.sexo?.toUpperCase() ?? null;
      if (sex === 'M') {
        mTotal++;
        if (isActiveStatus(p.estado)) mActive++;
      } else if (sex === 'F') {
        fTotal++;
        if (isActiveStatus(p.estado)) fActive++;
      } else {
        nullTotal++;
        if (isActiveStatus(p.estado)) nullActive++;
      }
    }
    const hasGenderData = mTotal + fTotal > 0;
    const genderByRetention = makeComposite(
      'gender-by-retention',
      'Sexo × Retención',
      [
        { group: 'Masculino', value: mTotal, pct: safeDiv(mActive, mTotal) * 100 },
        { group: 'Femenino', value: fTotal, pct: safeDiv(fActive, fTotal) * 100 },
        { group: 'Sin registro', value: nullTotal, pct: safeDiv(nullActive, nullTotal) * 100 },
      ],
      hasGenderData,
    );

    // ── R4: Age Group × Graduation ──
    const ageBuckets: Record<string, { count: number; graduated: number }> = {
      '14-17': { count: 0, graduated: 0 },
      '18-20': { count: 0, graduated: 0 },
      '21-24': { count: 0, graduated: 0 },
    };
    for (const p of data) {
      const age = p.edad;
      let key: string | null = null;
      if (age >= 14 && age <= 17) key = '14-17';
      else if (age >= 18 && age <= 20) key = '18-20';
      else if (age >= 21 && age <= 24) key = '21-24';
      if (key) {
        ageBuckets[key].count++;
        if (isGraduatedStatus(p.estado)) ageBuckets[key].graduated++;
      }
    }
    const ageGroups = Object.entries(ageBuckets).map(([group, { count, graduated }]) => ({
      group,
      value: count,
      pct: safeDiv(graduated, count) * 100,
    }));
    const ageCounts = Object.entries(ageBuckets).map(([group, { count }]) => ({
      group,
      value: count,
      pct: safeDiv(count, total) * 100,
    }));
    const hasAgeData = ageGroups.some(g => g.value > 0);
    const ageByGraduation: CompositeIndicator & { counts: GroupedValue[] } = {
      ...makeComposite('age-by-graduation', 'Edad × Egreso', ageGroups, hasAgeData),
      counts: ageCounts,
    };

    // ── R5: Inclusion Time by Center ──
    // Collect ALL centers with participants
    const allCenters = new Set<string>();
    data.forEach(p => { if (p.centro) allCenters.add(p.centro); });
    // Process centers WITH inclusion data
    const centerMap: Record<string, { totalDays: number; count: number }> = {};
    for (const p of data) {
      if (!p.centro) continue;
      if (!p.fechaRegistro || !p.fechaInclusion) continue;
      try {
        const regDate = new Date(p.fechaRegistro);
        const incDate = new Date(p.fechaInclusion);
        if (isNaN(regDate.getTime()) || isNaN(incDate.getTime())) continue;
        const diff = (incDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff < 0 || diff > 3650) continue; // cap at ~10 years
        if (!centerMap[p.centro]) centerMap[p.centro] = { totalDays: 0, count: 0 };
        centerMap[p.centro].totalDays += diff;
        centerMap[p.centro].count++;
      } catch {
        // skip malformed dates
      }
    }
    // Build result: centers WITH data sorted, then centers WITHOUT data at the end
    const centersWithData = new Set(Object.keys(centerMap));
    const inclusionTimeByCenter: RankedItem[] = [];
    // Add centers with data (sorted descending by avg days)
    const withData = Object.entries(centerMap)
      .map(([name, { totalDays, count }]) => ({
        name,
        value: Math.round(totalDays / count),
      }))
      .sort((a, b) => b.value - a.value);
    inclusionTimeByCenter.push(...withData);
    // Add centers without data at the bottom (sorted alphabetically)
    const naCenters = Array.from(allCenters)
      .filter(c => !centersWithData.has(c))
      .sort()
      .map(name => ({ name, value: 0, isNa: true }));
    inclusionTimeByCenter.push(...naCenters);
    const hasCenterData = withData.length > 0;

    // ── R6: Education × Social Programs ──
    const eduCounts: Record<string, number> = {};
    let eduWithProgTotal = 0;
    for (const p of data) {
      if (!hasValue(p.programasSociales)) continue;
      if (hasValue(p.nivelEstudio)) {
        const level = p.nivelEstudio!.trim();
        eduCounts[level] = (eduCounts[level] || 0) + 1;
        eduWithProgTotal++;
      }
    }
    const eduGroups = Object.entries(eduCounts)
      .map(([group, value]) => ({
        group,
        value,
        pct: safeDiv(value, eduWithProgTotal) * 100,
      }))
      .sort((a, b) => b.value - a.value);
    const educationByPrograms = makeComposite(
      'education-by-programs',
      'Nivel Educativo × Programas Sociales',
      eduGroups,
      eduWithProgTotal > 0,
    );

    // ── R7: Multi-vulnerability Concentration ──
    let zeroVuln = 0, oneVuln = 0, multiVuln = 0;
    let vulnDataFound = false;
    for (const p of data) {
      const items = splitAndFilter(p.vulnerabilidades);
      if (items.length > 0) vulnDataFound = true;
      if (items.length === 0) zeroVuln++;
      else if (items.length === 1) oneVuln++;
      else multiVuln++;
    }
    const vulnTotalCount = zeroVuln + oneVuln + multiVuln;
    const multiVulnConcentration = makeComposite(
      'multi-vuln-concentration',
      'Concentración de Vulnerabilidades',
      [
        { group: '0 condiciones', value: zeroVuln, pct: safeDiv(zeroVuln, vulnTotalCount) * 100 },
        { group: '1 condición', value: oneVuln, pct: safeDiv(oneVuln, vulnTotalCount) * 100 },
        { group: '2+ condiciones', value: multiVuln, pct: safeDiv(multiVuln, vulnTotalCount) * 100 },
      ],
      vulnDataFound,
    );

    // ── R8: Province Success Rate ──
    const provMap: Record<string, { active: number; graduated: number }> = {};
    for (const p of data) {
      const prov = p.provincia || 'Desconocido';
      if (!provMap[prov]) provMap[prov] = { active: 0, graduated: 0 };
      if (isActiveStatus(p.estado)) provMap[prov].active++;
      if (isGraduatedStatus(p.estado)) provMap[prov].graduated++;
    }
    const hasProvData = Object.values(provMap).some(p => p.active + p.graduated > 0);
    const provinceSuccessRate: RankedItem[] = Object.entries(provMap)
      .map(([name, { active, graduated }]) => {
        const denominator = active + graduated;
        return {
          name,
          value: denominator > 0 ? Math.round((graduated / denominator) * 100) : 0,
          pct: denominator > 0 ? (graduated / denominator) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value);

    // ── R9: Coverage × Vulnerability ──
    let vulnInPrograms = 0, totalVuln = 0;
    for (const p of data) {
      if (!hasValue(p.vulnerabilidades)) continue;
      totalVuln++;
      if (hasValue(p.programasSociales)) vulnInPrograms++;
    }
    const coveragePct = safeDiv(vulnInPrograms, totalVuln) * 100;
    const coverageByVulnerability = {
      pct: coveragePct,
      status: (totalVuln > 0 ? 'viable' : 'no-viable') as 'viable' | 'no-viable',
    };

    // ── R10: Tutor Assignment × Retention ──
    let withTutorActive = 0, withTutorTotal = 0;
    let withoutTutorActive = 0, withoutTutorTotal = 0;
    for (const p of data) {
      if (hasValue(p.tutor)) {
        withTutorTotal++;
        if (isActiveStatus(p.estado)) withTutorActive++;
      } else {
        withoutTutorTotal++;
        if (isActiveStatus(p.estado)) withoutTutorActive++;
      }
    }
    const tutorGroups: GroupedValue[] = [
      {
        group: 'Con tutor',
        value: withTutorTotal,
        pct: safeDiv(withTutorActive, withTutorTotal) * 100,
        status: withTutorTotal > 0 ? 'viable' : 'no-viable',
      },
      {
        group: 'Sin tutor',
        value: withoutTutorTotal,
        pct: safeDiv(withoutTutorActive, withoutTutorTotal) * 100,
        status: withoutTutorTotal > 0 ? 'viable' : 'no-viable',
      },
    ];
    const tutorByRetention: CompositeIndicator = {
      id: 'tutor-by-retention',
      label: 'Tutor × Retención',
      status: tutorGroups.some(g => g.status === 'viable') ? 'viable' : 'no-viable',
      groups: tutorGroups,
    };

    return {
      vulnByProgramStatus,
      programsByGraduation,
      genderByRetention,
      ageByGraduation,
      inclusionTimeByCenter,
      educationByPrograms,
      multiVulnConcentration,
      provinceSuccessRate,
      coverageByVulnerability,
      tutorByRetention,
    };
  }, [data]);
}
