/**
 * Imports shops from Yandex constructor maps into routes (line + week day).
 *
 *   node server/import-yandex.cjs            # import every route below
 *   node server/import-yandex.cjs 4-3-2      # import only listed routes
 *   node server/import-yandex.cjs --dry      # print parsed rows, do not save
 *
 * The sync server must be running. Client ids are `ym_<route>_<№>`, so re-running
 * updates the same shops instead of duplicating them.
 */
const API = process.env.API || 'http://localhost:3000/api/v1';

// Route code (line-day, 1 = Dushanba ... 6 = Shanba) -> Yandex constructor map id
const ROUTES = {
  '4-3-1': 'fa2791e1c4eeae13b829cb44dbe137174af21f52ff932962d0826f0304d96fd9',
  '4-3-2': '2be835ffab3e4dc5c8a9397075426e9b52b237ca9bd16f52548bfc62627372b1',
  '4-3-3': 'fdd4a37d925dbca0aecc412735a2bb6b51a0ce564d3051e5605b8bcd4429d9f5',
  '4-3-4': '09cf93b8e1b83b1cc68bc737d17eb623bf048587d625fd623a01bb8bf06650a0',
  '4-3-5': '36878357ef85c3405a8b8ebb69b3c86f6cd476217eae0c8bb552afd0fe5990f1',
  '4-3-6': '8144742f7d5ac9cef93322edd3b8fd94ec1c49923a1b27d808ddc6139a778328',
  '4-4-1': '381c3b400c9afeab3085fa02e565fda2126a27a1c2b17a02376c3bbdd930cfa0',
  '4-4-2': '3f99e3f69266ee2dfefada2c8701d25d31f4ef67861eb293c5c7c6a171946c5c',
  '4-4-3': '29c5a43dc6530008d61ce1b6527620585a0ae30d482869e2f962b30f5a5218cd',
  '4-4-4': 'bab9b79668a3e630d06ef4da4109f5ef271817655bebe21740d54379d82902a4',
  '4-4-5': '899b96225d931baa667a9f1fc96bebe19cb7cd08a7960d2361a5d308e8591172',
  '4-4-6': 'ae9e719a686a96b89131bdc962b7971689af8602d834dc0d9824f58d258699d2',
  '4-5-1': '6cebc39959309aaf3ab9ee3c1403ec0aa9f37a32dd7dd589baa1f0634abe745f',
  '4-5-2': 'e50289c5c6d5f678da1ff4d0babb535624845ad17556791bf7f79a76a84ecff4',
  '4-5-3': '33c2ad03209fb45baeb154b48a9b3d69d91bc034dbc41882ff27280cc5a9afc8',
  '4-5-4': 'b76e0eab529d5c90e71da13588fb15639f46a07541b501a6cd36546610989c1d',
  '4-5-5': '532ec68d90dae695e0cb35eaf6b818ada7a589401bd4e05bc72611c5843b9307',
  '4-5-6': '49b5c4334bcba2c99763f433435d7c9453551fe7917b56f76d5908b61fc6f11e',
  '4-6-1': '30f5b0900ad22c70b73725e4b09fc69b7bf8d04beacdb2bc9a7aa28d2355da7b',
  '4-6-2': '5424c8120c066f9f7d6dcfb8fb516f351a7bc82265166b2605fb369c4c8c7caa',
  '4-6-3': '2e7313e47ffdb7b4804b8e5aae5bdaa03f7c7632a744557ef4b7867be34d08b9',
  '4-6-4': '94874d5041af0db03a8f11f0c7d2cb282996f226b859f85136c16341c811f057',
  '4-6-5': 'fd8b565a8602a5d182a0ab29fafea96518679346c3c8947ab1978fbd237d818a',
  '4-6-6': '0b567779f129e6e6d81acc4c8ee654839de83c3cd20abf5445062852244552e2',
  '4-7-1': '73bce51d6b874a0f1bb0f5b2bc739caf122663672be132dad38e91710088fb58',
  '4-7-2': 'd1b2b5e8f8ae69e7f20e1840d2d01b80d0424763ba38e9ef55e2a7ba9aa2f73f',
  '4-7-3': 'cdee0780dc495bfd8127054a3bab3bd0a23edef0fdeb40f517cab683a72419c5',
  '4-7-4': '27456be375f9c107d0ac83b5e278b6b3e29bcae73c366c2adf5f7b7edd3f4906',
  '4-7-5': '0af8aaff4e097518cb164de795aac9280da4282fdd2e5b1e272d6ea9170f1898',
  '4-7-6': '913db77cd5752130c8d5ddefdc7d2c00170ce45aed4799895712b2fe73c69018',
  '4-8-1': 'b1caab28f43a1aba17d72f62b7fc8eebe6f407d54859cd454bf3144c7acad74e',
  '4-8-2': '0a44be20656b226acbbc00e8f1c567f0e4f781532089d66508e8086891467c79',
  '4-8-3': '83188cf9843ddd4275dfa90905cc027385e95a8ec41b676cc42e221a9ed0ce00',
  '4-8-4': '64393005dabde2a5d7d4d56c04d7cece00115214f9a6730bc1c00b5d2b749ab8',
  '4-8-5': '20752c353492487a4461cbac710f99ae4fe20a1c16f3531009d371328a8f22c4',
  '4-8-6': '794312799ffe4ee4638ed5b2cba0571aa051a08aebd9ca15ed20e923c165f337',
  '4-9-1': 'fd60fad276f875ba2b5b375bdddc2c709294e601e5248eefb3e09358645b4a15',
  '4-9-2': 'ed2ee195e157449fe5e7efaad2e244d6f4131bb980a70fecaa801851e6c7ea6c',
  '4-9-3': '674293b56d7c6e7fb10850ccb6f60e186c5c3b8359cfdf63145e24e277ca274a',
  '4-9-4': 'e42ee4814608a4a0cb7f85339706106cdbcdd28ca8357c539a1bf3fa328f4cc4',
  '4-9-5': 'd257dc482512ce29cb4239460362c69b6f015359c94fbf06880fb78412c23cc5',
  '4-9-6': '5f68e7bca421798b702673b7c0d10fec9e53371fbbcea2f5a33a48ee8813051f',
  '4-11-1': '516a5eee57ee23757392763808cae03934667252120c47c9e82d997de89efc49',
  '4-11-2': '5e755330c165b4fa16362c6184941259ccbefcfc6014dbeb275f5fea871c0866',
  '4-11-3': 'b5ca0b4d9577503a1e3259876bbc98f5b6ea65fc1f8dbace1bf55fdbda5497b3',
  '4-11-4': '24e495934c4e9390eb1e221fb7e12c0f0346717a396dd12b29949e2b8db685ab',
  '4-11-5': 'd2fd043d6adb7b084d43573b15b2157f598d2a44b38b1c8ddfb70b06ef23ec92',
  '4-11-6': '0faa791f4d41fc2cfba380fc5d1634533be752407e1d6a8b46472f282be43092',
  '4-12-1': '26760642c80df4269ade8385d46b3e187744c9c25c67cd63115517e5d1efa4a1',
  '4-12-2': '2fda3e862246d0e92b208e39c476682f5da2d28da9211ce5cba1c3500d316dea',
  '4-12-3': '75b5a0426fa3fc4e9a774944122c1e60be5189c91340c1a136b877be4000936c',
  '4-12-4': '36454bce5c91a35a30155846a43cce14671c8892415fe75cf1cb32e57f27413c',
  '4-12-5': '54e58c8ec387416af88b657611cc17ac8cc750ba1ab7be4c1fb05128848eed5c',
  '4-12-6': '2840e8356571d025ac3caf1c24870368e3b7f996b239b7a9dd5f84d563ccfd04',
  '4-13-1': '17765bb6d0da67a3b92d78db841487776ff0b0e32ba0f3160fb289d050c6deb3',
  '4-13-2': '4b4441b6b79667bdd1fada1af52af9a20df4db35f04d7b16524b33740172b1bf',
  '4-13-3': '70df2b01ce76079df6abe6bc642e93c17200539db91afae22512dccf789c4ba7',
  '4-13-4': '149672b122ae9888637bfa5bcff047b55bd619508e6f89a517818a288e765848',
  '4-13-5': 'c184554ac40ec68dd9e16abb1f87fa842bff1a622df180c230ecd096d3423c00',
  '4-13-6': '19ddd22e212b86f5aeabc3a9d60fb2d1fe9f4d8732df5c6a787cc3866eb3d3e4',
  '4-14-1': '471fc244026228f1b7d50f13dcd545c88ad38fa67bf48e858d6bd14e986427ff',
  '4-14-2': '25e5e44f4ba539691a7417cadc03953b39eaa0b5ab47d8f17a6f26e99cf5cb92',
  '4-14-3': 'f1baf7bb5c3db2e303c661cf96a27cae6a7738b6d4bb4d60a1915c155bb32dd8',
  '4-14-4': 'a1b93ed72876d5aff6c57d19f458361b20192eefa0bb2cd5a2778d8e6f7e5118',
  '4-14-5': '940b4ecf572462c408cbf621001eb8c70b3f4ac05081b6d7ad790b43b9b21629',
  '4-14-6': 'd289a2d094a8f96070f62e0e42fca071d277a310fa29386da433d7dd800267ac',
};

