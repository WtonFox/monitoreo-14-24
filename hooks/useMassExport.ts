import { useState, useRef } from 'react';
import { ExportFormat, ExportProgress, exportToCSV, exportToExcel, exportToJSON } from '../services/exporter';

interface UseMassExportResult {
    showMassExportModal: boolean;
    isMassExporting: boolean;
    massExportProgress: ExportProgress | null;
    openMassExportModal: () => void;
    closeMassExportModal: () => void;
    handleMassExport: (format: ExportFormat) => Promise<void>;
    cancelMassExport: () => void;
}

/**
 * Hook para gestionar exportación masiva de datos
 */
export const useMassExport = (): UseMassExportResult => {
    const [showMassExportModal, setShowMassExportModal] = useState<boolean>(false);
    const [isMassExporting, setIsMassExporting] = useState<boolean>(false);
    const [massExportProgress, setMassExportProgress] = useState<ExportProgress | null>(null);
    const massExportAbortRef = useRef<AbortController | null>(null);

    const openMassExportModal = () => setShowMassExportModal(true);
    const closeMassExportModal = () => setShowMassExportModal(false);

    const handleMassExport = async (format: ExportFormat) => {
        setIsMassExporting(true);
        setMassExportProgress(null);
        massExportAbortRef.current = new AbortController();

        const onProgress = (progress: ExportProgress) => {
            setMassExportProgress(progress);
        };

        try {
            switch (format) {
                case 'csv':
                    await exportToCSV(onProgress, massExportAbortRef.current.signal);
                    break;
                case 'xlsx':
                    await exportToExcel(onProgress, massExportAbortRef.current.signal);
                    break;
                case 'json':
                    await exportToJSON(onProgress, massExportAbortRef.current.signal);
                    break;
            }

            // Cerrar modal al completar
            setTimeout(() => {
                setShowMassExportModal(false);
                setMassExportProgress(null);
            }, 1500);

        } catch (error: any) {
            if (error.message !== 'Export cancelled by user') {
                alert(`Error durante la exportación: ${error.message}`);
            }
        } finally {
            setIsMassExporting(false);
            massExportAbortRef.current = null;
        }
    };

    const cancelMassExport = () => {
        massExportAbortRef.current?.abort();
        setShowMassExportModal(false);
        setIsMassExporting(false);
        setMassExportProgress(null);
    };

    return {
        showMassExportModal,
        isMassExporting,
        massExportProgress,
        openMassExportModal,
        closeMassExportModal,
        handleMassExport,
        cancelMassExport
    };
};
