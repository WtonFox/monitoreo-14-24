import React from 'react';
import { Users, UserCheck, MapPin, Building2, Map, Calendar, AlertCircle, Activity, Award } from 'lucide-react';
import { Participant } from '../types';
import { formatNumber } from '../utils/formatters';

interface StatsCardsProps {
  data: Participant[];
  totalItems: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ data, totalItems }) => {
  // Calculate statistics based on the PASSED data (which is filtered in App.tsx)

  const totalAge = data.reduce((acc, curr) => acc + (curr.edad || 0), 0);
  // const avgAge = data.length > 0 ? (totalAge / data.length).toFixed(1) : 0;

  // Unique provinces in current filtered view
  const uniqueProvinces = new Set(data.map(p => p.provincia).filter(Boolean)).size;
  // Unique municipalities
  const uniqueMunicipalities = new Set(data.map(p => p.municipio).filter(Boolean)).size;
  // Unique centers
  const uniqueCenters = new Set(data.map(p => p.centro).filter(Boolean)).size;

  // New KPIs from Phase 3
  // 1. Edad Promedio Registro
  const validEdadRegistro = data.filter(p => p.edadRegistro > 0);
  const avgEdadRegistro = validEdadRegistro.length > 0
    ? (validEdadRegistro.reduce((acc, p) => acc + p.edadRegistro, 0) / validEdadRegistro.length).toFixed(1)
    : 'N/A';

  // 2. Registrados con discapacidad — universo con dato (excluye N/A/N/D/null)
  const withDiscapacidadData = data.filter(p =>
    p.discapacidades !== null && p.discapacidades !== 'N/D' && p.discapacidades !== 'N/A'
  );
  const discapacitados = withDiscapacidadData.filter(p => p.discapacidades !== 'Ninguna');
  const discapacitadosCount = discapacitados.length;

  // 3. Registrados con enfermedad — universo con dato
  const withEnfermedadesData = data.filter(p =>
    p.enfermedades !== null && p.enfermedades !== 'N/D' && p.enfermedades !== 'N/A'
  );
  const enfermos = withEnfermedadesData.filter(p => p.enfermedades !== 'Ninguna');
  const enfermosCount = enfermos.length;

  // 4. Programa Social — estudiantes con algún programa registrado
  const withPrograma = data.filter(p =>
    p.programasSociales !== null && p.programasSociales !== 'N/A' && p.programasSociales !== 'N/D' && p.programasSociales !== 'Ninguna'
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mr-4">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total en API</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(totalItems)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-green-50 rounded-lg text-green-600 mr-4">
          <UserCheck size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Registros (Filtrados)</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(data.length)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 mr-4">
          <Building2 size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Centros</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(uniqueCenters)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-orange-50 rounded-lg text-orange-600 mr-4">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Provincias</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(uniqueProvinces)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-teal-50 rounded-lg text-teal-600 mr-4">
          <Map size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Municipios</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(uniqueMunicipalities)}</h3>
        </div>
      </div>

      {/* New KPIs — Phase 3 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-rose-50 rounded-lg text-rose-600 mr-4">
          <Calendar size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Edad Promedio Registro</p>
          <h3 className="text-2xl font-bold text-gray-800">{avgEdadRegistro}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-amber-50 rounded-lg text-amber-600 mr-4">
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Registrados con Discapacidad</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(discapacitadosCount)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-purple-50 rounded-lg text-purple-600 mr-4">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Registrados con Enfermedad</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(enfermosCount)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600 mr-4">
          <Award size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">En Programa Social</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatNumber(withPrograma)}</h3>
        </div>
      </div>

    </div>
  );
};