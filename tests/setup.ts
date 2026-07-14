/**
 * Global test setup (design §3).
 *
 * - Imports the fake-indexeddb auto-polyfill so every test sees a fresh
 *   in-memory IndexedDB at module load. M3 unit tests do not touch IndexedDB
 *   directly; integration tests in M3b will rely on this polyfill.
 * - Freezes the system clock at 2025-01-15T12:00:00Z (UTC) before every test
 *   so that any `new Date()` call inside source modules returns a stable
 *   value — required for reproducible characterization of fabrication
 *   behaviour in `utils/dataUtils.ts` (see H1).
 * - Restores any fetch stub installed by `tests/helpers/api.ts` and resets
 *   Vitest fake timers/mocks between tests.
 * - The setup never reads or writes `.env` (R-verify-9).
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, vi } from 'vitest';
import { restoreFetch } from './helpers/api';
import { freezeAt } from './helpers/time';

export const FROZEN_TIME = new Date('2025-01-15T12:00:00Z');

beforeEach(() => {
    freezeAt(FROZEN_TIME);
});

afterEach(() => {
    restoreFetch();
    vi.useRealTimers();
    vi.restoreAllMocks();
});
