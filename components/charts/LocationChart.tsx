import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Participant } from '../../types';
import { formatNumber } from '../../utils/formatters';

interface LocationChartProps {
  data: Participant[];
  showLabels: boolean;
}

export const LocationChart: React.FC<LocationChartProps> = ({ data, showLabels }) => {
  const provinceData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const prov = p.provincia || 'Desconocido';
      counts[prov] = (counts[prov] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad);
  }, [data]);

  const centerData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const center = p.centro || 'Sin Asignar';
      counts[center] = (counts[center] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key.length > 25 ? key.substring(0, 22) + '...' : key, full: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 6);
  }, [data]);

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 7 Provincias</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={provinceData.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '11px' }} />
              <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
              {showLabels && <Legend />}
              <Bar
                dataKey="Cantidad"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Centros Educativos</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={centerData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '10px' }} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border border-gray-200 shadow-lg rounded text-xs">
                      <p className="font-bold">{payload[0].payload.full}</p>
                      <p>{formatNumber(Number(payload[0].value))} participantes</p>
                    </div>
                  );
                }
                return null;
              }} />
              {showLabels && <Legend />}
              <Bar
                dataKey="Cantidad"
                fill="#8884d8"
                radius={[0, 4, 4, 0]}
                label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};
