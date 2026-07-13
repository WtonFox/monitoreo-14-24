// HashRouter is used intentionally for .NET integration:
// - Does NOT require server-side URL rewriting (unlike BrowserRouter)
// - Works when served as static files from any .NET sub-path
// - The .NET app just needs to serve index.html at any path
// - Auth token is passed via window.__AUTH_TOKEN (set by .NET server-side)
import React, { Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import Layout from './App';
import ProtectedRoute from './components/ProtectedRoute';
import Estadisticas from './pages/Estadisticas';
import ImpactoSocial from './pages/ImpactoSocial';
import MapaInteractivo from './pages/MapaInteractivo';
import Participantes from './pages/Participantes';
import Diagnostico from './pages/Diagnostico';
import Forbidden from './pages/Forbidden';

import IndicadoresLayout from './pages/IndicadoresLayout';

const Indicadores = React.lazy(() => import('./pages/Indicadores'));
const DemograficosBoard = React.lazy(() => import('./pages/indicadores/DemograficosBoard'));
const TerritorialesBoard = React.lazy(() => import('./pages/indicadores/TerritorialesBoard'));
const ProgramaBoard = React.lazy(() => import('./pages/indicadores/ProgramaBoard'));
const SocialesBoard = React.lazy(() => import('./pages/indicadores/SocialesBoard'));

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/estadisticas" replace /> },
      {
        path: 'estadisticas',
        element: (
          <ProtectedRoute>
            <Estadisticas />
          </ProtectedRoute>
        ),
      },
      {
        path: 'impacto-social',
        element: (
          <ProtectedRoute>
            <ImpactoSocial />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mapa-interactivo',
        element: (
          <ProtectedRoute>
            <MapaInteractivo />
          </ProtectedRoute>
        ),
      },
      {
        path: 'participantes',
        element: (
          <ProtectedRoute>
            <Participantes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'diagnostico',
        element: (
          <ProtectedRoute>
            <Diagnostico />
          </ProtectedRoute>
        ),
      },
      {
        path: 'indicadores',
        element: (
          <ProtectedRoute>
            <IndicadoresLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={
                <div className="flex items-center justify-center h-64 text-gray-400">
                  Cargando indicadores...
                </div>
              }>
                <Indicadores />
              </Suspense>
            ),
          },
          {
            path: 'demograficos',
            element: (
              <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando...</div>}>
                <DemograficosBoard />
              </Suspense>
            ),
          },
          {
            path: 'territoriales',
            element: (
              <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando...</div>}>
                <TerritorialesBoard />
              </Suspense>
            ),
          },
          {
            path: 'programa',
            element: (
              <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando...</div>}>
                <ProgramaBoard />
              </Suspense>
            ),
          },
          {
            path: 'sociales',
            element: (
              <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando...</div>}>
                <SocialesBoard />
              </Suspense>
            ),
          },
        ],
      },
      // Forbidden is unguarded — anyone can see it
      { path: 'forbidden', element: <Forbidden /> },
    ],
  },
]);
