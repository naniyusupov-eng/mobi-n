import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { PackageOpen, Printer, RefreshCw } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { formatDay } from '../../utils/format';
import { Button, Card, EmptyState, Money, Pill, Table, Td, Th, Tone } from '../../components/ui';
import { COMMON, PAYMENT_LABELS, Tri, UNIT_LABELS, fmt, useL } from '../../i18n/tri';
import { API, apiFetch } from '../../api';

interface SheetProduct {
  productId: string;
  code: string;
  name: string;
  units: Partial<Record<'korobka' | 'blok' | 'dona' | 'kg', number>>;
  totalDona: number;
  hasKg: boolean;
}

interface SheetStop {
  orderId: string;
  num: number | null;
  routeDay: number | null;
  shopName: string;
  phone: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: string;
}

interface Sheet {
  line: string;
  orders: number;
  total: number;
  products: SheetProduct[];
  stops: SheetStop[];
}

const T = {
  title: { uz: 'Yuk varaqasi', uz_cyrl: 'Юк варақаси', ru: 'Погрузочный лист' },
  delivery: { uz: 'Yetkazish kuni', uz_cyrl: 'Етказиш куни', ru: 'День доставки' },
  nOrders: { uz: '{n} ta buyurtma', uz_cyrl: '{n} та буюртма', ru: '{n} заказов' },
  products: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  stops: { uz: 'Doʻkonlar ketma-ketligi', uz_cyrl: 'Дўконлар кетма-кетлиги', ru: 'Порядок магазинов' },
  code: { uz: 'Kod', uz_cyrl: 'Код', ru: 'Код' },
  name: { uz: 'Nomi', uz_cyrl: 'Номи', ru: 'Название' },
  quantity: { uz: 'Miqdor', uz_cyrl: 'Миқдор', ru: 'Количество' },
  totalDona: { uz: 'Jami dona', uz_cyrl: 'Жами дона', ru: 'Всего шт' },
  loaded: { uz: 'Yuklandi', uz_cyrl: 'Юкланди', ru: 'Погружено' },
  total: { uz: 'Jami', uz_cyrl: 'Жами', ru: 'Итого' },
  print: { uz: 'Chop etish', uz_cyrl: 'Чоп этиш', ru: 'Печать' },
  refresh: { uz: 'Yangilash', uz_cyrl: 'Янгилаш', ru: 'Обновить' },
  hint: {
    uz: 'Oldingi ish kuni olingan buyurtmalar — shu kuni yetkaziladi',
    uz_cyrl: 'Олдинги иш куни олинган буюртмалар — шу куни етказилади',
    ru: 'Заказы, принятые в предыдущий рабочий день, — доставка в этот день',
  },
  empty: { uz: 'Bu kunga yetkaziladigan buyurtma yoʻq', uz_cyrl: 'Бу кунга етказиладиган буюртма йўқ', ru: 'На этот день доставок нет' },
  plusKg: { uz: '+ kg', uz_cyrl: '+ кг', ru: '+ кг' },
  driver: { uz: 'Haydovchi', uz_cyrl: 'Ҳайдовчи', ru: 'Водитель' },
  loader: { uz: 'Yuklovchi', uz_cyrl: 'Юкловчи', ru: 'Грузчик' },
} satisfies Record<string, Tri>;

const UNIT_ORDER = ['korobka', 'blok', 'dona', 'kg'] as const;

const PAYMENT_TONE: Record<PaymentMethod, Tone> = { naqd: 'green', nasiya: 'amber', otkazma: 'violet' };

const formatShopNum = (num: number | null) =>
  num == null ? '—' : Number.isInteger(num) ? String(num) : `${Math.floor(num)}a`;

const formatQty = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '').replace('.', ','));

/** Pill-shaped filter chip */
const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition',
      active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 shadow-card hover:text-brand-500'
    )}
  >
    {children}
  </button>
);

interface LoadingSheetProps {
  day: string; // delivery day, YYYY-MM-DD
}

