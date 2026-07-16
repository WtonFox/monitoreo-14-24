import React, { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { FileText, FileDown, Loader } from 'lucide-react';

interface ExportPDFButtonProps {
  onExport: () => Promise<void>;
  label?: string;
}

const STEPS = [
  'Compilando datos...',
  'Consolidando registros...',
  'Dando formato a la tabla...',
  'Ajustando estilos...',
  'Generando documento PDF...',
  'Preparando descarga...',
];

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  onExport,
  label = 'Exportar PDF',
}) => {
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Step animation while loading
  useEffect(() => {
    if (loading) {
      intervalRef.current = setInterval(() => {
        setStepIndex(prev => (prev + 1) % STEPS.length);
      }, 700);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading]);

  const handleClick = useCallback(async () => {
    if (loading) return;

    // Force React to commit the spinner to DOM before blocking on jsPDF
    flushSync(() => {
      setLoading(true);
      setStepIndex(0);
    });

    try {
      await onExport();
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      // Brief pause before hiding spinner so browser can GC
      await new Promise(resolve => setTimeout(resolve, 200));
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loading, onExport]);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-colors shadow-sm ${
          loading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={label}
      >
        {loading ? (
          <Loader size={16} className="animate-spin" />
        ) : (
          <FileText size={16} />
        )}
        {loading ? 'Generando...' : label}
      </button>

      {/* Full-screen spinner overlay */}
      {loading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-5 max-w-sm mx-4">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <FileDown size={22} className="absolute text-blue-600" />
            </div>
            <p className="text-base font-medium text-gray-700 text-center select-none min-h-[1.5em]">
              {STEPS[stepIndex]}
            </p>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportPDFButton;