// Manual fixes for placemarks whose text the parser cannot split well: route -> № -> fields
const OVERRIDES = {
  '4-3-1': {
    32: { name: 'Универсал маркет', ownerName: 'Деҳқонова Феруза' },
    27: { name: '777 Маркет', ownerName: 'Умаралиев Мамуржон' },
  },
  '4-3-4': {
    30: { name: 'Элчи маркет', ownerName: 'Элбек ака', address: '72-мактаб олди' },
  },
  '4-4-2': {
    // phone on the map has only 8 digits, kept as written
    33: { phone: '91145621', address: '' },
  },
  '4-4-6': {
    36: { name: 'Усмонов Икромжон', ownerName: 'Усмонов Икромжон', address: 'Бахт туйхона йони' },
    38: { name: 'Мини маркет (Мадумаров Алишер)', ownerName: 'Мадумаров Алишер', address: 'Кум шахар' },
    3: { name: 'Томоша махалла', address: 'Волидам маркет ёни' },
  },
  '4-5-4': {
    5: { name: 'Бархаёт ака', ownerName: 'Бархаёт ака, Орзугул опа', address: 'Кимсанобод' },
  },
  // Phones glued to the next number on the map ("91191454520-мактаб ёни")
  '4-11-3': {
    50: { name: 'Исройилива Иродахон', ownerName: 'Исройилива Иродахон', phone: '9115299424', address: '' },
    16: { name: 'Рахмонов Элйоржон', ownerName: 'Рахмонов Элйоржон', phone: '+998 91 191 45 45', address: '20-мактаб ёни' },
  },
  '4-11-5': {
    39: { name: 'Жураева Саддихон', ownerName: 'Жураева Саддихон', phone: '+998 90 292 12 40', address: '14-мактаб олди' },
  },
  '4-12-4': {
    11: { name: 'Яхшибоева Шохида', ownerName: 'Яхшибоева Шохида', address: 'Ешон махалла, паваротдан сал утиб унгда' },
  },
  '4-13-1': {
    30: { name: 'Махмудова Гузалхон', ownerName: 'Махмудова Гузалхон', address: 'Тургок махалла мфй, пункитдан утиб' },
    25: { name: 'Жураева Дилхумор', ownerName: 'Жураева Дилхумор', address: 'Ёйилма мфй, охак бозор рупараси' },
  },
  '4-13-2': {
    11: { name: 'Рахмонова Гуласал', ownerName: 'Рахмонова Гуласал', address: 'Ок олтин сентр утиб чап кулда' },
  },
  '4-14-5': {
    // phone on the map has only 8 digits, kept as written
    11: { phone: '99518638', address: 'Катта юл махалла' },
  },
  '4-14-6': {
    // phone on the map has only 8 digits, kept as written
    45: { phone: '9 854 09 96', address: 'Бордон махалласи йул буйи' },
  },
};

