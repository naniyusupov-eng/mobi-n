import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertCircle, Minus, Plus } from 'lucide-react';
import { Order, OrderReturn } from '../types';
import { Button, Modal, Money, formatSum } from './ui';
import { COMMON, Tri, UNIT_LABELS, useL } from '../i18n/tri';

const API = 'http://localhost:3000/api/v1';

/** Stored reason values: kept in Uzbek Latin, the server and reports match on them */
export const RETURN_REASONS = ['Doʻkon yopiq', 'Pul yetmadi', 'Kerak emas', 'Boshqa'];

/** Display labels for the stored reason values */
export const RETURN_REASON_LABELS: Record<string, Tri> = {
  'Doʻkon yopiq': { uz: 'Doʻkon yopiq', uz_cyrl: 'Дўкон ёпиқ', ru: 'Магазин закрыт' },
  'Pul yetmadi': { uz: 'Pul yetmadi', uz_cyrl: 'Пул етмади', ru: 'Не хватило денег' },
  'Kerak emas': { uz: 'Kerak emas', uz_cyrl: 'Керак эмас', ru: 'Не нужно' },
  Boshqa: { uz: 'Boshqa', uz_cyrl: 'Бошқа', ru: 'Другое' },
};

const T = {
  loadPrevError: {
    uz: 'Oldingi vozvratlarni yuklab boʻlmadi',
    uz_cyrl: 'Олдинги возвратларни юклаб бўлмади',
    ru: 'Не удалось загрузить предыдущие возвраты',
  },
  enterQty: { uz: 'Qaytgan tovar sonini kiriting', uz_cyrl: 'Қайтган товар сонини киритинг', ru: 'Укажите количество возвращённого товара' },
  saveFailed: { uz: 'Saqlab boʻlmadi', uz_cyrl: 'Сақлаб бўлмади', ru: 'Не удалось сохранить' },
  returnSum: { uz: 'Vozvrat summasi', uz_cyrl: 'Возврат суммаси', ru: 'Сумма возврата' },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
  saveReturn: { uz: 'Vozvratni saqlash', uz_cyrl: 'Возвратни сақлаш', ru: 'Сохранить возврат' },
  reason: { uz: 'Sabab', uz_cyrl: 'Сабаб', ru: 'Причина' },
  returnedGoods: { uz: 'Qaytgan tovarlar', uz_cyrl: 'Қайтган товарлар', ru: 'Возвращённые товары' },
  returnAll: { uz: 'Hammasi qaytdi', uz_cyrl: 'Ҳаммаси қайтди', ru: 'Вернули всё' },
  returnedBefore: { uz: 'avval qaytgan', uz_cyrl: 'аввал қайтган', ru: 'ранее возвращено' },
  fullyReturned: { uz: 'toʻliq qaytgan', uz_cyrl: 'тўлиқ қайтган', ru: 'возвращено полностью' },
  decrease: { uz: 'Kamaytirish', uz_cyrl: 'Камайтириш', ru: 'Уменьшить' },
  increase: { uz: 'Koʻpaytirish', uz_cyrl: 'Кўпайтириш', ru: 'Увеличить' },
} satisfies Record<string, Tri>;

interface ReturnModalProps {
  order: Order;
  onClose: () => void;
  onSaved: (order: Order) => void;
}

const lineKey = (productId: string, unit: string) => `${productId}|${unit}`;

