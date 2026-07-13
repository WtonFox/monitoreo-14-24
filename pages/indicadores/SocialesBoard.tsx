import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useIndicatorBoards } from '../../hooks/useIndicatorBoards';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Phone, MapPin } from 'lucide-react';

const SocialesBoard: React.FC = () => {
  const { dashboardData } = useDashboard();
  const { socialData } = useIndicatorBoards(dashboardData);

  // ── Empty state ──
  if (dashboardData.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <p>Recopilando datos sociales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {/* ── Section 1: Progress KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Completitud Teléfono */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
              <Phone size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Completitud Teléfono</p>
          </div>
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-800">
              {formatPercentage(socialData.phoneCompletenessPct)}
            </span>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(socialData.phoneCompletenessPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Completitud Dirección */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4">
              <MapPin size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">Completitud Dirección</p>
          </div>
          <div className="text-center">
            <span className="text-5xl font-bold text-gray-800">
              {formatPercentage(socialData.addressCompletenessPct)}
            </span>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2 w-full overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(socialData.addressCompletenessPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1 — Gender by Centro */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo por Centro (Top 10)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialData.genderByCentro} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="Mujeres" fill="#00C49F" stackId="sex" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Hombres" fill="#0088FE" stackId="sex" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 — Gender by Curso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo por Ruta Formativa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialData.genderByCurso} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="Mujeres" fill="#00C49F" stackId="sex" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Hombres" fill="#0088FE" stackId="sex" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3 — Age by Centro */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Grupo Etario por Centro</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialData.ageByCentro} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="r14_17" fill="#0088FE" stackId="age" radius={[0, 4, 4, 0]} />
                <Bar dataKey="r18_24" fill="#00C49F" stackId="age" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4 — Age by Curso */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Grupo Etario por Ruta Formativa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialData.ageByCurso} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatNumber} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="r14_17" fill="#0088FE" stackId="age" radius={[0, 4, 4, 0]} />
                <Bar dataKey="r18_24" fill="#00C49F" stackId="age" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SocialesBoard;
