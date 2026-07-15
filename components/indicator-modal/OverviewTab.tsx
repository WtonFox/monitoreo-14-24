import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Indicator } from '../../hooks/useIndicators';
import type { BoardData } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface OverviewTabProps {
  indicator: Indicator;
  boardData: BoardData;
  meta: { primary: string };
}

const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export const OverviewTab: React.FC<OverviewTabProps> = ({ indicator, boardData, meta }) => {
  const { demographicData, territorialData, programData, socialData } = boardData;

  switch (indicator.category) {
    case 'demograficos':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Distribución por sexo</h4>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={[{ name: 'Mujeres', value: demographicData.women }, { name: 'Hombres', value: demographicData.men }]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  <Cell fill="#2563eb" /><Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Mujeres: {formatPercentage(demographicData.womenPct)}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Hombres: {formatPercentage(demographicData.menPct)}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Grupos de edad</h4>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={demographicData.ageBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

    case 'territoriales':
      const territorialSections = [
        { title: 'Top Municipios', items: territorialData.topMunicipios.slice(0, 5) },
        { title: 'Top Centros', items: territorialData.topCentros.slice(0, 5) },
        { title: 'Top Cursos', items: territorialData.topCursos.slice(0, 5) },
      ].filter(section => {
        if (section.title === 'Top Municipios' && (indicator.id === 11 || indicator.id === 12)) return false;
        if (section.title === 'Top Centros' && (indicator.id === 15 || indicator.id === 16)) return false;
        if (section.title === 'Top Cursos' && (indicator.id === 17 || indicator.id === 18)) return false;
        return true;
      });
      const territorialCols = territorialSections.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
      return (
        <div className={`grid grid-cols-1 ${territorialCols} gap-4`}>
          {territorialSections.map(section => (
            <div key={section.title} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.title}</h4>
              <div className="space-y-1.5">
                {section.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs items-center">
                    <span className="text-gray-600 truncate mr-2 flex-1">{item.name}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatNumber(item.value)}</span>
                  </div>
                ))}
                {section.items.length === 0 && <p className="text-xs text-gray-400 italic">Sin datos</p>}
              </div>
            </div>
          ))}
        </div>
      );

    case 'programa':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Distribución por estado</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={programData.statusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value" nameKey="name">
                  {programData.statusDistribution.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] mt-1">
              {programData.statusDistribution.slice(0, 6).map((s, i) => (
                <span key={s.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name}: {formatNumber(s.value)}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumen de retención</h4>
            <div className="space-y-4 mt-2">
              {[
                { label: 'Activos', pct: programData.activePct, color: 'bg-green-500' },
                { label: 'Egresados', pct: programData.graduatedPct, color: 'bg-blue-500' },
                { label: 'Menores con tutor', pct: programData.minorsWithTutorPct, color: 'bg-amber-500' },
                { label: 'Responsables con teléfono', pct: programData.tutorsWithPhonePct, color: 'bg-purple-500' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{bar.label}</span><span className="font-semibold text-gray-900">{formatPercentage(bar.pct)}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`${bar.color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(bar.pct, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'sociales':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Completitud de datos</h4>
            <div className="space-y-5 mt-2">
              {[
                { label: 'Teléfono registrado', pct: socialData.phoneCompletenessPct, color: 'bg-blue-500' },
                { label: 'Dirección registrada', pct: socialData.addressCompletenessPct, color: 'bg-emerald-500' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-600">{bar.label}</span><span className="font-bold text-gray-900">{formatPercentage(bar.pct)}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-3"><div className={`${bar.color} h-3 rounded-full transition-all`} style={{ width: `${bar.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Género por centro (top 5)</h4>
            <div className="space-y-2 mt-1">
              {socialData.genderByCentro.slice(0, 5).map((item, i) => {
                const total = item.Mujeres + item.Hombres;
                const wp = total > 0 ? (item.Mujeres / total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5"><span className="truncate mr-2">{item.name}</span><span className="font-semibold tabular-nums">{formatNumber(total)}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden"><div className="bg-blue-500 h-1.5 transition-all" style={{ width: `${wp}%` }} /><div className="bg-amber-400 h-1.5 transition-all" style={{ width: `${100 - wp}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