// Goods brought back by the delivery driver: they go back to the warehouse and are
// subtracted from the sales of the day the order was taken.
export const ReturnModal: React.FC<ReturnModalProps> = ({ order, onClose, onSaved }) => {
  const L = useL();

  const [returned, setReturned] = useState<Record<string, number>>({});
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [saving, setSaving] = useState(false);
  // Our own messages are kept as Tri so they follow the language; server errors are plain text
  const [error, setError] = useState<Tri | string>('');

  // What was already returned for this order earlier
  useEffect(() => {
    fetch(`${API}/returns?order=${encodeURIComponent(order.id)}`)
      .then((r) => r.json())
      .then((d) => {
        const sums: Record<string, number> = {};
        for (const r of (d.returns || []) as OrderReturn[]) {
          for (const i of r.items) sums[lineKey(i.productId, i.unit)] = (sums[lineKey(i.productId, i.unit)] || 0) + i.quantity;
        }
        setReturned(sums);
      })
      .catch(() => setError(T.loadPrevError));
  }, [order.id]);

  const lines = order.items.map((item) => {
    const key = lineKey(item.productId, item.unit);
    const left = Math.max(0, item.quantity - (returned[key] || 0));
    return { item, key, left, value: Math.min(qty[key] || 0, left) };
  });

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + Math.round(l.value * l.item.unitPrice), 0),
    [lines]
  );

  const setValue = (key: string, value: number, left: number) =>
    setQty((prev) => ({ ...prev, [key]: Math.max(0, Math.min(left, value)) }));

  const returnAll = () => setQty(Object.fromEntries(lines.map((l) => [l.key, l.left])));

  const handleSave = async () => {
    const items = lines
      .filter((l) => l.value > 0)
      .map((l) => ({ productId: l.item.productId, unit: l.item.unit, quantity: l.value }));
    if (items.length === 0) return setError(T.enterQty);
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, reason, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onSaved(data.order);
      onClose();
    } catch (e: any) {
      setError(e.message || T.saveFailed);
      setSaving(false);
    }
  };

  const nothingLeft = lines.every((l) => l.left === 0);

  const stepBtn =
    'w-8 h-8 rounded-full bg-ink-100 text-ink-700 hover:bg-ink-200 flex items-center justify-center transition disabled:opacity-40';

  return (
    // Opens above the invoice (z-50), so it lives in a higher stacking context
    <div className="relative z-[60]">
      <Modal
        open
        onClose={onClose}
        width="md"
        title={L(COMMON.returns)}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="truncate">{order.shopName}</span>
            {order.lineCode && (
              <span className="text-[11px] font-semibold text-brand-500 bg-brand-50 rounded-full px-2 py-0.5">
                {order.lineCode}-{order.routeDay}
              </span>
            )}
            <span className="font-mono">#{order.id.slice(-6).toUpperCase()}</span>
          </span>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="text-[13px] text-ink-500">
              {L(T.returnSum)}: <Money value={total} className="font-bold text-rose-600 text-[15px]" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                {L(COMMON.cancel)}
              </Button>
              {/* Solid red action; the kit's danger button is the soft variant */}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || total === 0}
                className="inline-flex items-center justify-center h-11 px-4 rounded-xl2 text-sm font-semibold whitespace-nowrap bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                {saving ? L(T.saving) : L(T.saveReturn)}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Reason */}
          <div>
            <span className="block text-[13px] font-medium text-ink-700 mb-2">{L(T.reason)}</span>
            <div className="flex flex-wrap gap-2">
              {RETURN_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={clsx(
                    'h-9 px-4 rounded-full text-[13px] font-semibold transition whitespace-nowrap',
                    reason === r ? 'bg-rose-500 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                  )}
                >
                  {RETURN_REASON_LABELS[r] ? L(RETURN_REASON_LABELS[r]) : r}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-ink-700">{L(T.returnedGoods)}</span>
              {!nothingLeft && (
                <button
                  type="button"
                  onClick={returnAll}
                  className="text-[13px] font-semibold text-rose-600 hover:text-rose-700"
                >
                  {L(T.returnAll)}
                </button>
              )}
            </div>
            <div className="rounded-xl2 bg-ink-100/60 divide-y divide-white">
              {lines.map(({ item, key, left, value }) => (
                <div key={key} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-900 truncate">{item.productName}</div>
                    <div className="text-xs text-ink-400 tabular-nums">
                      {item.quantity} {UNIT_LABELS[item.unit] ? L(UNIT_LABELS[item.unit]) : item.unit} • {formatSum(item.unitPrice)}{' '}
                      {L(COMMON.som)}
                      {returned[key] ? (
                        <span className="text-rose-600">
                          {' '}
                          • {L(T.returnedBefore)}: {returned[key]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {left === 0 ? (
                    <span className="text-xs font-semibold text-ink-400 shrink-0 whitespace-nowrap">{L(T.fullyReturned)}</span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setValue(key, value - 1, left)}
                        disabled={value <= 0}
                        className={stepBtn}
                        aria-label={L(T.decrease)}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={left}
                        value={value || ''}
                        placeholder="0"
                        onChange={(e) => setValue(key, Number(e.target.value), left)}
                        className="w-14 h-8 text-center rounded-xl bg-white text-sm font-semibold tabular-nums text-ink-900 outline-none border border-transparent focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                      />
                      <button
                        type="button"
                        onClick={() => setValue(key, value + 1, left)}
                        disabled={value >= left}
                        className={stepBtn}
                        aria-label={L(T.increase)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-ink-400 w-10 tabular-nums">/ {left}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl2 bg-rose-50 text-rose-600 text-[13px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {typeof error === 'string' ? error : L(error)}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
