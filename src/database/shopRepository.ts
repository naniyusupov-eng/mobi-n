import { getDatabase } from './db';
import { Shop } from '../types';

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

    query += ' ORDER BY name ASC';

    const rows = db.getAllSync<any>(query, params);
    return rows.map((r) => ({
      ...r,
      isSynced: Boolean(r.isSynced),
    }));
  },

  getById: (id: string): Shop | null => {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM shops WHERE id = $id', { $id: id });
    if (!row) return null;
    return {
      ...row,
      isSynced: Boolean(row.isSynced),
    };
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

  collectPayment: (shopId: string, amount: number) => {
    const db = getDatabase();
    db.runSync(
      'UPDATE shops SET debtBalance = MAX(0, debtBalance - $amount) WHERE id = $id',
      { $amount: amount, $id: shopId }
    );
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
    return rows.map((r) => ({ ...r, isSynced: false }));
  },

  markSynced: (id: string) => {
    const db = getDatabase();
    db.runSync('UPDATE shops SET isSynced = 1 WHERE id = $id', { $id: id });
  },
};
