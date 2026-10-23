import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Plus, Save, Search, Tags, Trash2 } from 'lucide-react';
import { PackagingUnit, PriceList, Product } from '../../types';
import { Button, Card, EmptyState, Field, Pill, SearchInput, Table, Td, Th, fieldBase, formatSum } from '../../components/ui';
import { COMMON, Tri, UNIT_LABELS, fmt, useL } from '../../i18n/tri';
import { API, apiFetch } from '../../api';

const T = {
  title: { uz: 'Narx turlari', uz_cyrl: 'Нарх турлари', ru: 'Типы цен' },
  hint: {
    uz: 'Doʻkonga narx turi biriktirilsa, agent ilovasida shu narxlar ishlatiladi. Boʻsh katak: asosiy narx.',
    uz_cyrl: 'Дўконга нарх тури бириктирилса, агент иловасида шу нархлар ишлатилади. Бўш катак: асосий нарх.',
    ru: 'Если магазину назначен тип цен, в приложении агента используются эти цены. Пустая ячейка: базовая цена.',
  },
  newList: { uz: 'Yangi narx turi', uz_cyrl: 'Янги нарх тури', ru: 'Новый тип цен' },
  noLists: { uz: 'Hali narx turi yoʻq', uz_cyrl: 'Ҳали нарх тури йўқ', ru: 'Типов цен пока нет' },
  noListsHint: {
    uz: 'Masalan: "Ulgurji" yoki "Supermarket" narxlari',
    uz_cyrl: 'Масалан: "Улгуржи" ёки "Супермаркет" нархлари',
    ru: 'Например: цены «Опт» или «Супермаркет»',
  },
  pickList: { uz: 'Narx turini tanlang', uz_cyrl: 'Нарх турини танланг', ru: 'Выберите тип цен' },
  pickListHint: {
    uz: 'Chapdagi roʻyxatdan tanlang yoki yangisini yarating',
    uz_cyrl: 'Чапдаги рўйхатдан танланг ёки янгисини яратинг',
    ru: 'Выберите в списке слева или создайте новый',
  },
  name: { uz: 'Nomi', uz_cyrl: 'Номи', ru: 'Название' },
  namePlaceholder: { uz: 'Ulgurji', uz_cyrl: 'Улгуржи', ru: 'Опт' },
  nProducts: { uz: '{n} ta tovarda oʻz narxi', uz_cyrl: '{n} та товарда ўз нархи', ru: 'Свои цены: {n} товаров' },
  noOwn: { uz: 'Hamma narx asosiy', uz_cyrl: 'Ҳамма нарх асосий', ru: 'Все цены базовые' },
  product: { uz: 'Tovar', uz_cyrl: 'Товар', ru: 'Товар' },
  search: { uz: 'Tovar nomi yoki kodi', uz_cyrl: 'Товар номи ёки коди', ru: 'Название или код товара' },
  delete: { uz: 'Oʻchirish', uz_cyrl: 'Ўчириш', ru: 'Удалить' },
  deleteConfirm: {
    uz: '"{name}" narx turi oʻchirilsinmi? Unga biriktirilgan doʻkonlar asosiy narxga qaytadi.',
    uz_cyrl: '"{name}" нарх тури ўчирилсинми? Унга бириктирилган дўконлар асосий нархга қайтади.',
    ru: 'Удалить тип цен «{name}»? Магазины на нём вернутся к базовым ценам.',
  },
  discard: {
    uz: 'Saqlanmagan oʻzgarishlar yoʻqoladi. Davom etilsinmi?',
    uz_cyrl: 'Сақланмаган ўзгаришлар йўқолади. Давом этилсинми?',
    ru: 'Несохранённые изменения будут потеряны. Продолжить?',
  },
  errName: { uz: 'Narx turi nomini kiriting', uz_cyrl: 'Нарх тури номини киритинг', ru: 'Введите название типа цен' },
  errPrice: {
    uz: 'Narxlar musbat son boʻlishi kerak: {name}',
    uz_cyrl: 'Нархлар мусбат сон бўлиши керак: {name}',
    ru: 'Цены должны быть положительными числами: {name}',
  },
  saveError: { uz: 'Saqlashda xatolik yuz berdi', uz_cyrl: 'Сақлашда хатолик юз берди', ru: 'Ошибка при сохранении' },
  deleteError: { uz: 'Oʻchirib boʻlmadi', uz_cyrl: 'Ўчириб бўлмади', ru: 'Не удалось удалить' },
  loadError: { uz: 'Narx turlarini yuklab boʻlmadi', uz_cyrl: 'Нарх турларини юклаб бўлмади', ru: 'Не удалось загрузить типы цен' },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
  saved: { uz: 'Saqlandi', uz_cyrl: 'Сақланди', ru: 'Сохранено' },
  basePrice: { uz: 'Asosiy narx: {sum}', uz_cyrl: 'Асосий нарх: {sum}', ru: 'Базовая цена: {sum}' },
  nothingFound: { uz: 'Hech narsa topilmadi', uz_cyrl: 'Ҳеч нарса топилмади', ru: 'Ничего не найдено' },
  noProducts: { uz: 'Hali tovar qoʻshilmagan', uz_cyrl: 'Ҳали товар қўшилмаган', ru: 'Товары ещё не добавлены' },
} satisfies Record<string, Tri>;

