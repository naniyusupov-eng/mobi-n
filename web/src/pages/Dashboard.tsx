import React, { useState } from 'react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  ShoppingBag,
  Banknote,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { NavPage } from '../components/Sidebar';
import { formatDateTime } from '../utils/format';

interface DashboardProps {
  orders: Order[];
  totalDebt: number;
  debtorsCount: number;
  onViewOrder: (order: Order) => void;
  onNavigate: (page: NavPage) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, totalDebt, debtorsCount, onViewOrder, onNavigate }) => {
  const { lang, t } = useLanguage();
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const [feedFilter, setFeedFilter] = useState<'all' | 'new'>('all');

  const totalSales = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const cashSales = orders
    .filter((o) => o.paymentMethod === 'naqd')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const newOrders = orders.filter((o) => o.status === 'new');
  const displayedOrders = feedFilter === 'new' ? newOrders : orders;
  const avgCheck = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">{t('kpi_total_sales')}</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition">
              <TrendingUp className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1 tabular-nums">
            {t('col_avg_check')}: {avgCheck.toLocaleString(numLocale)} {t('som')}
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">{t('kpi_orders_count')}</span>
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
        </div>

        {/* Card 3: Cash Collected */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-sky-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">{t('kpi_cash')}</span>
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:bg-sky-100 transition">
              <Banknote className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {cashSales.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">{t('cash_desc')}</div>
        </div>

        {/* Card 4: Total Client Debt */}
        <div className="bg-white rounded-lg p-4 border border-slate-200/70 hover:border-amber-300 transition group shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-normal">{t('kpi_debt')}</span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:bg-amber-100 transition">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[1.8]" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight tabular-nums">
            {totalDebt.toLocaleString(numLocale)}{' '}
            <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </div>
          <div className="text-xs text-slate-400 font-normal mt-1">
            {debtorsCount} {t('shops_with_debt')}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden flex flex-col shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">{t('recent_orders')}</h3>
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

        <div className="divide-y divide-slate-100 flex-1">
          {displayedOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">{t('all_reviewed')}</div>
          ) : (
            displayedOrders.slice(0, 8).map((order) => (
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
                      <span className="text-xs font-medium text-slate-900 truncate">{order.shopName}</span>
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
                      {formatDateTime(order.createdAt, lang)}
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
    </div>
  );
};
