import { useMemo } from 'react';
import type { Participant } from '../types';
import { isWomen, isMen, isActiveStatus, hasValue } from '../utils/normalize';
import { formatNumber, formatPercentage } from '../utils/formatters';
import { ROUTES } from '../types/routes';

// ── Types ──

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'desercion' | 'cobertura' | 'calidad' | 'territorial' | 'operativo';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  value: string;
  threshold: string;
  affectedCount: number;
  relatedBoard?: string;
  /** Barra visual 0–100 de qué tan grave es la alerta */
  severityBar: number;
  /** Top entidades afectadas (centros, municipios, cursos) */
  topAffected?: { name: string; value: number }[];
  /** Acción sugerida */
  recommendation?: string;
  /** Tendencia histórica aproximada */
  trend?: TrendDirection;
  trendLabel?: string;
}

export interface UseAlertsResult {
  alerts: Alert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
  lastUpdated: Date;
}

// ── Helpers ──

const isDesertionStatus = (estado: string | null | undefined): boolean => {
  if (!estado) return false;
  const s = estado.trim().toLowerCase();
  return ['retirado', 'desertor', 'baja', 'cancelado', 'inactivo', 'no admitido', 'abandonó', 'abandono'].includes(s);
};

const safeDiv = (part: number, total: number): number => (total > 0 ? part / total : 0);

const pct = (part: number, total: number): string => formatPercentage(safeDiv(part, total) * 100);

const count = (data: Participant[], predicate: (p: Participant) => boolean): number =>
  data.filter(predicate).length;

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

/** Separa datos en "recientes" (últimos 6 meses) y "antiguos" */
function splitByRecency(data: Participant[]): { recent: Participant[]; older: Participant[] } {
  const cutoff = Date.now() - SIX_MONTHS_MS;
  const recent: Participant[] = [];
  const older: Participant[] = [];
  for (const p of data) {
    if (p.fechaRegistro) {
      const t = new Date(p.fechaRegistro).getTime();
      if (!isNaN(t) && t >= cutoff) recent.push(p);
      else older.push(p);
    } else {
      older.push(p);
    }
  }
  return { recent, older };
}

/** Calcula tendencia comparando métrica de datos recientes vs antiguos */
function computeTrend(
  data: Participant[],
  metricFn: (d: Participant[]) => number,
  worseningIsUp: boolean,
): { trend: TrendDirection; label: string } {
  const { recent, older } = splitByRecency(data);
  if (recent.length < 10 || older.length < 10) return { trend: 'stable', label: 'Sin datos históricos suficientes' };

  const recentVal = metricFn(recent);
  const olderVal = metricFn(older);
  const diff = recentVal - olderVal;
  const relDiff = olderVal > 0 ? Math.abs(diff / olderVal) : Math.abs(diff);

  if (relDiff < 0.05) return { trend: 'stable', label: 'Estable vs período anterior' };

  const isUp = diff > 0;
  const worsened = worseningIsUp ? isUp : !isUp;
  const direction = worsened ? 'up' : 'down';
  const sign = diff > 0 ? '+' : '';
  const pctLabel = olderVal > 0 ? `${sign}${formatPercentage((diff / olderVal) * 100)}` : `${sign}${diff.toFixed(1)}`;

  return {
    trend: direction,
    label: worsened
      ? `Empeoró ${pctLabel} vs período anterior`
      : `Mejoró ${pctLabel} vs período anterior`,
  };
}

/** Barra de severidad 0-100 normalizada contra el umbral */
function severityBar(value: number, threshold: number, max: number, isInverted: boolean): number {
  if (isInverted) {
    // Menor es peor (ej: cobertura teléfono: 30% cuando umbral es 50%)
    if (value >= threshold) return 0;
    return Math.min(100, Math.round(((threshold - value) / threshold) * 100));
  }
  // Mayor es peor (ej: deserción: 45% cuando umbral es 30%)
  if (value <= threshold) return 0;
  const remaining = max - threshold;
  if (remaining <= 0) return 100;
  return Math.min(100, Math.round(((value - threshold) / remaining) * 100));
}

// ── Metrics ──

interface ProvinciaMetric {
  provincia: string;
  total: number;
  desertores: number;
  desertionPct: number;
  women: number;
  men: number;
  withPhone: number;
  phonePct: number;
}

