import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Participant } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface AgeChartProps {
  data: Participant[];
  showLabels: boolean;
}

export const AgeChart: React.FC<AgeChartProps> = ({ data, showLabels }) => {
  const ageData = useMemo(() => {
    const ranges: Record<string, number> = {
      '14-17': 0, '18-20': 0, '21-24': 0, '25-29': 0, '30+': 0, Unknown: 0,
    };
    data.forEach(p => {
      const age = p.edad;
      if (age === null || age === undefined || age <= 0 || age > 120) {
        ranges['Unknown']++;
      } else if (age >= 14 && age <= 17) ranges['14-17']++;
      else if (age >= 18 && age <= 20) ranges['18-20']++;
      else if (age >= 21 && age <= 24) ranges['21-24']++;
      else if (age >= 25 && age <= 29) ranges['25-29']++;
      else ranges['30+']++;
    });
    return Object.keys(ranges).map(key => ({ name: key, Cantidad: ranges[key] }));
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Grupos de Edad</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatNumber} />
            <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
            {showLabels && <Legend />}
            <Bar
              dataKey="Cantidad"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
