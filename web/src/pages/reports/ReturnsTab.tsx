import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Banknote, CircleHelp, DoorClosed, LucideIcon, PackageX, RotateCcw, Undo2 } from 'lucide-react';
import { Line, OrderReturn } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDateTime, formatDay, formatMonth } from '../../utils/format';
import { Card, CardTitle, EmptyState, Money, Pill, Table, Td, Th, Tone, formatSum } from '../../components/ui';
import { Period, inPeriod } from '../../components/PeriodPicker';
import { COMMON, Tri, UNIT_LABELS, fmt, useL } from '../../i18n/tri';

const API = 'http://localhost:3000/api/v1';

const T = {
  shopClosed: { uz: 'Doʻkon yopiq', uz_cyrl: 'Дўкон ёпиқ', ru: 'Магазин закрыт' },
  noMoney: { uz: 'Pul yetmadi', uz_cyrl: 'Пул етмади', ru: 'Не хватило денег' },
  notNeeded: { uz: 'Kerak emas', uz_cyrl: 'Керак эмас', ru: 'Не нужно' },
  undoConfirm: {
    uz: '{shop}: {sum} soʻm vozvratni bekor qilasizmi? Tovar ombordan qayta ayiriladi.',
    uz_cyrl: '{shop}: {sum} сўм возвратни бекор қиласизми? Товар омбордан қайта айирилади.',
    ru: '{shop}: отменить возврат на {sum} сум? Товар снова будет списан со склада.',
  },
  returnsTitle: { uz: 'Vozvratlar', uz_cyrl: 'Возвратлар', ru: 'Возвраты' },
  subtitle: {
    uz: 'Xato kiritilgan vozvratni bekor qilish mumkin — tovar ombordan qayta ayiriladi',
    uz_cyrl: 'Хато киритилган возвратни бекор қилиш мумкин — товар омбордан қайта айирилади',
    ru: 'Ошибочный возврат можно отменить — товар снова будет списан со склада',
  },
  nPcs: { uz: '{n} ta', uz_cyrl: '{n} та', ru: '{n} шт' },
  emptyDay: { uz: 'Bu kunda vozvrat yoʻq', uz_cyrl: 'Бу кунда возврат йўқ', ru: 'В этот день возвратов нет' },
  emptyMonth: { uz: 'Bu oyda vozvrat yoʻq', uz_cyrl: 'Бу ойда возврат йўқ', ru: 'В этом месяце возвратов нет' },
  salesDay: { uz: 'Savdo kuni', uz_cyrl: 'Савдо куни', ru: 'День продажи' },
  reason: { uz: 'Sabab', uz_cyrl: 'Сабаб', ru: 'Причина' },
  goods: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  entered: { uz: 'Kiritilgan', uz_cyrl: 'Киритилган', ru: 'Внесён' },
  undo: { uz: 'Vozvratni bekor qilish', uz_cyrl: 'Возвратни бекор қилиш', ru: 'Отменить возврат' },
};

/** Icon, colour and translated label for each return reason (reasons come from ReturnModal's RETURN_REASONS) */
const reasonStyle = (reason: string): { icon: LucideIcon; tone: Tone; label?: Tri } => {
  const r = reason.toLowerCase();
  if (r.includes('yopiq')) return { icon: DoorClosed, tone: 'violet', label: T.shopClosed };
  if (r.includes('pul')) return { icon: Banknote, tone: 'amber', label: T.noMoney };
  if (r.includes('kerak emas')) return { icon: PackageX, tone: 'red', label: T.notNeeded };
  return { icon: CircleHelp, tone: 'gray' };
};

const ReasonPill: React.FC<{ reason: string; children?: React.ReactNode }> = ({ reason, children }) => {
  const L = useL();
  const { icon: Icon, tone, label } = reasonStyle(reason);
  return (
    <Pill tone={tone}>
      <Icon className="w-3.5 h-3.5" />
      {label ? L(label) : reason}
      {children}
    </Pill>
  );
};

interface ReturnsTabProps {
  period: Period; // month or a single day (by sales date)
  refreshKey: string; // changes when orders or returns change
}

