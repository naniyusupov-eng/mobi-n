import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, RotateCcw, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { dayKey, formatWeekdayDay, shiftDay } from '../utils/format';
import { useToday } from '../hooks/useNow';
import { HeroCard, HeroPill, Money, StatCard } from '../components/ui';

interface DashboardProps {
  orders: Order[];
  totalDebt: number;
  debtorsCount: number;
}

const net = (o: Order) => o.finalAmount - (o.returnedAmount || 0);

export const Dashboard: React.FC<DashboardProps> = ({ orders, totalDebt, debtorsCount }) => {
  const { lang } = useLanguage();
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
        label="Bugungi sof savdo"
        value={<Money value={stats.todayNet} />}
        badge={<HeroPill>{formatWeekdayDay(today, lang)}</HeroPill>}
      >
        <HeroPill solid>
          {trend === null ? (
            'kecha savdo yoʻq'
          ) : (
            <>
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend >= 0 ? '+' : ''}
              {trend}% kechagidan
            </>
          )}
        </HeroPill>
        <HeroPill>
          <ShoppingBag className="w-3.5 h-3.5" />
          {stats.todayCount} ta buyurtma
        </HeroPill>
      </HeroCard>
      <StatCard
        icon={RotateCcw}
        tone="red"
        label="Vozvrat"
        value={<Money value={stats.todayReturned} />}
        note={`savdoning ${returnShare}% • ${stats.todayReturnOrders} buyurtma`}
        className="min-w-0"
      />
      <StatCard
        icon={Wallet}
        tone="amber"
        label="Qarzdorlik"
        value={<Money value={totalDebt} />}
        note={`${debtorsCount} ta doʻkonda`}
        className="min-w-0"
      />
    </div>
  );
};
