/**
 * Maintenance commands for the server's database (run on the server machine).
 *
 *   node admin-tool.cjs set-admin <username>   choose the admin login and password (asks for the password),
 *                                              signs everyone out of the website; also the way to reset a
 *                                              forgotten password or to restore a downloaded backup
 *   node admin-tool.cjs rotate-keys            new agent and driver keys for every line: all phones are
 *                                              signed out and the line QR codes must be printed again
 *
 * Uses DATA_DIR like the server (default: ./data next to this file). Stop the server first:
 *   sudo systemctl stop rcandy && node admin-tool.cjs ... && sudo systemctl start rcandy
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const auth = require('./auth.cjs');

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sync_db.json');

function load() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Database not found: ${DB_FILE}`);
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!db.auth) db.auth = { admin: null, sessions: [] };
  if (!Array.isArray(db.auth.sessions)) db.auth.sessions = [];
  if (!Array.isArray(db.lines)) db.lines = [];
  return db;
}

function save(db) {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

// Reads lines from the terminal without showing what is typed (one reader for all questions,
// so answers piped in at once are not lost)
let rl = null;
let lines = null;
let prompt = '';
async function askHidden(question) {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
    rl._writeToOutput = (s) => rl.output.write(s.includes(prompt) ? s : s.replace(/[^\r\n]/g, '*'));
    lines = rl[Symbol.asyncIterator]();
  }
  prompt = question;
  rl.setPrompt(question);
  rl.prompt();
  const { value } = await lines.next();
  return value || '';
}

async function setAdmin(username) {
  const name = String(username || '').trim();
  if (name.length < 3) {
    console.error('Usage: node admin-tool.cjs set-admin <username>   (username min 3 characters)');
    process.exit(1);
  }
  const password = await askHidden('New password (min 8 characters): ');
  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }
  const again = await askHidden('Repeat the password: ');
  rl.close();
  process.stdout.write('\n');
  if (again !== password) {
    console.error('Passwords do not match');
    process.exit(1);
  }
  const db = load();
  db.auth.admin = { username: name, ...auth.hashPassword(password) };
  db.auth.sessions = db.auth.sessions.filter((s) => s.role !== 'admin'); // website signed out everywhere
  save(db);
  console.log(`Admin "${name}" saved. Sign in on the website with the new password.`);
}

function rotateKeys() {
  const db = load();
  for (const line of db.lines) line.keys = { agent: auth.newLineKey(), driver: auth.newLineKey() };
  db.auth.sessions = db.auth.sessions.filter((s) => s.role === 'admin'); // every phone signs in again
  save(db);
  console.log(`New keys for ${db.lines.length} lines. Print the QR codes again: Lines -> line -> QR.`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'set-admin') setAdmin(arg);
else if (cmd === 'rotate-keys') rotateKeys();
else {
  console.log('Commands:\n  node admin-tool.cjs set-admin <username>\n  node admin-tool.cjs rotate-keys');
  process.exit(cmd ? 1 : 0);
}
