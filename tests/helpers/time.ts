/**
 * Time helpers (design §3).
 *
 * Every test under `tests/**` expects the clock to be frozen at
 * `FROZEN_TIME` from setup.ts. Use `freezeAt` to override per-test or
 * inside `it(...)`, `advance` to step forward, and `now` to read the
 * (possibly faked) current timestamp.
 */
import { vi } from 'vitest';

export function freezeAt(date: Date | string): void {
    const target = typeof date === 'string' ? new Date(date) : date;
    vi.useFakeTimers();
    vi.setSystemTime(target);
}

export function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
}

export function now(): Date {
    return new Date();
}
