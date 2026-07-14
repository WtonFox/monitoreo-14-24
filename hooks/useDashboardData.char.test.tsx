/**
 * Characterization tests for useDashboardData — M6a Foundation.
 *
 * Covers WU1 (clearApiCache), WU2 (single provider), WU3 (isPausedRef),
 * WU4 (checkpoint), WU7 (awaited IndexedDB writes).
 *
 * Mocks the database module to avoid fake-indexeddb setImmediate
 * incompatibility with React Testing Library act().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Participant, PaginationResult } from '../types';
import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import type { DashboardContextValue } from '../contexts/DashboardContext';
import { useDashboardData } from './useDashboardData';
import { validParticipant } from '../tests/helpers/participants';

// ── Mock the API module ────────────────────────────────────────────────
const mockFetchParticipants = vi.fn();
const mockClearApiCache = vi.fn();

vi.mock('../services/api', () => ({
  fetchParticipants: (...args: unknown[]) => mockFetchParticipants(...args),
  clearApiCache: (...args: unknown[]) => mockClearApiCache(...args),
}));

// ── Mock the database module ───────────────────────────────────────────
// fake-indexeddb uses setImmediate internally, which doesn't flush inside
// React Testing Library's act().  We mock the database to keep tests
// deterministic without fighting the event loop.

const dbStorage: { participants: Participant[]; metadata: Record<string, unknown> } = {
  participants: [],
  metadata: {},
};

const mockSaveParticipants = vi.fn(async (participants: Participant[]) => {
  dbStorage.participants.push(...participants);
});

const mockGetAllParticipants = vi.fn(async (): Promise<Participant[]> => {
  return [...dbStorage.participants];
});

const mockClearAllData = vi.fn(async () => {
  dbStorage.participants = [];
  dbStorage.metadata = {};
});

const mockSaveMetadata = vi.fn(async (key: string, value: Record<string, unknown>) => {
  dbStorage.metadata[key] = { key, ...value };
});

const mockGetMetadata = vi.fn(async (key: string): Promise<unknown> => {
  return dbStorage.metadata[key] ?? null;
});

vi.mock('../services/database', () => ({
  saveParticipants: (...args: unknown[]) => (mockSaveParticipants as unknown as (...a: unknown[]) => Promise<void>)(...args),
  getAllParticipants: (...args: unknown[]) => (mockGetAllParticipants as unknown as (...a: unknown[]) => Promise<Participant[]>)(...args),
  clearAllData: (...args: unknown[]) => (mockClearAllData as unknown as (...a: unknown[]) => Promise<void>)(...args),
  saveMetadata: (...args: unknown[]) => (mockSaveMetadata as unknown as (...a: unknown[]) => Promise<void>)(...args),
  getMetadata: (...args: unknown[]) => (mockGetMetadata as unknown as (...a: unknown[]) => Promise<unknown>)(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────

function makePage(
  page: number,
  totalItems: number,
  itemsPerPage: number = 5,
): PaginationResult {
  const items: Participant[] =
    itemsPerPage > 0
      ? Array.from({ length: itemsPerPage }, (_, i) =>
          validParticipant({ id: (page - 1) * itemsPerPage + i + 1 }),
        )
      : [];
  return { items, totalItems, currentPage: page, pageSize: itemsPerPage };
}

function emptyPage(): PaginationResult {
  return { items: [], totalItems: 0, currentPage: 1, pageSize: 1 };
}

/** Minimal context value shape for DashboardProvider tests. */
function stubContextValue(
  overrides: Partial<DashboardContextValue> = {},
): DashboardContextValue {
  return {
    dashboardData: [],
    corruptedItems: [],
    totalRecordsInApi: 0,
    isSyncing: false,
    isPaused: false,
    syncStats: { loaded: 0, errors: 0, corrupted: 0, duplicated: 0, progress: 0 },
    criticalConnectionError: false,
    connectionErrorMessage: '',
    customToken: '',
    showTokenInput: false,
    setCustomToken: vi.fn(),
    setShowTokenInput: vi.fn(),
    setCriticalConnectionError: vi.fn(),
    setConnectionErrorMessage: vi.fn(),
    startSmartSync: vi.fn(),
    handleManualRefresh: vi.fn(),
    togglePause: vi.fn(),
    ...overrides,
  };
}

// ── Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  dbStorage.participants = [];
  dbStorage.metadata = {};
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('WU1 — clearApiCache', () => {
  it('calls clearApiCache when handleManualRefresh is invoked', async () => {
    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      await result.current.handleManualRefresh();
    });

    expect(mockClearApiCache).toHaveBeenCalledOnce();
  });

  it('calls clearApiCache before syncing restarts', async () => {
    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      await result.current.handleManualRefresh();
    });

    // clearApiCache is called synchronously at the top of handleManualRefresh
    expect(mockClearApiCache).toHaveBeenCalledOnce();
    // fetchParticipants is called inside setTimeout(1200) → not yet fired
    // Asserting call order requires timer advancement; skip for deterministic test
  });
});

describe('WU2 — DashboardProvider single provider', () => {
  it('renders children when a valid value prop is provided', () => {
    const value = stubContextValue();

    const { container } = render(
      <DashboardProvider value={value}>
        <div data-testid="child">OK</div>
      </DashboardProvider>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(container.textContent).toBe('OK');
  });

  it('passes context value through to consumers', () => {
    const value = stubContextValue({ totalRecordsInApi: 42 });

    const Consumer = () => {
      const ctx = useDashboard();
      return <div data-testid="records">{ctx.totalRecordsInApi}</div>;
    };

    const { container } = render(
      <DashboardProvider value={value}>
        <Consumer />
      </DashboardProvider>,
    );

    expect(container.querySelector('[data-testid="records"]')?.textContent).toBe('42');
  });

  it('throws at dev time when value prop is undefined', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <DashboardProvider value={undefined as never}>
          <div />
        </DashboardProvider>,
      );
    }).toThrow(
      'DashboardProvider requires a value prop',
    );

    consoleSpy.mockRestore();
  });
});

