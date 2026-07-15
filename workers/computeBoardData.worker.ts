import { computeBoardData } from '../hooks/computeBoardData';
import type { BoardCategory } from '../hooks/computeBoardData';
import type { Participant } from '../types';

interface WorkerRequest {
  data: Participant[];
  activeBoard: BoardCategory | 'all';
}

type WorkerResponse =
  | { data: ReturnType<typeof computeBoardData> }
  | { error: string };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { data, activeBoard } = e.data;
    const result = computeBoardData(data, activeBoard);
    const response: WorkerResponse = { data: result };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = { error: String(err) };
    self.postMessage(response);
  }
};
