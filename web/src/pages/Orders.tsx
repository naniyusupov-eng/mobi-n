import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import {
  Search,
  Eye,
  ShoppingBag,
  Banknote,
  Calculator,
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
      {/* 1. Summary Metrics Bar (Moved to Top for Macro Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">{t('total_orders_count')}</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">{filteredOrders.length}</span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">{t('displayed_sum')}</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">
              {totalSum.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Banknote className="w-4 h-4 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200/70 hover:border-sky-300 transition flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-xs font-normal text-slate-500 block">{t('col_avg_check')}</span>
            <span className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5 block">
              {avgCheck.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-md bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Calculator className="w-4 h-4 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Toolbar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.6]" />
          <input
            type="text"
            placeholder={t('search_orders_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/70 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-100 transition"
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
                className={`px-3 py-1 rounded-md text-xs transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 border border-sky-300 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? 'bg-sky-100 text-sky-800 font-medium' : 'bg-slate-100 text-slate-500 font-normal'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
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
                <tr key={order.id} className="hover:bg-sky-50/20 transition">
                  <td className="py-2.5 px-3.5">
                    <span className="font-mono text-[10px] font-normal text-sky-700 bg-sky-50 border border-sky-200/70 px-1.5 py-0.5 rounded">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
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
                      <div className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-normal mt-0.5 inline-block border border-sky-100">
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
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : order.status === 'confirmed'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                          : order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      onClick={() => onViewOrder(order)}
                      className="px-2.5 py-1 text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 rounded font-medium text-xs transition inline-flex items-center gap-1 border border-sky-200/70"
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
