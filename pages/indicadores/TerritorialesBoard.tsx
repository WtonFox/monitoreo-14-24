import React, { useState } from 'react'
import { formatNumber } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { MapPin, Building2, BookOpen, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { tickShort, chartClass, chartH } from '../../utils/indicadores-helpers'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

type ViewMode = 'grid' | 'row'

const TerritorialesBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData } = useIndicadoresFilters();
  const { territorialData } = boardData;

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  const renderHorizBar = (
    title: string,
    data: { name: string; value: number }[],
    color: string,
    dataKey = 'value',
    emptyMsg = 'Sin datos'
  ) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className={`h-${chartH} w-full`}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
              <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
              <Legend />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="flex h-full items-center justify-center text-gray-400">{emptyMsg}</div>}
      </div>
    </div>
  );

  return (
    <BoardShell
    title="Territoriales"
    description="Distribución geográfica de participantes por municipio, centro de formación y curso.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 mr-4"><MapPin size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Municipios</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.municipioCount)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Building2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Centros</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.centroCount)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4"><BookOpen size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Rutas Formativas</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatNumber(territorialData.cursoCount)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
                  <BoardInfo
            title="Territoriales"
            sections={[
              { heading: '¿Qué mide?', content: 'Distribución de participantes por municipio, centro de formación y curso. Permite identificar concentraciones geográficas y apoyar la planificación de intervenciones.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        {renderHorizBar('Top 10 Municipios', territorialData.topMunicipios, '#10b981', 'value', 'Sin datos de municipios')}
        {renderHorizBar('Top 10 Centros', territorialData.topCentros, '#8b5cf6', 'value', 'Sin datos de centros')}
        {renderHorizBar('Top 10 Rutas Formativas', territorialData.topCursos, '#f59e0b', 'value', 'Sin datos de cursos')}
        {/* Gender by Municipio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Sexo por Municipio (Top 10)</h3>
          <div className={`h-${chartH} w-full`}>
            {territorialData.genderByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={territorialData.genderByMunicipio} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={130} tickFormatter={tickShort} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Mujeres" fill="#00C49F" stackId="s" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Hombres" fill="#0088FE" stackId="s" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de género por municipio</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default TerritorialesBoard;