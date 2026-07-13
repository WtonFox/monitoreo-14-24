import React from 'react';

interface MapInfoModalProps {
    onClose: () => void;
}

export const MapInfoModal: React.FC<MapInfoModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-lg">Metodología de Densidad de Datos</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="p-6 text-sm text-slate-600 leading-relaxed overflow-y-auto max-h-[60vh]">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                </svg>
                                Cálculo de Densidad
                            </h4>
                            <p>
                                La densidad de datos se calcula dinámicamente basándose en la concentración de participantes registrados en cada unidad geográfica (Región, Provincia o Municipio). El conteo se realiza en tiempo real sobre el conjunto de datos filtrado.
                            </p>
                        </div>

                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-2 text-xs uppercase tracking-wider">Escala Cromática</h4>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-[#1e40af]"></div>
                                    <span><strong>Muy Alta (&gt;80%):</strong> Concentración crítica de participantes.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-[#3b82f6]"></div>
                                    <span><strong>Alta (60-80%):</strong> Participación significativa.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-[#60a5fa]"></div>
                                    <span><strong>Media (40-60%):</strong> Participación moderada.</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Escalas Locales vs. Globales</h4>
                            <p>
                                Al seleccionar un nivel específico (ej. Municipio dentro de una Provincia), el sistema recalcula los máximos y mínimos (normalización local) para asegurar que la variabilidad de datos sea visible incluso en zonas con menor densidad absoluta comparada con la capital.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
