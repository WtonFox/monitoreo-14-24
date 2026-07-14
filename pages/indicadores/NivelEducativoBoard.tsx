import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { GraduationCap, BookOpen, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];

type ViewMode = 'grid' | 'row'

const NivelEducativoBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { boardData, filteredData } = useIndicadoresFilters();
  const { educationData } = boardData;

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const totalConDato = educationData.educationDistribution.reduce((s, e) => s + e.value, 0);
  const totalSinDato = filteredData.length - totalConDato;
  const pctSinDato = filteredData.length > 0 ? (totalSinDato / filteredData.length) * 100 : 0;
  const nivelMasComun = educationData.educationDistribution.length > 0 ? educationData.educationDistribution[0] : null;
  const pctMasComun = nivelMasComun && filteredData.length > 0
    ? (nivelMasComun.value / filteredData.length) * 100
    : 0;

  return (
    <BoardShell>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600 mr-4"><GraduationCap size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Niveles Distintos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(educationData.educationDistribution.length)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Más Común</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {nivelMasComun ? `${nivelMasComun.name}: ${formatPercentage(pctMasComun)}` : 'N/A'}
            </h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total con Dato</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(totalConDato)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-gray-50 rounded-lg text-gray-500 mr-4"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Sin Dato</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(pctSinDato)}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio />
        </div>
                  <BoardInfo
            title="Nivel Educativo"
            sections={[
              { heading: '¿Qué mide?', content: 'Distribución de participantes por nivel de estudio. Relación entre nivel educativo, estado del programa (activo/egresado) y sexo.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
        <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución Educativa</h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={educationData.educationDistribution} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={80} fill="#8884d8" dataKey="value">
                    {educationData.educationDistribution.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel × Estado</h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData.educationByStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickFormatter={tickShort} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#14b8a6" stackId="s" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#3b82f6" stackId="s" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel × Sexo</h3>
          <div className={`h-${chartH} w-full`}>
            {educationData.educationBySex.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={educationData.educationBySex}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickFormatter={tickShort} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel predominante por Centro</h3>
          <div className={`h-${chartH} w-full overflow-y-auto`}>
            {educationData.topEducationByCenter.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Centro</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Nivel</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Participantes</th>
                  </tr>
                </thead>
                <tbody>
                  {educationData.topEducationByCenter.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-700">{item.center}</td>
                      <td className="py-2 px-3">
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">{item.level}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatNumber(item.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default NivelEducativoBoard;