function computeProvinciaMetrics(data: Participant[]): ProvinciaMetric[] {
  const map = new Map<string, ProvinciaMetric>();
  for (const p of data) {
    if (!p.provincia) continue;
    const prov = p.provincia;
    let m = map.get(prov);
    if (!m) {
      m = { provincia: prov, total: 0, desertores: 0, desertionPct: 0, women: 0, men: 0, withPhone: 0, phonePct: 0 };
      map.set(prov, m);
    }
    m.total++;
    if (isDesertionStatus(p.estado)) m.desertores++;
    if (isWomen(p.sexo)) m.women++;
    if (isMen(p.sexo)) m.men++;
    if (hasValue(p.telefonos)) m.withPhone++;
  }
  for (const m of map.values()) {
    m.desertionPct = safeDiv(m.desertores, m.total) * 100;
    m.phonePct = safeDiv(m.withPhone, m.total) * 100;
  }
  return Array.from(map.values()).sort((a, b) => b.desertionPct - a.desertionPct);
}

interface CentroMetric {
  centro: string;
  provincia: string | null;
  total: number;
  desertores: number;
  desertionPct: number;
  activos: number;
}

function computeCentroMetrics(data: Participant[]): CentroMetric[] {
  const map = new Map<string, CentroMetric>();
  for (const p of data) {
    if (!p.centro) continue;
    let m = map.get(p.centro);
    if (!m) {
      m = { centro: p.centro, provincia: p.provincia, total: 0, desertores: 0, desertionPct: 0, activos: 0 };
      map.set(p.centro, m);
    }
    m.total++;
    if (isDesertionStatus(p.estado)) m.desertores++;
    if (isActiveStatus(p.estado)) m.activos++;
  }
  for (const m of map.values()) {
    m.desertionPct = safeDiv(m.desertores, m.total) * 100;
  }
  return Array.from(map.values()).sort((a, b) => b.desertionPct - a.desertionPct);
}

