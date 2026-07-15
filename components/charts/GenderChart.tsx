import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Participant } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface GenderChartProps {
  data: Participant[];
  showLabels: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];

export const GenderChart: React.FC<GenderChartProps> = ({ data, showLabels }) => {
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const sex = (p.sexo || 'No Definido').trim().toUpperCase();
      counts[sex] = (counts[sex] || 0) + 1;
    });
    return Object.keys(counts).map(key => {
      let displayName = key;
      if (key === 'F') displayName = 'Femenino';
      else if (key === 'M') displayName = 'Masculino';
      else displayName = key;
      return { name: displayName, Cantidad: counts[key] };
    });
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Sexo</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={genderData}
              cx="50%" cy="50%"
              labelLine={showLabels}
              label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="Cantidad"
            >
              {genderData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
