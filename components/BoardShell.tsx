import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface BoardShellProps {
  title?: string;
  children?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}

/**
 * Shared wrapper for indicator board pages.
 * Provides consistent padding, animation, empty state, and optional title.
 *
 * Boards may adopt this shell gradually in Phase 2–3.
 */
const BoardShell: React.FC<BoardShellProps> = ({
  title,
  children,
  empty = false,
  emptyMessage,
}) => {
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
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      )}
      {children}
    </div>
  );
};

export default BoardShell;