/** Top N centros con más desertores dentro de una provincia */
function topCentrosByDesertion(data: Participant[], provincia: string, n: number = 5): { name: string; value: number }[] {
  const centroMap = new Map<string, number>();
  for (const p of data) {
    if (p.provincia === provincia && p.centro && isDesertionStatus(p.estado)) {
      centroMap.set(p.centro, (centroMap.get(p.centro) || 0) + 1);
    }
  }
  return Array.from(centroMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

/** Top N cursos dentro de un centro */
function topCursosByCentro(data: Participant[], centro: string, n: number = 5): { name: string; value: number }[] {
  const cursoMap = new Map<string, number>();
  for (const p of data) {
    if (p.centro === centro && p.rutaFormativa) {
      cursoMap.set(p.rutaFormativa, (cursoMap.get(p.rutaFormativa) || 0) + 1);
    }
  }
  return Array.from(cursoMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

/** Top N municipios con peor cobertura dentro de una provincia */
function topMunicipiosByPhone(data: Participant[], provincia: string, n: number = 5): { name: string; value: number }[] {
  const munMap = new Map<string, { total: number; withPhone: number }>();
  for (const p of data) {
    if (p.provincia === provincia && p.municipio) {
      let m = munMap.get(p.municipio);
      if (!m) {
        m = { total: 0, withPhone: 0 };
        munMap.set(p.municipio, m);
      }
      m.total++;
      if (hasValue(p.telefonos)) m.withPhone++;
    }
  }
  return Array.from(munMap.entries())
    .map(([name, m]) => ({ name, value: safeDiv(m.withPhone, m.total) * 100 }))
    .sort((a, b) => a.value - b.value)
    .slice(0, n)
    .map(m => ({ name: m.name, value: Math.round(100 - m.value) }));
}

// ── Thresholds ──

const DESERTION_THRESHOLD = 30;
const CONCENTRATION_THRESHOLD = 60;
const GENDER_GAP_THRESHOLD = 20;
const PHONE_COVERAGE_THRESHOLD = 50;
const CENTRO_DESERTION_THRESHOLD = 50;

// ── Main hook ──

export function useAlerts(data: Participant[]): UseAlertsResult {
  return useMemo(() => {
    const alerts: Alert[] = [];
    const total = data.length;
    const lastUpdated = new Date();

    if (total === 0) {
      return { alerts, criticalCount: 0, warningCount: 0, infoCount: 0, totalCount: 0, lastUpdated };
    }

    // ── 1. Provincia con alta deserción (CRITICAL) ──
    const provinciaMetrics = computeProvinciaMetrics(data);
    for (const pm of provinciaMetrics) {
      if (pm.desertionPct > DESERTION_THRESHOLD) {
        const topCentros = topCentrosByDesertion(data, pm.provincia, 3);
        const trend = computeTrend(data, d => {
          const m = computeProvinciaMetrics(d).find(p => p.provincia === pm.provincia);
          return m ? m.desertionPct : 0;
        }, true);

        alerts.push({
          id: `prov-des-${pm.provincia}`,
          severity: 'critical',
          category: 'desercion',
          title: `Deserción alta en ${pm.provincia}`,
          description: `${pm.provincia} tiene un ${pct(pm.desertores, pm.total)} de participantes en estado de deserción.`,
          value: pct(pm.desertores, pm.total),
          threshold: `>${DESERTION_THRESHOLD}%`,
          affectedCount: pm.desertores,
          severityBar: severityBar(pm.desertionPct, DESERTION_THRESHOLD, 100, false),
          topAffected: topCentros.length > 0 ? topCentros : undefined,
          recommendation: topCentros.length > 0
            ? `Priorizar seguimiento en ${topCentros[0].name} (${topCentros[0].value} desertores)`
            : 'Reforzar estrategia de retención en la provincia',
          trend: trend.trend,
          trendLabel: trend.label,
          relatedBoard: ROUTES.INDICADORES_DESERCION,
        });
      }
    }

    // ── 2. Centro sin activos (CRITICAL) ──
    const centroMetrics = computeCentroMetrics(data);
    for (const cm of centroMetrics) {
      if (cm.activos === 0 && cm.total > 0) {
        const topCursos = topCursosByCentro(data, cm.centro, 3);
        alerts.push({
          id: `centro-no-activos-${cm.centro}`,
          severity: 'critical',
          category: 'operativo',
          title: `Centro sin participantes activos`,
          description: `"${cm.centro}" (${cm.provincia || 's/provincia'}) tiene ${formatNumber(cm.total)} participantes pero ninguno en estado activo.`,
          value: '0 activos',
          threshold: '≥1 activo esperado',
          affectedCount: cm.total,
          severityBar: 100,
          topAffected: topCursos.length > 0 ? topCursos : undefined,
          recommendation: 'Revisar situación del centro y contactar participantes',
          relatedBoard: ROUTES.INDICADORES_DESEMPENO_CENTRO,
        });
      }
    }

    // ── 3. Centro con mayoría desertores (WARNING) ──
    for (const cm of centroMetrics) {
      if (cm.desertionPct > CENTRO_DESERTION_THRESHOLD && cm.activos > 0) {
        const topCursos = topCursosByCentro(data, cm.centro, 3);
        const trend = computeTrend(data, d => {
          const m = computeCentroMetrics(d).find(c => c.centro === cm.centro);
          return m ? m.desertionPct : 0;
        }, true);

        alerts.push({
          id: `centro-des-${cm.centro}`,
          severity: 'warning',
          category: 'desercion',
          title: `Mayoría desertores en "${cm.centro}"`,
          description: `El ${pct(cm.desertores, cm.total)} de los participantes de "${cm.centro}" han desertado.`,
          value: pct(cm.desertores, cm.total),
          threshold: `>${CENTRO_DESERTION_THRESHOLD}%`,
          affectedCount: cm.desertores,
          severityBar: severityBar(cm.desertionPct, CENTRO_DESERTION_THRESHOLD, 100, false),
          topAffected: topCursos.length > 0 ? topCursos : undefined,
          recommendation: 'Indagar causas de deserción en el centro y ajustar metodología',
          trend: trend.trend,
          trendLabel: trend.label,
          relatedBoard: ROUTES.INDICADORES_DESEMPENO_CENTRO,
        });
      }
    }

    // ── 4. Cobertura de teléfono baja por provincia (WARNING) ──
    for (const pm of provinciaMetrics) {
      if (pm.phonePct < PHONE_COVERAGE_THRESHOLD && pm.total >= 10) {
        const topMun = topMunicipiosByPhone(data, pm.provincia, 3);
        const trend = computeTrend(data, d => {
          const m = computeProvinciaMetrics(d).find(p => p.provincia === pm.provincia);
          return m ? m.phonePct : 100;
        }, false);

        alerts.push({
          id: `phone-${pm.provincia}`,
          severity: 'warning',
          category: 'calidad',
          title: `Baja cobertura de teléfono en ${pm.provincia}`,
          description: `Solo el ${pct(pm.withPhone, pm.total)} de los participantes en ${pm.provincia} tiene teléfono registrado.`,
          value: pct(pm.withPhone, pm.total),
          threshold: `≥${PHONE_COVERAGE_THRESHOLD}%`,
          affectedCount: pm.total - pm.withPhone,
          severityBar: severityBar(pm.phonePct, PHONE_COVERAGE_THRESHOLD, 100, true),
          topAffected: topMun.length > 0 ? topMun : undefined,
          recommendation: topMun.length > 0
            ? `Actualizar contactos prioritariamente en ${topMun[0].name}`
            : 'Campaña de actualización de contactos en la provincia',
          trend: trend.trend,
          trendLabel: trend.label,
          relatedBoard: ROUTES.INDICADORES_CALIDAD,
        });
      }
    }

    // ── 5. Concentración en cursos (WARNING) ──
    const cursoCounts: Record<string, number> = {};
    for (const p of data) {
      if (p.rutaFormativa) {
        cursoCounts[p.rutaFormativa] = (cursoCounts[p.rutaFormativa] || 0) + 1;
      }
    }
    const sortedCursos = Object.entries(cursoCounts).sort(([, a], [, b]) => b - a);
    if (sortedCursos.length >= 3) {
      const top2 = sortedCursos.slice(0, 2).reduce((s, [, v]) => s + v, 0);
      const concentrationPct = safeDiv(top2, total) * 100;
      if (concentrationPct > CONCENTRATION_THRESHOLD) {
        alerts.push({
          id: 'curso-concentracion',
          severity: 'warning',
          category: 'territorial',
          title: 'Alta concentración en pocos cursos',
          description: `Las 2 rutas formativas más populares concentran el ${formatPercentage(concentrationPct)} de los participantes.`,
          value: formatPercentage(concentrationPct),
          threshold: `>${CONCENTRATION_THRESHOLD}%`,
          affectedCount: top2,
          severityBar: severityBar(concentrationPct, CONCENTRATION_THRESHOLD, 100, false),
          topAffected: sortedCursos.slice(0, 5).map(([name, value]) => ({ name, value })),
          recommendation: 'Evaluar diversificar oferta formativa para reducir dependencia',
          relatedBoard: ROUTES.INDICADORES_TERRITORIALES,
        });
      }
    }

    // ── 6. Brecha de género por provincia (WARNING) ──
    for (const pm of provinciaMetrics) {
      if (pm.total < 20) continue;
      const womenPct = safeDiv(pm.women, pm.total) * 100;
      const menPct = safeDiv(pm.men, pm.total) * 100;
      const gap = Math.abs(womenPct - menPct);
      if (gap > GENDER_GAP_THRESHOLD && pm.women > 0 && pm.men > 0) {
        const dominant = womenPct > menPct ? 'mujeres' : 'hombres';
        alerts.push({
          id: `genero-${pm.provincia}`,
          severity: 'warning',
          category: 'territorial',
          title: `Brecha de género en ${pm.provincia}`,
          description: `Diferencia de ${formatPercentage(gap)} entre mujeres (${formatPercentage(womenPct)}) y hombres (${formatPercentage(menPct)}).`,
          value: formatPercentage(gap),
          threshold: `>${GENDER_GAP_THRESHOLD} pp`,
          affectedCount: pm.total,
          severityBar: severityBar(gap, GENDER_GAP_THRESHOLD, 100, false),
          recommendation: `Evaluar estrategias de captación equitativa; predominan ${dominant}`,
          relatedBoard: ROUTES.INDICADORES_DEMOGRAFICOS,
        });
      }
    }

    // ── 7. Menores sin tutor (INFO) ──
    const minors = data.filter(p => p.edad > 0 && p.edad < 18);
    const minorsWithoutTutor = minors.filter(p => !p.tutor || !hasValue(p.tutor));
    if (minorsWithoutTutor.length > 0) {
      // Top centros con menores sin tutor
      const centrosSinTutor = new Map<string, number>();
      for (const p of minorsWithoutTutor) {
        if (p.centro) centrosSinTutor.set(p.centro, (centrosSinTutor.get(p.centro) || 0) + 1);
      }
      const topCentrosTutor = Array.from(centrosSinTutor.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, value]) => ({ name, value }));

      alerts.push({
        id: 'menores-sin-tutor',
        severity: 'info',
        category: 'operativo',
        title: 'Menores sin responsable asignado',
        description: `${formatNumber(minorsWithoutTutor.length)} de ${formatNumber(minors.length)} menores no tienen tutor/responsable registrado.`,
        value: pct(minorsWithoutTutor.length, minors.length),
        threshold: '0% esperado',
        affectedCount: minorsWithoutTutor.length,
        severityBar: severityBar(safeDiv(minorsWithoutTutor.length, minors.length) * 100, 20, 100, false),
        topAffected: topCentrosTutor.length > 0 ? topCentrosTutor : undefined,
        recommendation: topCentrosTutor.length > 0
          ? `Gestionar tutores prioritariamente en ${topCentrosTutor[0].name}`
          : 'Regularizar tutores de menores en todos los centros',
        relatedBoard: ROUTES.INDICADORES_PROGRAMA,
      });
    }

    // ── 8. Registro declinante (INFO) ──
    const registrationsByMonth: Record<string, number> = {};
    for (const p of data) {
      if (p.fechaRegistro) {
        const d = new Date(p.fechaRegistro);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        registrationsByMonth[key] = (registrationsByMonth[key] || 0) + 1;
      }
    }
    const sortedMonths = Object.entries(registrationsByMonth).sort(([a], [b]) => a.localeCompare(b));
    if (sortedMonths.length >= 4) {
      const last3 = sortedMonths.slice(-3);
      const avgLast3 = last3.reduce((s, [, v]) => s + v, 0) / last3.length;
      const currentMonth = last3[last3.length - 1][1];
      if (currentMonth < avgLast3 * 0.7) {
        alerts.push({
          id: 'registro-declinante',
          severity: 'info',
          category: 'cobertura',
          title: 'Registro mensual en descenso',
          description: `El mes actual (${formatNumber(currentMonth)}) está un ${formatPercentage((1 - currentMonth / avgLast3) * 100)} por debajo del promedio de los últimos 3 meses (${formatNumber(Math.round(avgLast3))}).`,
          value: formatNumber(currentMonth),
          threshold: `≥${formatNumber(Math.round(avgLast3))}`,
          affectedCount: Math.round(avgLast3 - currentMonth),
          severityBar: severityBar(currentMonth, Math.round(avgLast3 * 0.7), Math.round(avgLast3), true),
          recommendation: 'Reforzar campañas de captación para revertir la tendencia',
          relatedBoard: ROUTES.INDICADORES_COBERTURA,
        });
      }
    }

    // ── 9. Completitud general baja (INFO) ──
    const fields = [
      { key: 'teléfono', count: count(data, p => hasValue(p.telefonos)) },
      { key: 'dirección', count: count(data, p => hasValue(p.direccion)) },
      { key: 'nivel estudio', count: count(data, p => hasValue(p.nivelEstudio)) },
      { key: 'alergias', count: count(data, p => hasValue(p.alergias)) },
    ];
    const sortedFields = [...fields].sort((a, b) => a.count - b.count);
    const lowestField = sortedFields[0];
    const lowestPct = safeDiv(lowestField.count, total) * 100;
    if (lowestPct < 60) {
      alerts.push({
        id: 'completitud-baja',
        severity: 'info',
        category: 'calidad',
        title: `Completitud baja en "${lowestField.key}"`,
        description: `Solo el ${formatPercentage(lowestPct)} de los participantes tiene ${lowestField.key} registrado.`,
        value: formatPercentage(lowestPct),
        threshold: '≥60%',
        affectedCount: total - lowestField.count,
        severityBar: severityBar(lowestPct, 60, 100, true),
        topAffected: sortedFields.slice(1).map(f => ({ name: f.key, value: Math.round(safeDiv(f.count, total) * 100) })),
        recommendation: 'Fortalecer registro de datos en la admisión de participantes',
        relatedBoard: ROUTES.INDICADORES_CALIDAD,
      });
    }

    // ── Sort ──
    const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const infoCount = alerts.filter(a => a.severity === 'info').length;

    return { alerts, criticalCount, warningCount, infoCount, totalCount: alerts.length, lastUpdated };
  }, [data]);
}
