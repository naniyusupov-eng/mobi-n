import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { X, Printer, RotateCcw } from 'lucide-react';
import { CompanySettings, Order, OrderStatus } from '../types';
import { ReturnModal } from './ReturnModal';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatDateTime, routeLabel } from '../utils/format';
import { Button, Pill, TONE, Tone, formatSum } from './ui';
import { COMMON, Tri, UNIT_LABELS, useL } from '../i18n/tri';

interface InvoiceModalProps {
  order: Order | null;
  company: CompanySettings;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onReturnSaved: (order: Order) => void;
}

const STATUS_TONE: Record<OrderStatus, Tone> = {
  new: 'amber',
  confirmed: 'brand',
  delivered: 'green',
  cancelled: 'red',
};

const PAYMENT_TONE: Record<string, Tone> = { naqd: 'green', nasiya: 'red', otkazma: 'brand' };

const T = {
  delivery: { uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' },
  afterReturn: { uz: 'Vozvratdan keyin', uz_cyrl: 'Возвратдан кейин', ru: 'После возврата' },
} satisfies Record<string, Tri>;

const SumText: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const L = useL();
  return (
    <span className={clsx('tabular-nums whitespace-nowrap', className)}>
      {formatSum(value)} {L(COMMON.som)}
    </span>
  );
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, company, onClose, onStatusChange, onReturnSaved }) => {
  const { t, lang } = useLanguage();
  const L = useL();
  const [showReturn, setShowReturn] = useState(false);

  // Escape closes the invoice (the return dialog handles its own Escape first)
  useEffect(() => {
    if (!order || showReturn) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, showReturn, onClose]);

  if (!order) return null;

  const returnedAmount = order.returnedAmount || 0;

  // Requisites from the Settings page, only the filled ones
  const requisites = [
    company.address,
    company.phone,
    [company.inn && `STIR: ${company.inn}`, company.bankAccount && `H/r: ${company.bankAccount}`, company.bankMfo && `MFO: ${company.bankMfo}`]
      .filter(Boolean)
      .join(' • '),
  ].filter((line): line is string => Boolean(line));

  const handlePrint = () => {
    window.print();
  };

  const paymentLabel =
    order.paymentMethod === 'naqd' ? t('pay_cash') : order.paymentMethod === 'nasiya' ? t('pay_debt') : t('pay_bank');

  const statusTone = STATUS_TONE[order.status] || 'gray';

  return (
    <>
    <div
      className="fixed inset-0 bg-ink-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white rounded-card shadow-pop max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 pt-5 pb-4 border-b border-ink-100 no-print">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="font-mono text-[15px] font-bold text-ink-900 whitespace-nowrap">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            {/* Status selector, coloured like the status pill */}
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className={clsx(
                'h-8 pl-3 pr-2 rounded-full text-xs font-semibold cursor-pointer outline-none border-0 focus:ring-4 focus:ring-brand-50',
                TONE[statusTone].soft,
                TONE[statusTone].text
              )}
            >
              <option value="new">{t('status_new')}</option>
              <option value="confirmed">{t('status_confirmed')}</option>
              <option value="delivered">{t('status_delivered')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="danger" icon={RotateCcw} onClick={() => setShowReturn(true)}>
              {L(COMMON.returns)}
            </Button>
            <Button size="sm" variant="primary" icon={Printer} onClick={handlePrint}>
              {t('btn_print_a4')}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-ink-100 text-ink-500 hover:text-ink-900 flex items-center justify-center shrink-0"
              aria-label={L(COMMON.close)}
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Printable document area */}
        <div className="px-6 py-6 overflow-y-auto flex-1 text-ink-700 text-sm" id="print-section">
          {/* Company header */}
          <div className="pb-4 mb-5 border-b border-ink-200 flex justify-between items-start gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-ink-200 shrink-0 bg-white">
                <img src="/logo.jpg" alt="Mobi_R Logo" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-ink-900 tracking-tight leading-tight">
                  {company.companyName || 'Mobi_R Qandolat'}
                </h1>
                {requisites.length > 0 ? (
                  requisites.map((line) => (
                    <p key={line} className="text-xs text-ink-500 mt-0.5 break-words">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-ink-400 mt-0.5">{t('invoice_sub')}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-ink-900">{t('invoice_title')}</div>
              <div className="text-xs text-ink-500 font-mono mt-0.5">№ {order.id.slice(-8).toUpperCase()}</div>
              <div className="text-xs text-ink-400 mt-0.5">
                {formatDateTime(order.createdAt, lang)} {new Date(order.createdAt).getFullYear()}
              </div>
            </div>
          </div>

          {/* Buyer & payment */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-ink-100/70 rounded-xl2 mb-5">
            <div className="min-w-0">
              <span className="block text-xs text-ink-400 mb-1">{t('invoice_buyer')}</span>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-ink-900 truncate">{order.shopName}</span>
                {order.lineCode && (
                  <span className="text-[11px] font-semibold text-ink-500 bg-white rounded-full px-2 py-0.5 shrink-0">
                    {routeLabel(order.lineCode, order.routeDay)}
                  </span>
                )}
              </div>
              {order.shopAddress && <div className="text-xs text-ink-500 mt-0.5">{order.shopAddress}</div>}
            </div>

            <div className="min-w-0">
              <span className="block text-xs text-ink-400 mb-1">{t('col_payment_type')}</span>
              <Pill tone={PAYMENT_TONE[order.paymentMethod] || 'gray'}>{paymentLabel}</Pill>
              {order.deliveryDate && (
                <div className="text-xs text-ink-500 mt-1.5">{L(T.delivery)}: {formatDate(order.deliveryDate, lang)}</div>
              )}
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-left text-[13px] border-collapse mb-5">
            <thead>
              <tr className="text-xs text-ink-400">
                <th className="py-2.5 px-3 w-8 font-medium bg-ink-100/60 rounded-l-xl">{t('invoice_col_no')}</th>
                <th className="py-2.5 px-3 font-medium bg-ink-100/60">{t('invoice_col_name')}</th>
                <th className="py-2.5 px-3 font-medium bg-ink-100/60 text-center">{t('invoice_col_unit')}</th>
                <th className="py-2.5 px-3 font-medium bg-ink-100/60 text-center">{t('invoice_col_qty')}</th>
                <th className="py-2.5 px-3 font-medium bg-ink-100/60 text-right">{t('invoice_col_price')}</th>
                <th className="py-2.5 px-3 font-medium bg-ink-100/60 text-right rounded-r-xl">{t('invoice_col_total')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-ink-100">
                  <td className="py-2.5 px-3 text-ink-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 text-ink-900 font-medium">{item.productName}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-ink-500">{UNIT_LABELS[item.unit] ? L(UNIT_LABELS[item.unit]) : item.unit}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums whitespace-nowrap">{formatSum(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                    {formatSum(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="max-w-xs text-ink-500 text-[13px]">
              {order.notes && (
                <p>
                  <span className="text-ink-700 font-semibold">{t('invoice_notes')}</span> {order.notes}
                </p>
              )}
            </div>

            <div className="w-72 max-w-full space-y-1.5 text-[13px]">
              <div className="flex justify-between gap-4 text-ink-500">
                <span>{t('invoice_subtotal')}</span>
                <SumText value={order.totalAmount} />
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between gap-4 text-rose-600">
                  <span>{t('invoice_discount')}</span>
                  <SumText value={-order.discountAmount} />
                </div>
              )}
              <div className="flex justify-between gap-4 text-[15px] font-bold text-ink-900 pt-2 border-t border-ink-200">
                <span>{t('invoice_total_pay')}</span>
                <SumText value={order.finalAmount} />
              </div>
              {returnedAmount > 0 && (
                <>
                  <div className="flex justify-between gap-4 text-rose-600">
                    <span>{L(COMMON.returns)}</span>
                    <SumText value={-returnedAmount} />
                  </div>
                  <div className="flex justify-between gap-4 text-[15px] font-bold text-brand-500 pt-2 border-t border-ink-200">
                    <span>{L(T.afterReturn)}</span>
                    <SumText value={order.finalAmount - returnedAmount} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-10 pt-6 border-t border-dashed border-ink-200 grid grid-cols-2 gap-10 text-[13px]">
            <div>
              <div className="border-b border-ink-200 pb-1 mb-1 text-ink-700">{t('invoice_released_by')} __________________</div>
              <span className="text-xs text-ink-400">{t('invoice_sign_agent')}</span>
            </div>
            <div>
              <div className="border-b border-ink-200 pb-1 mb-1 text-ink-700">{t('invoice_received_by')} __________________</div>
              <span className="text-xs text-ink-400">{t('invoice_sign_client')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Sibling of the overlay, so clicks inside it never reach the invoice backdrop */}
    {showReturn && <ReturnModal order={order} onClose={() => setShowReturn(false)} onSaved={onReturnSaved} />}
    </>
  );
};
