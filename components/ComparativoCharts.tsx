import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Participant } from '../types';
import { formatNumber } from '../utils/formatters';

interface ComparativoChartsProps {
  dataA: Participant[];
  dataB: Participant[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#a855f7'];

// ---------------------------------------------------------------------------
// Reusable dual-chart wrapper
// ---------------------------------------------------------------------------

const DualChart: React.FC<{
  title: string;
  renderChart: (data: Participant[], label: string) => React.ReactNode;
  dataA: Participant[];
  dataB: Participant[];
}> = ({ title, renderChart, dataA, dataB }) => (
  <div>
    <h3 className="text-base font-bold text-gray-800 mb-3">{title}</h3>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2">Grupo A</p>
        {renderChart(dataA, 'A')}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Grupo B</p>
        {renderChart(dataB, 'B')}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Bar chart helper
// ---------------------------------------------------------------------------

const SimpleBarChart: React.FC<{ data: { name: string; value: number }[]; color: string }> = ({ data, color }) => (
  <div className="h-52 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={formatNumber} style={{ fontSize: '10px' }} />
        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} />
        <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
        <Bar dataKey="value" fill={color} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// ---------------------------------------------------------------------------
// Gender Pie
// ---------------------------------------------------------------------------

const GenderPie: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const sex = (p.sexo || 'N/D').trim().toUpperCase();
      counts[sex === 'F' ? 'Femenino' : sex === 'M' ? 'Masculino' : sex] = (counts[sex === 'F' ? 'Femenino' : sex === 'M' ? 'Masculino' : sex] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status bar (top 5 statuses)
// ---------------------------------------------------------------------------

const StatusBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const st = p.estado || 'Sin Estado';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#f59e0b" />;
};

// ---------------------------------------------------------------------------
// Nivel de estudio bar
// ---------------------------------------------------------------------------

const EducLevelBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ne = p.nivelEstudio || 'N/D';
      if (ne !== 'N/A' && ne !== 'N/D') counts[ne] = (counts[ne] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#8884d8" />;
};

// ---------------------------------------------------------------------------
// Estado civil bar
// ---------------------------------------------------------------------------

const MaritalStatusBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ec = p.estadoCivil || 'N/D';
      if (ec !== 'N/A' && ec !== 'N/D') counts[ec] = (counts[ec] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#06b6d4" />;
};

// ---------------------------------------------------------------------------
// Vulnerabilidades bar (top 5)
// ---------------------------------------------------------------------------

const VulnerabilidadBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.vulnerabilidades || p.vulnerabilidades === 'N/A' || p.vulnerabilidades === 'Ninguna') return;
      p.vulnerabilidades.split(',').map(v => v.trim()).forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#ef4444" />;
};

// ---------------------------------------------------------------------------
// Programas sociales bar (top 5)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Ruta formativa bar (top 5)
// ---------------------------------------------------------------------------

const RutaBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.rutaFormativa) return;
      counts[p.rutaFormativa] = (counts[p.rutaFormativa] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#a855f7" />;
};

const ProgramasBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.programasSociales || p.programasSociales === 'N/A' || p.programasSociales === 'Ninguna') return;
      p.programasSociales.split(',').map(v => v.trim()).forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.length === 0) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return <SimpleBarChart data={chartData} color="#14b8a6" />;
};

// ---------------------------------------------------------------------------
// Age bars
// ---------------------------------------------------------------------------

const AgeBars: React.FC<{ data: Participant[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const ranges: Record<string, number> = { '14-17': 0, '18-20': 0, '21-24': 0, '25-29': 0, '30+': 0 };
    data.forEach(p => {
      const age = p.edad;
      if (age <= 0 || age > 120) return;
      if (age <= 17) ranges['14-17']++;
      else if (age <= 20) ranges['18-20']++;
      else if (age <= 24) ranges['21-24']++;
      else if (age <= 29) ranges['25-29']++;
      else ranges['30+']++;
    });
    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [data]);
  if (chartData.every(d => d.value === 0)) return <div className="h-52 flex items-center justify-center text-gray-400 text-xs">Sin datos</div>;
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" style={{ fontSize: '10px' }} />
          <YAxis tickFormatter={formatNumber} style={{ fontSize: '10px' }} />
          <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
          <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ComparativoCharts: React.FC<ComparativoChartsProps> = ({ dataA, dataB }) => {
  return (
    <div className="space-y-6">
      <DualChart title="Ruta Formativa — Cursos Más Demandados (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <RutaBars data={d} />} />

      <DualChart title="Distribución por Sexo" dataA={dataA} dataB={dataB}
        renderChart={(d) => <GenderPie data={d} />} />

      <DualChart title="Grupos de Edad" dataA={dataA} dataB={dataB}
        renderChart={(d) => <AgeBars data={d} />} />

      <DualChart title="Estado de Participantes (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <StatusBars data={d} />} />

      <DualChart title="Nivel de Estudio (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <EducLevelBars data={d} />} />

      <DualChart title="Estado Civil (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <MaritalStatusBars data={d} />} />

      <DualChart title="Vulnerabilidades (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <VulnerabilidadBars data={d} />} />

      <DualChart title="Programas Sociales (Top 5)" dataA={dataA} dataB={dataB}
        renderChart={(d) => <ProgramasBars data={d} />} />
    </div>
  );
};
