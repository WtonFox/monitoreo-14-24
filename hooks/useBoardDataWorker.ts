import { useRef, useState, useEffect, useCallback } from 'react';
import { computeBoardData } from './computeBoardData';
import type { BoardCategory, BoardData } from './computeBoardData';
import type { Participant } from '../types';

interface UseBoardDataWorkerResult {
  data: BoardData | null;
  loading: boolean;
  error: string | null;
}

function createWorkerOrNull(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  try {
    return new Worker(
      new URL('../workers/computeBoardData.worker.ts', import.meta.url),
      { type: 'module' },
    );
  } catch {
    return null;
  }
}

export function useBoardDataWorker(
  participants: Participant[],
  activeBoard: BoardCategory | 'all' = 'all',
): UseBoardDataWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<UseBoardDataWorkerResult>({
    data: null,
    loading: true,
    error: null,
  });

  const handleMessage = useCallback((e: MessageEvent) => {
    const msg = e.data;
    if (msg.error) {
      setState({ data: null, loading: false, error: msg.error });
    } else {
      setState({ data: msg.data as BoardData, loading: false, error: null });
    }
  }, []);

  const handleError = useCallback(() => {
    setState({ data: null, loading: false, error: 'Worker error occurred' });
  }, []);

  useEffect(() => {
    const worker = createWorkerOrNull();
    if (!worker) {
      const result = computeBoardData(participants, activeBoard);
      setState({ data: result, loading: false, error: null });
      return;
    }

    workerRef.current = worker;
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    worker.postMessage({ data: participants, activeBoard });

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.terminate();
      workerRef.current = null;
    };
  }, [participants, activeBoard, handleMessage, handleError]);

  return state;
}
