import React, { useState } from 'react'
import { formatNumber, formatPercentage } from '../../utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Treemap,
} from 'recharts'
import { Activity, Award, Heart, Phone, Grid3X3, List } from 'lucide-react'
import BoardShell from '../../components/BoardShell'
import { chartClass, chartH } from '../../utils/indicadores-helpers'
import { YAxisTick } from '../../utils/indicadores-tick-components'
import { useIndicadoresFilters } from '../../contexts/IndicadoresFiltersContext'
import { IndicadoresFilterBar } from '../../components/IndicadoresFilterBar'
import BoardInfo from '../../components/BoardInfo';

const STATUS_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#9333ea', '#ca8a04', '#0d9488', '#ea580c', '#4b5563'];

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  index?: number;
  name?: string;
  value?: number;
  total?: number;
  [key: string]: unknown;
}

const CustomTreemapContent: React.FC<TreemapContentProps> = ({ x, y, width, height, index, name, value, total }) => {
  const [hovered, setHovered] = useState(false);

  if (!x || !y || !width || !height || width < 10 || height < 10) return null;

  const pct = total && value ? (value / total) * 100 : 0;
  const color = STATUS_COLORS[(index ?? 0) % STATUS_COLORS.length];
  const labelSize = width > 110 ? 13 : width > 70 ? 11 : 9;
  const subSize = width > 90 ? 11 : 9;
  const showPct = width > 55 && height > 35;
  const showName = width > 40 && height > 22;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={hovered ? 0.85 : 1}
        stroke={hovered ? '#1e293b' : 'rgba(255,255,255,0.6)'}
        strokeWidth={hovered ? 2 : 1}
        rx={3}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPct ? 7 : 0)}
          textAnchor="middle"
          fill="#fff"
          fontSize={labelSize}
          fontWeight={600}
          style={{ pointerEvents: 'none' }}
        >
          {name}
        </text>
      )}
      {showPct && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize={subSize}
          style={{ pointerEvents: 'none' }}
        >
          {formatNumber(value ?? 0)} ({pct.toFixed(1)}%)
        </text>
      )}
      {/* Native tooltip for rich hover info */}
      <title>
        {name}: {formatNumber(value ?? 0)} de {formatNumber(total ?? 0)} participantes ({pct.toFixed(1)}%)
      </title>
    </g>
  );
};

type ViewMode = 'grid' | 'row'

const ProgramaBoard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('row');
  const { boardData, filteredData, isDataLoading } = useIndicadoresFilters();
  const { programData } = boardData;

  if (isDataLoading) {
    return <BoardShell loading />;
  }

  if (filteredData.length === 0) {
    return <BoardShell empty />;
  }

  return (
    <BoardShell
    title="Estado del Programa"
    description="Seguimiento del estado actual de participantes: activos, egresados, retención y egreso por centro.">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Activos</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.activePct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4"><Award size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Egresados</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.graduatedPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-orange-50 rounded-lg text-orange-500 mr-4"><Heart size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Menores con Tutor</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.minorsWithTutorPct)}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4"><Phone size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">% Tutores con Teléfono</p>
            <h3 className="text-2xl font-bold text-gray-800">{formatPercentage(programData.tutorsWithPhonePct)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <IndicadoresFilterBar showYear showProvince showMunicipio noContainer />
        <div className="ml-auto flex items-center gap-2">
                  <BoardInfo
            title="Estado del Programa"
            sections={[
              { heading: '¿Qué mide?', content: 'Seguimiento del estado de los participantes: activos, egresados, retirados. Incluye tasas de retención y egreso por centro y municipio.' },
              { heading: 'Fórmula', content: 'Los cálculos se realizan en tiempo real sobre los datos filtrados. Cada indicador incluye su fórmula en la descripción.' },
              { heading: 'Filtros', content: 'Usa los filtros globales (año, provincia, municipio, sexo) para segmentar la población. Los datos se actualizan automáticamente.' },
            ]}
          />
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setViewMode('row')}
              className={`p-1.5 rounded ${viewMode === 'row' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Vista fila"><List size={16} /></button>
            <button onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} title="Vista cuadrícula"><Grid3X3 size={16} /></button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={chartClass(viewMode)}>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Distribución por Estado
            <span className="text-sm font-normal text-gray-400 ml-2">
              {formatNumber(filteredData.length)} participantes
            </span>
          </h3>
          <div className="h-80 w-full">
            {programData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={programData.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  aspectRatio={1}
                  content={<CustomTreemapContent total={filteredData.length} />}
                />
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos de estado</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Centro</h3>
          <div className={`h-${chartH} w-full`}>
            {programData.activeVsGraduatedByCentro.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByCentro} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={180} tick={<YAxisTick />} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos por centro</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activos vs Egresados por Municipio</h3>
          <div className={`h-${chartH} w-full`}>
            {programData.activeVsGraduatedByMunicipio.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData.activeVsGraduatedByMunicipio} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={180} tick={<YAxisTick />} />
                  <Tooltip formatter={(v: unknown) => formatNumber(Number(v))} />
                  <Legend />
                  <Bar dataKey="Activos" fill="#00C49F" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Egresados" fill="#0088FE" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-gray-400">Sin datos por municipio</div>}
          </div>
        </div>
      </div>
    </BoardShell>
  );
};

export default ProgramaBoard;
