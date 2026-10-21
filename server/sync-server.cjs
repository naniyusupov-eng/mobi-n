/**
 * Mobi_R Sync Bridge Server
 * Endpoints for live synchronization between Mobile APK and Web Admin.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const auth = require('./auth.cjs');

// Settings come from the environment so the same code runs on this PC and on a hosted server
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sync_db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
// Built website (npm run build in web/); when present the server shows it on the same address
const WEB_DIST = process.env.WEB_DIST ? path.resolve(process.env.WEB_DIST) : path.join(__dirname, '..', 'web', 'dist');
const SEED_PRODUCTS = require('./seed-products.cjs');

const INITIAL_DATA = {
  orders: [],
  // Liniyalar: { id, code: '4-3' } — QR kod liniyaniki, agent skanerlab ulanadi
  lines: [],
  // Klientlar: { id, num?, name, ownerName, phone, address, latitude?, longitude?, lineCode?, day? (1-6), debtBalance? }
  // Marshrut kodi = `${lineCode}-${day}`, masalan 4-3-1 = 4-3 liniya, Dushanba
  clients: [],
  // Shops added from the mobile app that are not on a route yet
  shops: [],
  // Warehouse: { id, code, name, ..., stockDona }
  products: SEED_PRODUCTS,
  // Returned goods: { id, orderId, lineCode, routeDay, salesDate, reason, items[], total, createdAt }
  returns: [],
};

// Orders and payments reference a shop by id: a route client or a shop added from the mobile app
function findShop(db, id) {
  return db.clients.find((c) => c.id === id) || db.shops.find((s) => s.id === id) || null;
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// The database is kept in memory and re-read only when the file changes on disk
// (e.g. an import script or a restored backup), so requests do not parse it every time
let cache = null;
let cacheMtime = 0;

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    saveDatabase(JSON.parse(JSON.stringify(INITIAL_DATA)));
  }
  const mtime = fs.statSync(DB_FILE).mtimeMs;
  if (cache && mtime === cacheMtime) return cache;
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    // Never wipe the database on a bad read: keep a copy and fail the request instead
    const backup = `${DB_FILE}.broken-${Date.now()}`;
    fs.copyFileSync(DB_FILE, backup);
    console.error(`Error reading DB (copy saved to ${backup}):`, e.message);
    throw new Error('Database file could not be read');
  }
  if (!Array.isArray(db.lines)) db.lines = [];
  if (!Array.isArray(db.clients)) db.clients = [];
  if (!Array.isArray(db.shops)) db.shops = [];
  if (!Array.isArray(db.returns)) db.returns = [];
  if (!Array.isArray(db.products)) db.products = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  if (!db.auth) db.auth = { admin: null, sessions: [] };
  if (!Array.isArray(db.auth.sessions)) db.auth.sessions = [];
  cache = db;
  cacheMtime = mtime;
  if (auth.ensureLineKeys(db)) saveDatabase(db);
  return db;
}

function saveDatabase(data) {
  // Write to a temp file and rename, so a crash mid-write cannot leave a half-written database
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
  cache = data;
  cacheMtime = fs.statSync(DB_FILE).mtimeMs;
}

// ---------------------------------------------------------------- Backups
// One copy per hour (only when something changed), kept 2 days; one per day kept 60 days.
const HOURLY_KEEP = 48;
const DAILY_KEEP = 60;
let lastBackupMtime = 0;
const backupStamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });

function backupDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    const mtime = fs.statSync(DB_FILE).mtimeMs;
    if (mtime === lastBackupMtime) return;
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = backupStamp.format(new Date()).replace(', ', '_').slice(0, 13); // 2026-10-22_08 (Tashkent)
    fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, `hourly-${stamp}.json`));
    fs.copyFileSync(DB_FILE, path.join(BACKUP_DIR, `daily-${stamp.slice(0, 10)}.json`));
    lastBackupMtime = mtime;
    for (const [prefix, keep] of [['hourly-', HOURLY_KEEP], ['daily-', DAILY_KEEP]]) {
      const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(prefix)).sort();
      for (const old of files.slice(0, Math.max(0, files.length - keep))) fs.unlinkSync(path.join(BACKUP_DIR, old));
    }
  } catch (err) {
    console.error('Backup failed:', err.message);
  }
}
backupDatabase();
setInterval(backupDatabase, 60 * 60 * 1000).unref();

// ---------------------------------------------------------------- Website files
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

/** Serves the built website; unknown paths get index.html (the site is one page). Returns false if no build. */
function serveWeb(res, pathname) {
  if (!fs.existsSync(path.join(WEB_DIST, 'index.html'))) return false;
  const safe = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\]|\.\.)+/, '');
  let file = path.join(WEB_DIST, safe);
  if (!file.startsWith(WEB_DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB_DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
  return true;
}

/** Line (code) an order's shop belongs to */
function orderLine(db, orderId) {
  const order = db.orders.find((o) => o.id === orderId);
  const client = order ? db.clients.find((c) => c.id === order.shopId) : null;
  return client ? client.lineCode : null;
}

const publicLine = ({ keys, ...line }) => line;

// Business calendar date (Asia/Tashkent, whatever the server's own zone) as YYYY-MM-DD
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' });
function localDate(value) {
  return dayFormat.format(new Date(value));
}

// Orders the shop pays for later (the phone has sent both spellings)
const isCredit = (order) => order.paymentMethod === 'nasiya' || order.paymentMethod === 'debt';

// What the shop was charged for the order
const orderCharge = (order) => order.finalAmount || order.totalAmount || 0;

// Share of the list price actually charged (orders can carry a discount)
const chargeRatio = (order) => (order.totalAmount > 0 ? orderCharge(order) / order.totalAmount : 1);

// Day the driver delivers an order: the date the agent chose, otherwise the next working day
function deliveryDay(order) {
  if (order.deliveryDate) return String(order.deliveryDate).slice(0, 10);
  const d = new Date(`${localDate(order.createdAt)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1); // no deliveries on Sunday
  return d.toISOString().slice(0, 10);
}

// Quantity of one order line already brought back
function returnedQty(db, orderId, productId, unit) {
  return db.returns
    .filter((r) => r.orderId === orderId)
    .flatMap((r) => r.items)
    .filter((i) => i.productId === productId && i.unit === unit)
    .reduce((sum, i) => sum + i.quantity, 0);
}

// Quantity in pieces (dona) for stock. Weight units cannot be converted, so they return null.
function toDona(product, unit, quantity) {
  const perUnit = { dona: 1, blok: product.itemsPerBlock || 1, korobka: product.itemsPerBox || 1 }[unit];
  return perUnit ? quantity * perUnit : null;
}

function changeStock(db, productId, unit, quantity, sign) {
  const product = db.products.find((p) => p.id === productId);
  if (!product) return;
  const pieces = toDona(product, unit, quantity);
  if (pieces != null) product.stockDona = Math.max(0, (product.stockDona || 0) + sign * pieces);
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition'); // backup download keeps its file name
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
        const parsed = JSON.parse(raw);
        resolve(parsed === null ? {} : parsed);
      } catch (err) {
        const bad = new Error('Invalid JSON body');
        bad.status = 400;
        reject(bad);
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

    // Website pages (anything outside the API) when the built site is present
    if (req.method === 'GET' && !pathname.startsWith('/api/')) {
      if (serveWeb(res, pathname)) return;
    }

    const ip = req.socket.remoteAddress || '';

    // GET /api/v1/auth/status — does the admin still need to choose a password?
    if (req.method === 'GET' && pathname === '/api/v1/auth/status') {
      const db = loadDatabase();
      return jsonResponse(res, 200, { success: true, needsSetup: !db.auth.admin });
    }

    // POST /api/v1/auth/setup — { username, password } once, on the very first start
    if (req.method === 'POST' && pathname === '/api/v1/auth/setup') {
      const { username, password } = await parseBody(req);
      const db = loadDatabase();
      if (db.auth.admin) return jsonResponse(res, 403, { error: 'Admin already set up' });
      const name = String(username || '').trim();
      if (name.length < 3 || String(password || '').length < 8) {
        return jsonResponse(res, 400, { error: 'username min 3, password min 8 characters' });
      }
      db.auth.admin = { username: name, ...auth.hashPassword(password) };
      const token = auth.newToken();
      db.auth.sessions.push({ token, role: 'admin', createdAt: new Date().toISOString() });
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, token, username: name });
    }

    // POST /api/v1/auth/login — { username, password } website admin
    if (req.method === 'POST' && pathname === '/api/v1/auth/login') {
      if (auth.tooManyAttempts(ip)) return jsonResponse(res, 429, { error: 'Too many attempts, wait 10 minutes' });
      const { username, password } = await parseBody(req);
      const db = loadDatabase();
      const admin = db.auth.admin;
      if (!admin || String(username || '').trim() !== admin.username || !auth.verifyPassword(password, admin)) {
        return jsonResponse(res, 401, { error: 'Wrong username or password' });
      }
      const token = auth.newToken();
      // Old expired admin sessions are dropped on each sign-in
      db.auth.sessions = db.auth.sessions.filter((x) => x.role !== 'admin' || Date.now() - Date.parse(x.createdAt) < 30 * 86400000);
      db.auth.sessions.push({ token, role: 'admin', createdAt: new Date().toISOString() });
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, token, username: admin.username });
    }

    // POST /api/v1/auth/line — { key } from a line QR code (or typed) -> phone session
    if (req.method === 'POST' && pathname === '/api/v1/auth/line') {
      if (auth.tooManyAttempts(ip)) return jsonResponse(res, 429, { error: 'Too many attempts, wait 10 minutes' });
      const { key } = await parseBody(req);
      const db = loadDatabase();
      const found = auth.findLineKey(db, key);
      if (!found) return jsonResponse(res, 401, { error: 'Unknown line key' });
      const token = auth.newToken();
      db.auth.sessions.push({
        token,
        role: found.role,
        line: found.line.code,
        keyUsed: found.line.keys[found.role],
        createdAt: new Date().toISOString(),
      });
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, token, role: found.role, line: publicLine(found.line) });
    }

    // Everything below needs a signed-in user
    const session = auth.sessionFor(loadDatabase(), req);
    if (!session) return jsonResponse(res, 401, { error: 'Sign in required' });
    // A phone session ends when its line key is changed on the website
    if (session.role !== 'admin') {
      const line = loadDatabase().lines.find((l) => l.code === session.line);
      if (!line || !line.keys || line.keys[session.role] !== session.keyUsed) {
        return jsonResponse(res, 401, { error: 'Line key changed, scan the new QR code' });
      }
    }
    if (!auth.allowed(session, req.method, pathname)) return jsonResponse(res, 403, { error: 'Not allowed' });

    // Phones only see their own line
    if (session.role !== 'admin') {
      if (pathname === '/api/v1/clients' || pathname === '/api/v1/deliveries') url.searchParams.set('line', session.line);
      if (pathname === '/api/v1/payments') url.searchParams.set('by', `driver:${session.line}`);
      const routeOwn = pathname.match(/^\/api\/v1\/routes\/(.+)-[1-6]$/);
      if (routeOwn && routeOwn[1] !== session.line) return jsonResponse(res, 403, { error: 'Not your line' });
      const orderOwn = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/(deliver|undeliver)$/);
      if (orderOwn && orderLine(loadDatabase(), orderOwn[1]) !== session.line) return jsonResponse(res, 403, { error: 'Not your line' });
    }

    // GET /api/v1/auth/me
    if (req.method === 'GET' && pathname === '/api/v1/auth/me') {
      const db = loadDatabase();
      return jsonResponse(res, 200, {
        success: true,
        role: session.role,
        line: session.line || null,
        username: session.role === 'admin' ? db.auth.admin.username : null,
      });
    }

    // POST /api/v1/auth/logout
    if (req.method === 'POST' && pathname === '/api/v1/auth/logout') {
      const db = loadDatabase();
      db.auth.sessions = db.auth.sessions.filter((x) => x.token !== session.token);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true });
    }

    // POST /api/v1/auth/password — { current, next } admin changes the password
    if (req.method === 'POST' && pathname === '/api/v1/auth/password') {
      const { current, next } = await parseBody(req);
      const db = loadDatabase();
      if (!auth.verifyPassword(current, db.auth.admin)) return jsonResponse(res, 401, { error: 'Wrong current password' });
      if (String(next || '').length < 8) return jsonResponse(res, 400, { error: 'password min 8 characters' });
      db.auth.admin = { username: db.auth.admin.username, ...auth.hashPassword(next) };
      // Other admin sessions are signed out
      db.auth.sessions = db.auth.sessions.filter((x) => x.role !== 'admin' || x.token === session.token);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true });
    }

    // GET /api/v1/lines/:id/keys — the line's agent and driver keys (for printing QR codes)
    // POST /api/v1/lines/:id/keys — { role } issue a new key; phones using the old one are signed out
    const keysMatch = pathname.match(/^\/api\/v1\/lines\/([^/]+)\/keys$/);
    if (keysMatch) {
      const db = loadDatabase();
      const line = db.lines.find((l) => l.id === keysMatch[1]);
      if (!line) return jsonResponse(res, 404, { error: 'Line not found' });
      if (req.method === 'POST') {
        const { role } = await parseBody(req);
        if (!['agent', 'driver'].includes(role)) return jsonResponse(res, 400, { error: 'role must be agent or driver' });
        line.keys[role] = auth.newLineKey();
        db.auth.sessions = db.auth.sessions.filter((x) => !(x.line === line.code && x.role === role));
        saveDatabase(db);
      }
      return jsonResponse(res, 200, { success: true, keys: line.keys });
    }

    // GET /api/v1/admin/backup — download the whole database (a copy for safekeeping)
    if (req.method === 'GET' && pathname === '/api/v1/admin/backup') {
      const db = loadDatabase();
      const { auth: _secret, ...data } = db; // passwords and sessions stay on the server
      setCorsHeaders(res);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="mobi_r-backup-${localDate(Date.now())}.json"`,
      });
      return res.end(JSON.stringify(data, null, 1));
    }

    // GET /api/v1/orders — each order gets its shop's route (lineCode, routeDay, shopNum) for reports
    if (req.method === 'GET' && pathname === '/api/v1/orders') {
      const db = loadDatabase();
      const clientsById = new Map(db.clients.map((c) => [c.id, c]));
      const orders = db.orders.map((o) => {
        const c = clientsById.get(o.shopId);
        return c ? { ...o, lineCode: c.lineCode, routeDay: c.day, shopNum: c.num } : o;
      });
      return jsonResponse(res, 200, {
        success: true,
        count: orders.length,
        orders,
      });
    }

    // GET /api/v1/deliveries?line=4-3[&date=YYYY-MM-DD] — the line driver's orders for a day
    if (req.method === 'GET' && pathname === '/api/v1/deliveries') {
      const db = loadDatabase();
      const lineCode = url.searchParams.get('line');
      const date = url.searchParams.get('date') || localDate(Date.now());
      if (!lineCode) return jsonResponse(res, 400, { error: 'line is required' });
      const clientById = new Map(db.clients.map((c) => [c.id, c]));
      const orders = db.orders
        .filter((o) => o.status !== 'cancelled' && clientById.get(o.shopId)?.lineCode === lineCode && deliveryDay(o) === date)
        .map((o) => {
          const c = clientById.get(o.shopId) || {};
          return {
            ...o,
            lineCode,
            routeDay: c.day,
            shopNum: c.num,
            shopPhone: c.phone || '',
            shopAddress: c.address || o.shopAddress || '',
            latitude: c.latitude,
            longitude: c.longitude,
            shopDebt: c.debtBalance || 0,
            deliveryDay: date,
            returns: db.returns.filter((r) => r.orderId === o.id),
          };
        })
        .sort((a, b) => (a.shopNum ?? 9999) - (b.shopNum ?? 9999));
      return jsonResponse(res, 200, { success: true, date, line: lineCode, orders });
    }

    // POST /api/v1/orders/:id/deliver — { collected, by } the driver handed the goods over
    // POST /api/v1/orders/:id/undeliver — the driver undoes a mistaken "delivered"
    const deliverMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/(deliver|undeliver)$/);
    if (req.method === 'POST' && deliverMatch) {
      const body = await parseBody(req);
      const db = loadDatabase();
      const order = db.orders.find((o) => o.id === deliverMatch[1]);
      if (!order) return jsonResponse(res, 404, { error: 'Order not found' });
      if (order.status === 'cancelled') return jsonResponse(res, 400, { error: 'Bekor qilingan buyurtma' });
      if (deliverMatch[2] === 'deliver') {
        const collected = Number(body.collected);
        order.status = 'delivered';
        order.deliveredAt = new Date().toISOString();
        order.deliveredBy = String(body.by || '');
        order.collected = Number.isFinite(collected) && collected >= 0 ? Math.round(collected) : 0;
      } else {
        order.status = 'confirmed';
        delete order.deliveredAt;
        delete order.deliveredBy;
        delete order.collected;
      }
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, order });
    }

    // GET /api/v1/payments[?by=driver:4-3][&date=YYYY-MM-DD] — PKO history
    if (req.method === 'GET' && pathname === '/api/v1/payments') {
      const db = loadDatabase();
      const by = url.searchParams.get('by');
      const date = url.searchParams.get('date');
      const payments = (db.payments || []).filter(
        (pm) => (!by || pm.by === by) && (!date || localDate(pm.createdAt) === date)
      );
      return jsonResponse(res, 200, { success: true, payments });
    }

    // POST /api/v1/orders/:id/status — { status } changed on the website
    const statusMatch = pathname.match(/^\/api\/v1\/orders\/([^/]+)\/status$/);
    if (req.method === 'POST' && statusMatch) {
      const { status } = await parseBody(req);
      if (!['new', 'confirmed', 'delivered', 'cancelled'].includes(status)) {
        return jsonResponse(res, 400, { error: 'Unknown status' });
      }
      const db = loadDatabase();
      const order = db.orders.find((o) => o.id === statusMatch[1]);
      if (!order) return jsonResponse(res, 404, { error: 'Order not found' });
      const wasCancelled = order.status === 'cancelled';
      const nowCancelled = status === 'cancelled';
      if (wasCancelled !== nowCancelled) {
        const sign = nowCancelled ? +1 : -1;
        // Goods already returned are back in stock; only the kept part moves
        for (const item of order.items || []) {
          const kept = item.quantity - returnedQty(db, order.id, item.productId, item.unit);
          if (kept > 0) changeStock(db, item.productId, item.unit, kept, sign);
        }
        const shop = isCredit(order) ? findShop(db, order.shopId) : null;
        if (shop && nowCancelled) {
          const owed = Math.max(0, orderCharge(order) - (order.returnedAmount || 0));
          const removed = Math.min(shop.debtBalance || 0, owed);
          shop.debtBalance = (shop.debtBalance || 0) - removed;
          order.cancelDebtApplied = removed;
        } else if (shop) {
          shop.debtBalance = (shop.debtBalance || 0) + (order.cancelDebtApplied || 0);
          delete order.cancelDebtApplied;
        }
      }
      order.status = status;
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, order });
    }

    // GET /api/v1/products — warehouse catalogue with stock
    if (req.method === 'GET' && pathname === '/api/v1/products') {
      const db = loadDatabase();
      return jsonResponse(res, 200, { success: true, products: db.products });
    }

    // POST /api/v1/products — add or update a product
    if (req.method === 'POST' && pathname === '/api/v1/products') {
      const product = await parseBody(req);
      if (!product || !product.id || !product.name) return jsonResponse(res, 400, { error: 'id and name are required' });
      const db = loadDatabase();
      const index = db.products.findIndex((p) => p.id === product.id);
      if (index >= 0) db.products[index] = { ...db.products[index], ...product };
      else db.products.unshift(product);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, products: db.products });
    }

    // POST /api/v1/products/:id/stock — { stockDona } set by hand (stock count)
    const stockMatch = pathname.match(/^\/api\/v1\/products\/([^/]+)\/stock$/);
    if (req.method === 'POST' && stockMatch) {
      const { stockDona } = await parseBody(req);
      const db = loadDatabase();
      const product = db.products.find((p) => p.id === stockMatch[1]);
      if (!product || !(stockDona >= 0)) return jsonResponse(res, 400, { error: 'Unknown product or bad stock' });
      product.stockDona = Math.round(stockDona);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, products: db.products });
    }

    // POST /api/v1/returns — goods brought back by the delivery driver
    // { orderId, reason, items: [{ productId, unit, quantity }] }
    if (req.method === 'POST' && pathname === '/api/v1/returns') {
      const body = await parseBody(req);
      const db = loadDatabase();
      const order = db.orders.find((o) => o.id === body.orderId);
      if (!order) return jsonResponse(res, 404, { error: 'Order not found' });
      if (order.status === 'cancelled') return jsonResponse(res, 400, { error: 'Bekor qilingan buyurtmaga vozvrat kiritib boʻlmaydi' });
      const ratio = chargeRatio(order);

      const items = [];
      for (const wanted of body.items || []) {
        const line = (order.items || []).find((i) => i.productId === wanted.productId && i.unit === wanted.unit);
        const quantity = Number(wanted.quantity);
        if (!line || !(quantity > 0)) continue;
        const left = line.quantity - returnedQty(db, order.id, line.productId, line.unit);
        if (quantity > left) {
          return jsonResponse(res, 400, { error: `${line.productName}: faqat ${left} ta qaytarish mumkin` });
        }
        items.push({
          productId: line.productId,
          productName: line.productName,
          unit: line.unit,
          quantity,
          unitPrice: Math.round(line.unitPrice * ratio),
          totalPrice: Math.round(quantity * line.unitPrice * ratio),
        });
      }
      if (items.length === 0) return jsonResponse(res, 400, { error: 'Qaytariladigan tovar tanlanmagan' });

      const shop = findShop(db, order.shopId);
      const client = db.clients.find((c) => c.id === order.shopId);
      // Rounding must never let returns exceed what the shop was charged
      const total = Math.min(
        items.reduce((sum, i) => sum + i.totalPrice, 0),
        Math.max(0, orderCharge(order) - (order.returnedAmount || 0))
      );
      const ret = {
        id: `ret_${Date.now()}`,
        orderId: order.id,
        shopId: order.shopId,
        shopName: order.shopName,
        lineCode: client ? client.lineCode : null,
        routeDay: client ? client.day : null,
        salesDate: localDate(order.createdAt), // counted against the day the order was taken
        reason: String(body.reason || '').trim() || 'Boshqa',
        items,
        total,
        createdAt: new Date().toISOString(),
      };

      for (const i of items) changeStock(db, i.productId, i.unit, i.quantity, +1);
      // A credit shop does not owe for goods it did not keep; remember how much was taken off
      if (shop && isCredit(order)) {
        const removed = Math.min(shop.debtBalance || 0, total);
        shop.debtBalance = (shop.debtBalance || 0) - removed;
        ret.debtApplied = removed;
      }
      order.returnedAmount = (order.returnedAmount || 0) + total;

      db.returns.unshift(ret);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, return: ret, order });
    }

    // GET /api/v1/returns[?month=YYYY-MM][&line=4-3][&order=<id>]
    if (req.method === 'GET' && pathname === '/api/v1/returns') {
      const db = loadDatabase();
      const month = url.searchParams.get('month');
      const lineCode = url.searchParams.get('line');
      const orderId = url.searchParams.get('order');
      const returns = db.returns.filter(
        (r) =>
          (!month || r.salesDate.startsWith(month)) &&
          (!lineCode || r.lineCode === lineCode) &&
          (!orderId || r.orderId === orderId)
      );
      return jsonResponse(res, 200, { success: true, returns });
    }

    // DELETE /api/v1/returns/:id — undo a return entered by mistake
    const returnMatch = pathname.match(/^\/api\/v1\/returns\/([^/]+)$/);
    if (req.method === 'DELETE' && returnMatch) {
      const db = loadDatabase();
      const ret = db.returns.find((r) => r.id === returnMatch[1]);
      if (!ret) return jsonResponse(res, 404, { error: 'Return not found' });
      const order = db.orders.find((o) => o.id === ret.orderId);
      const shop = findShop(db, ret.shopId);
      for (const i of ret.items) changeStock(db, i.productId, i.unit, i.quantity, -1);
      // Give back exactly what the return took off (older returns have no debtApplied)
      if (shop && order && isCredit(order)) shop.debtBalance = (shop.debtBalance || 0) + (ret.debtApplied ?? ret.total);
      if (order) order.returnedAmount = Math.max(0, (order.returnedAmount || 0) - ret.total);
      db.returns = db.returns.filter((r) => r.id !== ret.id);
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true });
    }

    // GET /api/v1/stats/monthly?month=YYYY-MM — per line and day: sales, returns, net; return-free streaks
    if (req.method === 'GET' && pathname === '/api/v1/stats/monthly') {
      const db = loadDatabase();
      const month = url.searchParams.get('month') || localDate(Date.now()).slice(0, 7);
      const lineOf = new Map(db.clients.map((c) => [c.id, c.lineCode]));
      const today = localDate(Date.now());
      const cancelledIds = new Set(db.orders.filter((o) => o.status === 'cancelled').map((o) => o.id));

      const lines = db.lines.map((line) => {
        // Cancelled orders are not sales
        const orders = db.orders.filter((o) => o.status !== 'cancelled' && lineOf.get(o.shopId) === line.code);
        const returns = db.returns.filter(
          (r) => !cancelledIds.has(r.orderId) && (lineOf.get(r.shopId) ?? r.lineCode) === line.code
        );

        const days = {};
        const cell = (date) => (days[date] ||= { orders: 0, gross: 0, returns: 0, net: 0 });
        for (const o of orders) {
          const date = localDate(o.createdAt);
          if (!date.startsWith(month)) continue;
          const c = cell(date);
          c.orders += 1;
          c.gross += o.finalAmount || 0;
        }
        for (const r of returns) {
          if (!r.salesDate.startsWith(month)) continue;
          cell(r.salesDate).returns += r.total;
        }
        const totals = { orders: 0, gross: 0, returns: 0, net: 0 };
        for (const c of Object.values(days)) {
          c.net = c.gross - c.returns;
          totals.orders += c.orders;
          totals.gross += c.gross;
          totals.returns += c.returns;
          totals.net += c.net;
        }

        // Streak: consecutive sales days (before today, all time) without any return
        const returnDays = new Set(returns.map((r) => r.salesDate));
        const salesDays = [...new Set(orders.map((o) => localDate(o.createdAt)))].filter((d) => d < today).sort();
        let current = 0;
        let best = 0;
        for (const d of salesDays) {
          current = returnDays.has(d) ? 0 : current + 1;
          best = Math.max(best, current);
        }
        const lastReturnDate = [...returnDays].sort().pop() || null;

        return { code: line.code, days, totals, streak: { current, best, lastReturnDate } };
      });

      return jsonResponse(res, 200, { success: true, month, lines });
    }

    // GET /api/v1/settings — company requisites shown on invoices
    if (req.method === 'GET' && pathname === '/api/v1/settings') {
      const db = loadDatabase();
      return jsonResponse(res, 200, { success: true, settings: db.settings || {} });
    }

    // POST /api/v1/settings
    if (req.method === 'POST' && pathname === '/api/v1/settings') {
      const body = await parseBody(req);
      const db = loadDatabase();
      const allowed = ['companyName', 'address', 'phone', 'inn', 'bankAccount', 'bankMfo'];
      db.settings = { ...(db.settings || {}) };
      for (const key of allowed) {
        if (typeof body[key] === 'string') db.settings[key] = body[key].trim();
      }
      // Return-free streak bonus: days in a row without returns, and the bonus amount
      for (const key of ['bonusStreakDays', 'bonusAmount']) {
        if (body[key] !== undefined && Number(body[key]) >= 0) db.settings[key] = Math.round(Number(body[key]));
      }
      saveDatabase(db);
      return jsonResponse(res, 200, { success: true, settings: db.settings });
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

        // A phone clock running ahead would put the order on a future day:
        // anything stamped more than 5 minutes ahead gets the server's receive time
        const stamped = Date.parse(order.createdAt);
        if (!Number.isFinite(stamped) || stamped > Date.now() + 5 * 60 * 1000) {
          if (order.createdAt) order.clientCreatedAt = order.createdAt;
          order.createdAt = new Date().toISOString();
        }

        if (existsIndex >= 0) {
          // The first accepted timestamp stays (re-syncs must not move the order to another day)
          // Status, items and money were settled when the order first arrived (stock and debt
          // were applied then), so a resend may only fill in descriptive fields
          const {
            createdAt, clientCreatedAt, status, items, totalAmount, discountAmount, finalAmount,
            paymentMethod, returnedAmount, shopId, ...rest
          } = order;
          db.orders[existsIndex] = { ...db.orders[existsIndex], ...rest };
        } else {
          db.orders.unshift(order);
          addedCount++;

          // Sold goods leave the warehouse
          for (const item of order.items || []) {
            changeStock(db, item.productId, item.unit, item.quantity, -1);
          }

          // If nasiya, increment shop debt
          if (order.shopId && isCredit(order)) {
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
        // The phone retries failed uploads, so a payment with a known id is applied only once
        if (!Array.isArray(db.paymentIds)) db.paymentIds = [];
        const alreadyApplied = payment.id && db.paymentIds.includes(payment.id);
        if (!shop) return jsonResponse(res, 404, { error: 'Shop not found' });
        if (!alreadyApplied) {
          shop.debtBalance = Math.max(0, (shop.debtBalance || 0) - payment.amount);
          if (payment.id) db.paymentIds.push(payment.id);
          if (!Array.isArray(db.payments)) db.payments = [];
          db.payments.unshift({
            id: payment.id || `pay_${Date.now()}`,
            shopId: payment.shopId,
            shopName: shop.name,
            amount: Math.round(payment.amount),
            by: String(payment.by || ''),
            createdAt: payment.createdAt || new Date().toISOString(),
          });
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
      return jsonResponse(res, 200, { success: true, lines: db.lines.map(publicLine) });
    }

    // POST /api/v1/lines (create or update a line)
    if (req.method === 'POST' && pathname === '/api/v1/lines') {
      const { keys: _ignored, ...line } = await parseBody(req); // keys are issued by the server only
      const code = String(line.code || '').trim();
      if (!code) return jsonResponse(res, 400, { error: 'Line code is required' });
      const db = loadDatabase();
      const index = db.lines.findIndex((l) => l.id === line.id || l.code === code);
      if (index >= 0) {
        const oldCode = db.lines[index].code;
        if (oldCode !== code) for (const c of db.clients) if (c.lineCode === oldCode) c.lineCode = code;
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
      if (lineCode && !(Number(day) >= 1 && Number(day) <= 6)) {
        return jsonResponse(res, 400, { error: 'day must be 1-6 when a line is given' });
      }
      const db = loadDatabase();
      const idSet = new Set(Array.isArray(ids) ? ids : []);
      for (const c of db.clients) {
        if (!idSet.has(c.id)) continue;
        if (lineCode) {
          c.lineCode = String(lineCode);
          c.day = Number(day);
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

    // 404 Not Found
    return jsonResponse(res, 404, { error: 'Not Found', path: pathname });
  } catch (err) {
    if (err.status === 400) return jsonResponse(res, 400, { error: err.message });
    console.error('Server error:', err);
    return jsonResponse(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Mobi_R server on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (data: ${DATA_DIR})`);
  if (fs.existsSync(path.join(WEB_DIST, 'index.html'))) console.log(`Website served from ${WEB_DIST}`);
});
