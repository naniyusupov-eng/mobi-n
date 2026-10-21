/**
 * Sign-in and access rules for the sync server.
 *
 * - The website admin signs in with a username and password (set on first start).
 * - Phones sign in with a line key printed in the line's QR code. Each line has two keys:
 *   one for its agent (taking orders) and one for its delivery driver.
 * - Every request then carries "Authorization: Bearer <token>".
 */
const crypto = require('crypto');

const ADMIN_SESSION_DAYS = 30;
// Readable key alphabet (no 0/O, 1/I/L) so a key can also be typed by hand
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, record) {
  if (!record || !record.salt || !record.hash) return false;
  const hash = crypto.scryptSync(String(password), record.salt, 64);
  const expected = Buffer.from(record.hash, 'hex');
  return expected.length === hash.length && crypto.timingSafeEqual(expected, hash);
}

const newToken = () => crypto.randomBytes(32).toString('hex');

/** e.g. "K7QM-29XP" */
function newLineKey() {
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

const normalizeKey = (key) => String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Gives every line its agent and driver keys if it has none yet. Returns true if something changed. */
function ensureLineKeys(db) {
  let changed = false;
  for (const line of db.lines) {
    if (!line.keys) line.keys = {};
    for (const role of ['agent', 'driver']) {
      if (!line.keys[role]) {
        line.keys[role] = newLineKey();
        changed = true;
      }
    }
  }
  return changed;
}

/** Line and role for a typed or scanned key, or null */
function findLineKey(db, key) {
  const wanted = normalizeKey(key);
  if (!wanted) return null;
  for (const line of db.lines) {
    for (const role of ['agent', 'driver']) {
      if (line.keys && normalizeKey(line.keys[role]) === wanted) return { line, role };
    }
  }
  return null;
}

/** Session for the request's bearer token, or null */
function sessionFor(db, req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !db.auth) return null;
  const session = db.auth.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (session.role === 'admin') {
    const ageDays = (Date.now() - Date.parse(session.createdAt)) / 86400000;
    if (!(ageDays < ADMIN_SESSION_DAYS)) return null;
  }
  return session;
}

// What a phone may call. The admin may call everything.
const PHONE_RULES = {
  agent: [
    ['GET', /^\/api\/v1\/(products|clients|settings|auth\/me)$/],
    ['GET', /^\/api\/v1\/routes\/.+$/],
    ['POST', /^\/api\/v1\/(orders\/sync|shops\/sync|payments\/sync)$/],
  ],
  driver: [
    ['GET', /^\/api\/v1\/(products|clients|settings|deliveries|payments|auth\/me)$/],
    ['POST', /^\/api\/v1\/(returns|payments\/sync)$/],
    ['POST', /^\/api\/v1\/orders\/[^/]+\/(deliver|undeliver)$/],
  ],
};

function allowed(session, method, pathname) {
  if (session.role === 'admin') return true;
  return (PHONE_RULES[session.role] || []).some(([m, re]) => m === method && re.test(pathname));
}

// Simple brute-force brake for sign-in endpoints: 10 tries per 10 minutes per address
const attempts = new Map();
function tooManyAttempts(ip) {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now > a.reset) {
    attempts.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  a.count += 1;
  return a.count > 10;
}

module.exports = {
  hashPassword,
  verifyPassword,
  newToken,
  newLineKey,
  ensureLineKeys,
  findLineKey,
  sessionFor,
  allowed,
  tooManyAttempts,
};
