// Export shops as GeoJSON files for Yandex Map Constructor ("Импорт" button),
// so the maps can be recreated under our own Yandex account.
//
//   node server/export-yandex.cjs
//
// Writes into server/data/yandex-export/ (not committed: names and phone numbers):
//   routes/4-3-1.geojson           one file per route, like the original links
//   lines/4-3.geojson              one file per line, six week days in six colours
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'sync_db.json');
const OUT_DIR = path.join(__dirname, 'data', 'yandex-export');

// Yandex Constructor palette, one colour per week day
const DAY_COLORS = ['', '#1e98ff', '#ed4543', '#56db40', '#b51eff', '#f371d1', '#ff931e'];
const ROUTE_COLOR = '#ed4543'; // the colour used on the original route maps
const OFFICE = { name: 'Ofis / Sklad', coords: [70.941431, 40.530507] };

/** 30 -> "30", 30.5 -> "30a" */
const numLabel = (n) => (n == null ? '' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}a`);

const shopFeature = (c, color, prefix = '') => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
  properties: {
    iconContent: prefix + numLabel(c.num),
    iconCaption: c.name,
    description: [c.phone, c.address, c.notes].filter(Boolean).join('\n'), // the name is already the caption
    'marker-color': color,
  },
});

const officeFeature = () => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: OFFICE.coords },
  properties: { iconCaption: OFFICE.name, description: OFFICE.name, 'marker-color': '#595959' },
});

// Route lines drawn on the original maps (node server/fetch-yandex-lines.cjs), optional
const LINES_FILE = path.join(OUT_DIR, 'route-lines.json');
const routeLines = fs.existsSync(LINES_FILE) ? JSON.parse(fs.readFileSync(LINES_FILE, 'utf8')) : {};
const lineFeatures = (route) =>
  (routeLines[route] || []).map((l) => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: l.coords },
    properties: { description: l.title, stroke: l.color, 'stroke-width': l.width, 'stroke-opacity': l.opacity },
  }));

const collection = (name, features) => ({
  type: 'FeatureCollection',
  metadata: { name, creator: 'RCandy export' },
  features: features.map((f, i) => ({ ...f, id: i })),
});

const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
};

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const clients = (db.clients || []).filter((c) => c.lineCode && c.day && Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
const byNum = (a, b) => (a.num ?? 9999) - (b.num ?? 9999);

// Only regenerate our own output; route-lines.json and links.json live next to it
for (const dir of ['routes', 'lines']) fs.rmSync(path.join(OUT_DIR, dir), { recursive: true, force: true });
let routeFiles = 0;
const lineCodes = [...new Set(clients.map((c) => c.lineCode))].sort((a, b) =>
  a.localeCompare(b, undefined, { numeric: true })
);

for (const line of lineCodes) {
  const lineShops = clients.filter((c) => c.lineCode === line);

  for (let day = 1; day <= 6; day++) {
    const shops = lineShops.filter((c) => c.day === day).sort(byNum);
    if (!shops.length) continue;
    const name = `${line}-${day}`;
    write(
      path.join(OUT_DIR, 'routes', `${name}.geojson`),
      collection(name, [...shops.map((c) => shopFeature(c, ROUTE_COLOR)), officeFeature(), ...lineFeatures(name)])
    );
    routeFiles++;
  }

  // Whole line: number shows "day.num" so the six days stay apart on one map
  const features = lineShops
    .sort((a, b) => a.day - b.day || byNum(a, b))
    .map((c) => shopFeature(c, DAY_COLORS[c.day], `${c.day}.`));
  write(path.join(OUT_DIR, 'lines', `${line}.geojson`), collection(`${line} liniya`, [
      ...features,
      officeFeature(),
      ...[1, 2, 3, 4, 5, 6].flatMap((d) => lineFeatures(`${line}-${d}`)),
    ]));
}

console.log(`${clients.length} shops -> ${routeFiles} route files, ${lineCodes.length} line files in ${OUT_DIR}`);
