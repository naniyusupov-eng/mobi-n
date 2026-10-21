import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, CreditCard, QrCode, Route, Store, Wallet, X } from 'lucide-react';
import { Client, Line } from '../types';
import { LineQRModal } from '../components/LineQRModal';
import { Card, EmptyState, Money, Pill, StatCard, formatSum } from '../components/ui';
import { useToday } from '../hooks/useNow';
import { weekdayOf } from '../utils/format';
import { COMMON, Tri, WEEKDAY_LABELS, WEEKDAY_SHORT, fmt, useL } from '../i18n/tri';
import { API, apiFetch } from '../api';

const DAYS = [1, 2, 3, 4, 5, 6].map((day) => ({ day, short: WEEKDAY_SHORT[day], label: WEEKDAY_LABELS[day] }));

const T = {
  totalShops: { uz: 'Jami doʻkonlar', uz_cyrl: 'Жами дўконлар', ru: 'Всего магазинов' },
  byAllLines: { uz: 'Barcha liniyalar boʻyicha', uz_cyrl: 'Барча линиялар бўйича', ru: 'По всем линиям' },
  lines: { uz: 'Liniyalar', uz_cyrl: 'Линиялар', ru: 'Линии' },
  sixDayRoute: { uz: 'Har biri 6 kunlik marshrut', uz_cyrl: 'Ҳар бири 6 кунлик маршрут', ru: 'У каждой маршрут на 6 дней' },
  totalDebt: { uz: 'Umumiy qarz', uz_cyrl: 'Умумий қарз', ru: 'Общий долг' },
  debtorShops: { uz: '{n} ta doʻkon qarzdor', uz_cyrl: '{n} та дўкон қарздор', ru: 'Должников: {n}' },
  countPcs: { uz: '{n} ta', uz_cyrl: '{n} та', ru: '{n}' },
  sectionTitle: { uz: 'Liniyalar va marshrutlar', uz_cyrl: 'Линиялар ва маршрутлар', ru: 'Линии и маршруты' },
  sectionHint: {
    uz: 'Liniyani tanlang — hafta kunlari pastda ochiladi',
    uz_cyrl: 'Линияни танланг — ҳафта кунлари пастда очилади',
    ru: 'Выберите линию — дни недели откроются ниже',
  },
  sundayNoRoute: { uz: 'Yakshanba — marshrut yoʻq', uz_cyrl: 'Якшанба — маршрут йўқ', ru: 'Воскресенье — маршрута нет' },
  noLines: { uz: 'Liniyalar yoʻq', uz_cyrl: 'Линиялар йўқ', ru: 'Линий нет' },
  noLinesHint: {
    uz: 'Serverda hali birorta liniya qoʻshilmagan.',
    uz_cyrl: 'Серверда ҳали бирорта линия қўшилмаган.',
    ru: 'На сервере пока не добавлено ни одной линии.',
  },
  pickLine: {
    uz: 'Hafta kunlarini koʻrish uchun yuqoridan liniyani tanlang',
    uz_cyrl: 'Ҳафта кунларини кўриш учун юқоридан линияни танланг',
    ru: 'Выберите линию выше, чтобы увидеть дни недели',
  },
  lineWeekDays: { uz: '{code} liniya — hafta kunlari', uz_cyrl: '{code} линия — ҳафта кунлари', ru: 'Линия {code} — дни недели' },
  hasDebtors: { uz: 'Qarzdor doʻkonlar bor', uz_cyrl: 'Қарздор дўконлар бор', ru: 'Есть магазины с долгом' },
  lineName: { uz: '{code} liniya', uz_cyrl: '{code} линия', ru: 'Линия {code}' },
  shopsPickDay: {
    uz: '{n} ta doʻkon · hafta kunini tanlang',
    uz_cyrl: '{n} та дўкон · ҳафта кунини танланг',
    ru: 'Магазинов: {n} · выберите день недели',
  },
  qrTitle: {
    uz: '{code} liniya QR kodi — agent shu kod bilan kiradi',
    uz_cyrl: '{code} линия QR коди — агент шу код билан киради',
    ru: 'QR-код линии {code} — агент входит по этому коду',
  },
  dayTitle: { uz: '{n} ta doʻkon', uz_cyrl: '{n} та дўкон', ru: 'магазинов: {n}' },
  noDebt: { uz: 'Qarz yoʻq', uz_cyrl: 'Қарз йўқ', ru: 'Долгов нет' },
} satisfies Record<string, Tri>;

// Route day of a Tashkent date: 1 = Dushanba ... 6 = Shanba, null on Sunday
const routeDayOf = (day: string) => weekdayOf(day) || null;

interface LineStats {
  total: number;
  byDay: number[]; // index 1..6
}