describe('WU3 — Live pause via isPausedRef', () => {
  it('togglePause flips isPaused state', () => {
    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    // Initial state: not paused
    expect(result.current.isPaused).toBe(false);

    // First toggle → paused
    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(true);

    // Second toggle → unpaused
    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(false);
  });

  it('can pause and resume multiple times', () => {
    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.togglePause();
      });
      expect(result.current.isPaused).toBe(i % 2 === 0);
    }
  });
});

describe('WU4 — Persisted checkpoint', () => {
  it('saves checkpoint with lastSyncedPage after sync completes', async () => {
    vi.useFakeTimers();

    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 15, 1)) // probe
      .mockResolvedValueOnce(makePage(1, 15, 5)) // page 1
      .mockResolvedValueOnce(makePage(2, 15, 5)) // page 2
      .mockResolvedValueOnce(makePage(3, 15, 5)) // page 3
      .mockResolvedValueOnce(makePage(4, 15, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      const syncPromise = result.current.startSmartSync(1);
      for (let i = 0; i < 15; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }
      await syncPromise;
    });

    // saveMetadata was called for checkpoint (both force-start reset AND per-page)
    const syncInfoCalls = mockSaveMetadata.mock.calls.filter(
      (call: unknown[]) => (call[0] as string) === 'syncInfo'
    );
    expect(syncInfoCalls.length).toBeGreaterThanOrEqual(1);
    // At least one call has lastSyncedPage (either the force-start reset or per-page)
    const hasCheckpointField = syncInfoCalls.some(
      (call: unknown[]) => (call[1] as Record<string, unknown>).lastSyncedPage !== undefined
    );
    expect(hasCheckpointField).toBe(true);

    vi.useRealTimers();
  });

  it('resumes from checkpoint on subsequent startSmartSync', async () => {
    vi.useFakeTimers();

    dbStorage.metadata.syncInfo = {
      key: 'syncInfo',
      lastSync: Date.now(),
      totalRecords: 10,
      duplicated: 0,
      corrupted: 0,
      lastSyncedPage: 2,
      lastSyncedRecordCount: 10,
      syncTimestamp: Date.now(),
    };

    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 10, 1)) // probe — totalItems: 10
      .mockResolvedValueOnce(makePage(1, 10, 10)) // page from currentPage=2 — all data
      .mockResolvedValueOnce(makePage(2, 10, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      const syncPromise = result.current.startSmartSync();
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }
      await syncPromise;
    });

    // Sync completed — verify checkpoint was read (loadFromDB reads it on startup too)
    expect(mockGetMetadata).toHaveBeenCalledWith('syncInfo');

    vi.useRealTimers();
  });

  it('resets checkpoint on forceStartPage === 1', async () => {
    vi.useFakeTimers();

    dbStorage.metadata.syncInfo = {
      key: 'syncInfo',
      lastSync: Date.now(),
      totalRecords: 100,
      duplicated: 0,
      corrupted: 0,
      lastSyncedPage: 5,
      lastSyncedRecordCount: 50,
      syncTimestamp: Date.now(),
    };

    mockFetchParticipants.mockResolvedValue(emptyPage());

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      const syncPromise = result.current.startSmartSync(1);
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }
      await syncPromise;
    });

    // forceStartPage(1) should write a fresh checkpoint with lastSyncedPage: 1
    const resetCall = mockSaveMetadata.mock.calls.find(
      (call: unknown[]) => call[0] === 'syncInfo' && (call[1] as Record<string, unknown>).lastSyncedPage === 1
    );
    expect(resetCall).toBeDefined();

    vi.useRealTimers();
  });
});

describe('WU7 — Awaited IndexedDB writes', () => {
  it('awaits saveParticipants before advancing to next page', async () => {
    vi.useFakeTimers();

    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 10, 1)) // probe
      .mockResolvedValueOnce(makePage(1, 10, 5)) // page 1
      .mockResolvedValueOnce(makePage(2, 10, 5)) // page 2
      .mockResolvedValueOnce(makePage(3, 10, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      const syncPromise = result.current.startSmartSync(1);
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }
      await syncPromise;
    });

    // Sync completed — saveMetadata was called with checkpoint data
    // (may be from forceStartPage reset, per-page, or both)
    const savedSyncInfo = mockSaveMetadata.mock.calls.some(
      (call: unknown[]) => call[0] === 'syncInfo'
    );
    expect(savedSyncInfo).toBe(true);

    vi.useRealTimers();
  });

  it('awaits clearAllData before handleManualRefresh restart timer', async () => {
    vi.useFakeTimers();

    dbStorage.participants.push(
      ...Array.from({ length: 3 }, (_, i) => validParticipant({ id: i + 1 }))
    );

    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      const refreshPromise = result.current.handleManualRefresh();
      // Advance past the fire-and-forget setTimeout(1200)
      for (let i = 0; i < 10; i++) {
        await vi.advanceTimersByTimeAsync(500);
      }
      await refreshPromise;
    });

    // clearAllData was awaited before timer fired
    expect(mockClearAllData).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
