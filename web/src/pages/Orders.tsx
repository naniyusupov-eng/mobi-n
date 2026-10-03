import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import {
  Search,
  Eye,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OrdersProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
}

export const Orders: React.FC<OrdersProps> = ({ orders, onViewOrder }) => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchText =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.shopName.toLowerCase().includes(search.toLowerCase()) ||
        o.agentName.toLowerCase().includes(search.toLowerCase());

      if (!matchText) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  const totalSum = filteredOrders.reduce((sum, o) => sum + o.finalAmount, 0);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter((o) => o.status === 'new').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    };
  }, [orders]);

  const filterTabs = [
    { id: 'all', label: t('tab_all'), count: counts.all },
    { id: 'new', label: t('tab_new'), count: counts.new },
    { id: 'confirmed', label: t('tab_confirmed'), count: counts.confirmed },
    { id: 'delivered', label: t('tab_delivered'), count: counts.delivered },
  ];

  const avgCheck = filteredOrders.length > 0 ? Math.round(totalSum / filteredOrders.length) : 0;

  const getStatusLabel = (st: OrderStatus) => {
    switch (st) {
      case 'new':
        return t('status_new');
      case 'confirmed':
        return t('status_confirmed');
      case 'delivered':
        return t('status_delivered');
      case 'cancelled':
        return t('status_cancelled');
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'naqd':
        return t('pay_cash');
      case 'nasiya':
        return t('pay_debt');
      default:
        return t('pay_bank');
    }
  };

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.6]" />
          <input
            type="text"
            placeholder={t('search_orders_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/70 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Status Pills with Counters */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white font-medium shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-normal'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] tabular-nums ${
                    isActive ? 'text-slate-300 font-normal' : 'text-slate-400 font-normal'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-normal text-slate-500">{t('total_orders_count')}</span>
          <span className="text-base font-semibold text-slate-900 tabular-nums">{filteredOrders.length}</span>
        </div>
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-normal text-slate-500">{t('displayed_sum')}</span>
          <span className="text-base font-semibold text-slate-900 tabular-nums">
            {totalSum.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </span>
        </div>
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-normal text-slate-500">{t('col_avg_check')}</span>
          <span className="text-base font-semibold text-slate-900 tabular-nums">
            {avgCheck.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
          </span>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="py-2.5 px-3.5">{t('col_order_id')}</th>
                <th className="py-2.5 px-3.5">{t('col_date')}</th>
                <th className="py-2.5 px-3.5">{t('col_client')}</th>
                <th className="py-2.5 px-3.5">{t('col_agent')}</th>
                <th className="py-2.5 px-3.5">{t('col_payment_type')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_sum')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('col_status')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-2.5 px-3.5 font-mono text-[11px] font-normal text-slate-500">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500 font-normal">
                    <div>
                      {new Date(order.createdAt).toLocaleDateString(numLocale, {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {order.deliveryDate && (
                      <div className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-normal mt-0.5 inline-block">
                        📅 {order.deliveryDate}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-medium text-slate-900">{order.shopName}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{order.shopAddress}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-normal text-slate-600">{order.agentName}</td>
                  <td className="py-2.5 px-3.5">
                    <span
                      className={`font-normal ${
                        order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {getPaymentLabel(order.paymentMethod)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-medium text-slate-900 tabular-nums">
                    {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal ${
                        order.status === 'new'
                          ? 'bg-amber-50 text-amber-700'
                          : order.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-700'
                          : order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded font-normal text-xs transition inline-flex items-center gap-1 border border-slate-200/80"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[1.6]" />
                      <span>{t('btn_view_invoice')}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs font-normal">
          <div className="text-slate-400">
            {t('total_orders_count')}: <span className="tabular-nums text-slate-700 font-medium">{filteredOrders.length}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 mr-1.5">{t('displayed_sum')}:</span>
            <span className="font-medium text-slate-900 tabular-nums">
              {totalSum.toLocaleString(numLocale)} {t('som')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
