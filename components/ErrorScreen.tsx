import React from 'react';
import { WifiOff, RefreshCw, KeyRound } from 'lucide-react';

interface ErrorScreenProps {
    errorMessage: string;
    onRetry: () => void;
    customToken: string;
    onTokenChange: (token: string) => void;
    showTokenInput: boolean;
    onToggleTokenInput: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
    errorMessage,
    onRetry,
    customToken,
    onTokenChange,
    showTokenInput,
    onToggleTokenInput
}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full py-10 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-red-50 p-6 rounded-full mb-4 ring-8 ring-red-50">
                <WifiOff size={48} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error de Conexión</h3>
            <p className="text-gray-500 max-w-md mb-4 text-sm">
                No se pudo conectar con la API Gubernamental. Verifica tu conexión a internet o el estado del token.
            </p>
            <div className="bg-white p-4 rounded-lg text-xs text-left text-gray-600 mb-6 font-mono break-all max-w-lg border border-red-100 shadow-sm w-full">
                <span className="font-bold text-red-600 block mb-1">Diagnóstico:</span>
                {errorMessage}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                    onClick={onRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <RefreshCw size={18} /> Reintentar Conexión
                </button>

                <button
                    onClick={onToggleTokenInput}
                    className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2 py-2"
                >
                    <KeyRound size={16} />
                    {showTokenInput ? 'Ocultar Configuración' : 'Probar Otro Token'}
                </button>
            </div>

            {/* Input de Token Manual */}
            {showTokenInput && (
                <div className="mt-4 w-full max-w-md animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs text-gray-500 mb-1 text-left font-semibold">Token de Acceso (Bearer)</label>
                    <textarea
                        value={customToken}
                        onChange={(e) => onTokenChange(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 text-left">Este token se usará temporalmente en lugar del configurado por defecto.</p>
                </div>
            )}
        </div>
    );
};