// Returns of a month or a day, by line, with reasons; a mistaken entry can be undone
export const ReturnsTab: React.FC<ReturnsTabProps> = ({ period, refreshKey }) => {
  const { lang } = useLanguage();
  const L = useL();

  const month = period.kind === 'day' ? period.day.slice(0, 7) : period.kind === 'month' ? period.month : '';
  const [lines, setLines] = useState<Line[]>([]);
  const [lineFilter, setLineFilter] = useState('');
  const [monthReturns, setMonthReturns] = useState<OrderReturn[]>([]);
  const [reload, setReload] = useState(0);
  const returns = monthReturns.filter((r) => inPeriod(r.salesDate, period));
  const periodLabel = period.kind === 'day' ? formatDay(period.day, lang) : month ? formatMonth(month, lang) : '';

  useEffect(() => {
    fetch(`${API}/lines`)
      .then((r) => r.json())
      .then((d) => setLines(d.lines || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true; // ignore answers for a month or line that is no longer selected
    const line = lineFilter ? `&line=${encodeURIComponent(lineFilter)}` : '';
    fetch(`${API}/returns?month=${month}${line}`)
      .then((r) => r.json())
      .then((d) => alive && setMonthReturns(d.returns || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [month, lineFilter, reload, refreshKey]);

  const handleUndo = async (r: OrderReturn) => {
    if (!window.confirm(fmt(L(T.undoConfirm), { shop: r.shopName, sum: formatSum(r.total) }))) return;
    await fetch(`${API}/returns/${r.id}`, { method: 'DELETE' });
    setReload((n) => n + 1);
  };

  const total = returns.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-5">
      {/* Line filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 min-w-0">
          {[{ id: '', code: '' }, ...lines].map((l) => {
            const active = lineFilter === l.code;
            return (
              <button
                key={l.id || 'all'}
                type="button"
                onClick={() => setLineFilter(l.code)}
                className={clsx(
                  'h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition',
                  active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 shadow-card hover:text-brand-500'
                )}
              >
                {l.code || L(COMMON.allLines)}
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardTitle
          title={
            <span className="flex items-center gap-2">
              {L(T.returnsTitle)} {lineFilter && <Pill tone="brand">{lineFilter}</Pill>}
              <Pill tone="gray">{periodLabel}</Pill>
            </span>
          }
          subtitle={L(T.subtitle)}
          action={
            <span className="text-sm text-ink-500 whitespace-nowrap">
              {fmt(L(T.nPcs), { n: returns.length })} • <Money value={total} className="font-semibold text-rose-600" />
            </span>
          }
        />

        {returns.length === 0 ? (
          <EmptyState icon={RotateCcw} title={L(period.kind === 'day' ? T.emptyDay : T.emptyMonth)} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{L(T.salesDay)}</Th>
                <Th>{L(COMMON.route)}</Th>
                <Th>{L(COMMON.shop)}</Th>
                <Th>{L(T.reason)}</Th>
                <Th>{L(T.goods)}</Th>
                <Th align="right">{L(COMMON.sum)}</Th>
                <Th>{L(T.entered)}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="align-top hover:bg-ink-100/40 transition">
                  <Td className="whitespace-nowrap font-medium text-ink-900">{formatDate(`${r.salesDate}T12:00:00`, lang)}</Td>
                  <Td className="whitespace-nowrap">
                    {r.lineCode ? (
                      <Pill tone="brand">
                        {r.lineCode}-{r.routeDay}
                      </Pill>
                    ) : (
                      <span className="text-ink-200">—</span>
                    )}
                  </Td>
                  <Td className="font-semibold text-ink-900 max-w-[14rem]">
                    <span className="block truncate" title={r.shopName}>
                      {r.shopName}
                    </span>
                  </Td>
                  <Td>
                    <ReasonPill reason={r.reason} />
                  </Td>
                  <Td className="text-ink-500">
                    {r.items.map((i) => (
                      <div key={`${i.productId}-${i.unit}`} className="whitespace-nowrap">
                        {i.productName} — {i.quantity} {UNIT_LABELS[i.unit] ? L(UNIT_LABELS[i.unit]) : i.unit}
                      </div>
                    ))}
                  </Td>
                  <Td align="right" className="font-bold text-rose-600">
                    <Money value={r.total} />
                  </Td>
                  <Td className="whitespace-nowrap text-ink-400">{formatDateTime(r.createdAt, lang)}</Td>
                  <Td align="right">
                    <button
                      type="button"
                      onClick={() => handleUndo(r)}
                      title={L(T.undo)}
                      aria-label={L(T.undo)}
                      className="w-9 h-9 rounded-full inline-flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default ReturnsTab;
