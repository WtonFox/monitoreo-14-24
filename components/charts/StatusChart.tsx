import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Participant } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface StatusChartProps {
  data: Participant[];
  showLabels: boolean;
}

export const StatusChart: React.FC<StatusChartProps> = ({ data, showLabels }) => {
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const st = p.estado || 'Sin Estado';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Estado de Participantes (Top 5)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" style={{ fontSize: '10px' }} interval={0} />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
            {showLabels && <Legend />}
            <Bar
              dataKey="Cantidad"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
