import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, CreditCard, MapPin, Route, Search, Store, Wallet } from 'lucide-react';
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
import { weekdayOf } from '../utils/format';

const API = 'http://localhost:3000/api/v1';

const DAYS = [
  { day: 1, short: 'Du', label: 'Dushanba' },
  { day: 2, short: 'Se', label: 'Seshanba' },
  { day: 3, short: 'Ch', label: 'Chorshanba' },
  { day: 4, short: 'Pa', label: 'Payshanba' },
  { day: 5, short: 'Ju', label: 'Juma' },
  { day: 6, short: 'Sh', label: 'Shanba' },
];

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
  const today = routeDayOf(useToday()); // live: switches at midnight
  const [lines, setLines] = useState<Line[]>([]);
  const [line, setLine] = useState(initialRoute?.line || '');
  const [day, setDay] = useState<number>(initialRoute?.day || 0);
  const [shops, setShops] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [paymentShop, setPaymentShop] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const [highlightId, setHighlightId] = useState(highlightShopId || '');
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  useEffect(() => {
    fetch(`${API}/lines`)
      .then((r) => r.json())
      .then((d) => setLines(d.lines || []))
      .catch(() => setError('Liniyalarni yuklab boʻlmadi. Birozdan soʻng sahifani yangilang.'));
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
    fetch(`${API}/clients?line=${encodeURIComponent(line)}&day=${day}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setShops(d.clients || []);
        setError('');
      })
      .catch(() => alive && setError('Marshrut doʻkonlarini yuklab boʻlmadi. Qaytadan urinib koʻring.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [line, day]);

  const routeShops = useMemo(() => [...shops].sort((a, b) => (a.num ?? 0) - (b.num ?? 0)), [shops]);

  const visibleShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routeShops;
    const qDigits = q.replace(/\s/g, '');
    return routeShops.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.ownerName || '').toLowerCase().includes(q) ||
        (c.phone || '').replace(/\s/g, '').includes(qDigits) ||
        (c.address || '').toLowerCase().includes(q) ||
        formatNum(c.num) === q
    );
  }, [routeShops, search]);

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
    if (!paymentShop || !(amount > 0)) return;
    setPaying(true);
    try {
      const res = await fetch(`${API}/payments/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: paymentShop.id, amount }),
      }).then((r) => r.json());
      if (res.shop) setShops((prev) => prev.map((c) => (c.id === res.shop.id ? { ...c, ...res.shop } : c)));
      setError('');
      closePayment();
    } catch {
      setError('Toʻlovni saqlab boʻlmadi. Qaytadan urinib koʻring.');
    } finally {
      setPaying(false);
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
          <span className="min-w-0">{error}</span>
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
            aria-label="Liniya"
          >
            <option value="">Liniyani tanlang</option>
            {lines.map((l) => (
              <option key={l.id} value={l.code}>
                {l.code} liniya
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
                <span title={d.label}>
                  <span className="xl:hidden">{d.short}</span>
                  <span className="hidden xl:inline">{d.label}</span>
                  {d.day === today ? <span className="ml-1 opacity-70">•</span> : null}
                </span>
              ),
            }))}
          />

          <SearchInput
            icon={Search}
            value={search}
            onChange={setSearch}
            placeholder="Nomi, egasi, telefon yoki manzil"
            className="flex-1 min-w-[220px]"
          />
        </Card>
      </div>

      {!isRouteSelected ? (
        <Card>
          <EmptyState
            icon={Route}
            title={line ? `${line} liniya uchun hafta kunini tanlang` : 'Liniya va hafta kunini tanlang'}
            hint="Doʻkonlar marshrut boʻyicha koʻrsatiladi: avval liniyani, soʻng hafta kunini tanlang."
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
            <Pill className="text-[13px] px-3 py-1.5">{dayLabel}</Pill>
            <Pill className="text-[13px] px-3 py-1.5">
              <Store className="w-3.5 h-3.5" />
              {routeShops.length} ta doʻkon
            </Pill>
            {routeDebt.sum > 0 ? (
              <Pill tone="red" className="text-[13px] px-3 py-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Qarz: {formatSum(routeDebt.sum)} soʻm • {routeDebt.count} ta
              </Pill>
            ) : (
              <Pill tone="green" className="text-[13px] px-3 py-1.5">
                Qarz yoʻq
              </Pill>
            )}
            {search && (
              <span className="ml-auto text-[13px] text-ink-400 tabular-nums">Topildi: {visibleShops.length} ta</span>
            )}
          </div>

          <Card padded={false} className="p-3 md:p-4">
            {loading && shops.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-400">Yuklanmoqda…</div>
            ) : visibleShops.length === 0 ? (
              <EmptyState
                icon={search ? Search : Store}
                title={search ? 'Qidiruv boʻyicha doʻkon topilmadi' : 'Bu marshrutda doʻkonlar yoʻq'}
                hint={search ? 'Boshqa soʻz bilan qidirib koʻring.' : undefined}
                action={
                  search ? (
                    <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                      Qidiruvni tozalash
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
                    <Th>Doʻkon nomi</Th>
                    <Th>Ism-familiya</Th>
                    <Th>Telefon</Th>
                    <Th>Manzil</Th>
                    <Th align="right">Qarz</Th>
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
                                title="Xaritada ochish"
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
                                Toʻlov
                              </Button>
                            </div>
                          ) : (
                            <span className="text-ink-400">—</span>
                          )}
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
        title="Toʻlov qabul qilish"
        subtitle={paymentShop?.name}
        footer={
          <>
            <Button variant="ghost" onClick={closePayment}>
              Bekor qilish
            </Button>
            <Button icon={Wallet} onClick={() => handleConfirmPayment()} disabled={paying || amountNum <= 0}>
              Toʻlovni saqlash
            </Button>
          </>
        }
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl2 bg-rose-50">
            <span className="text-sm text-ink-700">Joriy qarz</span>
            <Money value={currentDebt} className="font-bold text-rose-600" />
          </div>
          <Field
            label="Toʻlov summasi"
            type="number"
            min={1}
            inputMode="numeric"
            suffix="soʻm"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            className="tabular-nums font-semibold"
            hint={
              amountNum > 0 && currentDebt > 0
                ? amountNum >= currentDebt
                  ? 'Qarz toʻliq yopiladi'
                  : `Qoladigan qarz: ${formatSum(currentDebt - amountNum)} soʻm`
                : undefined
            }
            autoFocus
            required
          />
          <div className="flex flex-wrap gap-2">
            <QuickAmount active={amountNum === currentDebt} onClick={() => setPayAmount(String(currentDebt))}>
              Toʻliq qarz
            </QuickAmount>
            {currentDebt >= 2 && (
              <QuickAmount
                active={amountNum === Math.round(currentDebt / 2)}
                onClick={() => setPayAmount(String(Math.round(currentDebt / 2)))}
              >
                Yarmi
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
