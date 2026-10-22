import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, Ban, CreditCard, MapPin, Pencil, Route, Search, Store, Wallet } from 'lucide-react';
import { Client, Line } from '../types';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  Money,
  Pill,
  SearchInput,
  Segmented,
  Select,
  Table,
  Td,
  Th,
  formatSum,
} from '../components/ui';
import { useToday } from '../hooks/useNow';
import { formatDate, weekdayOf } from '../utils/format';
import { COMMON, Tri, WEEKDAY_LABELS, WEEKDAY_SHORT, fmt, useL } from '../i18n/tri';
import { useLanguage } from '../context/LanguageContext';
import { API, apiFetch } from '../api';

const DAYS = [1, 2, 3, 4, 5, 6].map((day) => ({ day, short: WEEKDAY_SHORT[day], label: WEEKDAY_LABELS[day] }));

const T = {
  linesLoadError: {
    uz: 'Liniyalarni yuklab boʻlmadi. Birozdan soʻng sahifani yangilang.',
    uz_cyrl: 'Линияларни юклаб бўлмади. Бироздан сўнг саҳифани янгиланг.',
    ru: 'Не удалось загрузить линии. Обновите страницу чуть позже.',
  },
  shopsLoadError: {
    uz: 'Marshrut doʻkonlarini yuklab boʻlmadi. Qaytadan urinib koʻring.',
    uz_cyrl: 'Маршрут дўконларини юклаб бўлмади. Қайтадан уриниб кўринг.',
    ru: 'Не удалось загрузить магазины маршрута. Попробуйте ещё раз.',
  },
  paymentSaveError: {
    uz: 'Toʻlovni saqlab boʻlmadi. Qaytadan urinib koʻring.',
    uz_cyrl: 'Тўловни сақлаб бўлмади. Қайтадан уриниб кўринг.',
    ru: 'Не удалось сохранить оплату. Попробуйте ещё раз.',
  },
  pickLineOption: { uz: 'Liniyani tanlang', uz_cyrl: 'Линияни танланг', ru: 'Выберите линию' },
  lineName: { uz: '{code} liniya', uz_cyrl: '{code} линия', ru: 'Линия {code}' },
  searchPlaceholder: {
    uz: 'Nomi, egasi, telefon yoki manzil',
    uz_cyrl: 'Номи, эгаси, телефон ёки манзил',
    ru: 'Название, владелец, телефон или адрес',
  },
  pickDayForLine: {
    uz: '{code} liniya uchun hafta kunini tanlang',
    uz_cyrl: '{code} линия учун ҳафта кунини танланг',
    ru: 'Выберите день недели для линии {code}',
  },
  pickLineAndDay: { uz: 'Liniya va hafta kunini tanlang', uz_cyrl: 'Линия ва ҳафта кунини танланг', ru: 'Выберите линию и день недели' },
  pickHint: {
    uz: 'Doʻkonlar marshrut boʻyicha koʻrsatiladi: avval liniyani, soʻng hafta kunini tanlang.',
    uz_cyrl: 'Дўконлар маршрут бўйича кўрсатилади: аввал линияни, сўнг ҳафта кунини танланг.',
    ru: 'Магазины показываются по маршруту: сначала выберите линию, затем день недели.',
  },
  shopCount: { uz: '{n} ta doʻkon', uz_cyrl: '{n} та дўкон', ru: 'Магазинов: {n}' },
  routeDebt: { uz: 'Qarz: {sum} soʻm • {n} ta', uz_cyrl: 'Қарз: {sum} сўм • {n} та', ru: 'Долг: {sum} сум • {n}' },
  noDebt: { uz: 'Qarz yoʻq', uz_cyrl: 'Қарз йўқ', ru: 'Долгов нет' },
  found: { uz: 'Topildi: {n} ta', uz_cyrl: 'Топилди: {n} та', ru: 'Найдено: {n}' },
  notFound: {
    uz: 'Qidiruv boʻyicha doʻkon topilmadi',
    uz_cyrl: 'Қидирув бўйича дўкон топилмади',
    ru: 'По запросу магазины не найдены',
  },
  emptyRoute: { uz: 'Bu marshrutda doʻkonlar yoʻq', uz_cyrl: 'Бу маршрутда дўконлар йўқ', ru: 'На этом маршруте нет магазинов' },
  tryOther: { uz: 'Boshqa soʻz bilan qidirib koʻring.', uz_cyrl: 'Бошқа сўз билан қидириб кўринг.', ru: 'Попробуйте другой запрос.' },
  clearSearch: { uz: 'Qidiruvni tozalash', uz_cyrl: 'Қидирувни тозалаш', ru: 'Очистить поиск' },
  shopName: { uz: 'Doʻkon nomi', uz_cyrl: 'Дўкон номи', ru: 'Название магазина' },
  fullName: { uz: 'Ism-familiya', uz_cyrl: 'Исм-фамилия', ru: 'Имя и фамилия' },
  address: { uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' },
  openMap: { uz: 'Xaritada ochish', uz_cyrl: 'Харитада очиш', ru: 'Открыть на карте' },
  acceptPayment: { uz: 'Toʻlov qabul qilish', uz_cyrl: 'Тўлов қабул қилиш', ru: 'Принять оплату' },
  savePayment: { uz: 'Toʻlovni saqlash', uz_cyrl: 'Тўловни сақлаш', ru: 'Сохранить оплату' },
  currentDebt: { uz: 'Joriy qarz', uz_cyrl: 'Жорий қарз', ru: 'Текущий долг' },
  paymentAmount: { uz: 'Toʻlov summasi', uz_cyrl: 'Тўлов суммаси', ru: 'Сумма оплаты' },
  debtClosed: { uz: 'Qarz toʻliq yopiladi', uz_cyrl: 'Қарз тўлиқ ёпилади', ru: 'Долг будет погашен полностью' },
  remainingDebt: { uz: 'Qoladigan qarz: {sum} soʻm', uz_cyrl: 'Қоладиган қарз: {sum} сўм', ru: 'Остаток долга: {sum} сум' },
  fullDebt: { uz: 'Toʻliq qarz', uz_cyrl: 'Тўлиқ қарз', ru: 'Весь долг' },
  half: { uz: 'Yarmi', uz_cyrl: 'Ярми', ru: 'Половина' },
  days: { uz: '{n} kun', uz_cyrl: '{n} кун', ru: '{n} дн.' },
  debtAgeTitle: { uz: 'Qarz {date} dan beri', uz_cyrl: 'Қарз {date} дан бери', ru: 'Долг с {date}' },
  overdue: { uz: 'Muddati oʻtgan', uz_cyrl: 'Муддати ўтган', ru: 'Просрочен' },
  overLimit: { uz: 'Limitdan oshgan', uz_cyrl: 'Лимитдан ошган', ru: 'Превышен лимит' },
  limit: { uz: 'Limit', uz_cyrl: 'Лимит', ru: 'Лимит' },
  noLimit: { uz: 'limitsiz', uz_cyrl: 'лимитсиз', ru: 'без лимита' },
  left: { uz: 'qoldi {sum}', uz_cyrl: 'қолди {sum}', ru: 'осталось {sum}' },
  blocked: { uz: 'Bloklangan', uz_cyrl: 'Блокланган', ru: 'Заблокированы' },
  blockedHint: {
    uz: 'Limitdan oshgan yoki qarz muddati oʻtgan: yangi nasiya berilmaydi',
    uz_cyrl: 'Лимитдан ошган ёки қарз муддати ўтган: янги насия берилмайди',
    ru: 'Превышен лимит или просрочен долг: новый долг не выдаётся',
  },
  noBlocked: { uz: 'Bloklangan doʻkon yoʻq', uz_cyrl: 'Блокланган дўкон йўқ', ru: 'Заблокированных магазинов нет' },
  editLimit: { uz: 'Qarz limitini oʻzgartirish', uz_cyrl: 'Қарз лимитини ўзгартириш', ru: 'Изменить лимит долга' },
  limitDefault: { uz: 'Standart limit', uz_cyrl: 'Стандарт лимит', ru: 'Стандартный лимит' },
  limitOwn: { uz: 'Oʻz limiti', uz_cyrl: 'Ўз лимити', ru: 'Свой лимит' },
  limitNone: { uz: 'Limitsiz', uz_cyrl: 'Лимитсиз', ru: 'Без лимита' },
  limitDefaultHint: {
    uz: 'Sozlamalardagi umumiy limit: {value}',
    uz_cyrl: 'Созламалардаги умумий лимит: {value}',
    ru: 'Общий лимит из настроек: {value}',
  },
  limitNoneHint: {
    uz: 'Bu doʻkonga summa boʻyicha cheklov qoʻyilmaydi (muddat nazorati qoladi)',
    uz_cyrl: 'Бу дўконга сумма бўйича чеклов қўйилмайди (муддат назорати қолади)',
    ru: 'Ограничения по сумме не будет (контроль срока остаётся)',
  },
  limitAmount: { uz: 'Limit summasi', uz_cyrl: 'Лимит суммаси', ru: 'Сумма лимита' },
  errLimit: { uz: 'Limit 0 dan katta son boʻlishi kerak', uz_cyrl: 'Лимит 0 дан катта сон бўлиши керак', ru: 'Лимит должен быть больше 0' },
  limitSaveError: {
    uz: 'Limitni saqlab boʻlmadi. Qaytadan urinib koʻring.',
    uz_cyrl: 'Лимитни сақлаб бўлмади. Қайтадан уриниб кўринг.',
    ru: 'Не удалось сохранить лимит. Попробуйте ещё раз.',
  },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
} satisfies Record<string, Tri>;

type LimitMode = 'default' | 'own' | 'none';

// Route day of a Tashkent date: 1 = Dushanba ... 6 = Shanba, null on Sunday
const routeDayOf = (day: string) => weekdayOf(day) || null;

/** Shop number: 30 -> "30", 30.5 -> "30a" */
const formatNum = (n?: number) => (n == null ? '—' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}a`);

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

interface ClientsProps {
  initialRoute?: { line: string; day: number } | null;
  highlightShopId?: string;
}

export const Clients: React.FC<ClientsProps> = ({ initialRoute, highlightShopId }) => {
  const L = useL();
  const { lang } = useLanguage();
  const today = routeDayOf(useToday()); // live: switches at midnight
  const [lines, setLines] = useState<Line[]>([]);
  const [line, setLine] = useState(initialRoute?.line || '');
  const [day, setDay] = useState<number>(initialRoute?.day || 0);
  const [shops, setShops] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Tri | null>(null);
  const [search, setSearch] = useState('');

  const [paymentShop, setPaymentShop] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const [blockedOnly, setBlockedOnly] = useState(false);
  const [defaultLimit, setDefaultLimit] = useState(0); // from settings, 0 = no limit
  const [limitShop, setLimitShop] = useState<Client | null>(null);
  const [limitMode, setLimitMode] = useState<LimitMode>('default');
  const [limitValue, setLimitValue] = useState('');
  const [limitError, setLimitError] = useState<Tri | null>(null);
  const [limitSaving, setLimitSaving] = useState(false);

  const [highlightId, setHighlightId] = useState(highlightShopId || '');
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  useEffect(() => {
    apiFetch(`${API}/lines`)
      .then((r) => r.json())
      .then((d) => setLines(d.lines || []))
      .catch(() => setError(T.linesLoadError));
    apiFetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => setDefaultLimit(Number(d.settings?.creditLimitDefault) || 0))
      .catch(() => {});
  }, []);

  const isRouteSelected = Boolean(line && day);

  // Reload the route every time it is opened so debts synced from the mobile app are current
  useEffect(() => {
    setSearch('');
    if (!line || !day) {
      setShops([]);
      return;
    }
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/clients?line=${encodeURIComponent(line)}&day=${day}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setShops(d.clients || []);
        setError(null);
      })
      .catch(() => alive && setError(T.shopsLoadError))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [line, day]);

  const routeShops = useMemo(() => [...shops].sort((a, b) => (a.num ?? 0) - (b.num ?? 0)), [shops]);

  const blockedCount = useMemo(() => shops.filter((c) => c.creditBlocked).length, [shops]);

  const visibleShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = blockedOnly ? routeShops.filter((c) => c.creditBlocked) : routeShops;
    if (!q) return base;
    const qDigits = q.replace(/\s/g, '');
    return base.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ownerName || '').toLowerCase().includes(q) ||
        (c.phone || '').replace(/\s/g, '').includes(qDigits) ||
        (c.address || '').toLowerCase().includes(q) ||
        formatNum(c.num) === q
    );
  }, [routeShops, search, blockedOnly]);

  const routeDebt = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const c of shops) {
      if ((c.debtBalance || 0) > 0) {
        sum += c.debtBalance!;
        count += 1;
      }
    }
    return { sum, count };
  }, [shops]);

  // Bring the shop picked from the global search into view once its route has loaded (once)
  const scrolledTo = useRef('');
  useEffect(() => {
    if (!highlightId || loading || scrolledTo.current === highlightId) return;
    const row = rowRefs.current.get(highlightId);
    if (!row) return;
    scrolledTo.current = highlightId;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading, visibleShops]);

  const openRoute = (code: string, d?: number) => {
    setLine(code);
    setDay(d ?? (day || today || 1));
    setHighlightId('');
  };

  const openPayment = (c: Client) => {
    setPaymentShop(c);
    setPayAmount(String(c.debtBalance || ''));
  };

  const closePayment = () => {
    setPaymentShop(null);
    setPayAmount('');
  };

  const handleConfirmPayment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const amount = Number(payAmount);
    // A second Enter while saving must not take the payment off twice
    if (paying || !paymentShop || !(amount > 0)) return;
    setPaying(true);
    try {
      const res = await apiFetch(`${API}/payments/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The id lets the server ignore a repeated request for the same payment
        body: JSON.stringify({ id: `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, shopId: paymentShop.id, amount }),
      }).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
      if (res.shop) setShops((prev) => prev.map((c) => (c.id === res.shop.id ? { ...c, ...res.shop } : c)));
      setError(null);
      closePayment();
    } catch {
      setError(T.paymentSaveError);
    } finally {
      setPaying(false);
    }
  };

  // The server sends the effective limit only, so the mode is guessed from the settings default
  const openLimit = (c: Client) => {
    const lim = c.creditLimit || 0;
    const mode: LimitMode = lim === defaultLimit ? 'default' : lim === 0 ? 'none' : 'own';
    setLimitShop(c);
    setLimitMode(mode);
    setLimitValue(lim > 0 ? String(lim) : '');
    setLimitError(null);
  };

  const closeLimit = () => {
    if (limitSaving) return;
    setLimitShop(null);
  };

  const handleSaveLimit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (limitSaving || !limitShop) return;
    let creditLimit: number | null = null;
    if (limitMode === 'none') creditLimit = 0;
    else if (limitMode === 'own') {
      creditLimit = Number(limitValue.replace(/\s/g, ''));
      if (!(creditLimit > 0)) return setLimitError(T.errLimit);
    }
    setLimitSaving(true);
    setLimitError(null);
    try {
      const res = await apiFetch(`${API}/clients/${encodeURIComponent(limitShop.id)}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditLimit }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      if (d.shop) setShops((prev) => prev.map((c) => (c.id === d.shop.id ? { ...c, ...d.shop } : c)));
      setLimitShop(null);
    } catch {
      setLimitError(T.limitSaveError);
    } finally {
      setLimitSaving(false);
    }
  };

  const currentDebt = paymentShop?.debtBalance || 0;
  const amountNum = Number(payAmount) || 0;
  const dayLabel = DAYS.find((d) => d.day === day)?.label;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">
          <AlertCircle className="w-[18px] h-[18px] shrink-0" />
          <span className="min-w-0">{L(error)}</span>
        </div>
      )}

      {/* Route toolbar: stays on top while scrolling the shops */}
      <div className="sticky top-0 z-10 -mx-1 px-1 pt-1 pb-1 bg-canvas">
        <Card padded={false} className="p-3 flex flex-wrap items-center gap-3">
          <Select
            value={line}
            onChange={(e) => {
              setLine(e.target.value);
              if (e.target.value && !day) setDay(today || 1);
              setHighlightId('');
            }}
            className="w-[170px] font-semibold"
            aria-label={L(COMMON.line)}
          >
            <option value="">{L(T.pickLineOption)}</option>
            {lines.map((l) => (
              <option key={l.id} value={l.code}>
                {fmt(L(T.lineName), { code: l.code })}
              </option>
            ))}
          </Select>

          <Segmented
            value={day}
            onChange={(d) => {
              setDay(d);
              setHighlightId('');
            }}
            options={DAYS.map((d) => ({
              key: d.day,
              label: (
                <span title={L(d.label)}>
                  <span className="xl:hidden">{L(d.short)}</span>
                  <span className="hidden xl:inline">{L(d.label)}</span>
                  {d.day === today ? <span className="ml-1 opacity-70">•</span> : null}
                </span>
              ),
            }))}
          />

          <SearchInput
            icon={Search}
            value={search}
            onChange={setSearch}
            placeholder={L(T.searchPlaceholder)}
            className="flex-1 min-w-[220px]"
          />
        </Card>
      </div>

      {!isRouteSelected ? (
        <Card>
          <EmptyState
            icon={Route}
            title={line ? fmt(L(T.pickDayForLine), { code: line }) : L(T.pickLineAndDay)}
            hint={L(T.pickHint)}
            action={
              lines.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {lines.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => openRoute(l.code)}
                      className={clsx(
                        'h-9 px-4 rounded-full text-[13px] font-semibold tabular-nums transition',
                        l.code === line ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500 hover:bg-brand-100'
                      )}
                    >
                      {l.code}
                    </button>
                  ))}
                </div>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Route summary */}
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="brand" className="text-[13px] px-3 py-1.5">
              <Route className="w-3.5 h-3.5" />
              {line}-{day}
            </Pill>
            <Pill className="text-[13px] px-3 py-1.5">{dayLabel ? L(dayLabel) : null}</Pill>
            <Pill className="text-[13px] px-3 py-1.5">
              <Store className="w-3.5 h-3.5" />
              {fmt(L(T.shopCount), { n: routeShops.length })}
            </Pill>
            {routeDebt.sum > 0 ? (
              <Pill tone="red" className="text-[13px] px-3 py-1.5">
                <Wallet className="w-3.5 h-3.5" />
                {fmt(L(T.routeDebt), { sum: formatSum(routeDebt.sum), n: routeDebt.count })}
              </Pill>
            ) : (
              <Pill tone="green" className="text-[13px] px-3 py-1.5">
                {L(T.noDebt)}
              </Pill>
            )}
            {blockedCount > 0 || blockedOnly ? (
              <button
                type="button"
                onClick={() => setBlockedOnly((v) => !v)}
                aria-pressed={blockedOnly}
                title={L(T.blockedHint)}
                className={clsx(
                  'inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold whitespace-nowrap transition',
                  blockedOnly ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                )}
              >
                <Ban className="w-3.5 h-3.5" />
                {L(T.blocked)}: {blockedCount}
              </button>
            ) : null}
            {(search || blockedOnly) && (
              <span className="ml-auto text-[13px] text-ink-400 tabular-nums">{fmt(L(T.found), { n: visibleShops.length })}</span>
            )}
          </div>

          <Card padded={false} className="p-3 md:p-4">
            {loading && shops.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
            ) : visibleShops.length === 0 ? (
              <EmptyState
                icon={search ? Search : blockedOnly ? Ban : Store}
                title={search ? L(T.notFound) : blockedOnly ? L(T.noBlocked) : L(T.emptyRoute)}
                hint={search ? L(T.tryOther) : undefined}
                action={
                  search ? (
                    <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                      {L(T.clearSearch)}
                    </Button>
                  ) : blockedOnly ? (
                    <Button variant="secondary" size="sm" onClick={() => setBlockedOnly(false)}>
                      {L(COMMON.all)}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th align="center" className="w-14">
                      №
                    </Th>
                    <Th>{L(T.shopName)}</Th>
                    <Th>{L(T.fullName)}</Th>
                    <Th>{L(COMMON.phone)}</Th>
                    <Th>{L(T.address)}</Th>
                    <Th align="right">{L(COMMON.debt)}</Th>
                  </tr>
                </thead>
                <tbody>
                  {visibleShops.map((c) => {
                    const highlighted = c.id === highlightId;
                    const phones = (c.phone || '')
                      .split(/,\s*/)
                      .map((p) => p.trim())
                      .filter(Boolean);
                    return (
                      <tr
                        key={c.id}
                        ref={(el) => {
                          if (el) rowRefs.current.set(c.id, el);
                          else rowRefs.current.delete(c.id);
                        }}
                        className={clsx(
                          'transition align-top',
                          highlighted ? 'bg-brand-50 ring-2 ring-inset ring-brand-200' : 'hover:bg-ink-100/40'
                        )}
                      >
                        <Td align="center" className="font-semibold text-ink-500 tabular-nums">
                          {formatNum(c.num)}
                        </Td>
                        <Td className="min-w-[180px] max-w-[280px]">
                          <div className="font-semibold text-ink-900 break-words">{c.name}</div>
                          {c.notes ? (
                            <Pill tone="amber" className="mt-1 max-w-full" title={c.notes}>
                              <span className="truncate">{c.notes}</span>
                            </Pill>
                          ) : null}
                        </Td>
                        <Td className="min-w-[140px] max-w-[220px] break-words">
                          {c.ownerName || <span className="text-ink-400">—</span>}
                        </Td>
                        <Td className="tabular-nums">
                          {phones.length > 0 ? (
                            phones.map((p) => (
                              <a
                                key={p}
                                href={`tel:${p.replace(/\s/g, '')}`}
                                className="block whitespace-nowrap text-ink-700 hover:text-brand-500"
                              >
                                {p}
                              </a>
                            ))
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                        </Td>
                        <Td className="min-w-[180px] max-w-[300px]">
                          <div className="flex items-start gap-2">
                            {c.latitude != null && c.longitude != null ? (
                              <a
                                href={`https://yandex.uz/maps/?pt=${c.longitude},${c.latitude}&z=17&l=map`}
                                target="_blank"
                                rel="noreferrer"
                                title={L(T.openMap)}
                                className="w-7 h-7 -my-0.5 rounded-full bg-brand-50 text-brand-500 hover:bg-brand-100 flex items-center justify-center shrink-0"
                              >
                                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                              </a>
                            ) : null}
                            <span className="min-w-0 break-words text-ink-500">{c.address || '—'}</span>
                          </div>
                        </Td>
                        <Td align="right" className="whitespace-nowrap">
                          {(c.debtBalance || 0) > 0 ? (
                            <div className="flex items-center justify-end gap-2.5">
                              <Money value={c.debtBalance!} className="font-bold text-rose-600" />
                              <Button size="sm" variant="secondary" icon={CreditCard} onClick={() => openPayment(c)}>
                                {L(COMMON.payment)}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
                          {(c.debtBalance || 0) > 0 && (c.debtDays != null || c.overdue || c.overLimit) ? (
                            <div className="flex flex-wrap items-center justify-end gap-1.5 mt-1.5">
                              {c.debtDays != null ? (
                                <span
                                  className={clsx('text-xs tabular-nums', c.overdue ? 'font-semibold text-rose-600' : 'text-ink-500')}
                                  title={c.debtSince ? fmt(L(T.debtAgeTitle), { date: formatDate(c.debtSince, lang) }) : undefined}
                                >
                                  {c.debtDays === 0 ? L(COMMON.today) : fmt(L(T.days), { n: c.debtDays })}
                                </span>
                              ) : null}
                              {c.overdue ? (
                                <Pill tone="red" className="!py-0.5 !text-[11px]">
                                  {L(T.overdue)}
                                </Pill>
                              ) : null}
                              {c.overLimit ? (
                                <Pill tone="amber" className="!py-0.5 !text-[11px]">
                                  {L(T.overLimit)}
                                </Pill>
                              ) : null}
                            </div>
                          ) : null}
                          <div className="flex items-center justify-end gap-1 mt-1 text-xs text-ink-400">
                            <span className="tabular-nums">
                              {L(T.limit)}:{' '}
                              {(c.creditLimit || 0) > 0 ? (
                                <>
                                  {formatSum(c.creditLimit!)}
                                  {c.creditLeft != null ? ` • ${fmt(L(T.left), { sum: formatSum(c.creditLeft) })}` : ''}
                                </>
                              ) : (
                                L(T.noLimit)
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => openLimit(c)}
                              title={L(T.editLimit)}
                              aria-label={L(T.editLimit)}
                              className="w-6 h-6 rounded-full text-ink-400 hover:bg-brand-50 hover:text-brand-500 flex items-center justify-center"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Payment modal */}
      <Modal
        open={Boolean(paymentShop)}
        onClose={closePayment}
        width="sm"
        title={L(T.acceptPayment)}
        subtitle={paymentShop?.name}
        footer={
          <>
            <Button variant="ghost" onClick={closePayment}>
              {L(COMMON.cancel)}
            </Button>
            <Button icon={Wallet} onClick={() => handleConfirmPayment()} disabled={paying || amountNum <= 0}>
              {L(T.savePayment)}
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl2 bg-rose-50">
            <span className="text-sm text-ink-700">{L(T.currentDebt)}</span>
            <Money value={currentDebt} className="font-bold text-rose-600" />
          </div>
          <Field
            label={L(T.paymentAmount)}
            type="number"
            min={1}
            inputMode="numeric"
            suffix={L(COMMON.som)}
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            className="tabular-nums font-semibold"
            hint={
              amountNum > 0 && currentDebt > 0
                ? amountNum >= currentDebt
                  ? L(T.debtClosed)
                  : fmt(L(T.remainingDebt), { sum: formatSum(currentDebt - amountNum) })
                : undefined
            }
            autoFocus
            required
          />
          <div className="flex flex-wrap gap-2">
            <QuickAmount active={amountNum === currentDebt} onClick={() => setPayAmount(String(currentDebt))}>
              {L(T.fullDebt)}
            </QuickAmount>
            {currentDebt >= 2 && (
              <QuickAmount
                active={amountNum === Math.round(currentDebt / 2)}
                onClick={() => setPayAmount(String(Math.round(currentDebt / 2)))}
              >
                {L(T.half)}
              </QuickAmount>
            )}
            {QUICK_AMOUNTS.filter((a) => a < currentDebt).map((a) => (
              <QuickAmount key={a} active={amountNum === a} onClick={() => setPayAmount(String(a))}>
                {formatSum(a)}
              </QuickAmount>
            ))}
          </div>
          {/* Enter in the amount field submits */}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>

      {/* Credit limit modal */}
      <Modal
        open={Boolean(limitShop)}
        onClose={closeLimit}
        width="sm"
        title={L(T.editLimit)}
        subtitle={limitShop?.name}
        footer={
          <>
            <Button variant="ghost" onClick={closeLimit} disabled={limitSaving}>
              {L(COMMON.cancel)}
            </Button>
            <Button onClick={() => handleSaveLimit()} disabled={limitSaving}>
              {limitSaving ? L(T.saving) : L(COMMON.save)}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveLimit} className="space-y-4">
          {limitShop && (limitShop.debtBalance || 0) > 0 ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl2 bg-rose-50">
              <span className="text-sm text-ink-700">{L(T.currentDebt)}</span>
              <Money value={limitShop.debtBalance || 0} className="font-bold text-rose-600" />
            </div>
          ) : null}
          <Segmented
            value={limitMode}
            onChange={(m) => {
              setLimitMode(m);
              setLimitError(null);
            }}
            options={[
              { key: 'default', label: L(T.limitDefault) },
              { key: 'own', label: L(T.limitOwn) },
              { key: 'none', label: L(T.limitNone) },
            ]}
          />
          {limitMode === 'own' ? (
            <Field
              label={L(T.limitAmount)}
              type="number"
              min={1}
              inputMode="numeric"
              suffix={L(COMMON.som)}
              value={limitValue}
              onChange={(e) => {
                setLimitValue(e.target.value);
                setLimitError(null);
              }}
              className="tabular-nums font-semibold"
              autoFocus
            />
          ) : (
            <div className="px-4 py-3 rounded-xl2 bg-ink-100/70 text-sm text-ink-500">
              {limitMode === 'default'
                ? fmt(L(T.limitDefaultHint), {
                    value: defaultLimit > 0 ? `${formatSum(defaultLimit)} ${L(COMMON.som)}` : L(T.noLimit),
                  })
                : L(T.limitNoneHint)}
            </div>
          )}
          {limitError ? <div className="text-[13px] text-rose-600">{L(limitError)}</div> : null}
          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    </div>
  );
};

const QuickAmount: React.FC<{ children: React.ReactNode; active: boolean; onClick: () => void }> = ({ children, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'h-9 px-3.5 rounded-full text-[13px] font-semibold tabular-nums whitespace-nowrap transition',
      active ? 'bg-brand-500 text-white' : 'bg-ink-100/70 text-ink-700 hover:bg-brand-50 hover:text-brand-500'
    )}
  >
    {children}
  </button>
);

export default Clients;
