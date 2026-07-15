import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Indicator } from '../../hooks/useIndicators';
import type { BoardData } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface DetailTabProps {
  indicator: Indicator;
  boardData: BoardData;
  meta: { primary: string };
}

export const DetailTab: React.FC<DetailTabProps> = ({ indicator, boardData, meta }) => {
  const { qualityData, vulnerabilityData } = boardData;

  switch (indicator.category) {
    case 'calidad-dato':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Completitud por campo</h4>
            <div className="space-y-4 mt-2">
              {qualityData.fieldBreakdown.map((field, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600 truncate mr-2 flex-1">{field.name}</span><span className="font-bold text-gray-900">{formatPercentage(field.pct)}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-violet-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(field.pct, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumen de calidad</h4>
            <div className="space-y-3 mt-2">
              {[
                { label: 'Cédula', pct: qualityData.cedulaPct },
                { label: 'Fecha de nacimiento', pct: qualityData.birthDatePct },
                { label: 'Nivel de estudio', pct: qualityData.educationPct },
                { label: 'Alergias', pct: qualityData.allergiesPct },
                { label: 'Discapacidades', pct: qualityData.disabilitiesPct },
                { label: 'Enfermedades', pct: qualityData.diseasesPct },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(item.pct, 100)}%`, backgroundColor: meta.primary }} /></div>
                  <span className="text-xs font-semibold text-gray-700 w-24 text-right">{item.label}: {formatPercentage(item.pct)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'vulnerabilidad':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prevalencia</h4>
            <div className="space-y-4 mt-2">
              {[
                { label: 'Discapacidad', pct: vulnerabilityData.disabilitiesPct, color: 'bg-red-500' },
                { label: 'Enfermedad', pct: vulnerabilityData.diseasesPct, color: 'bg-orange-500' },
                { label: 'Alergia', pct: vulnerabilityData.allergiesPct, color: 'bg-amber-500' },
                { label: 'Programas Sociales', pct: vulnerabilityData.socialProgramsPct, color: 'bg-purple-500' },
                { label: 'Vulnerabilidades', pct: vulnerabilityData.vulnerabilitiesPct, color: 'bg-rose-500' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{bar.label}</span><span className="font-bold text-gray-900">{formatPercentage(bar.pct)}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className={`${bar.color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(bar.pct, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top listas</h4>
            <div className="space-y-4 mt-2">
              {[
                { title: 'Discapacidades', items: vulnerabilityData.topDisabilities },
                { title: 'Enfermedades', items: vulnerabilityData.topDiseases },
                { title: 'Alergias', items: vulnerabilityData.topAllergies },
              ].filter(section => {
                if (section.title === 'Discapacidades' && indicator.id === 44) return false;
                if (section.title === 'Enfermedades' && indicator.id === 46) return false;
                return true;
              }).map(section => (
                <div key={section.title}>
                  <h5 className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{section.title}</h5>
                  {section.items.length > 0 ? (
                    <div className="space-y-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs"><span className="text-gray-600 truncate mr-2 flex-1">{item.name}</span><span className="font-semibold text-gray-900">{formatNumber(item.value)}</span></div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-400 italic">Sin datos</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
