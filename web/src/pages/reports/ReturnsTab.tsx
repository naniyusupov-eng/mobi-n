import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Banknote, CircleHelp, DoorClosed, LucideIcon, PackageX, RotateCcw, Undo2 } from 'lucide-react';
import { Line, OrderReturn } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDateTime, formatDay, formatMonth } from '../../utils/format';
import { Card, CardTitle, EmptyState, Money, Pill, Table, Td, Th, Tone, formatSum } from '../../components/ui';
import { Period, inPeriod } from '../../components/PeriodPicker';

const API = 'http://localhost:3000/api/v1';

/** Icon and colour for each return reason (reasons come from ReturnModal's RETURN_REASONS) */
const reasonStyle = (reason: string): { icon: LucideIcon; tone: Tone } => {
  const r = reason.toLowerCase();
  if (r.includes('yopiq')) return { icon: DoorClosed, tone: 'violet' };
  if (r.includes('pul')) return { icon: Banknote, tone: 'amber' };
  if (r.includes('kerak emas')) return { icon: PackageX, tone: 'red' };
  return { icon: CircleHelp, tone: 'gray' };
};

const ReasonPill: React.FC<{ reason: string; children?: React.ReactNode }> = ({ reason, children }) => {
  const { icon: Icon, tone } = reasonStyle(reason);
  return (
    <Pill tone={tone}>
      <Icon className="w-3.5 h-3.5" />
      {reason}
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
    const line = lineFilter ? `&line=${encodeURIComponent(lineFilter)}` : '';
    fetch(`${API}/returns?month=${month}${line}`)
      .then((r) => r.json())
      .then((d) => setMonthReturns(d.returns || []))
      .catch(() => {});
  }, [month, lineFilter, reload, refreshKey]);

  const handleUndo = async (r: OrderReturn) => {
    if (!window.confirm(`${r.shopName}: ${formatSum(r.total)} soʻm vozvratni bekor qilasizmi? Tovar ombordan qayta ayiriladi.`)) return;
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
                {l.code || 'Barcha liniyalar'}
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardTitle
          title={
            <span className="flex items-center gap-2">
              Vozvratlar {lineFilter && <Pill tone="brand">{lineFilter}</Pill>}
              <Pill tone="gray">{periodLabel}</Pill>
            </span>
          }
          subtitle="Xato kiritilgan vozvratni bekor qilish mumkin — tovar ombordan qayta ayiriladi"
          action={
            <span className="text-sm text-ink-500 whitespace-nowrap">
              {returns.length} ta • <Money value={total} className="font-semibold text-rose-600" />
            </span>
          }
        />

        {returns.length === 0 ? (
          <EmptyState icon={RotateCcw} title={period.kind === 'day' ? 'Bu kunda vozvrat yoʻq' : 'Bu oyda vozvrat yoʻq'} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Savdo kuni</Th>
                <Th>Marshrut</Th>
                <Th>Doʻkon</Th>
                <Th>Sabab</Th>
                <Th>Tovarlar</Th>
                <Th align="right">Summa</Th>
                <Th>Kiritilgan</Th>
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
                        {i.productName} — {i.quantity} {i.unit}
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
                      title="Vozvratni bekor qilish"
                      aria-label="Vozvratni bekor qilish"
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