// Accepts "94.4908939", "+998(94)909-18-62", "91 056 28  48", "90-628-62-28"
const PHONE_RE = /(?<!\d)(?:\+?998[\s.\-]?)?\(?\d{2}\)?[\s.\-]{0,2}\d{3}[\s.\-]{0,2}\d{2}[\s.\-]{0,2}\d{2}(?!\d)/g;
const TITLE_RE = /(?<!\p{L})(опа|ака|хола|тога)(?!\p{L})/iu;
const SHOP_RE = /маркет|маркэт|market|дукон|дўкон|буфет|буфит|буфэт|озик|супер|бозорча|магнит|шашлик|магазин|савдо|чойхона/i;
// Landmark words only count as whole words, so surnames like Махмудов / Утбозоров stay names
const LANDMARK_RE =
  /(?<!\p{L})(мах|махалла\p{L}*|махала|куча\p{L}*|мактаб\p{L}*|бекат\p{L}*|мойка|масжид|йул|юл|рупараси|ёни|ёнида|олди|центр|сентир|петак|питак|бозор\p{L}*|чоррах\p{L}*|туман\p{L}*|мфй|ичи|ичида)(?!\p{L})/iu;
// "Эко Маркет сой буйи" -> name "Эко Маркет", address "сой буйи"
// "Озик овкат дукони Янги кургон махалласи" -> name "Озик овкат дукони", address "Янги кургон махалласи"
const SHOP_TAIL_RE = /^(.*?(?:маркет|маркэт|дукон|дугон|буфет|буфит|буфэт|магазин)(?:и)?)(?!\p{L})\s*[,.]?\s*(.+)$/iu;
const GENERIC_SHOP_RE = /^(мини|супер)?\s?маркет(и)?$/i;
const OFFICE_RE = /офи|склад/i;
const STAND_RE = /^(стелаж|ст)(\s*\d+)?$/i;

