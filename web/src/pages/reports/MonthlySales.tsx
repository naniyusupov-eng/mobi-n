import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Award, Banknote, RotateCcw, TrendingUp } from 'lucide-react';
import { CompanySettings, DayStats, LineMonthStats } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToday } from '../../hooks/useNow';
import { WEEKDAYS_SHORT, compactMoney, formatDay, weekdayOf } from '../../utils/format';
import { Period } from '../../components/PeriodPicker';
import { Card, CardTitle, Money, Pill, StatCard, formatSum } from '../../components/ui';

const API = 'http://localhost:3000/api/v1';
const EMPTY: DayStats = { orders: 0, gross: 0, returns: 0, net: 0 };
const sum = (n: number) => `${formatSum(n)} soʻm`;

// Two pinned columns (line + month total) stay visible while the days scroll under them
const COL1 = 'w-[132px] min-w-[132px] left-0 pl-5 md:pl-6';
const COL2 = 'w-[150px] min-w-[150px] left-[132px] shadow-[inset_-1px_0_0_0_theme(colors.ink.100)]';

interface MonthlySalesProps {
  month: string; // YYYY-MM
  company: CompanySettings;
  refreshKey: string; // changes when orders or returns change
  /** Open the orders of a line ('' = all lines) for a day or the whole month */
  onOpen: (lineCode: string, period: Period) => void;
}

