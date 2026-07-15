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
import Alertas from './pages/Alertas';
import Forbidden from './pages/Forbidden';

import IndicadoresLayout from './pages/IndicadoresLayout';
import LoadingSkeleton from './components/LoadingSkeleton';

const Indicadores = React.lazy(() => import('./pages/Indicadores'));
const DemograficosBoard = React.lazy(() => import('./pages/indicadores/DemograficosBoard'));
const TerritorialesBoard = React.lazy(() => import('./pages/indicadores/TerritorialesBoard'));
const ProgramaBoard = React.lazy(() => import('./pages/indicadores/ProgramaBoard'));
const CalidadDatoBoard = React.lazy(() => import('./pages/indicadores/CalidadDatoBoard'));
const VulnerabilidadBoard = React.lazy(() => import('./pages/indicadores/VulnerabilidadBoard'));
const CoberturaBoard = React.lazy(() => import('./pages/indicadores/CoberturaBoard'));
const NivelEducativoBoard = React.lazy(() => import('./pages/indicadores/NivelEducativoBoard'));
const DesempenoCentroBoard = React.lazy(() => import('./pages/indicadores/DesempenoCentroBoard'));
const CentrosSinMenoresBoard = React.lazy(() => import('./pages/indicadores/CentrosSinMenoresBoard'));
const DesercionBoard = React.lazy(() => import('./pages/indicadores/DesercionBoard'));
const RegistroDiarioBoard = React.lazy(() => import('./pages/indicadores/RegistroDiarioBoard'));
const CalidadNdBoard = React.lazy(() => import('./pages/indicadores/CalidadNdBoard'));

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
              <Suspense fallback={<LoadingSkeleton variant="page" label="Cargando indicadores..." />}>
                <Indicadores />
              </Suspense>
            ),
          },
          {
            path: 'demograficos',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <DemograficosBoard />
              </Suspense>
            ),
          },
          {
            path: 'territoriales',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <TerritorialesBoard />
              </Suspense>
            ),
          },
          {
            path: 'programa',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <ProgramaBoard />
              </Suspense>
            ),
          },
          {
            path: 'sociales',
            element: <Navigate to="/indicadores" replace />,
          },
          {
            path: 'calidad-dato',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <CalidadDatoBoard />
              </Suspense>
            ),
          },
          {
            path: 'vulnerabilidad',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <VulnerabilidadBoard />
              </Suspense>
            ),
          },
          {
            path: 'cobertura-temporal',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <CoberturaBoard />
              </Suspense>
            ),
          },
          {
            path: 'nivel-educativo',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <NivelEducativoBoard />
              </Suspense>
            ),
          },
          {
            path: 'desempeno-centro',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <DesempenoCentroBoard />
              </Suspense>
            ),
          },
          {
            path: 'centros-sin-menores',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <CentrosSinMenoresBoard />
              </Suspense>
            ),
          },
          {
            path: 'desercion',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <DesercionBoard />
              </Suspense>
            ),
          },
          {
            path: 'registro-diario',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <RegistroDiarioBoard />
              </Suspense>
            ),
          },
          {
            path: 'calidad-nd',
            element: (
              <Suspense fallback={<LoadingSkeleton variant="board" />}>
                <CalidadNdBoard />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'alertas',
        element: (
          <ProtectedRoute>
            <Alertas />
          </ProtectedRoute>
        ),
      },
      // Forbidden is unguarded — anyone can see it
      { path: 'forbidden', element: <Forbidden /> },
    ],
  },
]);
