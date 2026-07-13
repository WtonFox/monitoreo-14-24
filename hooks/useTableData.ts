import { useState, useCallback } from 'react';
import { Participant } from '../types';
import { fetchParticipants } from '../services/api';
import { sanitizeParticipant } from '../utils/dataUtils';

interface UseTableDataResult {
    tableData: Participant[];
    tableTotalItems: number;
    isTableLoading: boolean;
    tableError: string | null;
    loadTableData: (page: number, size: number) => Promise<void>;
}

/**
 * Hook para gestionar datos de tabla paginada
 */
export const useTableData = (customToken?: string, dashboardDataLength: number = 0): UseTableDataResult => {
    const [tableData, setTableData] = useState<Participant[]>([]);
    const [tableTotalItems, setTableTotalItems] = useState<number>(0);
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false);
    const [tableError, setTableError] = useState<string | null>(null);

    const loadTableData = useCallback(async (page: number, size: number) => {
        setIsTableLoading(true);
        setTableError(null);
        try {
            const result = await fetchParticipants(page, size, 0, customToken || undefined);
            const cleanItems = result.items.map((item, idx) => sanitizeParticipant(item, idx));
            setTableData(cleanItems);
            setTableTotalItems(result.totalItems);
        } catch (err: any) {
            setTableError(err.message || 'Error cargando lista');
        } finally {
            setIsTableLoading(false);
        }
    }, [customToken]);

    return {
        tableData,
        tableTotalItems,
        isTableLoading,
        tableError,
        loadTableData
    };
};
