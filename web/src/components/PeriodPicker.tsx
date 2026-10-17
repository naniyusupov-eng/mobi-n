import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToday } from '../hooks/useNow';
import { WEEKDAYS_SHORT, formatDay, formatMonth, monthName, shiftDay, shiftMonth, weekdayOf } from '../utils/format';
import { COMMON, Tri, useL } from '../i18n/tri';

export type Period = { kind: 'all' } | { kind: 'month'; month: string } | { kind: 'day'; day: string };
export type PeriodKind = Period['kind'];

/** Does a YYYY-MM-DD day fall into the period? */
export const inPeriod = (day: string, p: Period) =>
  p.kind === 'all' || (p.kind === 'month' ? day.startsWith(p.month) : day === p.day);

/**
 * Period state that follows the real calendar: if "today" or "this month" is selected,
 * it moves on by itself when the date changes at midnight.
 */
export const usePeriod = (initial: PeriodKind = 'month') => {
  const today = useToday();
  const [period, setPeriod] = useState<Period>(() =>
    initial === 'day' ? { kind: 'day', day: today } : initial === 'month' ? { kind: 'month', month: today.slice(0, 7) } : { kind: 'all' }
  );
  const prevToday = useRef(today);
  useEffect(() => {
    const prev = prevToday.current;
    if (prev === today) return;
    prevToday.current = today;
    setPeriod((p) =>
      p.kind === 'day' && p.day === prev
        ? { kind: 'day', day: today }
        : p.kind === 'month' && p.month === prev.slice(0, 7)
        ? { kind: 'month', month: today.slice(0, 7) }
        : p
    );
  }, [today]);
  return [period, setPeriod] as const;
};

const KIND_LABEL: Record<PeriodKind, Tri> = {
  all: COMMON.all,
  month: { uz: 'Oy', uz_cyrl: 'Ой', ru: 'Месяц' },
  day: { uz: 'Kun', uz_cyrl: 'Кун', ru: 'День' },
};

const T = {
  prevMonth: { uz: 'Oldingi oy', uz_cyrl: 'Олдинги ой', ru: 'Предыдущий месяц' },
  nextMonth: { uz: 'Keyingi oy', uz_cyrl: 'Кейинги ой', ru: 'Следующий месяц' },
  prevYear: { uz: 'Oldingi yil', uz_cyrl: 'Олдинги йил', ru: 'Предыдущий год' },
  nextYear: { uz: 'Keyingi yil', uz_cyrl: 'Кейинги йил', ru: 'Следующий год' },
  prevDay: { uz: 'Oldingi kun', uz_cyrl: 'Олдинги кун', ru: 'Предыдущий день' },
  nextDay: { uz: 'Keyingi kun', uz_cyrl: 'Кейинги кун', ru: 'Следующий день' },
  thisMonth: { uz: 'Shu oy', uz_cyrl: 'Шу ой', ru: 'Этот месяц' },
} satisfies Record<string, Tri>;

const navBtn =
  'w-9 h-9 rounded-xl flex items-center justify-center text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition disabled:opacity-30 disabled:pointer-events-none';

/* ---------- Calendar popovers ---------- */

