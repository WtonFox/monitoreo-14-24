import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Users, Heart, Calendar, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];

type ViewMode = 'grid' | 'row'

const DemograficosBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { boardData, filteredData } = useIndicadoresFilters();
  const { demographicData } = boardData;

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const genderPieData = [
    { name: 'Femenino', value: demographicData.women },
    { name: 'Masculino', value: demographicData.men },
  ];

  return (
    <BoardShell>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Inscritos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(demographicData.total)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-pink-50 rounded-lg text-pink-500 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mujeres</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(demographicData.womenPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hombres</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(demographicData.menPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Edad al Registro</p>
            <h3 className="text-2xl font-bold text-gray-800">{demographicData.avgAgeReg.toFixed(1)}</h3>
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <IndicadoresFilterBar showYear showProvince showMunicipio showSex />
        </div>
                  <BoardInfo
            title="Demográficos"
            sections={[
              { heading: '¿Qué mide?', content: 'Distribución de participantes por sexo, grupos de edad y estado civil. Muestra la composición demográfica de la población atendida por el programa.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
        <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('row')}
            className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Vista fila"><List size={16} /></button>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        {/* Gender Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Sexo</h3>
          <div className={`h-${chartH} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderPieData} cx="50%" cy="50%" labelLine={false}
                  label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80} fill="#8884d8" dataKey="value">
                  {genderPieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Grupos de Edad</h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.ageBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData.ageBuckets}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickFormatter={tickShort} />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de edad</div>}
          </div>
        </div>

        {/* Marital Status Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Estado Civil</h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.maritalStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={demographicData.maritalStatus} cx="50%" cy="50%" labelLine={false}
                    label={({ name, percent, value }: any) => `${tickShort(name)}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={70} fill="#8884d8" dataKey="value">
                    {demographicData.maritalStatus.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin datos de estado civil
              </div>
            )}
          </div>
        </div>

        {/* Gender × Age Stacked */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo por Grupo de Edad</h3>
          <div className={`h-${chartH} w-full`}>
            {demographicData.genderAgeCross.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicData.genderAgeCross}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" stackId="s" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" stackId="s" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default DemograficosBoard;