// What each line's truck takes on a delivery day: goods to load and shops in route order; printable
export const LoadingSheet: React.FC<LoadingSheetProps> = ({ day }) => {
  const { lang } = useLanguage();
  const L = useL();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lineFilter, setLineFilter] = useState('');
  const [reload, setReload] = useState(0);
  // The id is set only while printing, so an open invoice modal keeps its own #print-section
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/loading?date=${day}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setSheets(d.sheets || []);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [day, reload]);

  // Ctrl+P prints the sheets too, unless something else (an invoice) is already printable
  useEffect(() => {
    const before = () => {
      if (!document.getElementById('print-section')) flushSync(() => setPrinting(true));
    };
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const handlePrint = () => {
    flushSync(() => setPrinting(true));
    window.print();
    setPrinting(false);
  };

  // A line chosen on another day may have no orders now: fall back to all lines
  const activeLine = sheets.some((s) => s.line === lineFilter) ? lineFilter : '';
  const shown = activeLine ? sheets.filter((s) => s.line === activeLine) : sheets;
  const unitText = (p: SheetProduct) =>
    UNIT_ORDER.filter((u) => p.units[u])
      .map((u) => `${formatQty(p.units[u]!)} ${L(UNIT_LABELS[u])}`)
      .join(' + ');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap gap-2 min-w-0">
          <Chip active={activeLine === ''} onClick={() => setLineFilter('')}>
            {L(COMMON.allLines)}
          </Chip>
          {sheets.map((s) => (
            <Chip key={s.line} active={activeLine === s.line} onClick={() => setLineFilter(s.line)}>
              {s.line}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="white" icon={RefreshCw} onClick={() => setReload((n) => n + 1)} title={L(T.refresh)} />
          <Button icon={Printer} onClick={handlePrint} disabled={shown.length === 0}>
            {L(T.print)}
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <Card>
          {error ? (
            <EmptyState icon={PackageOpen} title={L(COMMON.error)} hint={L(COMMON.loadError)} />
          ) : loading ? (
            <EmptyState icon={PackageOpen} title={L(COMMON.loading)} />
          ) : (
            <EmptyState icon={PackageOpen} title={L(T.empty)} hint={`${L(T.delivery)}: ${formatDay(day, lang)}`} />
          )}
        </Card>
      ) : (
        <div id={printing ? 'print-section' : undefined} className={clsx('space-y-5', printing && 'print-plain')}>
          {shown.map((s) => {
            const totalDona = s.products.reduce((sum, p) => sum + p.totalDona, 0);
            return (
              <Card key={s.line} className="print-sheet">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-[19px] font-bold tracking-tight text-ink-900 flex items-center gap-2">
                      {L(T.title)} <Pill tone="brand" className="text-sm">{s.line}</Pill>
                    </h3>
                    <p className="text-[13px] text-ink-500 mt-1">
                      {L(T.delivery)}: <span className="font-semibold text-ink-900">{formatDay(day, lang)}</span>
                      {' • '}
                      {fmt(L(T.nOrders), { n: s.orders })}
                    </p>
                  </div>
                  <Money value={s.total} className="text-[19px] font-bold text-ink-900" />
                </div>

                <h4 className="text-sm font-semibold text-ink-900 mb-2">{L(T.products)}</h4>
                <Table>
                  <thead>
                    <tr>
                      <Th>{L(T.code)}</Th>
                      <Th>{L(T.name)}</Th>
                      <Th>{L(T.quantity)}</Th>
                      <Th align="right">{L(T.totalDona)}</Th>
                      <Th align="center">{L(T.loaded)}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.products.map((p) => (
                      <tr key={p.productId}>
                        <Td className="whitespace-nowrap font-mono text-ink-500">{p.code || '—'}</Td>
                        <Td className="font-semibold text-ink-900">{p.name}</Td>
                        <Td className="whitespace-nowrap">{unitText(p)}</Td>
                        <Td align="right" className="whitespace-nowrap font-semibold text-ink-900 tabular-nums">
                          {formatQty(p.totalDona)} {L(UNIT_LABELS.dona)}
                          {p.hasKg && p.totalDona > 0 ? ` ${L(T.plusKg)}` : ''}
                        </Td>
                        <Td align="center">
                          <span className="print-box inline-block w-5 h-5 rounded border-2 border-ink-300 align-middle" />
                        </Td>
                      </tr>
                    ))}
                    <tr>
                      <Td colSpan={3} className="font-bold text-ink-900">
                        {L(T.total)}
                      </Td>
                      <Td align="right" className="whitespace-nowrap font-bold text-ink-900 tabular-nums">
                        {formatQty(totalDona)} {L(UNIT_LABELS.dona)}
                      </Td>
                      <Td />
                    </tr>
                  </tbody>
                </Table>

                <h4 className="text-sm font-semibold text-ink-900 mt-6 mb-2">{L(T.stops)}</h4>
                <Table>
                  <thead>
                    <tr>
                      <Th>№</Th>
                      <Th>{L(COMMON.shop)}</Th>
                      <Th>{L(COMMON.phone)}</Th>
                      <Th>{L(COMMON.payment)}</Th>
                      <Th align="right">{L(COMMON.sum)}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.stops.map((st) => (
                      <tr key={st.orderId}>
                        <Td className="whitespace-nowrap font-semibold text-ink-900 tabular-nums">
                          {st.routeDay ? `${s.line}-${st.routeDay} / ` : ''}
                          {formatShopNum(st.num)}
                        </Td>
                        <Td className="font-semibold text-ink-900">{st.shopName}</Td>
                        <Td className="whitespace-nowrap text-ink-500">{st.phone || '—'}</Td>
                        <Td>
                          <Pill tone={PAYMENT_TONE[st.paymentMethod] || 'gray'}>
                            {PAYMENT_LABELS[st.paymentMethod] ? L(PAYMENT_LABELS[st.paymentMethod]) : st.paymentMethod}
                          </Pill>
                        </Td>
                        <Td align="right" className="font-semibold text-ink-900">
                          <Money value={st.amount} />
                        </Td>
                      </tr>
                    ))}
                    <tr>
                      <Td colSpan={4} className="font-bold text-ink-900">
                        {L(T.total)}: {fmt(L(T.nOrders), { n: s.orders })}
                      </Td>
                      <Td align="right" className="font-bold text-ink-900">
                        <Money value={s.total} />
                      </Td>
                    </tr>
                  </tbody>
                </Table>

                {/* Signature lines, mostly for the printed copy */}
                <div className="mt-6 grid grid-cols-2 gap-6 text-[13px] text-ink-500">
                  <div>
                    {L(T.loader)}: <span className="inline-block w-40 border-b border-ink-300 align-bottom" />
                  </div>
                  <div>
                    {L(T.driver)}: <span className="inline-block w-40 border-b border-ink-300 align-bottom" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {shown.length > 0 && <p className="text-xs text-ink-400 no-print">{L(T.hint)}</p>}
    </div>
  );
};

export default LoadingSheet;
