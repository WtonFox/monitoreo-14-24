/**
 * IndexedDB helpers (design §3).
 *
 * The M3a unit project (utils/**) does not open IndexedDB, but the M3b
 * integration project (hooks/**) does. Both rely on the fake-indexeddb
 * polyfill loaded by `tests/setup.ts`.
 *
 * - `installFakeIDB` is the explicit hook called by setup-aware tests. The
 *   polyfill itself installs on first import; we still expose the entry
 *   point so tests can assert availability.
 * - `resetIDB` enumerates and deletes every database in the current fake
 *   IndexedDB instance, enforcing isolation between tests (R-verify-5).
 * - `seedParticipants` is a typed stub that writes through the project's
 *   IndexedDB schema once M3b's hook characterization suite is added. For
 *   M3a it is declared but not yet wired to a real store.
 */
import type { Participant } from '../../types';

export async function installFakeIDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
        throw new Error('fake-indexeddb/auto failed to install indexedDB on globalThis');
    }
}

export async function resetIDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;
    type DBRecord = { name?: string };
    let known: Array<DBRecord> = [];
    try {
        const list = (await indexedDB.databases?.()) as Array<DBRecord> | undefined;
        known = list ?? [];
    } catch {
        known = [];
    }
    await Promise.all(
        known
            .filter((db): db is { name: string } => typeof db.name === 'string')
            .map(
                (db) =>
                    new Promise<void>((resolve) => {
                        const req = indexedDB.deleteDatabase(db.name);
                        req.onsuccess = () => resolve();
                        req.onerror = () => resolve();
                        req.onblocked = () => resolve();
                    })
            )
    );
}

/**
 * Seed participants into the project's IndexedDB.
 *
 * Implementation deferred to M3b: the actual database schema (object store
 * names, key paths) is owned by `services/database.ts`. This signature is
 * stable so M3a helpers can compile against it.
 */
export async function seedParticipants(_rows: Participant[]): Promise<void> {
    // Intentionally a no-op for M3a. Hook characterization in M3b will
    // import this and wire it to the real schema.
    return;
}
