import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CalendarClock, HandCoins, Pencil, RefreshCw, Target, Truck, UserCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { BUSINESS_TZ, formatDay, formatMonth } from '../../utils/format';
import { Button, Card, EmptyState, Field, Modal, Money, Pill, StatCard, Table, Td, Th, formatSum } from '../../components/ui';
import { COMMON, Tri, fmt, useL } from '../../i18n/tri';
import { API, apiFetch } from '../../api';

interface Loc {
  lat: number;
  lng: number;
}

interface Workday {
  startAt: string;
  startLoc?: Loc | null;
  endAt?: string;
  endLoc?: Loc | null;
}

interface WorkdayLine {
  line: string;
  agent: { workday: Workday | null; orders: number; sales: number };
  driver: { workday: Workday | null; toDeliver: number; delivered: number; cash: number };
  month: { sales: number; plan: number; percent: number | null };
}

const T = {
  agent: { uz: 'Agent', uz_cyrl: 'Агент', ru: 'Агент' },
  driver: { uz: 'Haydovchi', uz_cyrl: 'Ҳайдовчи', ru: 'Водитель' },
  month: { uz: 'Oy rejasi', uz_cyrl: 'Ой режаси', ru: 'План месяца' },
  start: { uz: 'Boshladi', uz_cyrl: 'Бошлади', ru: 'Начало' },
  end: { uz: 'Tugatdi', uz_cyrl: 'Тугатди', ru: 'Конец' },
  atWork: { uz: 'ishda', uz_cyrl: 'ишда', ru: 'на работе' },
  notStarted: { uz: 'boshlamagan', uz_cyrl: 'бошламаган', ru: 'не начинал' },
  delivered: { uz: 'Yetkazildi', uz_cyrl: 'Етказилди', ru: 'Доставлено' },
  cash: { uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' },
  salesPlan: { uz: 'Savdo / reja', uz_cyrl: 'Савдо / режа', ru: 'Продажи / план' },
  noPlan: { uz: 'reja yoʻq', uz_cyrl: 'режа йўқ', ru: 'нет плана' },
  editPlan: { uz: 'Rejani oʻzgartirish', uz_cyrl: 'Режани ўзгартириш', ru: 'Изменить план' },
  planAmount: { uz: 'Oylik reja summasi', uz_cyrl: 'Ойлик режа суммаси', ru: 'Сумма плана на месяц' },
  planHint: { uz: '0 — rejani olib tashlash', uz_cyrl: '0 — режани олиб ташлаш', ru: '0 — удалить план' },
  planSaveError: {
    uz: 'Rejani saqlab boʻlmadi. Qaytadan urinib koʻring.',
    uz_cyrl: 'Режани сақлаб бўлмади. Қайтадан уриниб кўринг.',
    ru: 'Не удалось сохранить план. Попробуйте ещё раз.',
  },
  openMap: { uz: 'Xaritada ochish', uz_cyrl: 'Харитада очиш', ru: 'Открыть на карте' },
  refresh: { uz: 'Yangilash', uz_cyrl: 'Янгилаш', ru: 'Обновить' },
  working: { uz: 'Ishga chiqqan liniyalar', uz_cyrl: 'Ишга чиққан линиялар', ru: 'Линии на работе' },
  ofLines: { uz: 'jami {n} ta liniya', uz_cyrl: 'жами {n} та линия', ru: 'всего линий: {n}' },
  deliveries: { uz: 'Yetkazishlar', uz_cyrl: 'Етказишлар', ru: 'Доставки' },
  deliveriesNote: { uz: 'yetkazildi / jami', uz_cyrl: 'етказилди / жами', ru: 'доставлено / всего' },
  cashCollected: { uz: 'Yigʻilgan naqd', uz_cyrl: 'Йиғилган нақд', ru: 'Собрано наличных' },
  monthSales: { uz: 'Oy savdosi', uz_cyrl: 'Ой савдоси', ru: 'Продажи за месяц' },
  ofPlan: { uz: 'reja {sum} • {p}%', uz_cyrl: 'режа {sum} • {p}%', ru: 'план {sum} • {p}%' },
  empty: { uz: 'Liniyalar yoʻq', uz_cyrl: 'Линиялар йўқ', ru: 'Линий нет' },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
} satisfies Record<string, Tri>;

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const formatTime = (iso: string) => timeFmt.format(new Date(iso));

const mapUrl = (loc: Loc) => `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;

/** A time, as a Google Maps link when the phone sent its location */
const TimeLink: React.FC<{ at: string; loc?: Loc | null; title: string }> = ({ at, loc, title }) =>
  loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) ? (
    <a href={mapUrl(loc)} target="_blank" rel="noreferrer" title={title} className="tabular-nums font-semibold text-brand-500 hover:underline">
      {formatTime(at)}
    </a>
  ) : (
    <span className="tabular-nums font-semibold text-ink-900">{formatTime(at)}</span>
  );

// Start / end of a work day: "ishda" while it runs, "boshlamagan" without one
const WorkdayCell: React.FC<{ workday: Workday | null }> = ({ workday }) => {
  const L = useL();
  if (!workday?.startAt) return <Pill tone="gray">{L(T.notStarted)}</Pill>;
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <TimeLink at={workday.startAt} loc={workday.startLoc} title={L(T.openMap)} />
      <span className="text-ink-400">—</span>
      {workday.endAt ? (
        <TimeLink at={workday.endAt} loc={workday.endLoc} title={L(T.openMap)} />
      ) : (
        <Pill tone="green" className="!py-0.5">
          {L(T.atWork)}
        </Pill>
      )}
    </div>
  );
};

const ProgressBar: React.FC<{ percent: number }> = ({ percent }) => (
  <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
    <div
      className={clsx('h-full rounded-full', percent >= 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-brand-500' : 'bg-amber-500')}
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

interface WorkdayTabProps {
  day: string; // YYYY-MM-DD
}

// Who started and ended the work day on each line, what they did, and the month's plan progress
export const WorkdayTab: React.FC<WorkdayTabProps> = ({ day }) => {
  const { lang } = useLanguage();
  const L = useL();
  const [lines, setLines] = useState<WorkdayLine[]>([]);
  const [month, setMonth] = useState(day.slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  const [planLine, setPlanLine] = useState<WorkdayLine | null>(null);
  const [planValue, setPlanValue] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/workdays?date=${day}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setLines(d.lines || []);
        setMonth(d.month || day.slice(0, 7));
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [day, reload]);

  const openPlan = (l: WorkdayLine) => {
    setPlanLine(l);
    setPlanValue(l.month.plan > 0 ? String(l.month.plan) : '');
    setPlanError(false);
  };

  const savePlan = async () => {
    if (!planLine) return;
    const amount = Math.max(0, Math.round(Number(planValue.replace(/\s/g, '')) || 0));
    setPlanSaving(true);
    setPlanError(false);
    try {
      const res = await apiFetch(`${API}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, line: planLine.line, amount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPlanLine(null);
      setReload((n) => n + 1);
    } catch {
      setPlanError(true);
    } finally {
      setPlanSaving(false);
    }
  };

  const working = lines.filter((l) => l.agent.workday?.startAt).length;
  const delivered = lines.reduce((s, l) => s + l.driver.delivered, 0);
  const toDeliver = lines.reduce((s, l) => s + l.driver.toDeliver, 0);
  const cash = lines.reduce((s, l) => s + l.driver.cash, 0);
  const monthSales = lines.reduce((s, l) => s + l.month.sales, 0);
  const totalPlan = lines.reduce((s, l) => s + l.month.plan, 0);
  const totalPercent = totalPlan > 0 ? Math.round((monthSales / totalPlan) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={UserCheck}
          tone="brand"
          label={L(T.working)}
          value={working}
          note={`${fmt(L(T.ofLines), { n: lines.length })} • ${formatDay(day, lang)}`}
        />
        <StatCard icon={Truck} tone="violet" label={L(T.deliveries)} value={`${delivered} / ${toDeliver}`} note={L(T.deliveriesNote)} />
        <StatCard icon={HandCoins} tone="green" label={L(T.cashCollected)} value={<Money value={cash} />} />
        <StatCard
          icon={Target}
          tone="amber"
          label={`${L(T.monthSales)} • ${formatMonth(month, lang)}`}
          value={<Money value={monthSales} />}
          note={totalPercent != null ? fmt(L(T.ofPlan), { sum: formatSum(totalPlan), p: totalPercent }) : L(T.noPlan)}
        />
      </div>

      <Card padded={false} className="p-3 md:p-4">
        <div className="flex justify-end mb-2">
          <Button variant="white" size="sm" icon={RefreshCw} onClick={() => setReload((n) => n + 1)} title={L(T.refresh)} />
        </div>
        {lines.length === 0 ? (
          error ? (
            <EmptyState icon={CalendarClock} title={L(COMMON.error)} hint={L(COMMON.loadError)} />
          ) : loading ? (
            <EmptyState icon={CalendarClock} title={L(COMMON.loading)} />
          ) : (
            <EmptyState icon={CalendarClock} title={L(T.empty)} />
          )
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{L(COMMON.line)}</Th>
                <Th>
                  {L(T.agent)}: {L(T.start)} — {L(T.end)}
                </Th>
                <Th align="right">{L(COMMON.orders)}</Th>
                <Th align="right">{L(COMMON.sales)}</Th>
                <Th>
                  {L(T.driver)}: {L(T.start)} — {L(T.end)}
                </Th>
                <Th align="right">{L(T.delivered)}</Th>
                <Th align="right">{L(T.cash)}</Th>
                <Th className="min-w-[220px]">
                  {L(T.month)} • {L(T.salesPlan)}
                </Th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.line} className="hover:bg-ink-100/40">
                  <Td>
                    <Pill tone="brand">{l.line}</Pill>
                  </Td>
                  <Td>
                    <WorkdayCell workday={l.agent.workday} />
                  </Td>
                  <Td align="right" className="tabular-nums font-semibold text-ink-900">
                    {l.agent.orders}
                  </Td>
                  <Td align="right">
                    <Money value={l.agent.sales} className="font-semibold text-ink-900" />
                  </Td>
                  <Td>
                    <WorkdayCell workday={l.driver.workday} />
                  </Td>
                  <Td align="right" className="tabular-nums whitespace-nowrap">
                    <span className={clsx('font-semibold', l.driver.toDeliver > 0 && l.driver.delivered >= l.driver.toDeliver ? 'text-emerald-600' : 'text-ink-900')}>
                      {l.driver.delivered}
                    </span>
                    <span className="text-ink-400"> / {l.driver.toDeliver}</span>
                  </Td>
                  <Td align="right">
                    <Money value={l.driver.cash} className="font-semibold text-ink-900" />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 text-[13px] whitespace-nowrap">
                          <span className="tabular-nums">
                            <span className="font-semibold text-ink-900">{formatSum(l.month.sales)}</span>
                            <span className="text-ink-400"> / {l.month.plan > 0 ? formatSum(l.month.plan) : L(T.noPlan)}</span>
                          </span>
                          {l.month.percent != null ? (
                            <span className="font-semibold tabular-nums text-ink-700">{Math.round(l.month.percent)}%</span>
                          ) : null}
                        </div>
                        {l.month.percent != null ? (
                          <div className="mt-1.5">
                            <ProgressBar percent={l.month.percent} />
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => openPlan(l)}
                        title={L(T.editPlan)}
                        aria-label={L(T.editPlan)}
                        className="w-7 h-7 rounded-full text-ink-400 hover:bg-brand-50 hover:text-brand-500 flex items-center justify-center shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(planLine)}
        onClose={() => !planSaving && setPlanLine(null)}
        width="sm"
        title={L(T.editPlan)}
        subtitle={planLine ? `${planLine.line} • ${formatMonth(month, lang)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlanLine(null)} disabled={planSaving}>
              {L(COMMON.cancel)}
            </Button>
            <Button onClick={() => savePlan()} disabled={planSaving}>
              {planSaving ? L(T.saving) : L(COMMON.save)}
            </Button>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            savePlan();
          }}
        >
          <Field
            label={L(T.planAmount)}
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            autoFocus
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
            suffix={L(COMMON.som)}
            hint={L(T.planHint)}
          />
          {planError ? <div className="text-[13px] text-rose-600">{L(T.planSaveError)}</div> : null}
        </form>
      </Modal>
    </div>
  );
};

export default WorkdayTab;