// Monday-first month grid; future days are disabled
const DayGrid: React.FC<{ value: string; today: string; onPick: (day: string) => void }> = ({ value, today, onPick }) => {
  const { lang } = useLanguage();
  const L = useL();
  const [view, setView] = useState(value.slice(0, 7));
  const first = `${view}-01`;
  const lead = (weekdayOf(first) + 6) % 7; // empty cells before the 1st
  const [y, m] = view.split('-').map(Number);
  const count = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => `${view}-${String(i + 1).padStart(2, '0')}`),
  ];
  const headers = [1, 2, 3, 4, 5, 6, 0].map((d) => WEEKDAYS_SHORT[lang][d]);

  return (
    <div className="w-[296px]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" className={navBtn} onClick={() => setView(shiftMonth(view, -1))} title={L(T.prevMonth)}>
          <ChevronLeft className="w-[18px] h-[18px]" />
        </button>
        <span className="text-sm font-semibold text-ink-900">{formatMonth(view, lang)}</span>
        <button
          type="button"
          className={navBtn}
          onClick={() => setView(shiftMonth(view, 1))}
          disabled={view >= today.slice(0, 7)}
          title={L(T.nextMonth)}
        >
          <ChevronRight className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {headers.map((h, i) => (
          <div key={h} className={clsx('h-7 text-[11px] font-semibold leading-7', i === 6 ? 'text-rose-500' : 'text-ink-400')}>
            {h}
          </div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`e${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              disabled={d > today}
              onClick={() => onPick(d)}
              className={clsx(
                'h-9 rounded-xl text-[13px] font-medium tabular-nums transition disabled:text-ink-200 disabled:pointer-events-none',
                d === value
                  ? 'bg-brand-500 text-white'
                  : d === today
                  ? 'text-brand-500 ring-1 ring-inset ring-brand-200 hover:bg-brand-50'
                  : weekdayOf(d) === 0
                  ? 'text-rose-500 hover:bg-ink-100'
                  : 'text-ink-700 hover:bg-ink-100'
              )}
            >
              {Number(d.slice(8))}
            </button>
          )
        )}
      </div>
      <button
        type="button"
        onClick={() => onPick(today)}
        className="mt-2 w-full h-9 rounded-xl text-[13px] font-semibold text-brand-500 hover:bg-brand-50 transition"
      >
        {L(COMMON.today)}
      </button>
    </div>
  );
};

// Year header with 12 months; future months are disabled
const MonthGrid: React.FC<{ value: string; today: string; onPick: (month: string) => void }> = ({ value, today, onPick }) => {
  const { lang } = useLanguage();
  const L = useL();
  const [year, setYear] = useState(Number(value.slice(0, 4)));
  const thisMonth = today.slice(0, 7);

  return (
    <div className="w-[296px]">
      <div className="flex items-center justify-between mb-2">
        <button type="button" className={navBtn} onClick={() => setYear(year - 1)} title={L(T.prevYear)}>
          <ChevronLeft className="w-[18px] h-[18px]" />
        </button>
        <span className="text-sm font-semibold text-ink-900 tabular-nums">{year}</span>
        <button type="button" className={navBtn} onClick={() => setYear(year + 1)} disabled={year >= Number(today.slice(0, 4))} title={L(T.nextYear)}>
          <ChevronRight className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 12 }, (_, i) => {
          const mk = `${year}-${String(i + 1).padStart(2, '0')}`;
          return (
            <button
              key={mk}
              type="button"
              disabled={mk > thisMonth}
              onClick={() => onPick(mk)}
              className={clsx(
                'h-10 rounded-xl text-[13px] font-medium transition disabled:text-ink-200 disabled:pointer-events-none',
                mk === value
                  ? 'bg-brand-500 text-white'
                  : mk === thisMonth
                  ? 'text-brand-500 ring-1 ring-inset ring-brand-200 hover:bg-brand-50'
                  : 'text-ink-700 hover:bg-ink-100'
              )}
            >
              {monthName(i + 1, lang)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onPick(thisMonth)}
        className="mt-2 w-full h-9 rounded-xl text-[13px] font-semibold text-brand-500 hover:bg-brand-50 transition"
      >
        {L(T.thisMonth)}
      </button>
    </div>
  );
};

/* ---------- Picker ---------- */

interface PeriodPickerProps {
  value: Period;
  onChange: (p: Period) => void;
  /** Which kinds the user can switch between; one kind hides the switch */
  kinds?: PeriodKind[];
}

/** [Hammasi | Oy | Kun]  ‹ 📅 12 okt 2026 › — the label opens a real calendar */
export const PeriodPicker: React.FC<PeriodPickerProps> = ({ value, onChange, kinds = ['all', 'month', 'day'] }) => {
  const { lang } = useLanguage();
  const L = useL();
  const today = useToday();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchKind = (kind: PeriodKind) => {
    setOpen(false);
    if (kind === value.kind) return;
    if (kind === 'all') return onChange({ kind });
    if (kind === 'month') return onChange({ kind, month: value.kind === 'day' ? value.day.slice(0, 7) : today.slice(0, 7) });
    // Day: keep the chosen month, defaulting to today in the current month
    const month = value.kind === 'month' ? value.month : today.slice(0, 7);
    onChange({ kind, day: month === today.slice(0, 7) ? today : `${month}-01` });
  };

  const step = (n: number) => {
    if (value.kind === 'month') onChange({ kind: 'month', month: shiftMonth(value.month, n) });
    if (value.kind === 'day') onChange({ kind: 'day', day: shiftDay(value.day, n) });
  };
  const atEnd =
    (value.kind === 'month' && value.month >= today.slice(0, 7)) || (value.kind === 'day' && value.day >= today);

  const label =
    value.kind === 'month'
      ? formatMonth(value.month, lang)
      : value.kind === 'day'
      ? value.day === today
        ? `${L(COMMON.today)}, ${formatDay(value.day, lang)}`
        : formatDay(value.day, lang)
      : '';

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {kinds.length > 1 && (
        <div className="inline-flex gap-1 p-1 bg-white rounded-xl2 shadow-card">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchKind(k)}
              className={clsx(
                'h-9 px-3.5 rounded-xl text-[13px] font-semibold transition whitespace-nowrap',
                k === value.kind ? 'bg-brand-500 text-white' : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
              )}
            >
              {L(KIND_LABEL[k])}
            </button>
          ))}
        </div>
      )}

      {value.kind !== 'all' && (
        <div ref={boxRef} className="relative inline-flex items-center gap-1 p-1 bg-white rounded-xl2 shadow-card">
          <button type="button" onClick={() => step(-1)} title={L(value.kind === 'day' ? T.prevDay : T.prevMonth)} className={navBtn}>
            <ChevronLeft className="w-[18px] h-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={clsx(
              'h-9 px-3 min-w-[9.5rem] rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold whitespace-nowrap transition',
              open ? 'bg-brand-50 text-brand-500' : 'text-ink-900 hover:bg-ink-100'
            )}
          >
            <CalendarDays className="w-4 h-4 text-brand-500" />
            {label}
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            title={L(value.kind === 'day' ? T.nextDay : T.nextMonth)}
            className={navBtn}
          >
            <ChevronRight className="w-[18px] h-[18px]" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 z-40 p-3 bg-white rounded-card shadow-pop">
              {value.kind === 'day' ? (
                <DayGrid
                  value={value.day}
                  today={today}
                  onPick={(day) => {
                    onChange({ kind: 'day', day });
                    setOpen(false);
                  }}
                />
              ) : (
                <MonthGrid
                  value={value.month}
                  today={today}
                  onPick={(month) => {
                    onChange({ kind: 'month', month });
                    setOpen(false);
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
