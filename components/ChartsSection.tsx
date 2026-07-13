import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Label
} from 'recharts';
import { Participant } from '../types';
import { Eye, EyeOff, Calendar, CalendarDays, BarChart2 } from 'lucide-react';
import { DominicanRepublicMap } from './DominicanRepublicMap';
import { PROVINCE_MUNICIPALITIES } from '../constants';
import { formatNumber } from '../utils/formatters';

interface ChartsSectionProps {
  data: Participant[];
  selectedProvince: string;  // From global filters
  selectedMunicipio: string; // From global filters
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b'];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ data, selectedProvince, selectedMunicipio }) => {
  // Estado para controlar visibilidad de labels
  const [showLabels, setShowLabels] = useState<boolean>(false);
  // Estado para controlar modo de vista del mapa (polygon por defecto)
  const [mapViewMode, setMapViewMode] = useState<'pin' | 'polygon'>('polygon');
  // Estado para vista de registros (mensual vs anual)
  const [registrationViewMode, setRegistrationViewMode] = useState<'monthly' | 'annual'>('monthly');
  // Estado para vista de inclusiones (mensual vs anual)
  const [inclusionViewMode, setInclusionViewMode] = useState<'monthly' | 'annual'>('monthly');

  // Determinar el nivel del mapa basado en filtros globales
  const mapLevel = useMemo<'province' | 'municipality'>(() => {
    // Si hay provincia seleccionada, mostrar municipios
    if (selectedProvince) return 'municipality';
    // Si no, mostrar provincias
    return 'province';
  }, [selectedProvince]);

