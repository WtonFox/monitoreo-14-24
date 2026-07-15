import React from 'react';
import { BarChart2, Loader } from 'lucide-react';

interface LoadingSkeletonProps {
  /** Which layout to skeletonize */
  variant?: 'page' | 'board' | 'inline';
  /** Label shown below the spinner (default: "Cargando...") */
  label?: string;
}

/**
 * Loading skeleton that matches the system's design language.
 *
 * `page`   → Full-page skeleton with cards, KPIs, and chart placeholders (dashboard/indicadores).
 * `board`  → Board shell skeleton with title + KPI grid + chart cards (individual boards).
 * `inline` → Compact spinner + text for inline sections.
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'page',
  label,
}) => {
  // ── Inline spinner (compact) ──
  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Loader className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <p className="text-sm">{label || 'Cargando...'}</p>
      </div>
    );
  }

  // ── Board skeleton (for indicator boards inside BoardShell) ──
  if (variant === 'board') {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
        {/* Title skeleton */}
        <div className="space-y-2 mb-2">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* KPI row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar skeleton */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-44 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-44 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-10 w-44 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Charts grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                <Loader className="w-5 h-5 animate-spin text-blue-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Page skeleton (default — mimics Estadisticas / Indicadores layout) ──
  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header + spinner row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-800 font-bold">
            <BarChart2 className="text-blue-600" size={24} />
            <div className="h-8 w-52 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader className="w-4 h-4 animate-spin text-blue-500" />
          <span>{label || 'Cargando indicadores...'}</span>
        </div>
      </div>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
              <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Area chart skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-72 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader className="w-8 h-8 animate-spin text-blue-400" />
            <span className="text-sm text-gray-300">Cargando visualización...</span>
          </div>
        </div>
      </div>

      {/* Map skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-[550px] bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
          <Loader className="w-10 h-10 animate-spin text-blue-400" />
        </div>
      </div>

      {/* Charts grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-64 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin text-blue-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
