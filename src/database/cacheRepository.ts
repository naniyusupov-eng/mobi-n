import { getDatabase } from './db';

/** Small key/value store for the last server answers (table local_cache) */
export const cacheRepository = {
  get: <T>(key: string): { data: T; savedAt: string } | null => {
    const db = getDatabase();
    const row = db.getFirstSync<{ json: string; savedAt: string }>('SELECT json, savedAt FROM local_cache WHERE key = $key', {
      $key: key,
    });
    if (!row) return null;
    try {
      return { data: JSON.parse(row.json) as T, savedAt: row.savedAt };
    } catch {
      return null;
    }
  },

  /** Saves a value; savedAt is kept when given (local edits keep the time of the last server answer) */
  set: (key: string, data: unknown, savedAt?: string) => {
    const db = getDatabase();
    db.runSync('INSERT OR REPLACE INTO local_cache (key, json, savedAt) VALUES ($key, $json, $savedAt)', {
      $key: key,
      $json: JSON.stringify(data),
      $savedAt: savedAt || new Date().toISOString(),
    });
  },

  /** Keys starting with the prefix, e.g. "deliveries:" */
  keys: (prefix: string): string[] => {
    const db = getDatabase();
    return db
      .getAllSync<{ key: string }>('SELECT key FROM local_cache WHERE key LIKE $prefix', { $prefix: `${prefix}%` })
      .map((r) => r.key);
  },
};
