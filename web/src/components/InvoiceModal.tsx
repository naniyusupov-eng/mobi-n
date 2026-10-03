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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/80">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/70 no-print">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-sky-700 bg-sky-50 border border-sky-200/70 px-2 py-0.5 rounded font-normal">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            {/* Status Selector */}
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className="text-xs font-normal px-2 py-0.5 rounded border border-slate-200 bg-slate-50/70 text-slate-700 cursor-pointer outline-none hover:border-sky-300 focus:border-sky-400 transition"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 stroke-[1.6]" />
              <span>{t('btn_print_a4')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4 stroke-[1.6]" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800" id="print-section">
          {/* Company Brand Header */}
          <div className="border-b border-slate-200 pb-3 mb-4 flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 shrink-0 bg-white p-0.5">
                <img src="/logo.jpg" alt="Mobi_R Logo" className="w-full h-full object-cover rounded-xs" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 tracking-tight leading-tight">
                  Mobi_R Qandolat
                </h1>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  {t('invoice_sub')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-medium text-slate-800">{t('invoice_title')}</div>
              <div className="text-xs text-slate-400 font-mono font-normal">№ {order.id.slice(-8).toUpperCase()}</div>
              <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                {new Date(order.createdAt).toLocaleDateString(numLocale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          {/* Client & Agent info card */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/70 rounded-md border border-slate-200/70 text-xs mb-4">
            <div>
              <span className="text-slate-400 block font-normal mb-0.5 text-[10px]">
                {t('invoice_buyer')}
              </span>
              <div className="font-medium text-slate-900 text-xs">{order.shopName}</div>
              <div className="text-slate-500 font-normal text-[11px] mt-0.5">{order.shopAddress}</div>
            </div>

            <div>
              <span className="text-slate-400 block font-normal mb-0.5 text-[10px]">
                {t('invoice_agent')}
              </span>
              <div className="font-medium text-slate-900 text-xs">{order.agentName}</div>
              <div className="text-slate-500 font-normal text-[11px] mt-0.5">
                {t('col_payment_type')}:{' '}
                <span
                  className={`font-normal ${
                    order.paymentMethod === 'nasiya' ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {paymentLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs border-collapse mb-5">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
                <th className="py-2 px-3 w-8">{t('invoice_col_no')}</th>
                <th className="py-2 px-3">{t('invoice_col_name')}</th>
                <th className="py-2 px-3 text-center">{t('invoice_col_unit')}</th>
                <th className="py-2 px-3 text-center">{t('invoice_col_qty')}</th>
                <th className="py-2 px-3 text-right">{t('invoice_col_price')}</th>
                <th className="py-2 px-3 text-right">{t('invoice_col_total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-slate-400 font-normal">{idx + 1}</td>
                  <td className="py-2 px-3 font-normal text-slate-900">{item.productName}</td>
                  <td className="py-2 px-3 text-center text-[11px] font-normal text-slate-500">
                    {item.unit}
                  </td>
                  <td className="py-2 px-3 text-center font-normal tabular-nums">{item.quantity}</td>
                  <td className="py-2 px-3 text-right font-normal tabular-nums">{item.unitPrice.toLocaleString(numLocale)}</td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900 tabular-nums">
                    {item.totalPrice.toLocaleString(numLocale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="border-t border-slate-200 pt-3 flex justify-between items-start text-xs">
            <div className="max-w-xs text-slate-400 font-normal">
              {order.notes && (
                <p>
                  <span className="text-slate-600 font-medium">{t('invoice_notes')}:</span> {order.notes}
                </p>
              )}
            </div>

            <div className="w-60 space-y-1 text-right">
              <div className="flex justify-between text-slate-500 font-normal">
                <span>{t('invoice_subtotal')}</span>
                <span className="font-normal tabular-nums">
                  {order.totalAmount.toLocaleString(numLocale)} {t('som')}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-normal">
                  <span>{t('invoice_discount')}</span>
                  <span className="tabular-nums">
                    -{order.discountAmount.toLocaleString(numLocale)} {t('som')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs font-semibold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>{t('invoice_total_pay')}</span>
                <span className="tabular-nums">
                  {order.finalAmount.toLocaleString(numLocale)} {t('som')}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-10 pt-6 border-t border-dashed border-slate-200 grid grid-cols-2 gap-10 text-xs">
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-normal text-slate-700">
                {t('invoice_released_by')} __________________
              </div>
              <span className="text-[10px] text-slate-400 font-normal">{t('invoice_sign_agent')}</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-1 mb-1 font-normal text-slate-700">
                {t('invoice_received_by')} __________________
              </div>
              <span className="text-[10px] text-slate-400 font-normal">{t('invoice_sign_client')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
