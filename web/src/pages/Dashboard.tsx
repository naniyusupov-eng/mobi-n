import React from 'react';
import { Agent, Order, Product, Shop } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  Users,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  agents: Agent[];
  shops: Shop[];
  products: Product[];
  onViewOrder: (order: Order) => void;
  onNavigate: (page: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  agents,
  shops,
  onViewOrder,
  onNavigate,
}) => {
  const { lang, t } = useLanguage();
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const totalSales = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const cashSales = orders
    .filter((o) => o.paymentMethod === 'naqd')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const totalDebt = shops.reduce((sum, s) => sum + s.debtBalance, 0);
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_total_sales')}
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400 stroke-[1.6]" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[1.6]" />
            <span className="text-emerald-600 font-normal">{t('vs_yesterday')}</span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_orders_count')}
            </span>
            <ShoppingBag className="w-4 h-4 text-slate-400 stroke-[1.6]" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {orders.length} <span className="text-xs font-normal text-slate-400">{t('orders_unit')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">
            {newOrdersCount > 0 ? (
              <span className="text-amber-600 font-normal">
                {newOrdersCount} {t('new_pending')}
              </span>
            ) : (
              t('all_reviewed')
            )}
          </div>
        </div>

        {/* Card 3: Cash Collected */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_cash')}
            </span>
            <Banknote className="w-4 h-4 text-slate-400 stroke-[1.6]" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {cashSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">{t('cash_desc')}</div>
        </div>

        {/* Card 4: Total Client Debt */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_debt')}
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400 stroke-[1.6]" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalDebt.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">
            {shops.filter((s) => s.debtBalance > 0).length} {t('shops_with_debt')}
          </div>
        </div>
      </div>

      {/* Main Grid: Orders Feed & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Live Orders Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/70 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">{t('recent_orders')}</h3>
              <p className="text-[11px] text-slate-400 font-normal">{t('recent_orders_sub')}</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-normal text-slate-500 hover:text-slate-900 flex items-center gap-1 transition"
            >
              {t('view_all')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="px-4 py-3 hover:bg-slate-50/60 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0 text-slate-500">
                    <ShoppingBag className="w-3.5 h-3.5 stroke-[1.6]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {order.shopName}
                      </span>
                      <span
                        className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                          order.status === 'new'
                            ? 'bg-amber-50 text-amber-700'
                            : order.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {order.status === 'new'
                          ? t('status_new')
                          : order.status === 'confirmed'
                          ? t('status_confirmed')
                          : t('status_delivered')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      <span className="text-slate-500">{order.agentName}</span> •{' '}
                      {new Date(order.createdAt).toLocaleTimeString(numLocale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-900 tabular-nums">
                      {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {order.paymentMethod === 'naqd'
                        ? t('pay_cash')
                        : order.paymentMethod === 'nasiya'
                        ? t('pay_debt')
                        : t('pay_bank')}
                    </div>
                  </div>
                  <button
                    onClick={() => onViewOrder(order)}
                    className="px-2.5 py-1 text-xs font-normal text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded border border-slate-200/80 transition"
                  >
                    {t('btn_view_invoice')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Top Agents Leaderboard */}
        <div className="bg-white rounded-lg border border-slate-200/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">{t('top_agents')}</h3>
                <p className="text-[11px] text-slate-400 font-normal">{t('top_agents_sub')}</p>
              </div>
              <Users className="w-4 h-4 text-slate-400 stroke-[1.6]" />
            </div>

            <div className="space-y-2.5">
              {agents.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-normal text-slate-400 w-4 text-center">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-medium text-slate-800">{agent.name}</h4>
                      <p className="text-[11px] text-slate-400 font-normal">{agent.territory}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-900 tabular-nums">
                      {(agent.totalSales / 1000000).toFixed(1)} mln {t('som')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {agent.ordersCount} {t('orders_unit')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('agents')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-normal text-center border border-slate-200/70 transition"
            >
              {t('quick_add_agent')}
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-normal text-center border border-slate-200/70 transition"
            >
              {t('quick_warehouse')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
