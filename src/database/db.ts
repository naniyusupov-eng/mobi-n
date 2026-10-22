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
  `);

  // Seed default categories if empty
  const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!catCount || catCount.count === 0) {
    const insertCat = db.prepareSync('INSERT INTO categories (id, name, iconName) VALUES ($id, $name, $iconName)');
    SEED_CATEGORIES.forEach((cat) => {
      insertCat.executeSync({ $id: cat.id, $name: cat.name, $iconName: cat.iconName || null });
    });
    insertCat.finalizeSync();
  }

  // Seed default products if empty
  const prodCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM products');
  if (!prodCount || prodCount.count === 0) {
    const insertProd = db.prepareSync(`
      INSERT INTO products (
        id, code, name, categoryId, categoryName, description,
        priceDona, priceBlok, priceKorobka, priceKg,
        itemsPerBlock, itemsPerBox, stockDona, imageUrl
      ) VALUES (
        $id, $code, $name, $categoryId, $categoryName, $description,
        $priceDona, $priceBlok, $priceKorobka, $priceKg,
        $itemsPerBlock, $itemsPerBox, $stockDona, $imageUrl
      )
    `);
    SEED_PRODUCTS.forEach((prod) => {
      insertProd.executeSync({
        $id: prod.id,
        $code: prod.code,
        $name: prod.name,
        $categoryId: prod.categoryId,
        $categoryName: prod.categoryName || '',
        $description: prod.description || '',
        $priceDona: prod.priceDona,
        $priceBlok: prod.priceBlok,
        $priceKorobka: prod.priceKorobka,
        $priceKg: prod.priceKg,
        $itemsPerBlock: prod.itemsPerBlock,
        $itemsPerBox: prod.itemsPerBox,
        $stockDona: prod.stockDona,
        $imageUrl: prod.imageUrl || null,
      });
    });
    insertProd.finalizeSync();
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
  `);
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('mobi_r.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
};
