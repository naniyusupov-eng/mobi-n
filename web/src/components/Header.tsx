import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Bell, CalendarDays, Receipt, Search, Store } from 'lucide-react';
import { Client, Order } from '../types';
import { formatSum } from './ui';
import { useLanguage } from '../context/LanguageContext';
import { useNow } from '../hooks/useNow';
import { BUSINESS_TZ, dayKey, formatWeekdayDay } from '../utils/format';
import { COMMON, useL } from '../i18n/tri';
import { API, apiFetch } from '../api';

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit' });

/** Live business date and time (Tashkent) */
const LiveClock: React.FC = () => {
  const { lang } = useLanguage();
  const L = useL();
  const now = useNow(10_000);
  return (
    <div
      className="hidden xl:flex items-center gap-2 h-12 px-4 rounded-full bg-white shadow-card shrink-0 text-sm"
      title={L({ uz: 'Toshkent vaqti', uz_cyrl: 'Тошкент вақти', ru: 'Ташкентское время' })}
    >
      <CalendarDays className="w-4 h-4 text-brand-500" />
      <span className="font-medium text-ink-700 whitespace-nowrap">{formatWeekdayDay(dayKey(now), lang)}</span>
      <span className="font-semibold text-ink-900 tabular-nums">{timeFmt.format(now)}</span>
    </div>
  );
};

export type SearchPick =
  | { kind: 'client'; client: Client }
  | { kind: 'order'; order: Order };

interface HeaderProps {
  title: string;
  orders: Order[];
  newOrdersCount: number;
  onPick: (pick: SearchPick) => void;
  onBell: () => void;
}

const shopNum = (n?: number) => (n == null ? '' : Number.isInteger(n) ? `№${n}` : `№${Math.floor(n)}a`);

/** Top bar: page title, global search (shops and orders), new-orders bell, admin */
export const Header: React.FC<HeaderProps> = ({ title, orders, newOrdersCount, onPick, onBell }) => {
  const L = useL();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [clients, setClients] = useState<Client[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Shops are loaded once, the first time search is used
  const loadClients = () => {
    if (clients) return;
    apiFetch(`${API}/clients`)
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []))
      .catch(() => setClients([]));
  };

  // Ctrl+K focuses the search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, []);

  const results = useMemo<SearchPick[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = q.replace(/\D/g, '');
    const shops = (clients || [])
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.ownerName || '').toLowerCase().includes(q) ||
          (digits.length >= 3 && (c.phone || '').replace(/\D/g, '').includes(digits))
      )
      .slice(0, 6)
      .map((client) => ({ kind: 'client' as const, client }));
    const ords = orders
      .filter((o) => o.shopName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
      .slice(0, 4)
      .map((order) => ({ kind: 'order' as const, order }));
    return [...shops, ...ords];
  }, [query, clients, orders]);

  useEffect(() => setActive(0), [query]);

  const pick = (p: SearchPick) => {
    onPick(p);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <header className="shrink-0 flex items-center gap-3 lg:gap-4 px-5 lg:px-8 pt-6 pb-2 no-print">
      <h1 className="flex-1 min-w-0 text-[26px] font-bold tracking-tight text-ink-900 truncate">{title}</h1>

      <div ref={boxRef} className="relative w-full max-w-[380px] hidden md:block">
        <Search className="w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            loadClients();
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={L({ uz: 'Doʻkon, telefon yoki buyurtma', uz_cyrl: 'Дўкон, телефон ёки буюртма', ru: 'Магазин, телефон или заказ' })}
          className="w-full h-12 pl-11 pr-16 rounded-xl2 bg-white shadow-card text-[15px] text-ink-900 placeholder:text-ink-400 outline-none focus:ring-4 focus:ring-brand-50"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink-400 border border-ink-200 rounded-md px-1.5 py-0.5">
          Ctrl K
        </span>

        {open && query.trim().length >= 2 ? (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 bg-white rounded-xl2 shadow-pop p-2 max-h-[420px] overflow-y-auto">
            {clients === null ? (
              <div className="px-3 py-4 text-sm text-ink-400">{L(COMMON.loading)}</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-ink-400">
                {L({ uz: 'Hech narsa topilmadi', uz_cyrl: 'Ҳеч нарса топилмади', ru: 'Ничего не найдено' })}
              </div>
            ) : (
              results.map((r, i) => {
                const isClient = r.kind === 'client';
                return (
                  <button
                    key={isClient ? `c-${r.client.id}` : `o-${r.order.id}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(r)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                      i === active ? 'bg-brand-50' : 'hover:bg-ink-100'
                    )}
                  >
                    <span
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                        isClient ? 'bg-brand-50 text-brand-500' : 'bg-violet-50 text-violet-600'
                      )}
                    >
                      {isClient ? <Store className="w-[18px] h-[18px]" /> : <Receipt className="w-[18px] h-[18px]" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink-900 truncate">
                        {isClient ? r.client.name : r.order.shopName}
                      </span>
                      <span className="block text-xs text-ink-400 truncate">
                        {isClient
                          ? [r.client.lineCode && r.client.day ? `${r.client.lineCode}-${r.client.day}` : '', shopNum(r.client.num), r.client.phone]
                              .filter(Boolean)
                              .join(' • ')
                          : `${L({ uz: 'Buyurtma', uz_cyrl: 'Буюртма', ru: 'Заказ' })} #${r.order.id.slice(-6).toUpperCase()} • ${formatSum(r.order.finalAmount)} ${L(COMMON.som)}`}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      <LiveClock />

      <button
        onClick={onBell}
        title={L({ uz: 'Yangi buyurtmalar', uz_cyrl: 'Янги буюртмалар', ru: 'Новые заказы' })}
        className="relative w-12 h-12 rounded-full bg-white shadow-card text-ink-500 hover:text-ink-900 flex items-center justify-center shrink-0"
      >
        <Bell className="w-5 h-5" />
        {newOrdersCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none flex items-center justify-center tabular-nums">
            {newOrdersCount}
          </span>
        ) : null}
      </button>
      <div
        title={L({ uz: 'Administrator', uz_cyrl: 'Администратор', ru: 'Администратор' })}
        className="w-12 h-12 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center shrink-0"
      >
        A
      </div>
    </header>
  );
};
