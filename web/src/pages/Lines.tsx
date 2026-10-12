import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CreditCard, QrCode, Route, Store, AlertCircle } from 'lucide-react';
import { Client, Line } from '../types';
import { LineQRModal } from '../components/LineQRModal';
import { Button, Card, CardTitle, EmptyState, Money, Pill, StatCard, formatSum } from '../components/ui';
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

interface LineStats {
  total: number;
  byDay: number[]; // index 1..6
}

export const Lines: React.FC<{ onOpenRoute: (line: string, day: number) => void }> = ({ onOpenRoute }) => {
  const today = routeDayOf(useToday()); // live: switches at midnight
  const [lines, setLines] = useState<Line[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [debtors, setDebtors] = useState<Client[]>([]);
  const [debt, setDebt] = useState({ total: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrLine, setQrLine] = useState<Line | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`${API}/lines`).then((r) => r.json()),
      fetch(`${API}/clients`).then((r) => r.json()),
    ])
      .then(([l, c]) => {
        if (!alive) return;
        setLines(l.lines || []);
        setClients(c.clients || []);
        setError('');
      })
      .catch(() => alive && setError('Maʼlumotlarni yuklab boʻlmadi. Birozdan soʻng sahifani yangilang.'))
      .finally(() => alive && setLoading(false));
    fetch(`${API}/debts`)
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
          <span className="min-w-0">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Store} label="Jami doʻkonlar" value={`${formatSum(clients.length)} ta`} note="Barcha liniyalar boʻyicha" />
        <StatCard icon={Route} tone="violet" label="Liniyalar" value={`${lines.length} ta`} note="Har biri 6 kunlik marshrut" />
        <StatCard
          icon={CreditCard}
          tone="red"
          label="Umumiy qarz"
          value={<Money value={debt.total} />}
          note={`${debt.count} ta doʻkon qarzdor`}
        />
      </div>

      <Card>
        <CardTitle
          title="Liniyalar va marshrutlar"
          subtitle="Doʻkonlarni koʻrish uchun marshrut kunini tanlang"
          action={today ? <Pill tone="brand">Bugun: {DAYS[today - 1].label}</Pill> : <Pill>Bugun: Yakshanba</Pill>}
        />

        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">Yuklanmoqda…</div>
        ) : lines.length === 0 ? (
          <EmptyState icon={Route} title="Liniyalar yoʻq" hint="Serverda hali birorta liniya qoʻshilmagan." />
        ) : (
          <div className="divide-y divide-ink-100">
            {lines.map((line) => {
              const s = stats.get(line.code) || { total: 0, byDay: [0, 0, 0, 0, 0, 0, 0] };
              const ld = debtByLine.get(line.code);
              return (
                <div key={line.id} className="py-4 first:pt-0 last:pb-0 flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-5">
                  {/* Line identity */}
                  <div className="flex items-center gap-3 min-w-0 xl:w-[180px] xl:shrink-0">
                    <div className="min-w-[48px] h-12 px-2 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center font-bold text-[15px] tabular-nums shrink-0">
                      {line.code}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-ink-900 truncate">{line.code} liniya</div>
                      <div className="text-[13px] text-ink-400 tabular-nums">{formatSum(s.total)} ta doʻkon</div>
                    </div>
                    {/* Debt + QR on narrow screens */}
                    <div className="ml-auto flex items-center gap-2 xl:hidden">
                      <LineDebt sum={ld?.sum || 0} count={ld?.count || 0} />
                      <Button variant="secondary" size="sm" icon={QrCode} onClick={() => setQrLine(line)} title={`${line.code} liniya QR kodi`}>
                        QR
                      </Button>
                    </div>
                  </div>

                  {/* Six route days */}
                  <div className="grid grid-cols-6 gap-2 flex-1 min-w-0">
                    {DAYS.map((d) => {
                      const isToday = d.day === today;
                      const count = s.byDay[d.day];
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => onOpenRoute(line.code, d.day)}
                          title={`${line.code}-${d.day} • ${d.label} • ${count} ta doʻkon`}
                          className={clsx(
                            'min-w-0 rounded-xl2 px-2 py-2 text-center transition',
                            isToday
                              ? 'bg-brand-500 text-white hover:bg-brand-600'
                              : 'bg-ink-100/70 text-ink-700 hover:bg-brand-50 hover:text-brand-500',
                            count === 0 && !isToday && 'opacity-60'
                          )}
                        >
                          <span className={clsx('block text-[11px] font-medium truncate', isToday ? 'text-white/80' : 'text-ink-400')}>
                            {d.short} · {line.code}-{d.day}
                          </span>
                          <span className="block text-[15px] font-bold tabular-nums leading-tight mt-0.5">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Debt + QR on wide screens */}
                  <div className="hidden xl:flex items-center gap-3 shrink-0">
                    <div className="w-[150px] text-right">
                      <LineDebt sum={ld?.sum || 0} count={ld?.count || 0} />
                    </div>
                    <Button variant="secondary" size="sm" icon={QrCode} onClick={() => setQrLine(line)} title={`${line.code} liniya QR kodi`}>
                      QR
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <LineQRModal line={qrLine} clientsCount={qrLine ? stats.get(qrLine.code)?.total || 0 : 0} onClose={() => setQrLine(null)} />
    </div>
  );
};

const LineDebt: React.FC<{ sum: number; count: number }> = ({ sum, count }) =>
  sum > 0 ? (
    <div className="text-right leading-tight">
      <Money value={sum} className="text-sm font-bold text-rose-600" />
      <div className="text-[11px] text-ink-400 whitespace-nowrap">{count} ta qarzdor</div>
    </div>
  ) : (
    <span className="text-[13px] text-ink-400 whitespace-nowrap">Qarz yoʻq</span>
  );

export default Lines;
