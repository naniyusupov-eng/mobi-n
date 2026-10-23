import React, { useMemo, useState } from 'react';
import { CompanySettings, Order } from '../types';
import { Period, PeriodPicker, usePeriod } from '../components/PeriodPicker';
import { Segmented } from '../components/ui';
import { MonthlySales } from './reports/MonthlySales';
import { LineOrders } from './reports/LineOrders';
import { ReturnsTab } from './reports/ReturnsTab';
import { LoadingSheet } from './reports/LoadingSheet';
import { CashTab } from './reports/CashTab';
import { WorkdayTab } from './reports/WorkdayTab';
import { Tri, useL } from '../i18n/tri';

type Tab = 'monthly' | 'line' | 'loading' | 'cash' | 'workday' | 'returns';

const TABS: { key: Tab; label: Tri }[] = [
  { key: 'monthly', label: { uz: 'Oylik savdo', uz_cyrl: 'Ойлик савдо', ru: 'Продажи за месяц' } },
  { key: 'line', label: { uz: 'Liniya buyurtmalari', uz_cyrl: 'Линия буюртмалари', ru: 'Заказы по линиям' } },
  { key: 'loading', label: { uz: 'Yuk varaqasi', uz_cyrl: 'Юк варақаси', ru: 'Погрузочный лист' } },
  { key: 'cash', label: { uz: 'Kassa', uz_cyrl: 'Касса', ru: 'Касса' } },
  { key: 'workday', label: { uz: 'Ish kuni', uz_cyrl: 'Иш куни', ru: 'Рабочий день' } },
  { key: 'returns', label: { uz: 'Vozvratlar', uz_cyrl: 'Возвратлар', ru: 'Возвраты' } },
];

interface ReportsProps {
  orders: Order[];
  company: CompanySettings;
  onViewOrder: (order: Order) => void;
}

export const Reports: React.FC<ReportsProps> = ({ orders, company, onViewOrder }) => {
  const L = useL();
  const [tab, setTab] = useState<Tab>('monthly');
  // Each tab keeps its own period; all of them follow the real calendar
  const [monthPeriod, setMonthPeriod] = usePeriod('month');
  const [linePeriod, setLinePeriod] = usePeriod('month');
  const [returnsPeriod, setReturnsPeriod] = usePeriod('month');
  // Loading sheets are for the next delivery day, so they start at tomorrow
  const [loadingPeriod, setLoadingPeriod] = usePeriod('day', 1);
  const [cashPeriod, setCashPeriod] = usePeriod('day');
  const [workdayPeriod, setWorkdayPeriod] = usePeriod('day');
  const [lineCode, setLineCode] = useState('');

  // A click in the monthly table opens that line's orders for the clicked day (or month)
  const openLineOrders = (code: string, period: Period) => {
    setLineCode(code);
    setLinePeriod(period);
    setTab('line');
    // The page scrolls inside <main>, not the window
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reload stats when orders or returns change (orders are polled every few seconds)
  const refreshKey = useMemo(
    () =>
      `${orders.length}:${orders.reduce((s, o) => s + o.finalAmount + (o.returnedAmount || 0), 0)}:${orders.filter((o) => o.status === 'cancelled').length}`,
    [orders]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={TABS.map((x) => ({ key: x.key, label: L(x.label) }))} value={tab} onChange={setTab} />
        {tab === 'monthly' && <PeriodPicker kinds={['month']} value={monthPeriod} onChange={setMonthPeriod} />}
        {tab === 'line' && <PeriodPicker value={linePeriod} onChange={setLinePeriod} />}
        {tab === 'loading' && <PeriodPicker kinds={['day']} allowFuture value={loadingPeriod} onChange={setLoadingPeriod} />}
        {tab === 'cash' && <PeriodPicker kinds={['day']} value={cashPeriod} onChange={setCashPeriod} />}
        {tab === 'workday' && <PeriodPicker kinds={['day']} value={workdayPeriod} onChange={setWorkdayPeriod} />}
        {tab === 'returns' && <PeriodPicker kinds={['month', 'day']} value={returnsPeriod} onChange={setReturnsPeriod} />}
      </div>

      {tab === 'monthly' && monthPeriod.kind === 'month' && (
        <MonthlySales month={monthPeriod.month} company={company} refreshKey={refreshKey} onOpen={openLineOrders} />
      )}
      {tab === 'line' && <LineOrders
          orders={orders}
          period={linePeriod}
          lineFilter={lineCode}
          onLineChange={setLineCode}
          onViewOrder={onViewOrder}
        />}
      {tab === 'loading' && loadingPeriod.kind === 'day' && <LoadingSheet day={loadingPeriod.day} />}
      {tab === 'cash' && cashPeriod.kind === 'day' && <CashTab day={cashPeriod.day} />}
      {tab === 'workday' && workdayPeriod.kind === 'day' && <WorkdayTab day={workdayPeriod.day} />}
      {tab === 'returns' && <ReturnsTab period={returnsPeriod} refreshKey={refreshKey} />}
    </div>
  );
};
