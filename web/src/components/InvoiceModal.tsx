import React from 'react';
import { Order, OrderStatus } from '../types';
import { X, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, onStatusChange }) => {
  const { t, lang } = useLanguage();
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabel =
    order.paymentMethod === 'naqd'
      ? t('pay_cash')
      : order.paymentMethod === 'nasiya'
      ? t('pay_debt')
      : t('pay_bank');

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in duration-150">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 no-print">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-slate-800 text-sm tracking-tight">
              {t('col_order_id')} #{order.id.slice(-6).toUpperCase()}
            </h3>
            {/* Status Selector */}
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 bg-slate-50 text-slate-700 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="new">{t('status_new')}</option>
              <option value="confirmed">{t('status_confirmed')}</option>
              <option value="delivered">{t('status_delivered')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('btn_print_a4')}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800" id="print-section">
          {/* Company Brand Header with Logo */}
          <div className="border-b-2 border-slate-800 pb-3 mb-5 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-white p-0.5">
                <img src="/logo.jpg" alt="Mobi_R Logo" className="w-full h-full object-cover rounded" />
              </div>
              <div>
                <h1 className="font-display text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                  Mobi_R Qandolat
                </h1>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {t('invoice_sub')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-display font-bold text-slate-800 tracking-wide uppercase">{t('invoice_title')}</div>
              <div className="text-xs text-slate-500 font-mono">№ {order.id.slice(-8).toUpperCase()}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString(numLocale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Client & Agent info card */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs mb-5">
            <div>
              <span className="text-slate-400 block font-semibold mb-0.5 uppercase text-[9px] tracking-wider">
                {t('invoice_buyer')}
              </span>
              <div className="font-bold text-slate-900 text-xs">{order.shopName}</div>
              <div className="text-slate-600 text-[11px] mt-0.5">{order.shopAddress}</div>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold mb-0.5 uppercase text-[9px] tracking-wider">
                {t('invoice_agent')}
              </span>
              <div className="font-bold text-slate-900 text-xs">{order.agentName}</div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                {t('col_payment_type')}:{' '}
                <span
                  className={`font-bold ${
                    order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {paymentLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border-collapse mb-6">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                <th className="py-2.5 px-3 font-bold w-8">{t('invoice_col_no')}</th>
                <th className="py-2.5 px-3 font-bold">{t('invoice_col_name')}</th>
                <th className="py-2.5 px-3 font-bold text-center">{t('invoice_col_unit')}</th>
                <th className="py-2.5 px-3 font-bold text-center">{t('invoice_col_qty')}</th>
                <th className="py-2.5 px-3 font-bold text-right">{t('invoice_col_price')}</th>
                <th className="py-2.5 px-3 font-bold text-right">{t('invoice_col_total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{item.productName}</td>
                  <td className="py-2 px-3 text-center uppercase text-[11px] font-bold text-slate-500">
                    {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center font-bold tabular-nums">{item.quantity}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{item.unitPrice.toLocaleString(numLocale)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                    {item.totalPrice.toLocaleString(numLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="border-t-2 border-slate-200 pt-3 flex justify-between items-start text-xs">
            <div className="max-w-xs text-slate-500">
              {order.notes && (
                <p>
                  <strong>{t('invoice_notes')}</strong> {order.notes}
                </p>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between text-slate-600">
                <span>{t('invoice_subtotal')}</span>
                <span className="font-semibold tabular-nums">
                  {order.totalAmount.toLocaleString(numLocale)} {t('som')}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>{t('invoice_discount')}</span>
                  <span className="font-semibold tabular-nums">
                    -{order.discountAmount.toLocaleString(numLocale)} {t('som')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span className="font-display">{t('invoice_total_pay')}</span>
                <span className="text-blue-700 tabular-nums">
                  {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t border-dashed border-slate-300 grid grid-cols-2 gap-12 text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">
                {t('invoice_released_by')} __________________
              </div>
              <span className="text-[10px] text-slate-400">{t('invoice_sign_agent')}</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">
                {t('invoice_received_by')} __________________
              </div>
              <span className="text-[10px] text-slate-400">{t('invoice_sign_client')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
