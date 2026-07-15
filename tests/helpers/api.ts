/**
 * Fetch helpers (design §3).
 *
 * Hand-rolled typed fake — NOT MSW (per R-verify-5 and the explicit
 * "MSW MUST NOT be added" rule in spec/scripts-and-dependencies).
 *
 * - `stubFetch(handler)` replaces `globalThis.fetch` with a function that
 *   delegates to the supplied handler. Handler receives the request URL
 *   and init and must return a `Response` or `Promise<Response>`.
 * - `restoreFetch()` puts the original `fetch` back. Called automatically
 *   from `tests/setup.ts` after each test.
 *
 * Tests MUST NOT issue a real network request — if a fetch happens with
 * no stub installed, Vitest's spy will simply return `undefined`, which
 * the source code surfaces as a clear, contained failure rather than a
 * silent leak.
 */
import { vi, type MockInstance } from 'vitest';

export type FetchHandler = (
    url: string | URL | Request,
    init?: RequestInit
) => Response | Promise<Response>;

let activeStub: MockInstance<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>> | null =
    null;

export function stubFetch(handler: FetchHandler): void {
    if (activeStub) {
        activeStub.mockRestore();
        activeStub = null;
    }
    activeStub = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
            return Promise.resolve(handler(input as string | URL | Request, init));
        });
}

export function restoreFetch(): void {
    if (activeStub) {
        activeStub.mockRestore();
        activeStub = null;
    }
}