export const Lines: React.FC<{ onOpenRoute: (line: string, day: number) => void }> = ({ onOpenRoute }) => {
  const L = useL();
  const today = routeDayOf(useToday()); // live: switches at midnight
  const [lines, setLines] = useState<Line[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [debtors, setDebtors] = useState<Client[]>([]);
  const [debt, setDebt] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Tri | null>(null);
  const [qrLine, setQrLine] = useState<Line | null>(null);
  const [openLine, setOpenLine] = useState<string | null>(null); // the card showing its week days

  useEffect(() => {
    let alive = true;
    Promise.all([
      apiFetch(`${API}/lines`).then((r) => r.json()),
      apiFetch(`${API}/clients`).then((r) => r.json()),
    ])
      .then(([l, c]) => {
        if (!alive) return;
        setLines(l.lines || []);
        setClients(c.clients || []);
        setError(null);
      })
      .catch(() => alive && setError(COMMON.loadError))
      .finally(() => alive && setLoading(false));
    apiFetch(`${API}/debts`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setDebt({ total: d.totalDebt || 0, count: d.count || 0 });
        setDebtors(d.debtors || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Per-line and per-day shop counts, computed once for all shops
  const stats = useMemo(() => {
    const map = new Map<string, LineStats>();
    for (const c of clients) {
      if (!c.lineCode) continue;
      let s = map.get(c.lineCode);
      if (!s) {
        s = { total: 0, byDay: [0, 0, 0, 0, 0, 0, 0] };
        map.set(c.lineCode, s);
      }
      s.total += 1;
      if (c.day) s.byDay[c.day] += 1;
    }
    return map;
  }, [clients]);

  const debtByLine = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const d of debtors) {
      if (!d.lineCode || !(d.debtBalance && d.debtBalance > 0)) continue;
      const s = map.get(d.lineCode) || { sum: 0, count: 0 };
      s.sum += d.debtBalance;
      s.count += 1;
      map.set(d.lineCode, s);
    }
    return map;
  }, [debtors]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">
          <AlertCircle className="w-[18px] h-[18px] shrink-0" />
          <span className="min-w-0">{L(error)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Store}
          label={L(T.totalShops)}
          value={fmt(L(T.countPcs), { n: formatSum(clients.length) })}
          note={L(T.byAllLines)}
        />
        <StatCard
          icon={Route}
          tone="violet"
          label={L(T.lines)}
          value={fmt(L(T.countPcs), { n: lines.length })}
          note={L(T.sixDayRoute)}
        />
        <StatCard
          icon={CreditCard}
          tone="red"
          label={L(T.totalDebt)}
          value={<Money value={debt.total} />}
          note={fmt(L(T.debtorShops), { n: debt.count })}
        />
      </div>

      {/* Section header */}
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h2 className="text-[19px] font-bold tracking-tight text-ink-900">{L(T.sectionTitle)}</h2>
          <p className="text-sm text-ink-400 mt-0.5">{L(T.sectionHint)}</p>
        </div>
        <Pill tone={today ? 'brand' : 'gray'} className="py-1.5 px-3 text-[13px]">
          <CalendarDays className="w-3.5 h-3.5" />
          {L(COMMON.today)}: {today ? L(WEEKDAY_LABELS[today]) : L(T.sundayNoRoute)}
        </Pill>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
        </Card>
      ) : lines.length === 0 ? (
        <Card>
          <EmptyState icon={Route} title={L(T.noLines)} hint={L(T.noLinesHint)} />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Line tiles: fixed grid, the chosen one turns blue */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
            {lines.map((line) => (
              <LineTile
                key={line.id}
                line={line}
                total={stats.get(line.code)?.total || 0}
                hasDebt={(debtByLine.get(line.code)?.sum || 0) > 0}
                active={openLine === line.code}
                onClick={() => setOpenLine((cur) => (cur === line.code ? null : line.code))}
              />
            ))}
          </div>

          {/* Details of the chosen line */}
          {openLine && lines.some((l) => l.code === openLine) ? (
            <LineDetail
              key={openLine}
              line={lines.find((l) => l.code === openLine)!}
              stats={stats.get(openLine) || { total: 0, byDay: [0, 0, 0, 0, 0, 0, 0] }}
              debt={debtByLine.get(openLine)}
              today={today}
              onOpenRoute={onOpenRoute}
              onQR={() => setQrLine(lines.find((l) => l.code === openLine) || null)}
              onClose={() => setOpenLine(null)}
            />
          ) : (
            <div className="rounded-card border-2 border-dashed border-ink-200 py-8 lg:min-h-[227px] flex items-center justify-center text-center text-sm text-ink-400">
              {L(T.pickLine)}
            </div>
          )}
        </div>
      )}

      <LineQRModal line={qrLine} clientsCount={qrLine ? stats.get(qrLine.code)?.total || 0 : 0} onClose={() => setQrLine(null)} />
    </div>
  );
};

