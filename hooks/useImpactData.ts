import { useMemo } from 'react';
import type { Participant } from '../types';
import { hasValue } from '../utils/normalize';

// ── Types ──

export interface ImpactData {
  /** 1. Social Programs — coverage and top programs */
  programCoverage: {
    totalWithPrograms: number;
    pctWithPrograms: number;
    topPrograms: { name: string; value: number }[];
  };

  /** 2. Health Profile — alergias, discapacidades, enfermedades */
  healthProfile: {
    alergias: { total: number; pct: number; topItems: { name: string; value: number }[] };
    discapacidades: { total: number; pct: number; topItems: { name: string; value: number }[] };
    enfermedades: { total: number; pct: number; topItems: { name: string; value: number }[] };
  };

  /** 3. Registration → Inclusion time delta */
  inclusionTime: {
    avgDays: number;
    distribution: { name: string; value: number }[];
  };

  /** 4. Tutor analysis */
  tutorAnalysis: {
    pctWithTutor: number;
    pctTutorsWithPhone: number;
    topTutors: { name: string; value: number }[];
  };

  /** 5. Data quality (phone + address) by province */
  dataQuality: { name: string; phonePct: number; addressPct: number }[];

  /** 6. Vulnerability × Social Programs cross */
  vulnVsPrograms: { name: string; programs: { name: string; value: number }[] }[];

  /** 7. Age at registration vs current age */
  ageComparison: { avgAgeReg: number; avgAgeNow: number };
}

// ── Helpers ──

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

/** Split a comma-separated field, trim, and filter out empty/N/D/N/A values */
const splitAndFilter = (val: string | null | undefined): string[] => {
  if (!hasValue(val)) return [];
  return val!
    .split(',')
    .map(v => v.trim())
    .filter(v => v && v !== 'N/D' && v !== 'N/A' && v !== 'Ninguna');
};

/** Count occurrences per item across all participants for a comma-separated field */
const countFieldItems = (
  data: Participant[],
  field: keyof Pick<Participant, 'alergias' | 'discapacidades' | 'enfermedades' | 'programasSociales'>,
): { counts: Record<string, number>; totalWithField: number } => {
  const counts: Record<string, number> = {};
  let totalWithField = 0;
  for (const p of data) {
    const items = splitAndFilter(p[field] as string | null | undefined);
    if (items.length > 0) totalWithField++;
    for (const item of items) {
      counts[item] = (counts[item] || 0) + 1;
    }
  }
  return { counts, totalWithField };
};

const MAX_REASONABLE_DAYS = 3650; // ~10 years ceiling

// ── Hook ──

