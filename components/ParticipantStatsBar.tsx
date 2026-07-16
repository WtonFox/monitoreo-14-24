import React from 'react';
import { Participant } from '../types';
import { formatNumber } from '../utils/formatters';

interface ParticipantStatsBarProps {
  data: Participant[];
}

export const ParticipantStatsBar: React.FC<ParticipantStatsBarProps> = ({ data }) => {
  const mCount = data.filter(p => p.sexo === 'M').length;
  const fCount = data.filter(p => p.sexo === 'F').length;
  const avgAge = data.length > 0
    ? Math.round(data.reduce((s, p) => s + (p.edad || 0), 0) / data.length)
    : 0;
  const uniqueCenters = new Set(data.map(p => p.centro).filter(Boolean)).size;

  return (
    <div className="flex flex-wrap gap-4 px-4 py-3 bg-blue-50 border-b border-blue-100 text-sm">
      <span className="font-semibold text-blue-900">{formatNumber(data.length)} participantes</span>
      <span className="text-blue-700">M: {formatNumber(mCount)}</span>
      <span className="text-blue-700">F: {formatNumber(fCount)}</span>
      {data.length > 0 && (
        <span className="text-blue-700">
          Edad prom: {avgAge}
        </span>
      )}
      <span className="text-blue-700">
        {formatNumber(uniqueCenters)} centros
      </span>
    </div>
  );
};
