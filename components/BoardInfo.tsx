import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface InfoSection {
  heading: string;
  content: string;
}

interface BoardInfoProps {
  title: string;
  sections: InfoSection[];
}

const BoardInfo: React.FC<BoardInfoProps> = ({ title, sections }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        title="Ver información del tablero"
      >
        <HelpCircle size={14} />
        Info
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sections */}
            <div className="px-6 py-4 space-y-4">
              {sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-bold text-gray-700 mb-1.5">{section.heading}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-2xl flex items-center justify-between">
              <span className="text-xs text-gray-400">Fuente: datos del programa Oportunidad 14-24</span>
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Cerrar <span className="text-gray-400">(ESC)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BoardInfo;
