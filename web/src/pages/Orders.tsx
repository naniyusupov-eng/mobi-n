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
      <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_orders_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status Pills with Counters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
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
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">{t('total_orders_count')}</span>
          <span className="font-display text-base font-black text-slate-900 tabular-nums">{filteredOrders.length}</span>
        </div>
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">{t('displayed_sum')}</span>
          <span className="font-display text-base font-black text-blue-600 tabular-nums">
            {totalSum.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-500">{t('som')}</span>
          </span>
        </div>
        <div className="bg-white px-3.5 py-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">{t('col_avg_check')}</span>
          <span className="font-display text-base font-black text-emerald-600 tabular-nums">
            {avgCheck.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-500">{t('som')}</span>
          </span>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-4">{t('col_order_id')}</th>
                <th className="py-2.5 px-4">{t('col_date')}</th>
                <th className="py-2.5 px-4">{t('col_client')}</th>
                <th className="py-2.5 px-4">{t('col_agent')}</th>
                <th className="py-2.5 px-4">{t('col_payment_type')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_sum')}</th>
                <th className="py-2.5 px-4 text-center">{t('col_status')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-medium">
                    {new Date(order.createdAt).toLocaleDateString(numLocale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-extrabold text-slate-900">{order.shopName}</div>
                    <div className="text-[11px] text-slate-400">{order.shopAddress}</div>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">{order.agentName}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`font-bold ${
                        order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {getPaymentLabel(order.paymentMethod)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-display font-bold text-slate-900 text-sm tabular-nums">
                    {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        order.status === 'new'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : order.status === 'confirmed'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded font-bold text-xs transition inline-flex items-center gap-1 border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t('btn_view_invoice')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-medium">
            {t('total_orders_count')} <strong className="tabular-nums text-slate-800">{filteredOrders.length}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-500 font-semibold mr-2">{t('displayed_sum')}</span>
            <span className="text-sm font-display font-black text-slate-900 tabular-nums">
              {totalSum.toLocaleString(numLocale)} {t('som')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
