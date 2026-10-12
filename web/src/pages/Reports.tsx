import React, { useMemo, useState } from 'react';
import { CompanySettings, Order } from '../types';
import { Period, PeriodPicker, usePeriod } from '../components/PeriodPicker';
import { Segmented } from '../components/ui';
import { MonthlySales } from './reports/MonthlySales';
import { LineOrders } from './reports/LineOrders';
import { ReturnsTab } from './reports/ReturnsTab';

type Tab = 'monthly' | 'line' | 'returns';

const TABS: { key: Tab; label: string }[] = [
  { key: 'monthly', label: 'Oylik savdo' },
  { key: 'line', label: 'Liniya buyurtmalari' },
  { key: 'returns', label: 'Vozvratlar' },
];

interface ReportsProps {
  orders: Order[];
  company: CompanySettings;
  onViewOrder: (order: Order) => void;
}

export const Reports: React.FC<ReportsProps> = ({ orders, company, onViewOrder }) => {
  const [tab, setTab] = useState<Tab>('monthly');
  // Each tab keeps its own period; all of them follow the real calendar
  const [monthPeriod, setMonthPeriod] = usePeriod('month');
  const [linePeriod, setLinePeriod] = usePeriod('month');
  const [returnsPeriod, setReturnsPeriod] = usePeriod('month');
  const [lineCode, setLineCode] = useState('');

  // A click in the monthly table opens that line's orders for the clicked day (or month)
  const openLineOrders = (code: string, period: Period) => {
    setLineCode(code);
    setLinePeriod(period);
    setTab('line');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reload stats when orders or returns change (orders are polled every few seconds)
  const refreshKey = useMemo(
    () => `${orders.length}:${orders.reduce((s, o) => s + o.finalAmount + (o.returnedAmount || 0), 0)}`,
    [orders]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === 'monthly' && <PeriodPicker kinds={['month']} value={monthPeriod} onChange={setMonthPeriod} />}
        {tab === 'line' && <PeriodPicker value={linePeriod} onChange={setLinePeriod} />}
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
      {tab === 'returns' && <ReturnsTab period={returnsPeriod} refreshKey={refreshKey} />}
    </div>
  );
};
