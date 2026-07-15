import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { AlertTriangle, Grid3X3, List, Accessibility, Heart, Shield } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

const COLORS = ['#dc2626', '#f97316', '#eab308', '#a855f7', '#ec4899'];
const PIE_COLORS = ['#dc2626', '#fca5a5', '#fef2f2'];

type ViewMode = 'grid' | 'row'

const VulnerabilidadBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData } = useIndicadoresFilters();
  const { vulnerabilityData } = boardData;

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const prevalenceData = [
    { name: 'Discapacidad', value: vulnerabilityData.disabilitiesPct },
    { name: 'Enfermedad', value: vulnerabilityData.diseasesPct },
    { name: 'Alergia', value: vulnerabilityData.allergiesPct },
    { name: 'Prog. Sociales', value: vulnerabilityData.socialProgramsPct },
    { name: 'Vulnerabilidad', value: vulnerabilityData.vulnerabilitiesPct },
  ];

  const pieData = [
    { name: 'Con discapacidad', value: vulnerabilityData.disabilitiesPct },
    { name: 'Con enfermedad', value: vulnerabilityData.diseasesPct },
    { name: 'Con alergia', value: vulnerabilityData.allergiesPct },
  ].filter(d => d.value > 0);

  return (
    <BoardShell
    title="Vulnerabilidad"
    description="Participantes con condiciones de vulnerabilidad: discapacidades, enfermedades, alergias y programas sociales.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-red-50 rounded-lg text-red-600 mr-4"><Accessibility size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Discapacidad</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.disabilitiesPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Enfermedad</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.diseasesPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Shield size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Prog. Sociales</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(vulnerabilityData.socialProgramsPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-500 mr-4"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Evaluados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(filteredData.length)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
                  <BoardInfo
            title="Vulnerabilidad"
            sections={[
              { heading: '¿Qué mide?', content: 'Participantes con condiciones de vulnerabilidad: discapacidades, enfermedades, alergias, programas sociales y vulnerabilidades generales. Los porcentajes se calculan solo sobre registros con dato.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`} title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`} title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Prevalencia</h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prevalenceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickFormatter={tickShort} />
                <YAxis tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                <Legend />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} name="Prevalencia" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución de condiciones</h3>
          <div className={`h-${chartH} w-full`}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatPercentage(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Discapacidades</h3>
          <div className={`h-${chartH} w-full`}>
            {vulnerabilityData.topDisabilities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityData.topDisabilities} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Bar dataKey="value" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Enfermedades</h3>
          <div className={`h-${chartH} w-full`}>
            {vulnerabilityData.topDiseases.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityData.topDiseases} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default VulnerabilidadBoard;