import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../types/routes';

const ImpactoSocial: React.FC = () => (
  <Navigate to={ROUTES.INDICADORES_IMPACTO} replace />
);

export default ImpactoSocial;
