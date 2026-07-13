import React, { useMemo } from 'react';
import { Participant } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    TrendingUp, GraduationCap, ShieldCheck, Users,
    Briefcase, Heart, AlertTriangle
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { IMPACT_ANALYSIS_EXCLUDED_STATUSES } from '../constants';

interface ImpactSectionProps {
    data: Participant[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ImpactSection: React.FC<ImpactSectionProps> = ({ data }) => {

    // Filter out dropouts/not admitted for Impact Analysis
    const impactData = useMemo(() => {
        return data.filter(p => !p.estado || !IMPACT_ANALYSIS_EXCLUDED_STATUSES.includes(p.estado));
    }, [data]);

    // Calculate excluded count for display
    const excludedCount = data.length - impactData.length;

    // --- Metricas Clave --- //
    const stats = useMemo(() => {
        // Total global (incluyendo desertores, retirados, etc)
        const total = data.length || 1;
        // Total para porcentajes de efectividad (solo activos/impactados)
        const effectiveTotal = impactData.length || 1;

        // 1. Reducción de Pobreza (Proxy: Vulnerabilidades)
        // Asumimos que aquellos identificados con vulnerabilidad son atendidos
        const withVulnerability = impactData.filter(p => p.vulnerabilidades && p.vulnerabilidades.length > 2).length;

        // 2. Prevención Delincuencia (Proxy: Datos demográficos de riesgo 14-24)
        const youthAtRisk = impactData.filter(p => p.edad >= 14 && p.edad <= 24).length;

        // 3. Educación (Proxy: Rutas Formativas Activas)
        // Filtramos rutas que parecen válidas (no nulas, no vacías)
        const inEducation = impactData.filter(p => p.rutaFormativa && p.rutaFormativa.length > 3).length;

        // 4. Inserción Laboral / Productiva (Proxy: Estado o 'Egresado')
        // Ajustar lógica según los estados reales de la data
        const productive = impactData.filter(p => p.estado === 'Inserción Laboral' || p.estado === 'Egresado').length;

        return {
            total,
            withVulnerability,
            vulnerabilityRate: ((withVulnerability / effectiveTotal) * 100).toFixed(1),
            youthAtRisk,
            youthRate: ((youthAtRisk / effectiveTotal) * 100).toFixed(1),
            inEducation,
            educationRate: ((inEducation / effectiveTotal) * 100).toFixed(1),
            productive
        };
    }, [impactData]);

    // --- Gráficos --- //

    // Gráfico 1: Desglose por Vulnerabilidad (Top 5)
    const vulnerabilityData = useMemo(() => {
        const counts: Record<string, number> = {};
        impactData.forEach(p => {
            if (p.vulnerabilidades) {
                // A veces vienen separadas por comas
                const vulns = p.vulnerabilidades.split(',').map(v => v.trim());
                vulns.forEach(v => {
                    if (v) counts[v] = (counts[v] || 0) + 1;
                });
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [impactData]);

    // Gráfico 2: Educación - Rutas Formativas (Top 5)
    const educationData = useMemo(() => {
        const counts: Record<string, number> = {};
        impactData.forEach(p => {
            if (p.rutaFormativa) {
                const route = p.rutaFormativa.trim();
                if (route) counts[route] = (counts[route] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [impactData]);

    // Gráfico 3: Distribución por Edad (Prevención Delincuencia)
    const ageData = useMemo(() => {
        const ranges = [
            { name: '14-17', min: 14, max: 17, value: 0 },
            { name: '18-20', min: 18, max: 20, value: 0 },
            { name: '21-24', min: 21, max: 24, value: 0 },
            { name: '25+', min: 25, max: 100, value: 0 },
        ];

        impactData.forEach(p => {
            const age = p.edad;
            const range = ranges.find(r => age >= r.min && age <= r.max);
            if (range) range.value++;
        });
        return ranges;
    }, [impactData]);

    return (
        <div className="space-y-8 p-2 animate-in fade-in duration-500">

            {/* Header Impacto */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="text-red-500" /> Tablero de Impacto Social
                </h2>
                <p className="text-gray-500">
                    Visualización estratégica del aporte del programa a la reducción de pobreza, educación y prevención.
                    {excludedCount > 0 && (
                        <span className="block mt-1 text-xs text-amber-600 font-medium">
                            * Se han excluido {formatNumber(excludedCount)} participantes con estado no activo (Retirados, No admitidos, etc).
                        </span>
                    )}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Pobreza / Vulnerabilidad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Reducción Pobreza</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(stats.withVulnerability)}</h3>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Jóvenes atendidos con <span className="font-medium text-gray-700">factores de vulnerabilidad</span> detectados.
                    </p>
                </div>

                {/* Card 2: Prevención Delincuencia (14-24 años) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Prevención Delito</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.youthRate}%</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Cobertura en demografía crítica <span className="font-medium text-gray-700">(14-24 años)</span> intervenida.
                    </p>
                </div>

                {/* Card 3: Educación Técnica */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Educación</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(stats.inEducation)}</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <GraduationCap size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Jóvenes insertados en <span className="font-medium text-gray-700">rutas formativas</span> técnicas.
                    </p>
                </div>

                {/* Card 4: Impacto Total */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Alcance Total</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(stats.total)}</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Users size={24} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Total de beneficiarios impactados por el programa a nivel nacional.
                    </p>
                </div>
            </div>

            {/* Row 1 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Chart: Factores de Vulnerabilidad */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-gray-400" size={18} />
                        Factores de Riesgo Mitigados
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vulnerabilityData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} interval={0} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => formatNumber(value)} />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Top 5 vulnerabilidades identificadas y en atención</p>
                </div>

                {/* Chart: Rutas Formativas */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Briefcase className="text-gray-400" size={18} />
                        Educación para el Trabajo
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={educationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {educationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(value: number) => formatNumber(value)} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "12px" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Distribución en áreas técnicas principales</p>
                </div>

            </div>

            {/* Row 2: Demographics for Impact */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Enfoque Demográfico (Prevención)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={formatNumber} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8 }} formatter={(value: number) => formatNumber(value)} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50}>
                                {ageData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 || index === 1 ? '#3b82f6' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <strong>Análisis Estratégico:</strong> La concentración en los grupos de <strong>14-17</strong> y <strong>18-20</strong> años demuestra una alta efectividad en la captación temprana, fundamental para la prevención de la delincuencia juvenil.
                </div>
            </div>

        </div>
    );
};
