// Fetch the drawn route lines (not placemarks) from the original Yandex constructor maps,
// so they can be carried over to our own maps.
//
//   node server/fetch-yandex-lines.cjs
//
// Writes server/data/yandex-export/route-lines.json: { "4-3-1": [{ coords, color, width, title }] }
const fs = require('fs');
const path = require('path');

// Route ids are kept in one place: the importer
const importer = fs.readFileSync(path.join(__dirname, 'import-yandex.cjs'), 'utf8');
const routesBlock = importer.slice(importer.indexOf('const ROUTES = {'), importer.indexOf('};', importer.indexOf('const ROUTES = {')));
const ROUTES = Object.fromEntries([...routesBlock.matchAll(/'([\d-]+)':\s*'([0-9a-f]+)'/g)].map((m) => [m[1], m[2]]));

/** The constructor widget page embeds the whole map as "userMap": {...} */
async function fetchUserMap(mapId) {
  const url = `https://yandex.ru/map-widget/v1/?lang=ru_RU&scroll=false&source=constructor-api&um=constructor%3A${mapId}`;
  const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const key = '"userMap":';
  const start = html.indexOf(key);
  if (start < 0) throw new Error(`userMap not found for ${mapId}`);
  let depth = 0, i = start + key.length, inStr = false, esc = false;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) break;
  }
  return JSON.parse(html.slice(start + key.length, i + 1));
}

/** Stroke style of a constructor line, coordinates rounded to ~10 cm */
const lineStyle = (f) => ({
  color: f.stroke?.color || '#1e98ff',
  opacity: f.stroke?.opacity ?? 0.9,
  width: f.stroke?.width || 5,
  title: f.title || '',
});

(async () => {
  if (process.argv[2] === '--inspect') {
    const map = await fetchUserMap(ROUTES['4-3-1']);
    const types = {};
    for (const f of map.features) types[f.type] = (types[f.type] || 0) + 1;
    console.log(types);
    for (const l of map.features.filter((f) => f.type === 'line')) { const { geometry, ...rest } = l; console.log(JSON.stringify(rest), geometry.coordinates.length, 'points'); }
    return;
  }

  const out = {};
  for (const [route, id] of Object.entries(ROUTES)) {
    const map = await fetchUserMap(id);
    out[route] = map.features
      .filter((f) => f.type === 'line')
      .map((f) => ({ coords: f.geometry.coordinates.map(([x, y]) => [+x.toFixed(6), +y.toFixed(6)]), ...lineStyle(f) }));
    process.stdout.write(`${route}:${out[route].length} `);
  }
  const file = path.join(__dirname, 'data', 'yandex-export', 'route-lines.json');
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`\n-> ${file}`);
})();
