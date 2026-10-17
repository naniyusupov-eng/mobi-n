import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, RotateCcw, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { dayKey, formatWeekdayDay, shiftDay } from '../utils/format';
import { useToday } from '../hooks/useNow';
import { HeroCard, HeroPill, Money, StatCard } from '../components/ui';
import { COMMON, Tri, fmt, useL } from '../i18n/tri';

const T = {
  todayNet: { uz: 'Bugungi sof savdo', uz_cyrl: 'Бугунги соф савдо', ru: 'Чистые продажи за сегодня' },
  noYesterday: { uz: 'kecha savdo yoʻq', uz_cyrl: 'кеча савдо йўқ', ru: 'вчера продаж не было' },
  vsYesterday: { uz: '{n}% kechagidan', uz_cyrl: '{n}% кечагидан', ru: '{n}% ко вчера' },
  ordersCount: { uz: '{n} ta buyurtma', uz_cyrl: '{n} та буюртма', ru: 'заказов: {n}' },
  returnNote: {
    uz: 'savdoning {p}% • {n} buyurtma',
    uz_cyrl: 'савдонинг {p}% • {n} буюртма',
    ru: '{p}% продаж • заказов: {n}',
  },
  debt: { uz: 'Qarzdorlik', uz_cyrl: 'Қарздорлик', ru: 'Задолженность' },
  debtors: { uz: '{n} ta doʻkonda', uz_cyrl: '{n} та дўконда', ru: 'у {n} магазинов' },
} satisfies Record<string, Tri>;

interface DashboardProps {
  orders: Order[];
  totalDebt: number;
  debtorsCount: number;
}

const net = (o: Order) => o.finalAmount - (o.returnedAmount || 0);

export const Dashboard: React.FC<DashboardProps> = ({ orders, totalDebt, debtorsCount }) => {
  const { lang } = useLanguage();
  const L = useL();
  const today = useToday(); // Tashkent day; rolls over by itself at midnight

  // Today's figures (cancelled orders excluded) and yesterday's net for the trend
  const stats = useMemo(() => {
    const yesterday = shiftDay(today, -1);

    let todayNet = 0;
    let todayReturned = 0;
    let todayGross = 0;
    let todayCount = 0;
    let todayReturnOrders = 0;
    let yesterdayNet = 0;

    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const k = dayKey(o.createdAt);
      if (k === yesterday) yesterdayNet += net(o);
      if (k !== today) continue;
      const ret = o.returnedAmount || 0;
      todayNet += net(o);
      todayGross += o.finalAmount;
      todayReturned += ret;
      todayCount += 1;
      if (ret > 0) todayReturnOrders += 1;
    }
    return { todayNet, todayReturned, todayGross, todayCount, todayReturnOrders, yesterdayNet };
  }, [orders, today]);

  const trend =
    stats.yesterdayNet > 0 ? Math.round(((stats.todayNet - stats.yesterdayNet) / stats.yesterdayNet) * 100) : null;
  const returnShare = stats.todayGross > 0 ? Math.round((stats.todayReturned / stats.todayGross) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <HeroCard
        icon={TrendingUp}
        label={L(T.todayNet)}
        value={<Money value={stats.todayNet} />}
        badge={<HeroPill>{formatWeekdayDay(today, lang)}</HeroPill>}
      >
        <HeroPill solid>
          {trend === null ? (
            L(T.noYesterday)
          ) : (
            <>
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {fmt(L(T.vsYesterday), { n: `${trend >= 0 ? '+' : ''}${trend}` })}
            </>
          )}
        </HeroPill>
        <HeroPill>
          <ShoppingBag className="w-3.5 h-3.5" />
          {fmt(L(T.ordersCount), { n: stats.todayCount })}
        </HeroPill>
      </HeroCard>
      <StatCard
        icon={RotateCcw}
        tone="red"
        label={L(COMMON.returns)}
        value={<Money value={stats.todayReturned} />}
        note={fmt(L(T.returnNote), { p: returnShare, n: stats.todayReturnOrders })}
        className="min-w-0"
      />
      <StatCard
        icon={Wallet}
        tone="amber"
        label={L(T.debt)}
        value={<Money value={totalDebt} />}
        note={fmt(L(T.debtors), { n: debtorsCount })}
        className="min-w-0"
      />
    </div>
  );
};
