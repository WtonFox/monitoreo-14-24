import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Participant } from '../types';
import { Calendar, CalendarDays } from 'lucide-react';
import { DominicanRepublicMap } from './DominicanRepublicMap';
import { PROVINCE_MUNICIPALITIES } from '../constants';
import { formatNumber } from '../utils/formatters';
import { AgeChart } from './charts/AgeChart';
import { GenderChart } from './charts/GenderChart';
import { StatusChart } from './charts/StatusChart';
import { LocationChart } from './charts/LocationChart';

interface ChartsSectionProps {
  data: Participant[];
  selectedProvince: string;
  selectedMunicipio: string;
  showLabels?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data, selectedProvince, selectedMunicipio, showLabels = false }) => {
  const [mapViewMode, setMapViewMode] = useState<'pin' | 'polygon'>('polygon');
  const [registrationViewMode, setRegistrationViewMode] = useState<'monthly' | 'annual'>('monthly');
  const [inclusionViewMode, setInclusionViewMode] = useState<'monthly' | 'annual'>('monthly');

  const mapLevel = useMemo<'province' | 'municipality'>(() => {
    if (selectedProvince) return 'municipality';
    return 'province';
  }, [selectedProvince]);

  const mapFilteredData = useMemo(() => {
    if (selectedProvince && mapLevel === 'municipality') {
      const officialMunicipalities = PROVINCE_MUNICIPALITIES[selectedProvince] || [];
      return data.filter(p => {
        if (p.provincia === selectedProvince) return true;
        if (p.municipio && officialMunicipalities.includes(p.municipio)) return true;
        return false;
      });
    }
    return data;
  }, [data, selectedProvince, mapLevel]);

  const registrationTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    const annualCounts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.fechaRegistro) return;
      try {
        const date = new Date(p.fechaRegistro);
        if (isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        counts[monthKey] = (counts[monthKey] || 0) + 1;
        const yearKey = `${date.getFullYear()}`;
        annualCounts[yearKey] = (annualCounts[yearKey] || 0) + 1;
      } catch (e) { }
    });
    return {
      monthly: Object.keys(counts).sort().map(key => ({ name: key, Registros: counts[key] })),
      annual: Object.keys(annualCounts).sort().map(key => ({ name: key, Registros: annualCounts[key] })),
    };
  }, [data]);

  const inclusionTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    const annualCounts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.fechaInclusion) return;
      try {
        const date = new Date(p.fechaInclusion);
        if (isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        counts[monthKey] = (counts[monthKey] || 0) + 1;
        const yearKey = `${date.getFullYear()}`;
        annualCounts[yearKey] = (annualCounts[yearKey] || 0) + 1;
      } catch (e) { }
    });
    return {
      monthly: Object.keys(counts).sort().map(key => ({ name: key, Inclusiones: counts[key] })),
      annual: Object.keys(annualCounts).sort().map(key => ({ name: key, Inclusiones: annualCounts[key] })),
    };
  }, [data]);

  const currentRegistrationData = registrationViewMode === 'monthly' ? registrationTrendData.monthly : registrationTrendData.annual;
  const currentInclusionData = inclusionViewMode === 'monthly' ? inclusionTrendData.monthly : inclusionTrendData.annual;

  const vulnerabilityData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.vulnerabilidades || p.vulnerabilidades === 'N/A' || p.vulnerabilidades === 'Ninguna') return;
      const vulns = p.vulnerabilidades.split(',').map(v => v.trim());
      vulns.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] })).sort((a, b) => b.Cantidad - a.Cantidad).slice(0, 5);
  }, [data]);

  const estadoCivilData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ec = p.estadoCivil || 'No Definido';
      if (ec === 'N/A' || ec === 'No Definido') return;
      counts[ec] = (counts[ec] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] }));
  }, [data]);

  const nivelEstudioData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ne = p.nivelEstudio || 'No Definido';
      if (ne === 'N/A' || ne === 'No Definido') return;
      counts[ne] = (counts[ne] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] }));
  }, [data]);

  const programasSocialesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.programasSociales || p.programasSociales === 'N/A' || p.programasSociales === 'Ninguna') return;
      p.programasSociales.split(',').map(v => v.trim()).forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] })).sort((a, b) => b.Cantidad - a.Cantidad).slice(0, 5);
  }, [data]);

  const discapacidadesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.discapacidades || p.discapacidades === 'N/D' || p.discapacidades === 'Ninguna') return;
      p.discapacidades.split(',').map(v => v.trim()).forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] })).sort((a, b) => b.Cantidad - a.Cantidad).slice(0, 5);
  }, [data]);

  const enfermedadesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.enfermedades || p.enfermedades === 'N/D' || p.enfermedades === 'Ninguna') return;
      p.enfermedades.split(',').map(v => v.trim()).forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.keys(counts).map(key => ({ name: key, Cantidad: counts[key] })).sort((a, b) => b.Cantidad - a.Cantidad).slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-gray-800">Evolución de Registros ({registrationViewMode === 'monthly' ? 'Mensual' : 'Anual'})</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button onClick={() => setRegistrationViewMode('monthly')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${registrationViewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><CalendarDays size={14} /> Mensual</button>
            <button onClick={() => setRegistrationViewMode('annual')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${registrationViewMode === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Calendar size={14} /> Anual</button>
          </div>
        </div>
        <div className="h-72 w-full">
          {currentRegistrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRegistrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="name" style={{ fontSize: '11px' }} minTickGap={30} />
                <YAxis tickFormatter={formatNumber} style={{ fontSize: '11px' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value)), "Registros"]} />
                {showLabels && <Legend />}
                <Area type="monotone" dataKey="Registros" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReg)" label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Datos insuficientes para línea de tiempo</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-gray-800">Evolución de Inclusiones ({inclusionViewMode === 'monthly' ? 'Mensual' : 'Anual'})</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button onClick={() => setInclusionViewMode('monthly')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${inclusionViewMode === 'monthly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><CalendarDays size={14} /> Mensual</button>
            <button onClick={() => setInclusionViewMode('annual')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${inclusionViewMode === 'annual' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Calendar size={14} /> Anual</button>
          </div>
        </div>
        <div className="h-72 w-full">
          {currentInclusionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentInclusionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="name" style={{ fontSize: '11px' }} minTickGap={30} />
                <YAxis tickFormatter={formatNumber} style={{ fontSize: '11px' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value)), "Inclusiones"]} />
                {showLabels && <Legend />}
                <Area type="monotone" dataKey="Inclusiones" stroke="#10b981" fillOpacity={1} fill="url(#colorInc)" label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Datos insuficientes para línea de tiempo de inclusiones</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              📍 Mapa de República Dominicana {mapLevel === 'municipality' ? 'por Municipio' : 'por Provincia'}
              {selectedProvince && <span className="block sm:inline text-sm font-normal text-blue-600 sm:ml-2">• {selectedProvince}</span>}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Visualización geográfica de la densidad de participantes.
              {showLabels && ' Pasa el mouse sobre una área para ver detalles.'}
              {selectedProvince && ` Mostrando municipios de ${selectedProvince}.`}
            </p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button onClick={() => setMapViewMode('polygon')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${mapViewMode === 'polygon' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🗺️ Polígonos</button>
            <button onClick={() => setMapViewMode('pin')} className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${mapViewMode === 'pin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>📍 PINs</button>
          </div>
        </div>
        <div className="h-96 md:h-[550px] w-full">
          <DominicanRepublicMap data={mapFilteredData} showLabels={showLabels} viewMode={mapViewMode} level={mapLevel} selectedProvince={selectedProvince} selectedMunicipality={selectedMunicipio} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationChart data={data} showLabels={showLabels} />
        <GenderChart data={data} showLabels={showLabels} />
        <AgeChart data={data} showLabels={showLabels} />
        <StatusChart data={data} showLabels={showLabels} />

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Vulnerabilidades Detectadas</h3>
          <div className="h-64 w-full">
            {vulnerabilityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vulnerabilityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  {showLabels && <Legend />}
                  <Bar dataKey="Cantidad" fill="#ff6b6b" radius={[0, 4, 4, 0]} label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de vulnerabilidad</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Estado Civil</h3>
          <div className="h-64 w-full">
            {estadoCivilData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estadoCivilData} cx="50%" cy="50%" labelLine={showLabels} label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="Cantidad">
                    {estadoCivilData.map((_, index) => (<Cell key={`cell-ec-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de estado civil</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Nivel de Estudio</h3>
          <div className="h-64 w-full">
            {nivelEstudioData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nivelEstudioData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  {showLabels && <Legend />}
                  <Bar dataKey="Cantidad" fill="#8884d8" radius={[0, 4, 4, 0]} label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de nivel de estudio</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Programas Sociales</h3>
          <div className="h-64 w-full">
            {programasSocialesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programasSocialesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatNumber} />
                  <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                  <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                  {showLabels && <Legend />}
                  <Bar dataKey="Cantidad" fill="#14b8a6" radius={[0, 4, 4, 0]} label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de programas sociales</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Salud: Discapacidades y Enfermedades</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Discapacidades</p>
              <div className="h-28 w-full">
                {discapacidadesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discapacidadesData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatNumber} />
                      <YAxis dataKey="name" type="category" width={90} style={{ fontSize: '10px' }} />
                      <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                      <Bar dataKey="Cantidad" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin datos</div>)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Enfermedades</p>
              <div className="h-28 w-full">
                {enfermedadesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enfermedadesData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatNumber} />
                      <YAxis dataKey="name" type="category" width={90} style={{ fontSize: '10px' }} />
                      <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                      <Bar dataKey="Cantidad" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (<div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin datos</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
