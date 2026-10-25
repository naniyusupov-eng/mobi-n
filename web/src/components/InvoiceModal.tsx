import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X, Printer, RotateCcw } from 'lucide-react';
import { CompanySettings, Order, OrderStatus } from '../types';
import { ReturnModal } from './ReturnModal';
import { useLanguage } from '../context/LanguageContext';
import { dayKey, formatDate, formatDateTime, routeLabel } from '../utils/format';
import { Button, TONE, Tone, formatSum } from './ui';
import { COMMON, PAYMENT_LABELS, Tri, UNIT_LABELS, useL } from '../i18n/tri';

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

const T = {
  title: { uz: 'YUK XATI', uz_cyrl: 'ЮК ХАТИ', ru: 'НАКЛАДНАЯ' },
  supplier: { uz: 'Taʼminotchi', uz_cyrl: 'Таъминотчи', ru: 'Поставщик' },
  buyer: { uz: 'Xaridor', uz_cyrl: 'Харидор', ru: 'Покупатель' },
  phone: { uz: 'Tel', uz_cyrl: 'Тел', ru: 'Тел' },
  route: { uz: 'Marshrut', uz_cyrl: 'Маршрут', ru: 'Маршрут' },
  payment: { uz: 'Toʻlov', uz_cyrl: 'Тўлов', ru: 'Оплата' },
  delivery: { uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' },
  name: { uz: 'Mahsulot', uz_cyrl: 'Маҳсулот', ru: 'Товар' },
  unit: { uz: 'Birlik', uz_cyrl: 'Бирлик', ru: 'Ед.' },
  qty: { uz: 'Soni', uz_cyrl: 'Сони', ru: 'Кол-во' },
  price: { uz: 'Narxi', uz_cyrl: 'Нархи', ru: 'Цена' },
  sum: { uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' },
  subtotal: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  discount: { uz: 'Chegirma', uz_cyrl: 'Чегирма', ru: 'Скидка' },
  total: { uz: 'Jami', uz_cyrl: 'Жами', ru: 'Итого' },
  afterReturn: { uz: 'Vozvratdan keyin', uz_cyrl: 'Возвратдан кейин', ru: 'После возврата' },
  note: { uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Примечание' },
  released: { uz: 'Topshirdi', uz_cyrl: 'Топширди', ru: 'Отпустил' },
  received: { uz: 'Qabul qildi', uz_cyrl: 'Қабул қилди', ru: 'Получил' },
  print: { uz: 'A4 chop etish', uz_cyrl: 'A4 чоп этиш', ru: 'Печать A4' },
} satisfies Record<string, Tri>;

const sum = (n: number) => formatSum(n);

/** The waybill itself: plain black-on-white document, used both on screen and on paper */
/** compact: smaller type and spacing so about three fit on one A4 page when printing many at once */
export const Waybill: React.FC<{ order: Order; company: CompanySettings; compact?: boolean }> = ({ order, company, compact }) => {
  const { lang } = useLanguage();
  const L = useL();
  const returned = order.returnedAmount || 0;
  const route = routeLabel(order.lineCode, order.routeDay);
  const cell = compact ? 'border border-black px-1.5 py-0.5' : 'border border-black px-2 py-1.5';

  return (
    <div className={clsx('waybill text-black leading-snug', compact ? 'waybill-compact text-[11px]' : 'text-[13px]')}>
      {/* Title, number, date */}
      <div className="flex items-end justify-between gap-6 border-b-2 border-black pb-2">
        <div>
          <div className={clsx('font-bold tracking-wide', compact ? 'text-[15px]' : 'text-[20px]')}>{L(T.title)}</div>
          <div className="font-mono text-[13px]">№ {order.id.slice(-6).toUpperCase()}</div>
        </div>
        <div className="text-right text-[13px]">
          <div>{formatDateTime(order.createdAt, lang)} {dayKey(order.createdAt).slice(0, 4)}</div>
          {order.deliveryDate ? (
            <div>
              {L(T.delivery)}: {formatDate(order.deliveryDate, lang)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Parties */}
      <div className={clsx('grid grid-cols-2 gap-6', compact ? 'py-1.5' : 'py-3')}>
        <div>
          <div className="text-[11px] uppercase tracking-wide">{L(T.supplier)}</div>
          <div className="font-semibold">{company.companyName || 'RCandy'}</div>
          {company.phone ? (
            <div>
              {L(T.phone)}: {company.phone}
            </div>
          ) : null}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide">{L(T.buyer)}</div>
          <div className="font-semibold">{order.shopName}</div>
          {order.shopPhone ? (
            <div>
              {L(T.phone)}: {order.shopPhone}
            </div>
          ) : null}
          {route || order.shopAddress ? (
            <div>{[route && `${L(T.route)}: ${route}${order.shopNum != null ? ` №${order.shopNum}` : ''}`, order.shopAddress].filter(Boolean).join(' · ')}</div>
          ) : null}
          <div>
            {L(T.payment)}: {PAYMENT_LABELS[order.paymentMethod] ? L(PAYMENT_LABELS[order.paymentMethod]) : order.paymentMethod}
          </div>
        </div>
      </div>

      {/* Goods, with a box on the left to tick each line off */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={clsx(cell, 'w-8')} aria-label="✓" />
            <th className={clsx(cell, 'w-8 text-center font-semibold')}>№</th>
            <th className={clsx(cell, 'text-left font-semibold')}>{L(T.name)}</th>
            <th className={clsx(cell, 'text-center font-semibold w-16')}>{L(T.unit)}</th>
            <th className={clsx(cell, 'text-right font-semibold w-16')}>{L(T.qty)}</th>
            <th className={clsx(cell, 'text-right font-semibold w-24')}>{L(T.price)}</th>
            <th className={clsx(cell, 'text-right font-semibold w-28')}>{L(T.sum)}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="break-inside-avoid">
              <td className={clsx(cell, 'text-center')}>
                <span className="inline-block w-4 h-4 border border-black align-middle" />
              </td>
              <td className={clsx(cell, 'text-center tabular-nums')}>{idx + 1}</td>
              <td className={cell}>{item.productName}</td>
              <td className={clsx(cell, 'text-center')}>{UNIT_LABELS[item.unit] ? L(UNIT_LABELS[item.unit]) : item.unit}</td>
              <td className={clsx(cell, 'text-right tabular-nums')}>{item.quantity}</td>
              <td className={clsx(cell, 'text-right tabular-nums whitespace-nowrap')}>{sum(item.unitPrice)}</td>
              <td className={clsx(cell, 'text-right tabular-nums whitespace-nowrap')}>{sum(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className={clsx('flex justify-between items-start gap-6 break-inside-avoid', compact ? 'pt-1.5' : 'pt-3')}>
        <div className="max-w-sm">
          {order.notes ? (
            <div>
              {L(T.note)}: {order.notes}
            </div>
          ) : null}
        </div>
        <table className="text-[13px]">
          <tbody>
            {order.discountAmount > 0 ? (
              <>
                <tr>
                  <td className="pr-6 py-0.5">{L(T.subtotal)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">{sum(order.totalAmount)}</td>
                </tr>
                <tr>
                  <td className="pr-6 py-0.5">{L(T.discount)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">−{sum(order.discountAmount)}</td>
                </tr>
              </>
            ) : null}
            <tr className={clsx('font-bold', compact ? 'text-[12px]' : 'text-[15px]')}>
              <td className="pr-6 py-1 border-t border-black">{L(T.total)}</td>
              <td className="text-right tabular-nums whitespace-nowrap border-t border-black">
                {sum(order.finalAmount)} {L(COMMON.som)}
              </td>
            </tr>
            {returned > 0 ? (
              <>
                <tr>
                  <td className="pr-6 py-0.5">{L(COMMON.returns)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">−{sum(returned)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="pr-6 py-0.5">{L(T.afterReturn)}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">
                    {sum(order.finalAmount - returned)} {L(COMMON.som)}
                  </td>
                </tr>
              </>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className={clsx('grid grid-cols-2 gap-12 break-inside-avoid', compact ? 'pt-4' : 'pt-10')}>
        {[T.released, T.received].map((who) => (
          <div key={who.uz}>
            <div className={clsx('border-b border-black', compact ? 'h-4' : 'h-6')} />
            <div className="text-[11px] pt-1">{L(who)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, company, onClose, onStatusChange, onReturnSaved }) => {
  const { t } = useLanguage();
  const L = useL();
  const [showReturn, setShowReturn] = useState(false);

  // Escape closes the invoice (the return dialog handles its own Escape first)
  useEffect(() => {
    if (!order || showReturn) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, showReturn, onClose]);

  // While the waybill is open, printing (button or Ctrl+P) prints only the waybill on A4:
  // the app is hidden and the copy rendered straight into <body> is shown (see index.css)
  useEffect(() => {
    if (!order) return;
    const on = () => document.body.classList.add('printing-waybill');
    const off = () => document.body.classList.remove('printing-waybill');
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
      off();
    };
  }, [order]);

  if (!order) return null;

  const statusTone = STATUS_TONE[order.status] || 'gray';

  return (
    <>
      <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-white rounded-card shadow-pop max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-6 pt-5 pb-4 border-b border-ink-100">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="font-mono text-[15px] font-bold text-ink-900 whitespace-nowrap">#{order.id.slice(-6).toUpperCase()}</span>
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
              <Button size="sm" variant="primary" icon={Printer} onClick={() => window.print()}>
                {L(T.print)}
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

          {/* On-screen preview: the same document as on paper */}
          <div className="px-8 py-7 overflow-y-auto flex-1 bg-white">
            <Waybill order={order} company={company} />
          </div>
        </div>
      </div>

      {/* Paper copy, outside the app so A4 printing has no modal, scroll or page-height limits */}
      {createPortal(
        <div className="waybill-print">
          <Waybill order={order} company={company} />
        </div>,
        document.body
      )}

      {/* Sibling of the overlay, so clicks inside it never reach the invoice backdrop */}
      {showReturn && <ReturnModal order={order} onClose={() => setShowReturn(false)} onSaved={onReturnSaved} />}
    </>
  );
};