const formatPhone = (raw) => {
  const d = raw.replace(/\D/g, '').replace(/^998(?=\d{9}$)/, '');
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
};

const clean = (s) =>
  s
    .replace(/[_]+/g, ' ')
    .replace(/[,.\-]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,\-]+|[\s.,\-]+$/g, '')
    .trim();

// "УМИДА ОПА" -> "Умида Опа"
const titleCaseIfShouting = (s) =>
  /\p{Ll}/u.test(s) ? s : s.toLowerCase().replace(/(^|[\s.(-])(\p{L})/gu, (m, p, c) => p + c.toUpperCase());

const capitalize =(s) => s.charAt(0).toUpperCase() + s.slice(1);

async function fetchPlacemarks(mapId) {
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
  const userMap = JSON.parse(html.slice(start + key.length, i + 1));
  return userMap.features.filter((f) => f.type === 'placemark');
}

// Splits free text like "Нодира опа 95.0425442 Шашлик маркази" into name / owner / phones / address
function parsePlacemark(f) {
  let text = f.title || '';
  let stand = '';
  // Stands ("СТЕЛАЖ") keep the real info in the subtitle
  if (STAND_RE.test(text.trim())) {
    stand = capitalize(text.trim().toLowerCase().replace(/^ст(?!\p{L})/u, 'стелаж'));
    text = f.subtitle || '';
  }

  const phones = (text.match(PHONE_RE) || []).map(formatPhone);
  const segments = text
    .replace(PHONE_RE, '\n')
    .split('\n')
    .flatMap((seg) => {
      // "Жамшид ака Шукрона маркет" -> ["Жамшид ака", "Шукрона маркет"]
      const m = seg.match(TITLE_RE);
      if (!m) return [seg];
      const cut = m.index + m[0].length;
      return [seg.slice(0, cut), seg.slice(cut)];
    })
    .map(clean)
    .map(titleCaseIfShouting)
    .filter(Boolean);

  let shop = '';
  let owner = '';
  const rest = [];
  segments.forEach((seg, idx) => {
    if (!shop && SHOP_RE.test(seg)) {
      // A bare "Маркет" / "Мини маркет" is not a name, keep the whole text then
      const match = seg.match(SHOP_TAIL_RE);
      // "Гушт дукон ёни" is a landmark, not a shop name: don't split off a lone "ёни" / "олди"
      const loneLandmark = match && /^(ёни|ёнида|йони|олди|рупараси|ёнбоши)$/i.test(clean(match[2]));
      const tail = match && !loneLandmark && (owner || !GENERIC_SHOP_RE.test(clean(match[1]))) ? match : null;
      shop = tail ? clean(tail[1]) : seg;
      if (tail) {
        const after = clean(tail[2]);
        // "Уч юлдуз маркет Дадахон ака" -> owner "Дадахон ака"
        if (!owner && TITLE_RE.test(after)) owner = after;
        else rest.push(after);
      }
    } else if (!owner && (TITLE_RE.test(seg) || (idx === 0 && !LANDMARK_RE.test(seg))))
      owner = seg;
    else rest.push(seg);
  });

  let name = shop || owner || rest[0] || '';
  if (shop && owner && GENERIC_SHOP_RE.test(shop)) name = `${capitalize(shop)} (${owner})`;
  const address = rest.join(', ') || (!shop && !owner ? name : '');

  return { name: capitalize(name), ownerName: owner, phone: phones.join(', '), address, notes: stand };
}

async function importRoute(route, mapId, dry) {
  const [lineCode, day] = [route.replace(/-\d$/, ''), Number(route.slice(-1))];
  const placemarks = await fetchPlacemarks(mapId);

  const labelOf = (f) => {
    const label = f.content && f.content.text;
    return label && /^\d+$/.test(label) ? Number(label) : null;
  };
  const labels = new Set(placemarks.map(labelOf).filter((n) => n != null));

  const clients = [];
  let prevNum = labels.size ? Math.max(...labels) + 1 : 1000;
  for (const f of placemarks) {
    const raw = [f.title, f.subtitle, f.caption].join(' ');
    if (OFFICE_RE.test(raw) && !/\d{5}/.test(raw)) continue;
    // Unnumbered placemarks sit between their neighbours (list is ordered high -> low).
    // If the next number is already taken on the map, use a half step (shown as "30a").
    let num = labelOf(f);
    if (num == null) num = labels.has(Math.floor(prevNum) - 1) || !Number.isInteger(prevNum) ? Math.floor(prevNum) - 0.5 : prevNum - 1;
    prevNum = num;

    const parsed = { ...parsePlacemark(f), ...((OVERRIDES[route] || {})[num] || {}) };
    clients.push({
      id: `ym_${route}_${num}`,
      num,
      ...parsed,
      latitude: f.coordinates[1],
      longitude: f.coordinates[0],
      lineCode,
      day,
    });
  }

  const nums = clients.map((c) => c.num);
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (dupes.length) throw new Error(`${route}: duplicate numbers ${dupes.join(', ')}`);

  if (dry) {
    if (process.env.DRY_JSON) require('fs').appendFileSync(process.env.DRY_JSON, JSON.stringify({ route, clients }) + '\n');
    console.log(`\n=== ${route} (${clients.length})`);
    clients.forEach((c) =>
      console.log([c.num, c.name, c.ownerName || '—', c.phone || '—', c.address || '—', c.notes].filter((x) => x !== '').join(' | '))
    );
    return;
  }

  const post = (path, body) =>
    fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());

  await post('/lines', { code: lineCode });
  // Replace the route's previous import so removed map points disappear too
  const existing = await fetch(`${API}/clients?line=${lineCode}&day=${day}`).then((r) => r.json());
  const keep = new Set(clients.map((c) => c.id));
  for (const c of existing.clients || []) {
    if (c.id.startsWith('ym_') && !keep.has(c.id)) {
      await fetch(`${API}/clients/${c.id}`, { method: 'DELETE' });
    }
  }
  const res = await post('/clients/import', clients);
  console.log(`${route}: ${clients.length} shops (${res.added} new)`);
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const only = args.filter((a) => !a.startsWith('--'));
  for (const [route, mapId] of Object.entries(ROUTES)) {
    if (only.length && !only.includes(route)) continue;
    await importRoute(route, mapId, dry);
  }
}

main().catch((e) => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
