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
    <div className="space-y-5">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('kpi_total_sales')}
            </span>
            <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-black text-slate-900 mt-3 tracking-tight tabular-nums">
            {totalSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-bold text-slate-400">{t('som')}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t('vs_yesterday')}</span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('kpi_orders_count')}
            </span>
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-black text-slate-900 mt-3 tracking-tight tabular-nums">
            {orders.length} <span className="text-xs font-bold text-slate-400">{t('orders_unit')}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">
            {newOrdersCount > 0 ? (
              <span className="text-amber-700 font-bold">
                {newOrdersCount} {t('new_pending')}
              </span>
            ) : (
              t('all_reviewed')
            )}
          </div>
        </div>

        {/* Card 3: Cash Collected */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('kpi_cash')}
            </span>
            <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-black text-slate-900 mt-3 tracking-tight tabular-nums">
            {cashSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-bold text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">{t('cash_desc')}</div>
        </div>

        {/* Card 4: Total Client Debt */}
        <div className="bg-white rounded-lg p-5 border border-slate-200/90 shadow-xs group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('kpi_debt')}
            </span>
            <div className="w-9 h-9 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-black text-rose-700 mt-3 tracking-tight tabular-nums">
            {totalDebt.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-bold text-rose-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">
            {shops.filter((s) => s.debtBalance > 0).length} {t('shops_with_debt')}
          </div>
        </div>
      </div>

      {/* Main Grid: Orders Feed & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Live Orders Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-display font-black text-slate-900 text-sm">{t('recent_orders')}</h3>
              <p className="text-xs text-slate-500 font-medium">{t('recent_orders_sub')}</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 transition"
            >
              {t('view_all')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="p-3.5 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                      order.status === 'new'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : order.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {order.shopName}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          order.status === 'new'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : order.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {order.status === 'new'
                          ? t('status_new')
                          : order.status === 'confirmed'
                          ? t('status_confirmed')
                          : t('status_delivered')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <strong className="text-slate-600">{order.agentName}</strong> •{' '}
                      {new Date(order.createdAt).toLocaleTimeString(numLocale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-900 tabular-nums font-display">
                      {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                    </div>
                    <div
                      className={`text-[10px] font-bold ${
                        order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {order.paymentMethod === 'naqd'
                        ? t('pay_cash')
                        : order.paymentMethod === 'nasiya'
                        ? t('pay_debt')
                        : t('pay_bank')}
                    </div>
                  </div>
                  <button
                    onClick={() => onViewOrder(order)}
                    className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200/60 transition"
                  >
                    {t('btn_view_invoice')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Top Agents Leaderboard */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-display font-black text-slate-900 text-sm">{t('top_agents')}</h3>
                <p className="text-xs text-slate-500 font-medium">{t('top_agents_sub')}</p>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {agents.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{agent.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{agent.territory}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 tabular-nums">
                      {(agent.totalSales / 1000000).toFixed(1)} mln {t('som')}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      {agent.ordersCount} {t('orders_unit')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('agents')}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-bold text-center border border-blue-200/60 transition"
            >
              {t('quick_add_agent')}
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold text-center border border-slate-200 transition"
            >
              {t('quick_warehouse')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