  // Filtrar datos del mapa para mostrar solo los municipios de la provincia seleccionada
  const mapFilteredData = useMemo(() => {
    // Si hay provincia seleccionada, filtrar para mostrar solo esos municipios
    if (selectedProvince && mapLevel === 'municipality') {
      // Obtener la lista oficial de municipios de esta provincia
      const officialMunicipalities = PROVINCE_MUNICIPALITIES[selectedProvince] || [];

      // Filtrar datos que pertenezcan a esta provincia O a sus municipios oficiales
      return data.filter(p => {
        // Coincidir por provincia
        if (p.provincia === selectedProvince) return true;
        // O coincidir por municipio si está en la lista oficial
        if (p.municipio && officialMunicipalities.includes(p.municipio)) return true;
        return false;
      });
    }
    // Si no hay filtro, mostrar todo
    return data;
  }, [data, selectedProvince, mapLevel]);

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      // Normalizar sexo: convertir a mayúscula y limpiar espacios
      const sex = (p.sexo || 'No Definido').trim().toUpperCase();
      counts[sex] = (counts[sex] || 0) + 1;
    });
    return Object.keys(counts).map(key => {
      // Expandir F/M a nombres completos (ahora todos en mayúsculas)
      let displayName = key;
      if (key === 'F') displayName = 'Femenino';
      else if (key === 'M') displayName = 'Masculino';
      else displayName = key; // Mantener otros valores como están
      return { name: displayName, Cantidad: counts[key] };
    });
  }, [data]);

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


  const ageData = useMemo(() => {
    const ranges = {
      '14-17': 0,
      '18-20': 0,
      '21-24': 0,
      '25-29': 0,
      '30+': 0
    };
    data.forEach(p => {
      const age = p.edad || 0;
      if (age >= 14 && age <= 17) ranges['14-17']++;
      else if (age >= 18 && age <= 20) ranges['18-20']++;
      else if (age >= 21 && age <= 24) ranges['21-24']++;
      else if (age >= 25 && age <= 29) ranges['25-29']++;
      else ranges['30+']++;
    });
    return Object.keys(ranges).map(key => ({ name: key, Cantidad: ranges[key as keyof typeof ranges] }));
  }, [data]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const st = p.estado || 'Sin Estado';
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  const registrationTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    const annualCounts: Record<string, number> = {};

    data.forEach(p => {
      if (!p.fechaRegistro) return;
      try {
        const date = new Date(p.fechaRegistro);
        if (isNaN(date.getTime())) return;

        // Monthly key
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        counts[monthKey] = (counts[monthKey] || 0) + 1;

        // Annual key
        const yearKey = `${date.getFullYear()}`;
        annualCounts[yearKey] = (annualCounts[yearKey] || 0) + 1;

      } catch (e) { }
    });

    const monthlyData = Object.keys(counts)
      .sort()
      .map(key => ({ name: key, Registros: counts[key] }));

    const annualData = Object.keys(annualCounts)
      .sort()
      .map(key => ({ name: key, Registros: annualCounts[key] }));

    return { monthly: monthlyData, annual: annualData };
  }, [data]);

  const inclusionTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    const annualCounts: Record<string, number> = {};

    data.forEach(p => {
      if (!p.fechaInclusion) return;
      try {
        const date = new Date(p.fechaInclusion);
        if (isNaN(date.getTime())) return;

        // Monthly key
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        counts[monthKey] = (counts[monthKey] || 0) + 1;

        // Annual key
        const yearKey = `${date.getFullYear()}`;
        annualCounts[yearKey] = (annualCounts[yearKey] || 0) + 1;

      } catch (e) { }
    });

    const monthlyData = Object.keys(counts)
      .sort()
      .map(key => ({ name: key, Inclusiones: counts[key] }));

    const annualData = Object.keys(annualCounts)
      .sort()
      .map(key => ({ name: key, Inclusiones: annualCounts[key] }));

    return { monthly: monthlyData, annual: annualData };
  }, [data]);

  const currentRegistrationData = registrationViewMode === 'monthly' ? registrationTrendData.monthly : registrationTrendData.annual;
  const currentInclusionData = inclusionViewMode === 'monthly' ? inclusionTrendData.monthly : inclusionTrendData.annual;

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

  const vulnerabilityData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.vulnerabilidades || p.vulnerabilidades === 'N/A' || p.vulnerabilidades === 'Ninguna') return;
      const vulns = p.vulnerabilidades.split(',').map(v => v.trim());
      vulns.forEach(v => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });

    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  // ——— Phase 3: New chart data ———

  const estadoCivilData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ec = p.estadoCivil || 'No Definido';
      if (ec === 'N/A' || ec === 'No Definido') return;
      counts[ec] = (counts[ec] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      Cantidad: counts[key],
    }));
  }, [data]);

  const nivelEstudioData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const ne = p.nivelEstudio || 'No Definido';
      if (ne === 'N/A' || ne === 'No Definido') return;
      counts[ne] = (counts[ne] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      Cantidad: counts[key],
    }));
  }, [data]);

  const programasSocialesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.programasSociales || p.programasSociales === 'N/A' || p.programasSociales === 'Ninguna') return;
      const items = p.programasSociales.split(',').map(v => v.trim());
      items.forEach(v => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  const discapacidadesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.discapacidades || p.discapacidades === 'N/D' || p.discapacidades === 'Ninguna') return;
      const items = p.discapacidades.split(',').map(v => v.trim());
      items.forEach(v => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  const enfermedadesData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      if (!p.enfermedades || p.enfermedades === 'N/D' || p.enfermedades === 'Ninguna') return;
      const items = p.enfermedades.split(',').map(v => v.trim());
      items.forEach(v => {
        if (v) counts[v] = (counts[v] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .map(key => ({ name: key, Cantidad: counts[key] }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 5);
  }, [data]);

  return (
    <div className="space-y-6 mb-8">
      {/* Controles globales de gráficos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-2">
        <h2 className="text-gray-800 font-bold flex items-center gap-2">
          <BarChart2 className="text-blue-600" size={20} />
          Visualización de Datos
        </h2>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${showLabels
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
        >
          {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          {showLabels ? 'Ocultar Etiquetas' : 'Mostrar Etiquetas'}
        </button>
      </div>

      {/* Row 1: Timeline (Wide) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-gray-800">Evolución de Registros ({registrationViewMode === 'monthly' ? 'Mensual' : 'Anual'})</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button
              onClick={() => setRegistrationViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${registrationViewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CalendarDays size={14} /> Mensual
            </button>
            <button
              onClick={() => setRegistrationViewMode('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${registrationViewMode === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Calendar size={14} /> Anual
            </button>
          </div>
        </div>
        <div className="h-72 w-full">
          {currentRegistrationData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentRegistrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" style={{ fontSize: '11px' }} minTickGap={30} />
                <YAxis tickFormatter={formatNumber} style={{ fontSize: '11px' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value)), "Registros"]} />
                {(showLabels || true) && <Legend />}
                <Area
                  type="monotone"
                  dataKey="Registros"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorReg)"
                  label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Datos insuficientes para línea de tiempo</div>
          )}
        </div>
      </div>

      {/* Row 1.2: Evolución de Inclusiones (Analogo a Registros) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold text-gray-800">Evolución de Inclusiones ({inclusionViewMode === 'monthly' ? 'Mensual' : 'Anual'})</h3>
          <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
            <button
              onClick={() => setInclusionViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${inclusionViewMode === 'monthly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CalendarDays size={14} /> Mensual
            </button>
            <button
              onClick={() => setInclusionViewMode('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${inclusionViewMode === 'annual' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Calendar size={14} /> Anual
            </button>
          </div>
        </div>
        <div className="h-72 w-full">
          {currentInclusionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentInclusionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" style={{ fontSize: '11px' }} minTickGap={30} />
                <YAxis tickFormatter={formatNumber} style={{ fontSize: '11px' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip formatter={(value: unknown) => [formatNumber(Number(value)), "Inclusiones"]} />
                {(showLabels || true) && <Legend />}
                <Area
                  type="monotone"
                  dataKey="Inclusiones"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorInc)"
                  label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">Datos insuficientes para línea de tiempo de inclusiones</div>
          )}
        </div>
      </div>

      {/* Row 1.5: NUEVO - Mapa Geográfico de República Dominicana */}
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
            <button
              onClick={() => setMapViewMode('polygon')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${mapViewMode === 'polygon' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              🗺️ Polígonos
            </button>
            <button
              onClick={() => setMapViewMode('pin')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${mapViewMode === 'pin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              📍 PINs
            </button>
          </div>
        </div>

        <div className="h-96 md:h-[550px] w-full">
          <DominicanRepublicMap
            data={mapFilteredData}
            showLabels={showLabels}
            viewMode={mapViewMode}
            level={mapLevel}
            selectedProvince={selectedProvince}
            selectedMunicipality={selectedMunicipio}
          />
        </div>
      </div>


      {/* Row 3: Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Province Chart (Top 7) */}
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

        {/* Gender Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Sexo</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={showLabels}
                  label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="Cantidad"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution */}
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

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Estado de Participantes (Top 5)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" style={{ fontSize: '10px' }} interval={0} />
                <YAxis tickFormatter={formatNumber} />
                <Tooltip formatter={(value: unknown) => formatNumber(Number(value))} />
                {showLabels && <Legend />}
                <Bar
                  dataKey="Cantidad"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  label={showLabels ? { position: 'top', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Centers */}
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

        {/* Vulnerabilities */}
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
                  <Bar
                    dataKey="Cantidad"
                    fill="#ff6b6b"
                    radius={[0, 4, 4, 0]}
                    label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de vulnerabilidad</div>
            )}
          </div>
        </div>

        {/* ——— Phase 3: New Charts ——— */}

        {/* Estado Civil Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribución por Estado Civil</h3>
          <div className="h-64 w-full">
            {estadoCivilData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoCivilData}
                    cx="50%"
                    cy="50%"
                    labelLine={showLabels}
                    label={({ name, percent, value }: any) => `${name}: ${formatNumber(value)} (${((percent || 0) * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="Cantidad"
                  >
                    {estadoCivilData.map((entry, index) => (
                      <Cell key={`cell-ec-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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

        {/* Nivel Estudio Bar Chart */}
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
                  <Bar
                    dataKey="Cantidad"
                    fill="#8884d8"
                    radius={[0, 4, 4, 0]}
                    label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de nivel de estudio</div>
            )}
          </div>
        </div>

        {/* Programas Sociales Bar Chart */}
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
                  <Bar
                    dataKey="Cantidad"
                    fill="#14b8a6"
                    radius={[0, 4, 4, 0]}
                    label={showLabels ? { position: 'right', fontSize: 10, formatter: (value: unknown) => formatNumber(Number(value)) } : false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Sin datos de programas sociales</div>
            )}
          </div>
        </div>

        {/* Discapacidades / Enfermedades — two mini bar charts */}
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
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin datos</div>
                )}
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
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">Sin datos</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
