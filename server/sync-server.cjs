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
  // Liniyalar: { id, code: '4-3' } — QR kod liniyaniki, agent skanerlab ulanadi
  lines: [],
  // Klientlar: { id, num?, name, ownerName, phone, address, latitude?, longitude?, lineCode?, day? (1-6), debtBalance? }
  // Marshrut kodi = `${lineCode}-${day}`, masalan 4-3-1 = 4-3 liniya, Dushanba
  clients: [],
  // Shops added from the mobile app that are not on a route yet
  shops: [],
};

// Orders and payments reference a shop by id: a route client or a shop added from the mobile app
function findShop(db, id) {
  return db.clients.find((c) => c.id === id) || db.shops.find((s) => s.id === id) || null;
}

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
    const db = JSON.parse(raw);
    if (!Array.isArray(db.lines)) db.lines = [];
    if (!Array.isArray(db.clients)) db.clients = [];
    return db;
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
            const shop = findShop(db, order.shopId);
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
      let shop = null;
      if (payment && payment.shopId && payment.amount > 0) {
        shop = findShop(db, payment.shopId);
        if (shop) {
          shop.debtBalance = Math.max(0, (shop.debtBalance || 0) - payment.amount);
          saveDatabase(db);
        }
      }
      return jsonResponse(res, 200, { success: true, shop });
    }

    // GET /api/v1/debts — shops that owe money, biggest debt first
    if (req.method === 'GET' && pathname === '/api/v1/debts') {
      const db = loadDatabase();
      const debtors = [...db.clients, ...db.shops]
        .filter((s) => (s.debtBalance || 0) > 0)
        .sort((a, b) => b.debtBalance - a.debtBalance);
      const totalDebt = debtors.reduce((sum, s) => sum + s.debtBalance, 0);
      return jsonResponse(res, 200, { success: true, totalDebt, count: debtors.length, debtors });
    }

    // GET /api/v1/lines
    if (req.method === 'GET' && pathname === '/api/v1/lines') {
      const db = loadDatabase();
      return jsonResponse(res, 200, { success: true, lines: db.lines });
    }

    // POST /api/v1/lines (create or update a line)
    if (req.method === 'POST' && pathname === '/api/v1/lines') {
      const line = await parseBody(req);
      const code = String(line.code || '').trim();
      if (!code) return jsonResponse(res, 400, { error: 'Line code is required' });
      const db = loadDatabase();
      const index = db.lines.findIndex((l) => l.id === line.id || l.code === code);
      if (index >= 0) {
        db.lines[index] = { ...db.lines[index], ...line, code };
      } else {
        db.lines.push({ ...line, id: line.id || `line_${Date.now()}`, code });
      }
      db.lines.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, lines: db.lines });
    }

    // DELETE /api/v1/lines/:id (clients of the line become unassigned)
    const lineMatch = pathname.match(/^\/api\/v1\/lines\/([^/]+)$/);
    if (req.method === 'DELETE' && lineMatch) {
      const db = loadDatabase();
      const line = db.lines.find((l) => l.id === lineMatch[1]);
      if (line) {
        db.lines = db.lines.filter((l) => l.id !== line.id);
        for (const c of db.clients) {
          if (c.lineCode === line.code) {
            delete c.lineCode;
            delete c.day;
          }
        }
        saveDatabase(db);
      }
      return jsonResponse(res, 200, { success: true, lines: db.lines, clients: db.clients });
    }

    // GET /api/v1/clients[?line=4-3][&day=1]
    if (req.method === 'GET' && pathname === '/api/v1/clients') {
      const db = loadDatabase();
      const lineCode = url.searchParams.get('line');
      const day = url.searchParams.get('day');
      const clients = db.clients.filter(
        (c) => (!lineCode || c.lineCode === lineCode) && (!day || String(c.day) === day)
      );
      return jsonResponse(res, 200, { success: true, count: clients.length, clients });
    }

    // GET /api/v1/routes/:code — clients of one route, e.g. /api/v1/routes/4-3-1 (4-3 line, Monday)
    const routeMatch = pathname.match(/^\/api\/v1\/routes\/(.+)-([1-6])$/);
    if (req.method === 'GET' && routeMatch) {
      const db = loadDatabase();
      const [, lineCode, day] = routeMatch;
      const line = db.lines.find((l) => l.code === lineCode) || null;
      const clients = db.clients.filter((c) => c.lineCode === lineCode && String(c.day) === day);
      return jsonResponse(res, 200, { success: true, line, day: Number(day), count: clients.length, clients });
    }

    // POST /api/v1/clients/import — array of clients, upsert by id
    if (req.method === 'POST' && pathname === '/api/v1/clients/import') {
      const payload = await parseBody(req);
      const items = Array.isArray(payload) ? payload : [payload];
      const db = loadDatabase();
      let added = 0;
      items.forEach((item, i) => {
        if (!item || !item.name) return;
        const index = item.id ? db.clients.findIndex((c) => c.id === item.id) : -1;
        if (index >= 0) {
          db.clients[index] = { ...db.clients[index], ...item };
        } else {
          db.clients.push({ ...item, id: item.id || `client_${Date.now()}_${i}` });
          added++;
        }
      });
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, added, clients: db.clients });
    }

    // POST /api/v1/clients/assign — { ids: [], lineCode: '4-3' | null, day: 1-6 | null }
    if (req.method === 'POST' && pathname === '/api/v1/clients/assign') {
      const { ids, lineCode, day } = await parseBody(req);
      const db = loadDatabase();
      const idSet = new Set(Array.isArray(ids) ? ids : []);
      for (const c of db.clients) {
        if (!idSet.has(c.id)) continue;
        if (lineCode) {
          c.lineCode = lineCode;
          if (day) c.day = Number(day);
        } else {
          delete c.lineCode;
          delete c.day;
        }
      }
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, clients: db.clients });
    }

    // DELETE /api/v1/clients/:id
    const clientMatch = pathname.match(/^\/api\/v1\/clients\/([^/]+)$/);
    if (req.method === 'DELETE' && clientMatch) {
      const db = loadDatabase();
      db.clients = db.clients.filter((c) => c.id !== clientMatch[1]);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, clients: db.clients });
    }

    // POST /api/v1/reset (Delete orders and set debts to 0; lines, clients and shops are kept)
    if (req.method === 'POST' && pathname === '/api/v1/reset') {
      const db = loadDatabase();
      db.orders = [];
      for (const s of [...db.clients, ...db.shops]) {
        if (s.debtBalance) s.debtBalance = 0;
      }
      saveDatabase(db);
      console.log('-> Database reset to 0 by client request');
      return jsonResponse(res, 200, { success: true, message: 'Database reset to 0 successfully' });
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
