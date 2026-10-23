import { getDatabase } from './db';
import { Shop } from '../types';

/** SQLite row -> Shop (booleans are stored as 0/1) */
const mapRow = (r: any): Shop => ({
  ...r,
  isSynced: Boolean(r.isSynced),
  creditLimit: Number(r.creditLimit) || 0,
  debtSince: r.debtSince ?? null,
  debtDays: r.debtDays ?? null,
  overLimit: Boolean(r.overLimit),
  overdue: Boolean(r.overdue),
  creditBlocked: Boolean(r.creditBlocked),
  creditLeft: r.creditLeft ?? null,
  priceListId: r.priceListId ?? null,
});

export const shopRepository = {
  getAll: (searchQuery?: string, visitDay?: string): Shop[] => {
    const db = getDatabase();
    let query = 'SELECT * FROM shops WHERE 1=1';
    const params: Record<string, any> = {};

    if (searchQuery && searchQuery.trim().length > 0) {
      query += ' AND (name LIKE $search OR ownerName LIKE $search OR address LIKE $search OR phone LIKE $search)';
      params.$search = `%${searchQuery.trim()}%`;
    }

    if (visitDay && visitDay !== 'Barchasi') {
      query += ' AND (visitDay = $day OR visitDay = "Barchasi")';
      params.$day = visitDay;
    }

    query += ' ORDER BY routeDay IS NULL, routeDay ASC, num ASC, name ASC';

    const rows = db.getAllSync<any>(query, params);
    return rows.map(mapRow);
  },

  getById: (id: string): Shop | null => {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM shops WHERE id = $id', { $id: id });
    if (!row) return null;
    return mapRow(row);
  },

  create: (data: {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    latitude?: number;
    longitude?: number;
    debtBalance?: number;
    visitDay?: string;
  }): Shop => {
    const db = getDatabase();
    const id = `shop_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const debtBalance = data.debtBalance || 0;
    const visitDay = data.visitDay || 'Barchasi';

    db.runSync(
      `INSERT INTO shops (id, name, ownerName, phone, address, latitude, longitude, debtBalance, visitDay, createdAt, isSynced)
       VALUES ($id, $name, $ownerName, $phone, $address, $latitude, $longitude, $debtBalance, $visitDay, $createdAt, 0)`,
      {
        $id: id,
        $name: data.name,
        $ownerName: data.ownerName,
        $phone: data.phone,
        $address: data.address,
        $latitude: data.latitude || null,
        $longitude: data.longitude || null,
        $debtBalance: debtBalance,
        $visitDay: visitDay,
        $createdAt: createdAt,
      }
    );

    // Queue for sync with NestJS
    db.runSync(
      `INSERT INTO sync_queue (id, entityType, entityId, action, payloadJson, status, createdAt)
       VALUES ($id, 'shop', $entityId, 'create', $payload, 'pending', $createdAt)`,
      {
        $id: `sync_${Date.now()}`,
        $entityId: id,
        $payload: JSON.stringify({ id, ...data, debtBalance, visitDay, createdAt }),
        $createdAt: createdAt,
      }
    );

    return {
      id,
      name: data.name,
      ownerName: data.ownerName,
      phone: data.phone,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      debtBalance,
      visitDay,
      createdAt,
      isSynced: false,
    };
  },

  updateDebt: (shopId: string, additionalDebt: number) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE shops SET debtBalance = debtBalance + $additionalDebt WHERE id = $id',
      { $additionalDebt: additionalDebt, $id: shopId }
    );
  },

  /** PKO: takes a debt payment off the shop and queues it; `by` tells the server who collected it */
  collectPayment: (shopId: string, amount: number, by = '') => {
    const db = getDatabase();
    const id = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    db.withTransactionSync(() => {
      db.runSync(
        'UPDATE shops SET debtBalance = MAX(0, debtBalance - $amount) WHERE id = $id',
        { $amount: amount, $id: shopId }
      );
      // Queue for the server so the debt on the website goes down too
      db.runSync(
        `INSERT INTO sync_queue (id, entityType, entityId, action, payloadJson, status, createdAt)
         VALUES ($id, 'payment', $entityId, 'create', $payload, 'pending', $createdAt)`,
        {
          $id: `sync_${id}`,
          $entityId: shopId,
          $payload: JSON.stringify({ id, shopId, amount, by, createdAt }),
          $createdAt: createdAt,
        }
      );
    });
  },

  // Replaces the line's shops with the list downloaded from the server.
  // Shops added on this phone that are not on a route yet are kept.
  replaceLineShops: (lineCode: string, shops: Shop[]) => {
    const db = getDatabase();
    // Keep "visited today" marks across the refresh
    const visited = new Map(
      db
        .getAllSync<{ id: string; lastVisitedAt: string }>('SELECT id, lastVisitedAt FROM shops WHERE lastVisitedAt IS NOT NULL')
        .map((r) => [r.id, r.lastVisitedAt])
    );
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM shops WHERE lineCode IS NOT NULL');
      const insert = db.prepareSync(`
        INSERT OR REPLACE INTO shops (
          id, name, ownerName, phone, address, latitude, longitude, debtBalance, visitDay,
          lastVisitedAt, createdAt, isSynced, lineCode, routeDay, num, notes,
          creditLimit, debtSince, debtDays, overLimit, overdue, creditBlocked, creditLeft, priceListId
        ) VALUES (
          $id, $name, $ownerName, $phone, $address, $latitude, $longitude, $debtBalance, $visitDay,
          $lastVisitedAt, $createdAt, 1, $lineCode, $routeDay, $num, $notes,
          $creditLimit, $debtSince, $debtDays, $overLimit, $overdue, $creditBlocked, $creditLeft, $priceListId
        )
      `);
      try {
        for (const s of shops) {
          insert.executeSync({
            $id: s.id,
            $name: s.name,
            $ownerName: s.ownerName || '',
            $phone: s.phone || '',
            $address: s.address || '',
            $latitude: s.latitude ?? null,
            $longitude: s.longitude ?? null,
            $debtBalance: s.debtBalance || 0,
            $visitDay: s.visitDay,
            $lastVisitedAt: visited.get(s.id) ?? null,
            $createdAt: s.createdAt,
            $lineCode: lineCode,
            $routeDay: s.routeDay ?? null,
            $num: s.num ?? null,
            $notes: s.notes || null,
            $creditLimit: s.creditLimit || 0,
            $debtSince: s.debtSince ?? null,
            $debtDays: s.debtDays ?? null,
            $overLimit: s.overLimit ? 1 : 0,
            $overdue: s.overdue ? 1 : 0,
            $creditBlocked: s.creditBlocked ? 1 : 0,
            $creditLeft: s.creditLeft ?? null,
            $priceListId: s.priceListId ?? null,
          });
        }
      } finally {
        insert.finalizeSync();
      }
    });
  },

  markVisited: (shopId: string) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE shops SET lastVisitedAt = $visitedAt WHERE id = $id',
      { $visitedAt: new Date().toISOString(), $id: shopId }
    );
  },

  getUnsynced: (): Shop[] => {
    const db = getDatabase();
    const rows = db.getAllSync<any>('SELECT * FROM shops WHERE isSynced = 0');
    return rows.map(mapRow);
  },

  markSynced: (id: string) => {
    const db = getDatabase();
    db.runSync('UPDATE shops SET isSynced = 1 WHERE id = $id', { $id: id });
  },
};
