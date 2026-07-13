import React from 'react';
import { useFiltersContext } from '../contexts/FiltersContext';
import { ImpactSection } from '../components/ImpactSection';

const ImpactoSocial: React.FC = () => {
  const { filteredData } = useFiltersContext();

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <ImpactSection data={filteredData} />
    </div>
  );
};

export default ImpactoSocial;
