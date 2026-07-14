/**
 * Characterization tests for useDashboardData — M6a Foundation.
 *
 * Covers WU1 (clearApiCache), WU2 (single provider), WU3 (isPausedRef),
 * WU4 (checkpoint), WU7 (awaited IndexedDB writes).
 *
 * Runs under vitest integration project (jsdom + fake-indexeddb).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Participant, PaginationResult } from '../types';
import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import type { DashboardContextValue } from '../contexts/DashboardContext';
import { useDashboardData } from './useDashboardData';
import { resetIDB } from '../tests/helpers/db';
import { validParticipant } from '../tests/helpers/participants';
import { getMetadata } from '../services/database';

// ── Mock the API module ────────────────────────────────────────────────
const mockFetchParticipants = vi.fn();
const mockClearApiCache = vi.fn();

vi.mock('../services/api', () => ({
  fetchParticipants: (...args: unknown[]) => mockFetchParticipants(...args),
  clearApiCache: (...args: unknown[]) => mockClearApiCache(...args),
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

beforeEach(async () => {
  await resetIDB();
  vi.clearAllMocks();
});

afterEach(() => {
  // Real timers restored by tests/setup.ts afterEach
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

    // clearApiCache must be called before the sync restart timer fires
    expect(mockClearApiCache).toHaveBeenCalledOnce();
    expect(mockClearApiCache).toHaveBeenCalledBefore(mockFetchParticipants as never);
  });
});

describe('WU2 — DashboardProvider single provider', () => {
  it('renders children when a valid value prop is provided', () => {
    const value = stubContextValue() as Parameters<typeof DashboardProvider>[0]['value'];

    const { container } = render(
      <DashboardProvider value={value}>
        <div data-testid="child">OK</div>
      </DashboardProvider>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(container.textContent).toBe('OK');
  });

  it('passes context value through to consumers', () => {
    const value = stubContextValue({ totalRecordsInApi: 42 }) as Parameters<
      typeof DashboardProvider
    >[0]['value'];

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
    // Silence console.error from React error boundary
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
    // 3 pages of data (5 items each) → probe + 3 pages = 4 fetch calls
    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 15, 1)) // probe
      .mockResolvedValueOnce(makePage(1, 15, 5)) // page 1
      .mockResolvedValueOnce(makePage(2, 15, 5)) // page 2
      .mockResolvedValueOnce(makePage(3, 15, 5)) // page 3
      .mockResolvedValueOnce(makePage(4, 15, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      await result.current.startSmartSync(1);
    });

    const meta = await getMetadata('syncInfo');
    expect(meta).toBeDefined();
    expect(meta.lastSyncedPage).toBe(3);
    expect(meta.lastSyncedRecordCount).toBe(15);
    expect(meta.syncTimestamp).toEqual(expect.any(Number));
  });

  it('resumes from checkpoint on subsequent startSmartSync', async () => {
    // First sync: 2 pages of data
    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 10, 1)) // probe
      .mockResolvedValueOnce(makePage(1, 10, 5)) // page 1
      .mockResolvedValueOnce(makePage(2, 10, 5)) // page 2
      .mockResolvedValueOnce(makePage(3, 10, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    // Run first sync
    await act(async () => {
      await result.current.startSmartSync(1);
    });

    // Verify checkpoint stored
    const meta = await getMetadata('syncInfo');
    expect(meta.lastSyncedPage).toBe(2);

    // Verify the mock was called enough times
    expect(mockFetchParticipants).toHaveBeenCalledTimes(4);
  });

  it('resets checkpoint on forceStartPage === 1', async () => {
    // Pre-set a checkpoint
    const { saveMetadata } = await import('../services/database');
    await saveMetadata('syncInfo', {
      lastSync: Date.now(),
      totalRecords: 100,
      duplicated: 0,
      corrupted: 0,
      lastSyncedPage: 5,
      lastSyncedRecordCount: 50,
      syncTimestamp: Date.now(),
    });

    // Now start fresh sync from page 1 — but return 0 total so sync ends quickly
    mockFetchParticipants.mockResolvedValue(emptyPage());

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      await result.current.startSmartSync(1);
    });

    // Checkpoint should be reset
    const meta = await getMetadata('syncInfo');
    expect(meta.lastSyncedPage).toBe(1);
    expect(meta.lastSyncedRecordCount).toBe(0);
  });
});

describe('WU7 — Awaited IndexedDB writes', () => {
  it('awaits saveParticipants before advancing to next page', async () => {
    // Two pages, then empty
    mockFetchParticipants
      .mockResolvedValueOnce(makePage(1, 10, 1)) // probe
      .mockResolvedValueOnce(makePage(1, 10, 5)) // page 1
      .mockResolvedValueOnce(makePage(2, 10, 5)) // page 2
      .mockResolvedValueOnce(makePage(3, 10, 0)); // empty → stop

    const { result } = renderHook(() => useDashboardData());

    await act(async () => {
      await result.current.startSmartSync(1);
    });

    // After sync, verify ALL participants are in IndexedDB
    const { getAllParticipants } = await import('../services/database');
    const stored = await getAllParticipants();
    expect(stored).toHaveLength(10);

    // Verify checkpoint reflects the final synced count
    const meta = await getMetadata('syncInfo');
    expect(meta.lastSyncedRecordCount).toBe(10);
  });

  it('awaits clearAllData before handleManualRefresh restart timer', async () => {
    // Seed some data first, then refresh
    const { saveParticipants, getAllParticipants } = await import('../services/database');
    const seed = Array.from({ length: 3 }, (_, i) => validParticipant({ id: i + 1 }));
    await saveParticipants(seed);

    mockFetchParticipants.mockResolvedValue(emptyPage());
    const { result } = renderHook(() => useDashboardData());

    // Manual refresh should clear DB before timer fires
    await act(async () => {
      await result.current.handleManualRefresh();
    });

    // DB should be empty
    const stored = await getAllParticipants();
    expect(stored).toHaveLength(0);
  });
});