export function useImpactData(data: Participant[]): ImpactData {
  return useMemo(() => {
    const total = data.length;

    // ── 1. Program Coverage ──
    const { counts: programCounts, totalWithField: totalWithPrograms } =
      countFieldItems(data, 'programasSociales');
    const pctWithPrograms = safeDiv(totalWithPrograms, total) * 100;
    const topPrograms = Object.entries(programCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // ── 2. Health Profile ──
    const healthFields = ['alergias', 'discapacidades', 'enfermedades'] as const;
    const healthProfile = {} as ImpactData['healthProfile'];
    for (const field of healthFields) {
      const { counts, totalWithField } = countFieldItems(data, field);
      healthProfile[field] = {
        total: totalWithField,
        pct: safeDiv(totalWithField, total) * 100,
        topItems: Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5),
      };
    }

    // ── 3. Inclusion Time ──
    const daysDiffs: number[] = [];
    for (const p of data) {
      if (!p.fechaRegistro || !p.fechaInclusion) continue;
      try {
        const regDate = new Date(p.fechaRegistro);
        const incDate = new Date(p.fechaInclusion);
        if (isNaN(regDate.getTime()) || isNaN(incDate.getTime())) continue;
        const diff = (incDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff >= 0 && diff <= MAX_REASONABLE_DAYS) {
          daysDiffs.push(diff);
        }
      } catch {
        // skip malformed dates
      }
    }
    const avgDays =
      daysDiffs.length > 0
        ? Math.round(daysDiffs.reduce((s, d) => s + d, 0) / daysDiffs.length)
        : 0;
    const distribution = [
      { name: '0–30 días', value: daysDiffs.filter(d => d >= 0 && d <= 30).length },
      { name: '31–90 días', value: daysDiffs.filter(d => d > 30 && d <= 90).length },
      { name: '91–180 días', value: daysDiffs.filter(d => d > 90 && d <= 180).length },
      { name: '181–365 días', value: daysDiffs.filter(d => d > 180 && d <= 365).length },
      { name: '+365 días', value: daysDiffs.filter(d => d > 365).length },
    ];

    // ── 4. Tutor Analysis ──
    const withTutor = data.filter(p => hasValue(p.tutor));
    const tutorsWithPhone = withTutor.filter(p => hasValue(p.telefonosResponsable));
    const tutorCounts: Record<string, number> = {};
    for (const p of withTutor) {
      if (p.tutor) {
        const name = p.tutor.trim();
        if (name) tutorCounts[name] = (tutorCounts[name] || 0) + 1;
      }
    }
    const topTutors = Object.entries(tutorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const pctWithTutor = safeDiv(withTutor.length, total) * 100;
    const pctTutorsWithPhone = safeDiv(tutorsWithPhone.length, withTutor.length) * 100;

    // ── 5. Data Quality by Province ──
    const provinceMap: Record<string, { total: number; withPhone: number; withAddress: number }> = {};
    for (const p of data) {
      const prov = p.provincia || 'Desconocido';
      if (!provinceMap[prov]) provinceMap[prov] = { total: 0, withPhone: 0, withAddress: 0 };
      provinceMap[prov].total++;
      if (hasValue(p.telefonos)) provinceMap[prov].withPhone++;
      if (hasValue(p.direccion)) provinceMap[prov].withAddress++;
    }
    const dataQuality = Object.entries(provinceMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 15)
      .map(([name, { total, withPhone, withAddress }]) => ({
        name,
        phonePct: safeDiv(withPhone, total) * 100,
        addressPct: safeDiv(withAddress, total) * 100,
      }));

    // ── 6. Vulnerabilities × Social Programs ──
    const vulnProgramsMap: Record<string, Record<string, number>> = {};
    for (const p of data) {
      if (!hasValue(p.vulnerabilidades) || !hasValue(p.programasSociales)) continue;
      const vulns = splitAndFilter(p.vulnerabilidades);
      const progs = splitAndFilter(p.programasSociales);
      for (const vuln of vulns) {
        if (!vulnProgramsMap[vuln]) vulnProgramsMap[vuln] = {};
        for (const prog of progs) {
          vulnProgramsMap[vuln][prog] = (vulnProgramsMap[vuln][prog] || 0) + 1;
        }
      }
    }
    const vulnVsPrograms = Object.entries(vulnProgramsMap)
      .map(([name, progs]) => {
        const entries = Object.entries(progs)
          .map(([n, value]) => ({ name: n, value }))
          .sort((a, b) => b.value - a.value);
        const totalEntries = entries.reduce((s, e) => s + e.value, 0);
        return { name, total: totalEntries, programs: entries };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(({ name, programs }) => ({ name, programs }));

    // ── 7. Age Comparison ──
    const ageRegData = data.filter(p => p.edadRegistro > 0);
    const avgAgeReg =
      ageRegData.length > 0
        ? ageRegData.reduce((s, p) => s + p.edadRegistro, 0) / ageRegData.length
        : 0;
    const ageNowData = data.filter(p => p.edad > 0);
    const avgAgeNow =
      ageNowData.length > 0
        ? ageNowData.reduce((s, p) => s + p.edad, 0) / ageNowData.length
        : 0;

    return {
      programCoverage: { totalWithPrograms, pctWithPrograms, topPrograms },
      healthProfile,
      inclusionTime: { avgDays, distribution },
      tutorAnalysis: { pctWithTutor, pctTutorsWithPhone, topTutors },
      dataQuality,
      vulnVsPrograms,
      ageComparison: { avgAgeReg, avgAgeNow },
    };
  }, [data]);
}
