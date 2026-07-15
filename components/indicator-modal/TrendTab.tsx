import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Indicator } from '../../hooks/useIndicators';
import type { BoardData } from '../../hooks/useIndicatorBoards';
import { formatNumber } from '../../utils/formatters';

interface TrendTabProps {
  indicator: Indicator;
  boardData: BoardData;
  meta: { primary: string };
}

export const TrendTab: React.FC<TrendTabProps> = ({ indicator, boardData, meta }) => {
  const { temporalData, educationData, centerData } = boardData;

  switch (indicator.category) {
    case 'cobertura-temporal':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registros por año</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={temporalData.registrationsByYear}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Métricas temporales</h4>
            <div className="space-y-4 mt-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-xs text-gray-600">Edad registro promedio</span>
                <span className="text-sm font-bold text-gray-900">{temporalData.avgAgeAtRegistration.toFixed(1)} años</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-xs text-gray-600">Días a inclusión</span>
                <span className="text-sm font-bold text-gray-900">{temporalData.avgDaysToInclusion.toFixed(0)} días</span>
              </div>
              <div className="mt-4">
                <h5 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Registros por trimestre</h5>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={temporalData.registrationsByQuarter}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} hide />
                    <Tooltip />
                    <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );

    case 'nivel-educativo':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Distribución educativa</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={educationData.educationDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill={meta.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel × Estado</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={educationData.educationByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Activos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

    case 'desempeno-centro':
      return (
        <div className={`grid grid-cols-1 ${indicator.id === 61 ? '' : 'sm:grid-cols-2'} gap-4`}>
          {indicator.id !== 61 && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top centros</h4>
            <div className="space-y-2 mt-1 max-h-60 overflow-y-auto">
              {centerData.topCenters.slice(0, 5).map((item, i) => (
                <div key={i} className="text-xs border-b border-gray-100 pb-1.5">
                  <div className="flex justify-between items-center mb-1"><span className="text-gray-700 font-medium truncate mr-2 flex-1">{item.name}</span><span className="font-bold text-gray-900">{formatNumber(item.total)}</span></div>
                  <div className="flex gap-3 text-[10px] text-gray-500"><span>Activos: {formatNumber(item.activos)}</span><span>Egresados: {formatNumber(item.egresados)}</span></div>
                </div>
              ))}
            </div>
          </div>
          )}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Género por centro</h4>
            <div className="space-y-2 mt-1">
              {centerData.genderByCenter.slice(0, 5).map((item, i) => {
                const total = item.Mujeres + item.Hombres;
                const wp = total > 0 ? (item.Mujeres / total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5"><span className="truncate mr-2">{item.name}</span><span className="font-semibold tabular-nums">{formatNumber(total)}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 flex overflow-hidden"><div className="bg-teal-500 h-1.5 transition-all" style={{ width: `${wp}%` }} /><div className="bg-amber-400 h-1.5 transition-all" style={{ width: `${100 - wp}%` }} /></div>
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
