/**
 * Mobi_R Sync Bridge Server
 * Endpoints for live synchronization between Mobile APK and Web Admin.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sync_db.json');

const INITIAL_DATA = {
  orders: [],
  shops: [
    {
      id: 'shop_1',
      name: 'Oqtepa Minimarket',
      ownerName: 'Akmal aka',
      phone: '+998 90 123 45 67',
      address: 'Toshkent sh., Chilonzor 9-mavze, 14-uy',
      debtBalance: 0,
      visitDay: 'Dushanba',
    },
    {
      id: 'shop_2',
      name: 'Baraka Baqqollik Doʻkoni',
      ownerName: 'Dilshod Raximov',
      phone: '+998 97 765 43 21',
      address: 'Toshkent sh., Bunyodkor koʻchasi, 45-uy',
      debtBalance: 0,
      visitDay: 'Dushanba',
    },
    {
      id: 'shop_3',
      name: 'Shirinliklar Olami',
      ownerName: 'Feruza opa',
      phone: '+998 93 555 12 34',
      address: 'Toshkent sh., Yunusobod 11-mavze, 2-uy',
      debtBalance: 0,
      visitDay: 'Seshanba',
    },
    {
      id: 'shop_4',
      name: 'Ziyo Oziq-Ovqat',
      ownerName: 'Jamshid Karimov',
      phone: '+998 99 888 77 66',
      address: 'Toshkent sh., Mirzo Ulugʻbek tumani, Qorasuv-1',
      debtBalance: 0,
      visitDay: 'Chorshanba',
    },
    {
      id: 'shop_5',
      name: 'Farovon Supermarket',
      ownerName: 'Nodirbek',
      phone: '+998 91 234 56 78',
      address: 'Toshkent sh., Sergeli 7-mavze, Yangi Sergeli koʻchasi',
      debtBalance: 0,
      visitDay: 'Payshanba',
    },
  ],
};

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading DB, resetting to initial:', e.message);
    saveDatabase(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

function jsonResponse(res, statusCode, body) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        resolve({ _raw: raw });
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  try {
    // Health check
    if (pathname === '/health' || pathname === '/api/v1/health' || pathname === '') {
      return jsonResponse(res, 200, {
        status: 'ok',
        app: 'Mobi_R Sync Server',
        time: new Date().toISOString(),
      });
    }

    // GET /api/v1/orders
    if (req.method === 'GET' && pathname === '/api/v1/orders') {
      const db = loadDatabase();
      return jsonResponse(res, 200, {
        success: true,
        count: db.orders.length,
        orders: db.orders,
      });
    }

    // GET /api/v1/shops
    if (req.method === 'GET' && pathname === '/api/v1/shops') {
      const db = loadDatabase();
      return jsonResponse(res, 200, {
        success: true,
        count: db.shops.length,
        shops: db.shops,
      });
    }

    // POST /api/v1/orders/sync (From Mobile APK)
    if (req.method === 'POST' && pathname === '/api/v1/orders/sync') {
      const payload = await parseBody(req);
      const db = loadDatabase();
      const itemsToSync = Array.isArray(payload) ? payload : [payload];

      let addedCount = 0;
      for (const order of itemsToSync) {
        if (!order || !order.id) continue;
        const existsIndex = db.orders.findIndex((o) => o.id === order.id);
        if (existsIndex >= 0) {
          db.orders[existsIndex] = { ...db.orders[existsIndex], ...order };
        } else {
          db.orders.unshift(order);
          addedCount++;

          // If nasiya, increment shop debt
          if (order.shopId && (order.paymentMethod === 'nasiya' || order.paymentMethod === 'debt')) {
            const shop = db.shops.find((s) => s.id === order.shopId);
            if (shop) {
              shop.debtBalance = (shop.debtBalance || 0) + (order.finalAmount || order.totalAmount || 0);
              shop.lastOrderDate = new Date().toISOString().split('T')[0];
            }
          }
        }
      }

      saveDatabase(db);
      console.log(`-> Received order(s). Added ${addedCount}, total orders: ${db.orders.length}`);
      return jsonResponse(res, 200, {
        success: true,
        message: `${addedCount} orders synced successfully`,
        totalOrders: db.orders.length,
      });
    }

    // POST /api/v1/shops/sync
    if (req.method === 'POST' && pathname === '/api/v1/shops/sync') {
      const newShop = await parseBody(req);
      const db = loadDatabase();
      if (newShop && newShop.id) {
        const index = db.shops.findIndex((s) => s.id === newShop.id);
        if (index >= 0) {
          db.shops[index] = { ...db.shops[index], ...newShop };
        } else {
          db.shops.push(newShop);
        }
        saveDatabase(db);
      }
      return jsonResponse(res, 200, { success: true, shops: db.shops });
    }

    // POST /api/v1/payments/sync (PKO)
    if (req.method === 'POST' && pathname === '/api/v1/payments/sync') {
      const payment = await parseBody(req);
      const db = loadDatabase();
      if (payment && payment.shopId && payment.amount) {
        const shop = db.shops.find((s) => s.id === payment.shopId);
        if (shop) {
          shop.debtBalance = Math.max(0, (shop.debtBalance || 0) - payment.amount);
          saveDatabase(db);
        }
      }
      return jsonResponse(res, 200, { success: true, shops: db.shops });
    }

    // POST /api/v1/reset (Reset everything to 0)
    if (req.method === 'POST' && pathname === '/api/v1/reset') {
      const cleanData = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveDatabase(cleanData);
      console.log('-> Database reset to 0 by client request');
      return jsonResponse(res, 200, {
        success: true,
        message: 'Database reset to 0 successfully',
        orders: [],
        shops: cleanData.shops,
      });
    }

    // 404 Not Found
    return jsonResponse(res, 404, { error: 'Not Found', path: pathname });
  } catch (err) {
    console.error('Server error:', err);
    return jsonResponse(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Mobi_R Sync Server is running!`);
  console.log(`📡 Local address:   http://localhost:${PORT}`);
  console.log(`📡 LAN address:     http://192.168.1.47:${PORT}`);
  console.log(`====================================================`);
});
