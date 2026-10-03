import React, { useState } from 'react';
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
  Package,
  Store,
  Layers,
  Sparkles,
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
  products,
  onViewOrder,
  onNavigate,
}) => {
  const { lang, t } = useLanguage();
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const [feedFilter, setFeedFilter] = useState<'all' | 'new'>('all');

  const totalSales = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const cashSales = orders
    .filter((o) => o.paymentMethod === 'naqd')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const totalDebt = shops.reduce((sum, s) => sum + s.debtBalance, 0);
  const newOrders = orders.filter((o) => o.status === 'new');
  const displayedOrders = feedFilter === 'new' ? newOrders : orders;

  const totalStockDona = products.reduce((sum, p) => sum + p.stockDona, 0);
  const shopsWithDebtCount = shops.filter((s) => s.debtBalance > 0).length;

  return (
    <div className="space-y-4">
      {/* Top Operational Overview Banner (New Layout Placement) */}
      <div className="bg-gradient-to-r from-sky-50/80 via-white to-sky-50/30 rounded-lg p-3.5 border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200/60">
            <Sparkles className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-900">
                {t('dash_title')}
              </h2>
              <span className="text-[10px] font-medium text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200/50">
                APK Real-Time Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              {t('dash_sub')}
            </p>
          </div>
        </div>

        {/* Quick Micro Insights */}
        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto">
          <div className="px-2.5 py-1 bg-white/90 rounded-md border border-sky-100 text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">{t('kpi_cash')}:</span>
            <span className="text-sky-800 font-medium tabular-nums">
              {cashSales.toLocaleString(numLocale)} {t('som')}
            </span>
          </div>
          <div className="px-2.5 py-1 bg-white/90 rounded-md border border-slate-200/70 text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">{t('kpi_debt')}:</span>
            <span className="text-amber-700 font-medium tabular-nums">
              {totalDebt.toLocaleString(numLocale)} {t('som')}
            </span>
          </div>
          <div className="px-2.5 py-1 bg-white/90 rounded-md border border-slate-200/70 text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-normal">Agentlar:</span>
            <span className="text-slate-800 font-medium tabular-nums">
              {agents.length} ta
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row with Havorang (Sky) Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_total_sales')}
            </span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition">
              <TrendingUp className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-normal mt-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[1.6]" />
            <span className="text-emerald-600 font-normal">{t('vs_yesterday')}</span>
          </div>
          <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-sky-500 rounded-full w-full" />
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_orders_count')}
            </span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition">
              <ShoppingBag className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {orders.length} <span className="text-xs font-normal text-slate-400">{t('orders_unit')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">
            {newOrders.length > 0 ? (
              <span className="text-amber-600 font-medium">
                {newOrders.length} {t('new_pending')}
              </span>
            ) : (
              t('all_reviewed')
            )}
          </div>
          <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-sky-400 rounded-full w-3/4" />
          </div>
        </div>

        {/* Card 3: Cash Collected */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_cash')}
            </span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition">
              <Banknote className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {cashSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">{t('cash_desc')}</div>
          <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-sky-500 rounded-full w-4/5" />
          </div>
        </div>

        {/* Card 4: Total Client Debt */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {t('kpi_debt')}
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalDebt.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">
            {shopsWithDebtCount} {t('shops_with_debt')}
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-amber-400 rounded-full w-1/3" />
          </div>
        </div>
      </div>

      {/* Main Grid: Orders Feed & Right Control Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Live Orders Stream */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200/70 overflow-hidden flex flex-col shadow-2xs">
          {/* Feed Header with Quick Filter Tabs */}
          <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-900">{t('recent_orders')}</h3>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-400 font-normal">{t('recent_orders_sub')}</p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  feedFilter === 'all'
                    ? 'bg-sky-50 text-sky-800 font-medium border border-sky-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('tab_all')} ({orders.length})
              </button>
              <button
                onClick={() => setFeedFilter('new')}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  feedFilter === 'new'
                    ? 'bg-sky-50 text-sky-800 font-medium border border-sky-200/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('tab_new')} ({newOrders.length})
              </button>

              <button
                onClick={() => onNavigate('orders')}
                className="ml-2 text-xs font-normal text-sky-700 hover:text-sky-900 flex items-center gap-0.5 transition"
              >
                {t('view_all')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="divide-y divide-slate-100 flex-1">
            {displayedOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {t('all_reviewed')}
              </div>
            ) : (
              displayedOrders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="px-4 py-3 hover:bg-sky-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-sky-50/70 border border-sky-100 flex items-center justify-center shrink-0 text-sky-600">
                      <ShoppingBag className="w-3.5 h-3.5 stroke-[1.6]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200/70 px-1.5 py-0.2 rounded font-normal">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs font-medium text-slate-900 truncate">
                          {order.shopName}
                        </span>
                        <span
                          className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                            order.status === 'new'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : order.status === 'confirmed'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
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
                        <span className="text-slate-600 font-normal">{order.agentName}</span> •{' '}
                        {new Date(order.createdAt).toLocaleTimeString(numLocale, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
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
                      className="px-2.5 py-1 text-xs font-medium text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200/70 transition"
                    >
                      {t('btn_view_invoice')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Top Agents & Operational Quick Panel */}
        <div className="space-y-4">
          {/* Top Agents Leaderboard */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">{t('top_agents')}</h3>
                <p className="text-[11px] text-slate-400 font-normal">{t('top_agents_sub')}</p>
              </div>
              <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 stroke-[1.8]" />
              </div>
            </div>

            <div className="space-y-3">
              {agents.map((agent, index) => {
                const maxSales = Math.max(...agents.map((a) => a.totalSales), 1);
                const salesPercent = Math.min(100, Math.round((agent.totalSales / maxSales) * 100));

                return (
                  <div key={agent.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-mono ${
                          index === 0
                            ? 'bg-sky-100 text-sky-800 font-medium'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <h4 className="font-medium text-slate-800 truncate">{agent.name}</h4>
                          <span className="text-[10px] text-slate-400 font-normal">{agent.territory}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-slate-900 tabular-nums">
                          {(agent.totalSales / 1000000).toFixed(1)} mln
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {agent.ordersCount} {t('orders_unit')}
                        </div>
                      </div>
                    </div>
                    {/* Visual Sky Progress Bar */}
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(8, salesPercent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts & Inventory Overview (New Layout Widget) */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-900">Tezkor Boshqaruv</span>
              <span className="text-[10px] text-sky-700 font-mono bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                Ombor: {totalStockDona} dona
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('agents')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 rounded-md text-xs font-normal border border-slate-200/70 transition"
              >
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('quick_add_agent')}</span>
              </button>
              <button
                onClick={() => onNavigate('products')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 rounded-md text-xs font-normal border border-slate-200/70 transition"
              >
                <Package className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('quick_warehouse')}</span>
              </button>
              <button
                onClick={() => onNavigate('shops')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 rounded-md text-xs font-normal border border-slate-200/70 transition"
              >
                <Store className="w-3.5 h-3.5 text-sky-600" />
                <span>Do'konlar</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 text-slate-700 rounded-md text-xs font-normal border border-slate-200/70 transition"
              >
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                <span>Hisobotlar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
