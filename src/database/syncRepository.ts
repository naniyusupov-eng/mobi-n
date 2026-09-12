import { getDatabase } from './db';
import { SyncQueueItem } from '../types';

export const syncRepository = {
  getPending: (): SyncQueueItem[] => {
    const db = getDatabase();
    return db.getAllSync<SyncQueueItem>(
      'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY createdAt ASC'
    );
  },

  getPendingCount: (): number => {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"'
    );
    return result?.count || 0;
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
