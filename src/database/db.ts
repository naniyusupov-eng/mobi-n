import * as SQLite from 'expo-sqlite';
import { SEED_CATEGORIES, SEED_PRODUCTS } from './seedData';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const initDatabase = (db: SQLite.SQLiteDatabase) => {
  // Enable foreign keys
  db.execSync('PRAGMA foreign_keys = ON;');

  // Create tables
  db.execSync(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      territory TEXT,
      token TEXT,
      avatarUrl TEXT,
      loginAt TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      iconName TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      categoryName TEXT,
      description TEXT,
      priceDona REAL DEFAULT 0,
      priceBlok REAL DEFAULT 0,
      priceKorobka REAL DEFAULT 0,
      priceKg REAL DEFAULT 0,
      itemsPerBlock INTEGER DEFAULT 1,
      itemsPerBox INTEGER DEFAULT 1,
      stockDona INTEGER DEFAULT 0,
      imageUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ownerName TEXT,
      phone TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      debtBalance REAL DEFAULT 0,
      visitDay TEXT DEFAULT 'Barchasi',
      lastVisitedAt TEXT,
      createdAt TEXT NOT NULL,
      isSynced INTEGER DEFAULT 0,
      lineCode TEXT,
      routeDay INTEGER,
      num REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      shopId TEXT NOT NULL,
      shopName TEXT NOT NULL,
      agentId TEXT NOT NULL,
      agentName TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      discountAmount REAL DEFAULT 0,
      finalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      isSynced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      lastAttemptAt TEXT,
      errorMessage TEXT
    );

    -- Last server answers kept for offline use (driver day lists, price lists), keyed e.g. "deliveries:2026-10-23"
    CREATE TABLE IF NOT EXISTS local_cache (
      key TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      savedAt TEXT NOT NULL
    );
  `);

  // No demo catalogue: products and categories come only from the server (sign-in and every sync).
  // Older installs: once, drop the demo rows that are still exactly as seeded (a server download replaces them anyway).
  const version = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (version < 1) {
    db.withTransactionSync(() => {
      for (const p of SEED_PRODUCTS) {
        db.runSync(
          'DELETE FROM products WHERE id = $id AND code = $code AND name = $name AND priceDona = $priceDona AND stockDona = $stockDona',
          { $id: p.id, $code: p.code, $name: p.name, $priceDona: p.priceDona, $stockDona: p.stockDona }
        );
      }
      // Demo categories with no product left
      for (const c of SEED_CATEGORIES) {
        if (c.id === 'cat_all') continue;
        db.runSync('DELETE FROM categories WHERE id = $id AND id NOT IN (SELECT DISTINCT categoryId FROM products)', { $id: c.id });
      }
    });
    db.execSync('PRAGMA user_version = 1;');
  }

  // Older installs: add route columns to shops (CREATE TABLE IF NOT EXISTS keeps the old schema)
  for (const column of ['lineCode TEXT', 'routeDay INTEGER', 'num REAL', 'notes TEXT']) {
    try {
      db.execSync(`ALTER TABLE shops ADD COLUMN ${column};`);
    } catch {
      // column already exists
    }
  }

  // Credit control columns (GET /clients). Same safe upgrade: ignore "duplicate column".
  for (const column of [
    'creditLimit REAL DEFAULT 0',
    'debtSince TEXT',
    'debtDays INTEGER',
    'overLimit INTEGER DEFAULT 0',
    'overdue INTEGER DEFAULT 0',
    'creditBlocked INTEGER DEFAULT 0',
    'creditLeft REAL',
  ]) {
    try {
      db.execSync(`ALTER TABLE shops ADD COLUMN ${column};`);
    } catch (e: any) {
      if (!/duplicate column/i.test(String(e?.message ?? e))) throw e;
    }
  }

  // Price list of the shop (GET /clients) and promotions applied to an order. Same safe upgrade.
  for (const [table, column] of [
    ['shops', 'priceListId TEXT'],
    ['orders', 'promosJson TEXT'],
    ['orders', 'deliveryDate TEXT'], // YYYY-MM-DD chosen at checkout (older orders: only in notes)
  ]) {
    try {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column};`);
    } catch (e: any) {
      if (!/duplicate column/i.test(String(e?.message ?? e))) throw e;
    }
  }

  // Shops come from the server by line now; drop the old built-in demo shops
  db.execSync("DELETE FROM shops WHERE id IN ('shop_1', 'shop_2', 'shop_3', 'shop_4', 'shop_5');");
};

export const resetAllDataToZero = () => {
  const db = getDatabase();
  db.execSync(`
    UPDATE shops SET debtBalance = 0;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM sync_queue;
    DELETE FROM local_cache WHERE key <> 'pricing';
  `);
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('mobi_r.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
};
