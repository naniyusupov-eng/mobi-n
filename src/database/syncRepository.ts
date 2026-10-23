import { getDatabase } from './db';
import { SyncQueueItem } from '../types';

export const syncRepository = {
  getPending: (): SyncQueueItem[] => {
    const db = getDatabase();
    return db.getAllSync<SyncQueueItem>(
      // Failed items are retried on the next sync (e.g. the phone was offline).
      // rowid keeps the insert order for items saved in the same millisecond
      // (a deliver and an undeliver of one order must reach the server in that order).
      "SELECT * FROM sync_queue WHERE status IN ('pending', 'failed') ORDER BY createdAt ASC, rowid ASC"
    );
  },

  /** Queued items of the given types, oldest first */
  getPendingOfTypes: (types: SyncQueueItem['entityType'][]): SyncQueueItem[] =>
    syncRepository.getPending().filter((i) => types.includes(i.entityType)),

  getPendingCount: (): number => {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'failed')"
    );
    return result?.count || 0;
  },

  /** Puts an action in the queue; the sync sends it to the server */
  enqueue: (
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    action: SyncQueueItem['action'],
    payload: unknown
  ) => {
    const db = getDatabase();
    const createdAt = new Date().toISOString();
    db.runSync(
      `INSERT INTO sync_queue (id, entityType, entityId, action, payloadJson, status, createdAt)
       VALUES ($id, $entityType, $entityId, $action, $payload, 'pending', $createdAt)`,
      {
        $id: `sync_${entityType}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        $entityType: entityType,
        $entityId: entityId,
        $action: action,
        $payload: JSON.stringify(payload),
        $createdAt: createdAt,
      }
    );
  },

  markSuccess: (id: string) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE sync_queue SET status = "synced", lastAttemptAt = $time WHERE id = $id',
      { $id: id, $time: new Date().toISOString() }
    );
  },

  markFailed: (id: string, error: string) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE sync_queue SET status = "failed", attempts = attempts + 1, errorMessage = $error, lastAttemptAt = $time WHERE id = $id',
      { $id: id, $error: error, $time: new Date().toISOString() }
    );
  },

  clearSynced: () => {
    const db = getDatabase();
    db.runSync('DELETE FROM sync_queue WHERE status = "synced"');
  },
};
