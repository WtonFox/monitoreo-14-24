import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../types/routes';

const Forbidden: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <ShieldAlert size={40} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Acceso Denegado
        </h1>

        <p className="text-gray-500 leading-relaxed mb-8">
          No tienes permisos suficientes para acceder a esta página.
          Si crees que esto es un error, contacta al administrador del
          sistema para solicitar los permisos correspondientes.
        </p>

        <NavLink
          to={ROUTES.ESTADISTICAS}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <ArrowLeft size={18} />
          Volver al inicio
        </NavLink>
      </div>
    </div>
  );
};

export default Forbidden;
