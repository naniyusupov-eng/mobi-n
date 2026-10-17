import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Banknote, Eye, Landmark, NotebookPen, Wallet } from 'lucide-react';
import { Line, Order, OrderStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { dayKey, formatDateTime, formatDay, formatMonth, routeLabel } from '../../utils/format';
import { Period, inPeriod } from '../../components/PeriodPicker';
import { Button, Card, CardTitle, IconCircle, Money, Pill, Table, Td, Th, Tone, TONE } from '../../components/ui';
import { COMMON, fmt, useL } from '../../i18n/tri';

const API = 'http://localhost:3000/api/v1';

const T = {
  allTime: { uz: 'Butun davr', uz_cyrl: 'Бутун давр', ru: 'Весь период' },
  allChip: { uz: 'Barchasi', uz_cyrl: 'Барчаси', ru: 'Все' },
  ordersAndReceipts: { uz: 'Buyurtmalar va cheklar', uz_cyrl: 'Буюртмалар ва чеклар', ru: 'Заказы и чеки' },
  nPcs: { uz: '{n} ta', uz_cyrl: '{n} та', ru: '{n} шт' },
  nShops: { uz: '{n} ta doʻkon', uz_cyrl: '{n} та дўкон', ru: '{n} магазинов' },
  empty: { uz: 'Bu davrda buyurtmalar yoʻq', uz_cyrl: 'Бу даврда буюртмалар йўқ', ru: 'За этот период заказов нет' },
};

const STATUS_TONE: Record<OrderStatus, Tone> = {
  new: 'amber',
  confirmed: 'brand',
  delivered: 'green',
  cancelled: 'red',
};

const formatShopNum = (num?: number) =>
  num == null ? '' : Number.isInteger(num) ? String(num) : `${Math.floor(num)}a`;

/** Pill-shaped filter chip */
const Chip: React.FC<{ active: boolean; onClick: () => void; title?: string; children: React.ReactNode }> = ({
  active,
  onClick,
  title,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={clsx(
      'h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition',
      active ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-500'
    )}
  >
    {children}
  </button>
);

interface LineOrdersProps {
  orders: Order[];
  period: Period; // all time, a month or a single day
  lineFilter: string; // '' = all lines
  onLineChange: (code: string) => void;
  onViewOrder: (order: Order) => void;
}

interface Debtor {
  lineCode?: string;
  day?: number;
  debtBalance: number;
}

// Orders and receipts of all lines or one line for a period, amounts after returns
export const LineOrders: React.FC<LineOrdersProps> = ({ orders, period, lineFilter, onLineChange: setLineFilter, onViewOrder }) => {
  const { t, lang } = useLanguage();
  const L = useL();

  const [lines, setLines] = useState<Line[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);

  useEffect(() => {
    fetch(`${API}/lines`)
      .then((r) => r.json())
      .then((d) => setLines(d.lines || []))
      .catch(() => {});
    fetch(`${API}/debts`)
      .then((r) => r.json())
      .then((d) => setDebtors(d.debtors || []))
      .catch(() => {});
  }, []);

  // Everything below is scoped to the chosen line and period (days in Tashkent time)
  const scoped = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'cancelled' && (!lineFilter || o.lineCode === lineFilter) && inPeriod(dayKey(o.createdAt), period)
      ),
    [orders, lineFilter, period]
  );

  // Sales after returns (vozvrat)
  const net = (o: Order) => o.finalAmount - (o.returnedAmount || 0);
  const sumBy = (method?: string) =>
    scoped.filter((o) => !method || o.paymentMethod === method).reduce((sum, o) => sum + net(o), 0);
  const totalReturns = scoped.reduce((sum, o) => sum + (o.returnedAmount || 0), 0);
  const totalRevenue = sumBy();
  const revenueCards: { label: string; value: number; icon: typeof Wallet; tone: Tone }[] = [
    { label: t('rev_total'), value: totalRevenue, icon: Wallet, tone: 'brand' },
    { label: t('rev_cash'), value: sumBy('naqd'), icon: Banknote, tone: 'green' },
    { label: t('rev_debt'), value: sumBy('nasiya'), icon: NotebookPen, tone: 'amber' },
    { label: t('rev_bank'), value: sumBy('otkazma'), icon: Landmark, tone: 'violet' },
  ];

  // Debt is a current balance, not tied to the period
  const lineDebtors = debtors.filter((d) => !lineFilter || d.lineCode === lineFilter);
  const lineDebt = lineDebtors.reduce((sum, d) => sum + d.debtBalance, 0);
  const avgCheck = scoped.length > 0 ? Math.round(totalRevenue / scoped.length) : 0;
  const periodLabel =
    period.kind === 'day' ? formatDay(period.day, lang) : period.kind === 'month' ? formatMonth(period.month, lang) : L(T.allTime);
  const scopeLabel = lineFilter || L(COMMON.allLines);

  return (
    <div className="space-y-5">
      {/* Line & day selector */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="w-12 shrink-0 pt-2 text-[13px] font-medium text-ink-400">{L(COMMON.line)}</span>
          <div className="flex flex-wrap gap-2 min-w-0">
            <Chip
              active={!lineFilter}
              onClick={() => setLineFilter('')}
            >
              {L(T.allChip)}
            </Chip>
            {lines.map((l) => (
              <Chip key={l.id} active={lineFilter === l.code} onClick={() => setLineFilter(l.code)}>
                {l.code}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      {/* Revenue structure (net of returns) */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <h3 className="text-[17px] font-bold tracking-tight text-ink-900">{t('rev_structure')}</h3>
          <Pill tone="brand">{scopeLabel}</Pill>
          <Pill tone="gray">{periodLabel}</Pill>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {revenueCards.map((card) => {
            const share = totalRevenue > 0 ? (card.value / totalRevenue) * 100 : 0;
            return (
              <Card key={card.label} className="flex flex-col gap-2.5 min-w-0">
                <IconCircle icon={card.icon} tone={card.tone} />
                <div className="text-sm text-ink-500 truncate">{card.label}</div>
                <div className="text-[26px] leading-tight font-bold tracking-tight text-ink-900 truncate">
                  <Money value={card.value} />
                </div>
                <div className="h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
                  <div className={clsx('h-full rounded-full', TONE[card.tone].solid)} style={{ width: `${share}%` }} />
                </div>
                <div className="text-[13px] text-ink-400 tabular-nums">
                  {share.toFixed(0)}% {t('share')}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Orders and receipts of the chosen line */}
      <Card>
          <CardTitle
            title={
              <span className="flex items-center gap-2">
                {L(T.ordersAndReceipts)} <Pill tone="brand">{scopeLabel}</Pill> <Pill tone="gray">{periodLabel}</Pill>
              </span>
            }
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <Pill tone="gray">
              {L(COMMON.orders)}: <span className="text-ink-900">{fmt(L(T.nPcs), { n: scoped.length })}</span>
            </Pill>
            <Pill tone="brand">
              {t('col_avg_check')}: <Money value={avgCheck} />
            </Pill>
            <Pill tone="red">
              {L(COMMON.returns)}: <Money value={totalReturns} />
            </Pill>
            <Pill tone="amber">
              {L(COMMON.debt)}: <Money value={lineDebt} /> <span className="opacity-70">({fmt(L(T.nShops), { n: lineDebtors.length })})</span>
            </Pill>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>{t('col_date')}</Th>
                <Th>{L(COMMON.route)}</Th>
                <Th>{t('col_client')}</Th>
                <Th>{t('col_payment_type')}</Th>
                <Th align="right">{t('col_sum')}</Th>
                <Th align="right">{L(COMMON.returns)}</Th>
                <Th align="center">{t('col_status')}</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {scoped.length === 0 && (
                <tr>
                  <Td colSpan={8} align="center" className="py-10 text-ink-400">
                    {L(T.empty)}
                  </Td>
                </tr>
              )}
              {scoped.map((order) => (
                <tr key={order.id} className="hover:bg-ink-100/40 transition">
                  <Td className="whitespace-nowrap text-ink-500">{formatDateTime(order.createdAt, lang)}</Td>
                  <Td className="whitespace-nowrap">
                    <Pill tone="brand">
                      {routeLabel(order.lineCode, order.routeDay) || '—'}
                    </Pill>
                    {order.shopNum != null && <span className="ml-2 text-ink-400">№{formatShopNum(order.shopNum)}</span>}
                  </Td>
                  <Td className="font-semibold text-ink-900 max-w-[16rem]">
                    <span className="block truncate" title={order.shopName}>
                      {order.shopName}
                    </span>
                  </Td>
                  <Td className={clsx('whitespace-nowrap', order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-ink-500')}>
                    {order.paymentMethod === 'naqd'
                      ? t('pay_cash')
                      : order.paymentMethod === 'nasiya'
                      ? t('pay_debt')
                      : t('pay_bank')}
                  </Td>
                  <Td align="right" className="font-semibold text-ink-900">
                    <Money value={order.finalAmount} />
                  </Td>
                  <Td align="right">
                    {order.returnedAmount ? (
                      <span className="text-rose-600 whitespace-nowrap">
                        −<Money value={order.returnedAmount} />
                      </span>
                    ) : (
                      <span className="text-ink-200">—</span>
                    )}
                  </Td>
                  <Td align="center">
                    <Pill tone={STATUS_TONE[order.status] || 'amber'}>
                      {order.status === 'confirmed'
                        ? t('status_confirmed')
                        : order.status === 'delivered'
                        ? t('status_delivered')
                        : order.status === 'cancelled'
                        ? t('status_cancelled')
                        : t('status_new')}
                    </Pill>
                  </Td>
                  <Td align="right">
                    <Button variant="secondary" size="sm" icon={Eye} onClick={() => onViewOrder(order)}>
                      {L(COMMON.receipt)}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
      </Card>
    </div>
  );
};
