import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Participant } from '../types';

// Definir esquema de la base de datos
interface MonitoreoDB extends DBSchema {
  participants: {
    key: number;
    value: Participant;
    indexes: {
      'by-provincia': string;
      'by-estado': string;
      'by-edad': number;
      'by-estadoCivil': string;
      'by-nivelEstudio': string;
    };
  };
  metadata: {
    key: string;
    value: {
      lastSync: number;
      totalRecords: number;
      version: string;
      duplicated?: number;
      corrupted?: number;
      lastSyncedPage?: number;
      lastSyncedRecordCount?: number;
      syncTimestamp?: number;
    };
  };
}

const DB_NAME = 'monitoreo-14-24-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MonitoreoDB> | null = null;

/**
 * Inicializar la base de datos IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<MonitoreoDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<MonitoreoDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // Store para participantes
      if (!db.objectStoreNames.contains('participants')) {
        const participantStore = db.createObjectStore('participants', {
          keyPath: 'id'
        });

        // Índices para búsquedas rápidas
        participantStore.createIndex('by-provincia', 'provincia');
        participantStore.createIndex('by-estado', 'estado');
        participantStore.createIndex('by-edad', 'edad');
      }

      // Store para metadata
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }

      // Migración v1→v2: agregar índices para nuevos campos
      if (oldVersion < 2) {
        const store = transaction.objectStore('participants');
        if (!store.indexNames.contains('by-estadoCivil')) {
          store.createIndex('by-estadoCivil', 'estadoCivil');
        }
        if (!store.indexNames.contains('by-nivelEstudio')) {
          store.createIndex('by-nivelEstudio', 'nivelEstudio');
        }
      }
    },
  });

  return dbInstance;
}

/**
 * Guardar participantes en la base de datos (batch)
 */
export async function saveParticipants(participants: Participant[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('participants', 'readwrite');

  await Promise.all(
    participants.map(participant => tx.store.put(participant))
  );

  await tx.done;
}

/**
 * Obtener todos los participantes de la base de datos
 */
export async function getAllParticipants(): Promise<Participant[]> {
  const db = await initDB();
  return db.getAll('participants');
}

/**
 * Obtener participantes con paginación
 */
export async function getParticipantsPaginated(
  offset: number,
  limit: number
): Promise<Participant[]> {
  const db = await initDB();
  const tx = db.transaction('participants', 'readonly');
  const store = tx.objectStore('participants');

  let cursor = await store.openCursor();
  const results: Participant[] = [];
  let skipped = 0;

  while (cursor && results.length < limit) {
    if (skipped >= offset) {
      results.push(cursor.value);
    }
    skipped++;
    cursor = await cursor.continue();
  }

  return results;
}

/**
 * Obtener count de participantes
 */
export async function getParticipantsCount(): Promise<number> {
  const db = await initDB();
  return db.count('participants');
}

/**
 * Guardar metadata de sincronización
 */
export async function saveMetadata(key: string, value: any): Promise<void> {
  const db = await initDB();
  await db.put('metadata', { key, ...value });
}

/**
 * Obtener metadata de sincronización
 */
export async function getMetadata(key: string): Promise<any> {
  const db = await initDB();
  return db.get('metadata', key);
}

/**
 * Limpiar toda la base de datos
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(['participants', 'metadata'], 'readwrite');

  await Promise.all([
    tx.objectStore('participants').clear(),
    tx.objectStore('metadata').clear()
  ]);

  await tx.done;
}

/**
 * Verificar si hay datos en caché
 */
export async function hasCachedData(): Promise<boolean> {
  const db = await initDB();
  const count = await db.count('participants');
  return count > 0;
}

/**
 * Obtener información del caché
 */
export async function getCacheInfo(): Promise<{
  recordsCount: number;
  lastSync: Date | null;
  isStale: boolean;
}> {
  const db = await initDB();
  const count = await db.count('participants');
  const metadata = await db.get('metadata', 'lastSync');

  const lastSync = metadata?.lastSync ? new Date(metadata.lastSync) : null;
  const STALE_TIME = 24 * 60 * 60 * 1000; // 24 horas
  const isStale = lastSync ? (Date.now() - lastSync.getTime()) > STALE_TIME : true;

  return {
    recordsCount: count,
    lastSync,
    isStale
  };
}