/** Small line tile: code and shop count; blue when chosen */
const LineTile: React.FC<{ line: Line; total: number; hasDebt: boolean; active: boolean; onClick: () => void }> = ({
  line,
  total,
  hasDebt,
  active,
  onClick,
}) => {
  const L = useL();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={fmt(L(T.lineWeekDays), { code: line.code })}
      className={clsx(
        'relative rounded-card p-3.5 text-left transition',
        active ? 'bg-brand-500 text-white shadow-pop' : 'bg-white shadow-card hover:shadow-pop hover:-translate-y-0.5'
      )}
    >
      <div className={clsx('text-[20px] font-bold tabular-nums tracking-tight', active ? 'text-white' : 'text-brand-500')}>
        {line.code}
      </div>
      <div className={clsx('mt-0.5 flex items-center gap-1 text-[12px] tabular-nums', active ? 'text-white/80' : 'text-ink-400')}>
        <Store className="w-3 h-3" />
        {formatSum(total)}
      </div>
      {hasDebt && (
        <span
          className={clsx('absolute top-3 right-3 w-1.5 h-1.5 rounded-full', active ? 'bg-white' : 'bg-rose-500')}
          title={L(T.hasDebtors)}
        />
      )}
    </button>
  );
};

interface LineDetailProps {
  line: Line;
  stats: LineStats;
  debt?: { sum: number; count: number };
  today: number | null;
  onOpenRoute: (line: string, day: number) => void;
  onQR: () => void;
  onClose: () => void;
}

/** The chosen line: six week days to open, today's route, debt and QR */
const LineDetail: React.FC<LineDetailProps> = ({ line, stats: s, debt, today, onOpenRoute, onQR, onClose }) => {
  const L = useL();
  const max = Math.max(1, ...s.byDay.slice(1));
  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 min-w-[3.25rem] px-2.5 rounded-xl2 bg-brand-500 text-white flex items-center justify-center font-bold text-[17px] tabular-nums shrink-0">
          {line.code}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[16px] text-ink-900 truncate">{fmt(L(T.lineName), { code: line.code })}</div>
          <div className="flex items-center gap-1.5 text-[13px] text-ink-400 tabular-nums">
            <Store className="w-3.5 h-3.5" />
            {fmt(L(T.shopsPickDay), { n: formatSum(s.total) })}
          </div>
        </div>
        <LineDebt sum={debt?.sum || 0} count={debt?.count || 0} />
        <button
          type="button"
          onClick={onQR}
          title={fmt(L(T.qrTitle), { code: line.code })}
          className="h-10 px-3.5 rounded-full bg-ink-100 text-ink-700 hover:bg-brand-500 hover:text-white flex items-center gap-1.5 text-[13px] font-semibold transition shrink-0"
        >
          <QrCode className="w-4 h-4" /> QR
        </button>
        <button
          type="button"
          onClick={onClose}
          title={L(COMMON.close)}
          aria-label={L(COMMON.close)}
          className="w-10 h-10 rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-900 flex items-center justify-center transition shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Six week days */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DAYS.map((d) => {
          const isToday = d.day === today;
          const count = s.byDay[d.day];
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => onOpenRoute(line.code, d.day)}
              title={`${line.code}-${d.day} • ${L(d.label)} • ${fmt(L(T.dayTitle), { n: count })}`}
              className={clsx(
                'group min-w-0 rounded-xl2 p-3.5 text-left transition',
                isToday ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-ink-100/70 text-ink-900 hover:bg-brand-50',
                count === 0 && !isToday && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={clsx('text-[13px] font-semibold truncate', isToday ? 'text-white' : 'text-ink-700')}>{L(d.label)}</span>
                {isToday && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-white/20 rounded-full px-1.5 py-0.5">
                    {L(COMMON.today)}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="text-[22px] font-bold tabular-nums leading-none">{count}</span>
                <span className={clsx('text-[12px]', isToday ? 'text-white/75' : 'text-ink-400')}>{L(COMMON.shops)}</span>
              </div>
              <div className={clsx('mt-2 h-1 rounded-full overflow-hidden', isToday ? 'bg-white/25' : 'bg-ink-200/70')}>
                <div className={clsx('h-full rounded-full', isToday ? 'bg-white' : 'bg-brand-500')} style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <div
                className={clsx(
                  'mt-2 flex items-center gap-1 text-[12px] font-semibold tabular-nums',
                  isToday ? 'text-white/90' : 'text-ink-400 group-hover:text-brand-500'
                )}
              >
                {line.code}-{d.day} <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

const LineDebt: React.FC<{ sum: number; count: number }> = ({ sum, count }) => {
  const L = useL();
  return sum > 0 ? (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[13px] font-semibold whitespace-nowrap"
      title={fmt(L(T.debtorShops), { n: count })}
    >
      <Wallet className="w-3.5 h-3.5" />
      <Money value={sum} />
      <span className="font-medium opacity-70">· {count}</span>
    </div>
  ) : (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[13px] font-semibold whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5" /> {L(T.noDebt)}
    </span>
  );
};

export default Lines;
