import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { MapSection } from '../components/MapSection';

const MapaInteractivo: React.FC = () => {
  const { dashboardData } = useDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <MapSection data={dashboardData} />
    </div>
  );
};

export default MapaInteractivo;