// Daily sales of every line for a month: the basis for monthly pay, with return-free streaks
export const MonthlySales: React.FC<MonthlySalesProps> = ({ month, company, refreshKey, onOpen }) => {
  const { lang } = useLanguage();
  const today = useToday();
  const bonusDays = company.bonusStreakDays || 10;

  const [lines, setLines] = useState<LineMonthStats[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    fetch(`${API}/stats/monthly?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setLines(d.lines || []);
        setError('');
        setLoaded(true);
      })
      .catch(() => setError('Statistikani yuklab boʻlmadi'));
  }, [month, refreshKey, today]);

  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);

  // Bring today's column into view when the month opens
  useLayoutEffect(() => {
    const box = scrollRef.current;
    const cell = todayRef.current;
    if (!box) return;
    box.scrollLeft = cell ? Math.max(0, cell.offsetLeft - 282 - box.clientWidth / 3) : 0;
  }, [month, loaded]);

  const totals = lines.reduce(
    (acc, l) => ({
      orders: acc.orders + l.totals.orders,
      gross: acc.gross + l.totals.gross,
      returns: acc.returns + l.totals.returns,
      net: acc.net + l.totals.net,
    }),
    EMPTY
  );
  const dayTotal = (date: string) =>
    lines.reduce((acc, l) => {
      const c = l.days[date] || EMPTY;
      return { orders: acc.orders + c.orders, gross: acc.gross + c.gross, returns: acc.returns + c.returns, net: acc.net + c.net };
    }, EMPTY);
  const bonusLines = lines.filter((l) => l.streak.current >= bonusDays);
  const returnShare = totals.gross > 0 ? (totals.returns / totals.gross) * 100 : 0;

  const cellTitle = (code: string, date: string, c: DayStats) =>
    `${code} • ${formatDay(date, lang)}\nSavdo: ${sum(c.gross)} (${c.orders} ta)\nVozvrat: ${sum(c.returns)}\nSof: ${sum(c.net)}`;
  const totalTitle = (code: string, c: DayStats) =>
    `${code} • oy jami\nSavdo: ${sum(c.gross)} (${c.orders} ta)\nVozvrat: ${sum(c.returns)}\nSof: ${sum(c.net)}`;

  const dayCellCls = (d: string) =>
    clsx(
      'px-1 text-center tabular-nums whitespace-nowrap',
      d === today ? 'bg-brand-50' : weekdayOf(d) === 0 ? 'bg-ink-100/50' : ''
    );

  /** Month total cell: net in bold, returns underneath */
  const TotalCell: React.FC<{ c: DayStats; strong?: boolean }> = ({ c, strong }) => (
    <div className="leading-tight">
      <div className={clsx('font-bold whitespace-nowrap', strong ? 'text-brand-500' : 'text-ink-900')}>
        <Money value={c.net} />
      </div>
      <div className="text-[11px] text-ink-400 whitespace-nowrap mt-0.5">
        {c.returns > 0 ? (
          <span className="text-rose-600">
            −{compactMoney(c.returns)} vozvrat
          </span>
        ) : (
          `${c.orders} ta buyurtma`
        )}
      </div>
    </div>
  );

  // Every amount opens that day's orders in "Liniya buyurtmalari"
  const dayBtn = (strong: boolean) =>
    clsx(
      'px-1.5 py-1 -my-1 rounded-lg tabular-nums transition hover:bg-brand-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
      strong ? 'text-ink-900 font-semibold' : 'text-inherit'
    );

  const thBase = 'py-2 text-xs font-medium text-ink-400 bg-ink-100 whitespace-nowrap';

  return (
    <div className="space-y-5">
      {error && <div className="px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">{error}</div>}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} tone="brand" label="Oy savdosi" value={<Money value={totals.gross} />} note={`${totals.orders} ta buyurtma`} />
        <StatCard
          icon={RotateCcw}
          tone="red"
          label="Vozvrat"
          value={<Money value={totals.returns} />}
          note={`savdoning ${returnShare.toFixed(1).replace('.', ',')}%`}
        />
        <StatCard icon={Banknote} tone="green" label="Sof savdo" value={<Money value={totals.net} />} note="savdo − vozvrat" />
        <StatCard
          icon={Award}
          tone="amber"
          label="Bonusga yetgan liniyalar"
          value={`${bonusLines.length} ta`}
          note={
            <span className="block truncate">
              {bonusDays} kun vozvratsiz
              {company.bonusAmount ? (
                <>
                  {' • '}
                  <Money value={company.bonusAmount} />
                </>
              ) : null}
            </span>
          }
        />
      </div>

      {/* Lines x days */}
      <Card padded={false} className="overflow-hidden">
        <div className="px-5 md:px-6 pt-5 md:pt-6">
          <CardTitle
            title="Liniyalar boʻyicha kunlik sof savdo"
            subtitle="Summani bosing — oʻsha kungi buyurtmalar va cheklar ochiladi"
            action={
              <div className="hidden md:flex items-center gap-4 text-xs text-ink-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-brand-500" /> bugun
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> vozvrat boʻlgan kun
                </span>
              </div>
            }
          />
        </div>
        <div ref={scrollRef} className="overflow-x-auto pb-5 md:pb-6">
          <table className="w-full text-[13px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={clsx(thBase, COL1, 'sticky z-20 pr-4 text-left')}>Liniya</th>
                <th className={clsx(thBase, COL2, 'sticky z-20 px-3 text-left')}>Oy jami (sof)</th>
                {dates.map((d, i) => {
                  const isToday = d === today;
                  const sunday = weekdayOf(d) === 0;
                  return (
                    <th
                      key={d}
                      ref={isToday ? todayRef : undefined}
                      className={clsx(
                        thBase,
                        'px-1 text-center min-w-[3.5rem] tabular-nums',
                        i === dates.length - 1 && 'pr-5 md:pr-6',
                        d > today && 'opacity-40'
                      )}
                    >
                      <div
                        className={clsx(
                          'mx-auto w-9 rounded-lg py-0.5 leading-tight',
                          isToday ? 'bg-brand-500 text-white' : sunday ? 'text-rose-500' : 'text-ink-700'
                        )}
                      >
                        <div className="text-[13px] font-semibold">{Number(d.slice(8))}</div>
                        <div className={clsx('text-[10px] font-medium', isToday ? 'text-white/80' : sunday ? 'text-rose-400' : 'text-ink-400')}>
                          {WEEKDAYS_SHORT[lang][weekdayOf(d)]}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 2} className="py-10 text-center text-ink-400">
                    {loaded ? 'Maʼlumot yoʻq' : 'Yuklanmoqda…'}
                  </td>
                </tr>
              )}
              {lines.map((l) => {
                const hasBonus = l.streak.current >= bonusDays;
                return (
                  <tr key={l.code} className="group">
                    <td
                      onClick={() => onOpen(l.code, { kind: 'month', month })}
                      title={`${l.code} — oy buyurtmalari`}
                      className={clsx(COL1, 'sticky z-10 pr-4 py-2.5 bg-white group-hover:bg-ink-100 border-b border-ink-100 whitespace-nowrap cursor-pointer')}
                    >
                      <div className="font-bold text-ink-900 group-hover:text-brand-500 transition">{l.code}</div>
                      {hasBonus ? (
                        <Pill tone="amber" className="mt-1 !px-1.5 !py-0 text-[11px]" title={`${l.streak.current} kun vozvratsiz`}>
                          <Award className="w-3 h-3" /> Bonus
                        </Pill>
                      ) : l.streak.current > 0 ? (
                        <div className="text-[11px] text-ink-400 mt-0.5" title="Vozvratsiz kunlar ketma-ketligi">
                          {l.streak.current}/{bonusDays} kun
                        </div>
                      ) : null}
                    </td>
                    <td
                      title={totalTitle(l.code, l.totals)}
                      onClick={() => onOpen(l.code, { kind: 'month', month })}
                      className={clsx(COL2, 'sticky z-10 px-3 py-2.5 bg-white group-hover:bg-ink-100 border-b border-ink-100 cursor-pointer')}
                    >
                      <TotalCell c={l.totals} />
                    </td>
                    {dates.map((d, i) => {
                      const c = l.days[d];
                      const future = d > today;
                      return (
                        <td
                          key={d}
                          title={c ? cellTitle(l.code, d, c) : undefined}
                          className={clsx(dayCellCls(d), 'py-2.5 relative border-b border-ink-100 group-hover:bg-ink-100/60', i === dates.length - 1 && 'pr-5 md:pr-6')}
                        >
                          {c ? (
                            <>
                              <button type="button" onClick={() => onOpen(l.code, { kind: 'day', day: d })} className={dayBtn(c.returns > 0)}>
                                {compactMoney(c.net)}
                              </button>
                              {c.returns > 0 && <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 pointer-events-none" />}
                            </>
                          ) : future ? null : (
                            <span className="text-ink-200">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            {lines.length > 0 && (
              <tfoot>
                <tr className="font-semibold">
                  <td
                    onClick={() => onOpen('', { kind: 'month', month })}
                    className={clsx(COL1, 'sticky z-10 pr-4 py-2.5 bg-brand-50 text-ink-900 cursor-pointer hover:text-brand-500')}
                  >
                    Jami
                  </td>
                  <td
                    title={totalTitle('Jami', totals)}
                    onClick={() => onOpen('', { kind: 'month', month })}
                    className={clsx(COL2, 'sticky z-10 px-3 py-2.5 bg-brand-50 cursor-pointer')}
                  >
                    <TotalCell c={totals} strong />
                  </td>
                  {dates.map((d, i) => {
                    const c = dayTotal(d);
                    return (
                      <td
                        key={d}
                        title={c.orders ? cellTitle('Jami', d, c) : undefined}
                        className={clsx(
                          'px-1 py-2.5 text-center tabular-nums whitespace-nowrap text-ink-900',
                          d === today ? 'bg-brand-100' : 'bg-brand-50',
                          i === dates.length - 1 && 'pr-5 md:pr-6'
                        )}
                      >
                        {c.orders ? (
                          <button type="button" onClick={() => onOpen('', { kind: 'day', day: d })} className={dayBtn(false)}>
                            {compactMoney(c.net)}
                          </button>
                        ) : d > today ? null : <span className="text-ink-200">·</span>}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
};
