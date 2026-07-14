import React, { useMemo } from 'react';
import type { Participant } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import { Heart, Activity, Clock, Users } from 'lucide-react';
import { useImpactData } from '../hooks/useImpactData';
import { hasValue } from '../utils/normalize';
import { formatNumber, formatPercentage } from '../utils/formatters';

// ── Types ──

interface ImpactSectionProps {
  data: Participant[];
}

// ── Helpers ──

const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ff6b6b', '#a4de6c', '#d0ed57', '#ffc658',
];

const tickShort = (val: string) => (val.length > 14 ? val.substring(0, 12) + '…' : val);

// ── Component ──

export const ImpactSection: React.FC<ImpactSectionProps> = ({ data }) => {
  const impactData = useImpactData(data);
  const total = data.length;

  // ── Derived metrics ──

  const healthCombinedPct = useMemo(() => {
    if (total === 0) return 0;
    const withAny = data.filter(
      p => hasValue(p.alergias) || hasValue(p.discapacidades) || hasValue(p.enfermedades),
    ).length;
    return safeDiv(withAny, total) * 100;
  }, [data, total]);

  // Transform vulnVsPrograms → Recharts stacked-bar format
  const vulnProgramChartData = useMemo(() => {
    if (impactData.vulnVsPrograms.length === 0) return [];
    const allPrograms = new Set<string>();
    for (const v of impactData.vulnVsPrograms) {
      for (const p of v.programs) allPrograms.add(p.name);
    }
    const programList = Array.from(allPrograms);
    return impactData.vulnVsPrograms.map(v => {
      const row: Record<string, string | number> = { name: v.name };
      for (const prog of programList) {
        row[prog] = v.programs.find(p => p.name === prog)?.value ?? 0;
      }
      return row;
    });
  }, [impactData.vulnVsPrograms]);

  const ageComparisonData = [
    { name: 'Al Registro', Edad: Math.round(impactData.ageComparison.avgAgeReg * 10) / 10 },
    { name: 'Actual', Edad: Math.round(impactData.ageComparison.avgAgeNow * 10) / 10 },
  ];

  // ── Empty state ──

  if (total === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
        <Heart size={32} className="mb-2" />
        <p>Sin datos para el tablero de impacto social</p>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ═══ Header ═══ */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="text-red-500" /> Tablero de Impacto Social
        </h2>
        <p className="text-gray-500 mt-1">
          Indicadores de cobertura social, perfil de salud, tiempos de inclusión,
          responsables y calidad de datos.
        </p>
      </div>

      {/* ═══ KPI Row ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 — Cobertura Social */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-500 mr-4">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Cobertura Social</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(impactData.programCoverage.pctWithPrograms, 1)}
            </h3>
          </div>
        </div>

        {/* KPI 2 — Salud */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-500 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Salud</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {formatPercentage(healthCombinedPct, 1)}
            </h3>
          </div>
        </div>

        {/* KPI 3 — Tiempo Promedio Inclusión */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500 mr-4">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tiempo Promedio Inclusión</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {impactData.inclusionTime.avgDays > 0
                ? `${formatNumber(impactData.inclusionTime.avgDays)} días`
                : '—'}
            </h3>
          </div>
        </div>

        {/* KPI 4 — Responsables */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-500 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Responsables</p>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-bold text-gray-800">
                  {formatPercentage(impactData.tutorAnalysis.pctWithTutor, 0)}
                </span>
                <span className="text-xs text-gray-400 ml-1">con tutor</span>
              </div>
              <div className="text-gray-300 text-lg font-thin">|</div>
              <div>
                <span className="text-2xl font-bold text-gray-800">
                  {formatPercentage(impactData.tutorAnalysis.pctTutorsWithPhone, 0)}
                </span>
                <span className="text-xs text-gray-400 ml-1">con teléfono</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Charts Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Chart 1: Cobertura de Programas Sociales ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Cobertura de Programas Sociales
          </h3>
          <div className="h-64 w-full">
            {impactData.programCoverage.topPrograms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData.programCoverage.topPrograms}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tickFormatter={tickShort}
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    formatter={(value: unknown) => formatNumber(Number(value))}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de programas sociales
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 2: Perfil de Salud (3 mini bars) ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Perfil de Salud</h3>
          <div className="space-y-4">
            {/* Alergias */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Alergias ({formatNumber(impactData.healthProfile.alergias.total)})
              </p>
              <div className="h-20 w-full">
                {impactData.healthProfile.alergias.topItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={impactData.healthProfile.alergias.topItems}
                      layout="vertical"
                      margin={{ left: 5, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatNumber} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tickFormatter={tickShort}
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    Sin datos
                  </div>
                )}
              </div>
            </div>
            {/* Discapacidades */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Discapacidades ({formatNumber(impactData.healthProfile.discapacidades.total)})
              </p>
              <div className="h-20 w-full">
                {impactData.healthProfile.discapacidades.topItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={impactData.healthProfile.discapacidades.topItems}
                      layout="vertical"
                      margin={{ left: 5, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatNumber} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tickFormatter={tickShort}
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    Sin datos
                  </div>
                )}
              </div>
            </div>
            {/* Enfermedades */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Enfermedades ({formatNumber(impactData.healthProfile.enfermedades.total)})
              </p>
              <div className="h-20 w-full">
                {impactData.healthProfile.enfermedades.topItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={impactData.healthProfile.enfermedades.topItems}
                      layout="vertical"
                      margin={{ left: 5, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatNumber} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tickFormatter={tickShort}
                        style={{ fontSize: '10px' }}
                      />
                      <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                      <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    Sin datos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Chart 3: Tiempo Registro → Inclusión ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Tiempo Registro → Inclusión
          </h3>
          <div className="h-64 w-full">
            {impactData.inclusionTime.distribution.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impactData.inclusionTime.distribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" style={{ fontSize: '11px' }} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de fechas de inclusión
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 4: Top Responsables ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Responsables</h3>
          <div className="h-64 w-full">
            {impactData.tutorAnalysis.topTutors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData.tutorAnalysis.topTutors}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tickFormatter={tickShort}
                    style={{ fontSize: '10px' }}
                  />
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de responsables
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 5: Calidad de Datos por Provincia ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Calidad de Datos por Provincia
          </h3>
          <div className="h-64 w-full">
            {impactData.dataQuality.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData.dataQuality}
                  layout="vertical"
                  margin={{ left: 10, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v: unknown) => `${v}%`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tickFormatter={tickShort}
                    style={{ fontSize: '10px' }}
                  />
                  <Tooltip formatter={(value: unknown) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar
                    dataKey="phonePct"
                    name="Teléfono"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                  <Bar
                    dataKey="addressPct"
                    name="Dirección"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de provincias
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 6: Edad al Registro vs Actual ── */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Edad al Registro vs Actual
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: unknown) => `${Number(value).toFixed(1)} años`}
                />
                <Bar dataKey="Edad" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Chart 7: Vulnerabilidades y Programas Sociales (full width) ═══ */}
      {vulnProgramChartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Vulnerabilidades y Programas Sociales
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Distribución de programas sociales por tipo de vulnerabilidad
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vulnProgramChartData}
                layout="vertical"
                margin={{ left: 10, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tickFormatter={tickShort}
                  style={{ fontSize: '11px' }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {Object.keys(vulnProgramChartData[0])
                  .filter(k => k !== 'name')
                  .map((key, idx) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={key.length > 18 ? key.substring(0, 16) + '…' : key}
                      stackId="a"
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      radius={[0, 4, 4, 0]}
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ Footer ═══ */}
      <p className="text-xs text-gray-400 text-center">
        Datos calculados sobre {formatNumber(total)} participantes.
      </p>
    </div>
  );
};
