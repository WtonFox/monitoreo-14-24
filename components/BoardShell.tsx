import React from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

interface BoardShellProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
  loading?: boolean;
}

/**
 * Shared wrapper for indicator board pages.
 * Provides consistent padding, animation, empty state, optional title and description.
 */
const BoardShell: React.FC<BoardShellProps> = ({
  title,
  description,
  children,
  empty = false,
  emptyMessage,
  loading = false,
}) => {
  if (loading) {
    return <LoadingSkeleton variant="board" />;
  }

  if (empty) {
    return (
      <div className="p-6 max-w-7xl mx-auto w-full">
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
          <AlertTriangle size={48} className="mb-3 text-gray-300" />
          <p className="text-gray-400">{emptyMessage || 'Sin datos'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500 space-y-6">
      {title && (
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default BoardShell;
