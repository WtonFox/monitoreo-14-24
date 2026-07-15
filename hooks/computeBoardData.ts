import type { Participant } from '../types';
import { isWomen, isMen, isActiveStatus, isGraduatedStatus, hasValue } from '../utils/normalize';

export type BoardCategory =
  | 'demographic'
  | 'territorial'
  | 'program'
  | 'quality'
  | 'vulnerability'
  | 'temporal'
  | 'education'
  | 'center';

export interface BoardData {
  demographicData: DemographicSlice;
  territorialData: TerritorialSlice;
  programData: ProgramSlice;
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
  unknown: number;
  womenPct: number;
  menPct: number;
  unknownPct: number;
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
  evolutionByYear: { name: string; Activos: number; Egresados: number; Retirados: number }[];
  statusByCurso: { name: string; Activos: number; Egresados: number }[];
  contactabilidadByCentro: { name: string; totalTutores: number; conTelefono: number; pct: number }[];
  minorsTutorByCentro: { name: string; totalMenores: number; conTutor: number; pct: number }[];
  avgAgeByStatus: { activeAvg: number; graduatedAvg: number };
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

const count = (data: Participant[], pred: (p: Participant) => boolean): number =>
  data.filter(pred).length;

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const isEmptyValue = (val: string | null | undefined): boolean =>
  val === null || val === undefined || val.trim() === '' || val === 'N/A' || val === 'N/D';

const topNArr = (data: { name: string; value: number }[], n: number) =>
  data.sort((a, b) => b.value - a.value).slice(0, n);

const emptyDemographicSlice = (total = 0): DemographicSlice => ({
  total, women: 0, men: 0, unknown: 0, womenPct: 0, menPct: 0, unknownPct: 0,
  avgAgeReg: 0, ageBuckets: [], maritalStatus: [], genderAgeCross: [],
});

const emptyTerritorialSlice = (): TerritorialSlice => ({
  municipioCount: 0, centroCount: 0, cursoCount: 0,
  topMunicipios: [], topCentros: [], topCursos: [], genderByMunicipio: [],
});

const emptyProgramSlice = (): ProgramSlice => ({
  activePct: 0, graduatedPct: 0, minorsWithTutorPct: 0, tutorsWithPhonePct: 0,
  statusDistribution: [], activeVsGraduatedByCentro: [], activeVsGraduatedByMunicipio: [],
  evolutionByYear: [], statusByCurso: [], contactabilidadByCentro: [],
  minorsTutorByCentro: [], avgAgeByStatus: { activeAvg: 0, graduatedAvg: 0 },
});

const emptyQualitySlice = (): QualitySlice => ({
  cedulaPct: 0, birthDatePct: 0, educationPct: 0, allergiesPct: 0,
  disabilitiesPct: 0, diseasesPct: 0, fieldBreakdown: [],
});

const emptyVulnerabilitySlice = (): VulnerabilitySlice => ({
  disabilitiesPct: 0, diseasesPct: 0, allergiesPct: 0,
  socialProgramsPct: 0, vulnerabilitiesPct: 0,
  topDisabilities: [], topDiseases: [], topAllergies: [], topSocialPrograms: [],
});

const emptyTemporalSlice = (): TemporalSlice => ({
  registrationsByYear: [], yearGrowth: [], avgAgeAtRegistration: 0,
  avgDaysToInclusion: 0, registrationsByQuarter: [],
});

const emptyEducationSlice = (): EducationSlice => ({
  educationDistribution: [], educationByStatus: [], educationBySex: [],
  topEducationByCenter: [],
});

const emptyCenterSlice = (): CenterSlice => ({
  totalCenters: 0, topCenters: [], genderByCenter: [], avgAgeByCenter: [],
});

export function computeBoardData(
  data: Participant[],
  activeBoard: BoardCategory | 'all' = 'all',
): BoardData {
  const total = data.length;
  const needs = (cat: BoardCategory): boolean =>
    activeBoard === 'all' || activeBoard === cat;

  const needsDemo = needs('demographic');
  const needsTerr = needs('territorial');
  const needsProg = needs('program');
  const needsQual = needs('quality');
  const needsVuln = needs('vulnerability');
  const needsTemp = needs('temporal');
  const needsEdu  = needs('education');
  const needsCtr  = needs('center');
  const needsTop  = needsTerr || needsProg || needsCtr;
  const needsStatus = needsProg || needsCtr;

  let women = 0, men = 0, unknownSex = 0;
  let ageRegSum = 0, ageRegCount = 0;

  const buckets: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0, Unknown: 0 };
  const womenBucket: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0, Unknown: 0 };
  const menBucket: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25+': 0, Unknown: 0 };
  const maritalCount: Record<string, number> = {};
  const municipioCount: Record<string, number> = {};
  const centroCount: Record<string, number> = {};
  const cursoCount: Record<string, number> = {};

  const womenByMuni: Record<string, number> = {};
  const womenByCentro: Record<string, number> = {};
  const menByCentro: Record<string, number> = {};

  let totalActive = 0, totalGraduated = 0;
  const activeByCentro: Record<string, number> = {};
  const graduatedByCentro: Record<string, number> = {};
  const activeByMuni: Record<string, number> = {};
  const graduatedByMuni: Record<string, number> = {};
  const statusCount: Record<string, number> = {};

  const womenByCurso: Record<string, number> = {};
  const menByCurso: Record<string, number> = {};
  const age14_17ByCurso: Record<string, number> = {};
  const age18_24ByCurso: Record<string, number> = {};
  const age14_17ByCentro: Record<string, number> = {};
  const age18_24ByCentro: Record<string, number> = {};
  const centroAgeSum: Record<string, number> = {};
  const centroAgeCount: Record<string, number> = {};

  const minors: number[] = [];
  let minorsCount = 0;

  // Accumulators for new program indicators (fortalecer-estado-programa)
  const yearsAcc: Record<string, Record<string, number>> = {};
  const cursoAcc: Record<string, Record<string, number>> = {};
  const contactAcc: Record<string, { totalTutores: number; conTelefono: number }> = {};
  const minorsAcc: Record<string, { totalMenores: number; conTutor: number }> = {};
  let activeAgeSum = 0, activeAgeCount = 0;
  let graduatedAgeSum = 0, graduatedAgeCount = 0;

  let qualityCedula = 0, qualityBirthDate = 0, qualityEducation = 0;
  let qualityAllergies = 0, qualityDisabilities = 0, qualityDiseases = 0;

  const disabledCountMap: Record<string, number> = {};
  const diseaseCountMap: Record<string, number> = {};
  const allergyCountMap: Record<string, number> = {};
  const socialProgramCountMap: Record<string, number> = {};
  let vulnerabilityDisabilities = 0, vulnerabilityDiseases = 0, vulnerabilityAllergies = 0;
  let vulnerabilitySocialPrograms = 0, vulnerabilityVulnerabilities = 0;

  const yearCounts: Record<string, number> = {};
  const quarterCounts: Record<string, number> = {};
  let totalDaysToInclusion = 0, countWithInclusion = 0;

  const educationCounts: Record<string, number> = {};
  const educationActiveStatus: Record<string, number> = {};
  const educationGraduatedStatus: Record<string, number> = {};
  const educationWomenCount: Record<string, number> = {};
  const educationMenCount: Record<string, number> = {};
  const centroEducationLevelCounts: Record<string, Record<string, number>> = {};

  for (const p of data) {
    const age = p.edad;
    const esMujer = isWomen(p.sexo);
    const esHombre = isMen(p.sexo);

    if (esMujer) women++;
    else if (esHombre) men++;
    else unknownSex++;

    if (p.edadRegistro > 0) {
      ageRegSum += p.edadRegistro;
      ageRegCount++;
    }

    let bucketKey: string;
    if (age === null || age === undefined || age <= 0 || age > 120) {
      bucketKey = 'Unknown';
    } else if (age >= 14 && age <= 17) {
      bucketKey = '14-17';
    } else if (age >= 18 && age <= 20) {
      bucketKey = '18-20';
    } else if (age >= 21 && age <= 24) {
      bucketKey = '21-24';
    } else {
      bucketKey = '25+';
    }
    buckets[bucketKey]++;
    if (esMujer) womenBucket[bucketKey]++;
    if (esHombre) menBucket[bucketKey]++;

    if (p.estadoCivil && !isEmptyValue(p.estadoCivil))
      maritalCount[p.estadoCivil] = (maritalCount[p.estadoCivil] || 0) + 1;

    if (needsTop && p.municipio) {
      municipioCount[p.municipio] = (municipioCount[p.municipio] || 0) + 1;
      if (needsTerr && esMujer) womenByMuni[p.municipio] = (womenByMuni[p.municipio] || 0) + 1;
    }

    if (needsTop && p.centro) {
      centroCount[p.centro] = (centroCount[p.centro] || 0) + 1;
      if (esMujer) womenByCentro[p.centro] = (womenByCentro[p.centro] || 0) + 1;
      if (esHombre) menByCentro[p.centro] = (menByCentro[p.centro] || 0) + 1;
      if (needsCtr) {
        if (age >= 14 && age <= 17) age14_17ByCentro[p.centro] = (age14_17ByCentro[p.centro] || 0) + 1;
        if (age >= 18 && age <= 24) age18_24ByCentro[p.centro] = (age18_24ByCentro[p.centro] || 0) + 1;
        centroAgeSum[p.centro] = (centroAgeSum[p.centro] || 0) + (p.edadRegistro || 0);
        centroAgeCount[p.centro] = (centroAgeCount[p.centro] || 0) + (p.edadRegistro > 0 ? 1 : 0);
      }
    }

    if (needsTop && p.rutaFormativa) {
      cursoCount[p.rutaFormativa] = (cursoCount[p.rutaFormativa] || 0) + 1;
      if (needsTerr) {
        if (esMujer) womenByCurso[p.rutaFormativa] = (womenByCurso[p.rutaFormativa] || 0) + 1;
        if (esHombre) menByCurso[p.rutaFormativa] = (menByCurso[p.rutaFormativa] || 0) + 1;
        if (age >= 14 && age <= 17) age14_17ByCurso[p.rutaFormativa] = (age14_17ByCurso[p.rutaFormativa] || 0) + 1;
        if (age >= 18 && age <= 24) age18_24ByCurso[p.rutaFormativa] = (age18_24ByCurso[p.rutaFormativa] || 0) + 1;
      }
    }

    if (needsStatus && p.estado) {
      statusCount[p.estado] = (statusCount[p.estado] || 0) + 1;
      if (isActiveStatus(p.estado)) {
        totalActive++;
        if ((needsProg || needsCtr) && p.centro) activeByCentro[p.centro] = (activeByCentro[p.centro] || 0) + 1;
        if (needsProg && p.municipio) activeByMuni[p.municipio] = (activeByMuni[p.municipio] || 0) + 1;
        if (needsProg && p.edadRegistro > 0) { activeAgeSum += p.edadRegistro; activeAgeCount++; }
      }
      if (isGraduatedStatus(p.estado)) {
        totalGraduated++;
        if ((needsProg || needsCtr) && p.centro) graduatedByCentro[p.centro] = (graduatedByCentro[p.centro] || 0) + 1;
        if (needsProg && p.municipio) graduatedByMuni[p.municipio] = (graduatedByMuni[p.municipio] || 0) + 1;
        if (needsProg && p.edadRegistro > 0) { graduatedAgeSum += p.edadRegistro; graduatedAgeCount++; }
      }
    }
    if (needsProg && age !== null && age !== undefined && age > 0 && age < 18) {
      minors.push(p.edad);
    }

    // ── New program indicators: in-loop accumulators ──
    if (needsProg) {
      // evolutionByYear: group by year × estado
      if (p.fechaRegistro) {
        const year = new Date(p.fechaRegistro).getFullYear();
        if (!yearsAcc[year]) yearsAcc[year] = {};
        const estadoKey = p.estado || 'Desconocido';
        yearsAcc[year][estadoKey] = (yearsAcc[year][estadoKey] || 0) + 1;
      }
      // statusByCurso: group by rutaFormativa × estado
      if (p.rutaFormativa && p.estado) {
        if (!cursoAcc[p.rutaFormativa]) cursoAcc[p.rutaFormativa] = {};
        cursoAcc[p.rutaFormativa][p.estado] = (cursoAcc[p.rutaFormativa][p.estado] || 0) + 1;
      }
      // contactabilidadByCentro: tutors with phone per center
      if (p.centro && !!p.tutor && !isEmptyValue(p.tutor)) {
        if (!contactAcc[p.centro]) contactAcc[p.centro] = { totalTutores: 0, conTelefono: 0 };
        contactAcc[p.centro].totalTutores++;
        if (!!p.telefonosResponsable && !isEmptyValue(p.telefonosResponsable)) {
          contactAcc[p.centro].conTelefono++;
        }
      }
      // minorsTutorByCentro: minors with tutor per center
      if (p.centro && (p.edad || 0) < 18) {
        if (!minorsAcc[p.centro]) minorsAcc[p.centro] = { totalMenores: 0, conTutor: 0 };
        minorsAcc[p.centro].totalMenores++;
        if (!!p.tutor && !isEmptyValue(p.tutor)) {
          minorsAcc[p.centro].conTutor++;
        }
      }
    }

    if (needsQual) {
      if (hasValue(p.cedula)) qualityCedula++;
      if (hasValue(p.fechaNacimiento)) qualityBirthDate++;
      if (hasValue(p.nivelEstudio)) qualityEducation++;
      if (hasValue(p.alergias)) qualityAllergies++;
      if (hasValue(p.discapacidades)) qualityDisabilities++;
      if (hasValue(p.enfermedades)) qualityDiseases++;
    }

    if (needsVuln) {
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
    }

    if (needsTemp) {
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
    }

    if (needsEdu && p.nivelEstudio && !isEmptyValue(p.nivelEstudio)) {
      educationCounts[p.nivelEstudio] = (educationCounts[p.nivelEstudio] || 0) + 1;
      if (p.estado) {
        if (isActiveStatus(p.estado)) educationActiveStatus[p.nivelEstudio] = (educationActiveStatus[p.nivelEstudio] || 0) + 1;
        if (isGraduatedStatus(p.estado)) educationGraduatedStatus[p.nivelEstudio] = (educationGraduatedStatus[p.nivelEstudio] || 0) + 1;
      }
      if (esMujer) educationWomenCount[p.nivelEstudio] = (educationWomenCount[p.nivelEstudio] || 0) + 1;
      if (esHombre) educationMenCount[p.nivelEstudio] = (educationMenCount[p.nivelEstudio] || 0) + 1;
      if (p.centro) {
        if (!centroEducationLevelCounts[p.centro]) centroEducationLevelCounts[p.centro] = {};
        centroEducationLevelCounts[p.centro][p.nivelEstudio] = (centroEducationLevelCounts[p.centro][p.nivelEstudio] || 0) + 1;
      }
    }
  }

  // ── Post-loop: compute derived values ──

  const knownSexTotal = women + men;
  const womenPct = safeDiv(women, knownSexTotal) * 100;
  const menPct = safeDiv(men, knownSexTotal) * 100;
  const unknownSexPct = safeDiv(unknownSex, knownSexTotal) * 100;
  const avgAgeReg = ageRegCount > 0 ? ageRegSum / ageRegCount : 0;

  minorsCount = minors.length;

  let ageBuckets: { name: string; value: number }[] = [];
  let maritalStatus: { name: string; value: number }[] = [];
  let genderAgeCross: { name: string; Mujeres: number; Hombres: number }[] = [];

  if (needs('demographic')) {
    ageBuckets = Object.entries(buckets).map(([name, value]) => ({ name, value }));
    maritalStatus = Object.entries(maritalCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    genderAgeCross = Object.keys(buckets).map(key => ({
      name: key,
      Mujeres: womenBucket[key],
      Hombres: menBucket[key],
    }));
  }

  let topMunicipios: { name: string; value: number }[] = [];
  let topCentros: { name: string; value: number }[] = [];
  let topCursos: { name: string; value: number }[] = [];
  let genderByMunicipio: { name: string; Mujeres: number; Hombres: number }[] = [];

  // Computed outside needs('territorial') because program and center slices also depend on them
  const shouldComputeTop = needs('territorial') || needs('program') || needs('center');
  if (shouldComputeTop) {
    topMunicipios = topNArr(
      Object.entries(municipioCount).map(([name, value]) => ({ name, value })),
      10
    );
    topCentros = topNArr(
      Object.entries(centroCount).map(([name, value]) => ({ name, value })),
      10
    );
    topCursos = topNArr(
      Object.entries(cursoCount).map(([name, value]) => ({ name, value })),
      10
    );
  }

  if (needs('territorial')) {
    genderByMunicipio = topMunicipios.map(m => ({
      name: m.name,
      Mujeres: womenByMuni[m.name] || 0,
      Hombres: m.value - (womenByMuni[m.name] || 0),
    }));
  }

  let minorsWithTutor = 0;
  let tutorsTotalCount = 0;
  let tutorsWithPhoneCount = 0;
  let statusDistribution: { name: string; value: number }[] = [];
  let activeVsGraduatedByCentro: { name: string; Activos: number; Egresados: number }[] = [];
  let activeVsGraduatedByMunicipio: { name: string; Activos: number; Egresados: number }[] = [];
  let evolutionByYear: { name: string; Activos: number; Egresados: number; Retirados: number }[] = [];
  let statusByCurso: { name: string; Activos: number; Egresados: number }[] = [];
  let contactabilidadByCentro: { name: string; totalTutores: number; conTelefono: number; pct: number }[] = [];
  let minorsTutorByCentro: { name: string; totalMenores: number; conTutor: number; pct: number }[] = [];
  let avgAgeByStatus: { activeAvg: number; graduatedAvg: number } = { activeAvg: 0, graduatedAvg: 0 };

  if (needs('program')) {
    minorsWithTutor = count(data, p => (p.edad || 0) < 18 && !!p.tutor && !isEmptyValue(p.tutor));
    const tutorsTotal = data.filter(p => !!p.tutor && !isEmptyValue(p.tutor));
    tutorsTotalCount = tutorsTotal.length;
    tutorsWithPhoneCount = tutorsTotal.filter(p => p.telefonosResponsable && !isEmptyValue(p.telefonosResponsable)).length;

    statusDistribution = Object.entries(statusCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    activeVsGraduatedByCentro = topCentros.map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '\u2026' : c.name,
      Activos: activeByCentro[c.name] || 0,
      Egresados: graduatedByCentro[c.name] || 0,
    }));
    activeVsGraduatedByMunicipio = topMunicipios.map(m => ({
      name: m.name,
      Activos: activeByMuni[m.name] || 0,
      Egresados: graduatedByMuni[m.name] || 0,
    }));

    // New program indicators: post-loop mapping
    evolutionByYear = Object.entries(yearsAcc)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, statuses]) => {
        let activos = 0, egresados = 0;
        for (const [estado, count] of Object.entries(statuses)) {
          if (isActiveStatus(estado)) activos += count;
          else if (isGraduatedStatus(estado)) egresados += count;
        }
        const total = Object.values(statuses).reduce((s, c) => s + c, 0);
        return {
          name: year,
          Activos: activos,
          Egresados: egresados,
          Retirados: total - activos - egresados,
        };
      });

    statusByCurso = Object.entries(cursoAcc)
      .map(([curso, statuses]) => {
        let activos = 0, egresados = 0;
        for (const [estado, count] of Object.entries(statuses)) {
          if (isActiveStatus(estado)) activos += count;
          else if (isGraduatedStatus(estado)) egresados += count;
        }
        return { name: curso, Activos: activos, Egresados: egresados };
      })
      .sort((a, b) => (b.Activos + b.Egresados) - (a.Activos + a.Egresados));

    contactabilidadByCentro = Object.entries(contactAcc)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 18) + '\u2026' : name,
        totalTutores: data.totalTutores,
        conTelefono: data.conTelefono,
        pct: safeDiv(data.conTelefono, data.totalTutores) * 100,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    minorsTutorByCentro = Object.entries(minorsAcc)
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 18) + '\u2026' : name,
        totalMenores: data.totalMenores,
        conTutor: data.conTutor,
        pct: safeDiv(data.conTutor, data.totalMenores) * 100,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);

    avgAgeByStatus = {
      activeAvg: safeDiv(activeAgeSum, activeAgeCount),
      graduatedAvg: safeDiv(graduatedAgeSum, graduatedAgeCount),
    };
  }

  let qualityFieldBreakdown: { name: string; pct: number; total: number; ndCount: number }[] = [];

  if (needs('quality')) {
    qualityFieldBreakdown = [
      { name: 'C\u00e9dula', pct: safeDiv(qualityCedula, total) * 100, total: qualityCedula, ndCount: total - qualityCedula },
      { name: 'Fecha de nacimiento', pct: safeDiv(qualityBirthDate, total) * 100, total: qualityBirthDate, ndCount: total - qualityBirthDate },
      { name: 'Nivel de estudio', pct: safeDiv(qualityEducation, total) * 100, total: qualityEducation, ndCount: total - qualityEducation },
      { name: 'Alergias', pct: safeDiv(qualityAllergies, total) * 100, total: qualityAllergies, ndCount: total - qualityAllergies },
      { name: 'Discapacidades', pct: safeDiv(qualityDisabilities, total) * 100, total: qualityDisabilities, ndCount: total - qualityDisabilities },
      { name: 'Enfermedades', pct: safeDiv(qualityDiseases, total) * 100, total: qualityDiseases, ndCount: total - qualityDiseases },
    ];
  }

  const topDisArr = (map: Record<string, number>, n: number): { name: string; value: number }[] =>
    Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, n);

  let registrationsByYear: { name: string; value: number }[] = [];
  let yearGrowth: { name: string; growth: number }[] = [];
  let avgAgeAtRegistration = 0;
  let avgDaysToInclusion = 0;
  let registrationsByQuarter: { name: string; value: number }[] = [];

  if (needs('temporal')) {
    const yearsSorted = Object.keys(yearCounts).sort();
    registrationsByYear = yearsSorted.map(y => ({ name: y, value: yearCounts[y] }));
    yearGrowth = yearsSorted.slice(1).map(y => {
      const prevIdx = yearsSorted.indexOf(String(Number(y) - 1));
      if (prevIdx < 0) return { name: y, growth: 0 };
      const prev = yearCounts[yearsSorted[prevIdx]];
      const curr = yearCounts[y];
      return { name: y, growth: prev > 0 ? ((curr - prev) / prev) * 100 : 0 };
    });
    avgAgeAtRegistration = avgAgeReg;
    avgDaysToInclusion = countWithInclusion > 0 ? totalDaysToInclusion / countWithInclusion : 0;
    registrationsByQuarter = Object.entries(quarterCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }

  let educationDistribution: { name: string; value: number }[] = [];
  let educationByStatus: { name: string; Activos: number; Egresados: number }[] = [];
  let educationBySex: { name: string; Mujeres: number; Hombres: number }[] = [];
  let topEducationByCenter: { center: string; level: string; count: number }[] = [];

  if (needs('education')) {
    educationDistribution = Object.entries(educationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const eduKeys = educationDistribution.map(e => e.name);
    educationByStatus = eduKeys.map(name => ({
      name,
      Activos: educationActiveStatus[name] || 0,
      Egresados: educationGraduatedStatus[name] || 0,
    }));
    educationBySex = eduKeys.map(name => ({
      name,
      Mujeres: educationWomenCount[name] || 0,
      Hombres: educationMenCount[name] || 0,
    }));

    topEducationByCenter = Object.entries(centroEducationLevelCounts)
      .map(([centro, levels]) => {
        const top = Object.entries(levels).sort(([, a], [, b]) => b - a)[0];
        return { center: centro, level: top[0], count: top[1] };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  let topCenters: { key: string; name: string; total: number; activos: number; egresados: number }[] = [];
  let genderByCenterArr: { name: string; Mujeres: number; Hombres: number }[] = [];
  let avgAgeByCenter: { name: string; avgAge: number }[] = [];

  if (needs('center')) {
    topCenters = Object.entries(centroCount)
      .map(([name, totalVal]) => ({
        key: name,
        name: name.length > 20 ? name.substring(0, 18) + '\u2026' : name,
        total: totalVal,
        activos: activeByCentro[name] || 0,
        egresados: graduatedByCentro[name] || 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    genderByCenterArr = topCenters.map(c => ({
      name: c.name,
      Mujeres: womenByCentro[c.key] || 0,
      Hombres: menByCentro[c.key] || 0,
    }));

    avgAgeByCenter = Object.entries(centroCount)
      .map(([name]) => {
        const aSum = centroAgeSum[name] || 0;
        const aCnt = centroAgeCount[name] || 0;
        return {
          name: name.length > 20 ? name.substring(0, 18) + '\u2026' : name,
          avgAge: aCnt > 0 ? aSum / aCnt : 0,
        };
      })
      .sort((a, b) => b.avgAge - a.avgAge)
      .slice(0, 10);
  }

  return {
    demographicData: needs('demographic')
      ? {
          total, women, men, unknown: unknownSex, womenPct, menPct, unknownPct: unknownSexPct, avgAgeReg,
          ageBuckets, maritalStatus, genderAgeCross,
        }
      : emptyDemographicSlice(total),

    territorialData: needs('territorial')
      ? {
          municipioCount: Object.keys(municipioCount).length,
          centroCount: Object.keys(centroCount).length,
          cursoCount: Object.keys(cursoCount).length,
          topMunicipios, topCentros, topCursos, genderByMunicipio,
        }
      : emptyTerritorialSlice(),

    programData: needs('program')
      ? {
          activePct: safeDiv(totalActive, total) * 100,
          graduatedPct: safeDiv(totalGraduated, total) * 100,
          minorsWithTutorPct: minorsCount > 0 ? safeDiv(minorsWithTutor, minorsCount) * 100 : 0,
          tutorsWithPhonePct: tutorsTotalCount > 0 ? safeDiv(tutorsWithPhoneCount, tutorsTotalCount) * 100 : 0,
          statusDistribution, activeVsGraduatedByCentro, activeVsGraduatedByMunicipio,
          evolutionByYear, statusByCurso, contactabilidadByCentro,
          minorsTutorByCentro, avgAgeByStatus,
        }
      : emptyProgramSlice(),

    qualityData: needs('quality')
      ? {
          cedulaPct: safeDiv(qualityCedula, total) * 100,
          birthDatePct: safeDiv(qualityBirthDate, total) * 100,
          educationPct: safeDiv(qualityEducation, total) * 100,
          allergiesPct: safeDiv(qualityAllergies, total) * 100,
          disabilitiesPct: safeDiv(qualityDisabilities, total) * 100,
          diseasesPct: safeDiv(qualityDiseases, total) * 100,
          fieldBreakdown: qualityFieldBreakdown,
        }
      : emptyQualitySlice(),

    vulnerabilityData: needs('vulnerability')
      ? {
          disabilitiesPct: safeDiv(vulnerabilityDisabilities, total) * 100,
          diseasesPct: safeDiv(vulnerabilityDiseases, total) * 100,
          allergiesPct: safeDiv(vulnerabilityAllergies, total) * 100,
          socialProgramsPct: safeDiv(vulnerabilitySocialPrograms, total) * 100,
          vulnerabilitiesPct: safeDiv(vulnerabilityVulnerabilities, total) * 100,
          topDisabilities: topDisArr(disabledCountMap, 3),
          topDiseases: topDisArr(diseaseCountMap, 3),
          topAllergies: topDisArr(allergyCountMap, 3),
          topSocialPrograms: topDisArr(socialProgramCountMap, 3),
        }
      : emptyVulnerabilitySlice(),

    temporalData: needs('temporal')
      ? {
          registrationsByYear, yearGrowth, avgAgeAtRegistration,
          avgDaysToInclusion, registrationsByQuarter,
        }
      : emptyTemporalSlice(),

    educationData: needs('education')
      ? { educationDistribution, educationByStatus, educationBySex, topEducationByCenter }
      : emptyEducationSlice(),

    centerData: needs('center')
      ? {
          totalCenters: Object.keys(centroCount).length,
          topCenters: topCenters.map(({ key: _key, ...rest }) => rest),
          genderByCenter: genderByCenterArr,
          avgAgeByCenter,
        }
      : emptyCenterSlice(),
  };
}