const UNITS: PackagingUnit[] = ['dona', 'blok', 'korobka', 'kg'];

export const basePrice = (p: Product, unit: PackagingUnit) =>
  ({ dona: p.priceDona, blok: p.priceBlok, korobka: p.priceKorobka, kg: p.priceKg })[unit] || 0;

type DraftPrices = Record<string, Partial<Record<PackagingUnit, string>>>;
interface Draft {
  id?: string;
  name: string;
  prices: DraftPrices;
}

const toDraft = (l: PriceList): Draft => {
  const prices: DraftPrices = {};
  for (const [pid, row] of Object.entries(l.prices || {})) {
    prices[pid] = {};
    for (const u of UNITS) if (row[u] != null) prices[pid][u] = String(row[u]);
  }
  return { id: l.id, name: l.name, prices };
};

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/\s/g, '')));

const ownCount = (l: PriceList) => Object.values(l.prices || {}).filter((row) => Object.keys(row).length > 0).length;

const send = async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
  const res = await apiFetch(`${API}${path}`, {
    method,
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

export const PriceListsView: React.FC<{ products: Product[] }> = ({ products }) => {
  const L = useL();
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    apiFetch(`${API}/price-lists`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => alive && setLists(Array.isArray(d.priceLists) ? d.priceLists : []))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? sorted.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) : sorted;
  }, [sorted, search]);

  const open = (next: Draft) => {
    if (dirty && !window.confirm(L(T.discard))) return;
    setDraft(next);
    setDirty(false);
    setError('');
    setSavedAt(0);
  };

  const setPrice = (pid: string, unit: PackagingUnit, value: string) => {
    setDraft((d) => (d ? { ...d, prices: { ...d.prices, [pid]: { ...d.prices[pid], [unit]: value } } } : d));
    setDirty(true);
    setError('');
  };

  const save = async () => {
    if (!draft || saving) return;
    const name = draft.name.trim();
    if (!name) return setError(L(T.errName));
    const prices: PriceList['prices'] = {};
    for (const p of products) {
      const row = draft.prices[p.id];
      if (!row) continue;
      const clean: Partial<Record<PackagingUnit, number>> = {};
      for (const u of UNITS) {
        const raw = row[u];
        if (raw == null || raw.trim() === '') continue;
        const v = num(raw);
        if (!Number.isFinite(v) || v <= 0) return setError(fmt(L(T.errPrice), { name: p.name }));
        clean[u] = Math.round(v);
      }
      if (Object.keys(clean).length) prices[p.id] = clean;
    }
    setSaving(true);
    setError('');
    try {
      const d = await send('/price-lists', 'POST', { ...(draft.id ? { id: draft.id } : {}), name, prices });
      const next: PriceList[] = Array.isArray(d.priceLists) ? d.priceLists : [];
      setLists(next);
      // A new list is appended by the server
      const saved = draft.id ? next.find((l) => l.id === draft.id) : next[next.length - 1];
      if (saved) setDraft(toDraft(saved));
      setDirty(false);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : L(T.saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (l: PriceList) => {
    if (!window.confirm(fmt(L(T.deleteConfirm), { name: l.name }))) return;
    try {
      const d = await send(`/price-lists/${encodeURIComponent(l.id)}`, 'DELETE');
      setLists(Array.isArray(d.priceLists) ? d.priceLists : lists.filter((x) => x.id !== l.id));
      if (draft?.id === l.id) {
        setDraft(null);
        setDirty(false);
      }
    } catch (e) {
      window.alert(e instanceof Error && e.message ? e.message : L(T.deleteError));
    }
  };

  const current = draft?.id ? lists.find((l) => l.id === draft.id) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">
      {/* Lists */}
      <Card padded={false} className="p-3 space-y-2">
        <div className="px-2 pt-1 pb-1 text-[15px] font-bold text-ink-900">{L(T.title)}</div>
        {loading ? (
          <div className="py-8 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
        ) : failed ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl2 bg-rose-50 text-sm text-rose-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {L(T.loadError)}
          </div>
        ) : lists.length === 0 ? (
          <div className="px-2 py-3 text-[13px] text-ink-400">{L(T.noListsHint)}</div>
        ) : (
          lists.map((l) => {
            const n = ownCount(l);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => draft?.id !== l.id && open(toDraft(l))}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-xl2 transition',
                  draft?.id === l.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-ink-100/70'
                )}
              >
                <div className="font-semibold text-ink-900 truncate">{l.name}</div>
                <div className="text-xs text-ink-400">{n > 0 ? fmt(L(T.nProducts), { n }) : L(T.noOwn)}</div>
              </button>
            );
          })
        )}
        <Button
          icon={Plus}
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={failed}
          onClick={() => open({ name: '', prices: {} })}
        >
          {L(T.newList)}
        </Button>
      </Card>

      {/* Editor */}
      <Card padded={false} className="p-3 md:p-4">
        {!draft ? (
          <EmptyState
            icon={Tags}
            title={lists.length === 0 && !loading ? L(T.noLists) : L(T.pickList)}
            hint={lists.length === 0 && !loading ? L(T.hint) : L(T.pickListHint)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 px-1">
              <div className="flex-1 min-w-[220px] max-w-sm">
                <Field
                  label={L(T.name)}
                  placeholder={L(T.namePlaceholder)}
                  value={draft.name}
                  maxLength={60}
                  autoFocus={!draft.id}
                  onChange={(e) => {
                    setDraft({ ...draft, name: e.target.value });
                    setDirty(true);
                    setError('');
                  }}
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                {savedAt > 0 && !dirty ? <Pill tone="green">{L(T.saved)}</Pill> : null}
                {current ? (
                  <Button variant="danger" icon={Trash2} onClick={() => remove(current)} disabled={saving}>
                    {L(T.delete)}
                  </Button>
                ) : null}
                <Button icon={Save} onClick={save} disabled={saving}>
                  {saving ? L(T.saving) : L(COMMON.save)}
                </Button>
              </div>
            </div>
            <div className="px-1 text-[13px] text-ink-400">{L(T.hint)}</div>

            {error ? (
              <div className="flex items-start gap-2 mx-1 px-4 py-3 rounded-xl2 bg-rose-50 text-rose-600 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">{error}</span>
              </div>
            ) : null}

            <SearchInput icon={Search} value={search} onChange={setSearch} placeholder={L(T.search)} className="max-w-md" />

            {visible.length === 0 ? (
              <EmptyState icon={Search} title={products.length === 0 ? L(T.noProducts) : L(T.nothingFound)} />
            ) : (
              <Table className="min-w-[820px]">
                <thead>
                  <tr>
                    <Th>{L(T.product)}</Th>
                    {UNITS.map((u) => (
                      <Th key={u} align="right" className="w-[150px]">
                        <span className="capitalize">{L(UNIT_LABELS[u])}</span>
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className="hover:bg-ink-100/40 transition">
                      <Td className="max-w-[280px]">
                        <div className="font-semibold text-ink-900 truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-xs text-ink-400 font-mono">{p.code}</div>
                      </Td>
                      {UNITS.map((u) => {
                        const base = basePrice(p, u);
                        const raw = draft.prices[p.id]?.[u] ?? '';
                        const v = num(raw);
                        const diff = base > 0 && v > 0 ? Math.round(((v - base) / base) * 1000) / 10 : null;
                        return (
                          <Td key={u} align="right" className="!py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={raw}
                              placeholder={base > 0 ? formatSum(base) : '—'}
                              title={fmt(L(T.basePrice), { sum: base > 0 ? formatSum(base) : '—' })}
                              onChange={(e) => setPrice(p.id, u, e.target.value)}
                              className={clsx(fieldBase, '!h-9 !px-3 text-right tabular-nums', raw.trim() && 'font-semibold !bg-brand-50/60')}
                            />
                            {diff != null && diff !== 0 ? (
                              <div className={clsx('mt-0.5 text-[11px] tabular-nums', diff < 0 ? 'text-emerald-600' : 'text-amber-600')}>
                                {diff > 0 ? '+' : '−'}
                                {Math.abs(diff)}%
                              </div>
                            ) : null}
                          </Td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
