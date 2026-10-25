import React, { useMemo, useState } from 'react';
import { Inbox, Printer, Receipt, Search, SearchX } from 'lucide-react';
import { CompanySettings, Order, OrderStatus, PaymentMethod } from '../types';
import { useWaybillPrint } from '../components/WaybillBatchPrint';
import { useLanguage } from '../context/LanguageContext';
import { dayKey, formatDate, formatDateTime, routeLabel } from '../utils/format';
import { PeriodPicker, inPeriod, usePeriod } from '../components/PeriodPicker';
import { Button, Card, EmptyState, Money, Pill, SearchInput, Segmented, Table, Td, Th, Tone } from '../components/ui';
import { COMMON, PAYMENT_LABELS, STATUS_LABELS, Tri, useL } from '../i18n/tri';

interface OrdersProps {
  orders: Order[];
  company: CompanySettings;
  onViewOrder: (order: Order) => void;
}

type Filter = 'all' | 'new' | 'confirmed' | 'delivered';

const STATUS_META: Record<OrderStatus, { label: Tri; tone: Tone }> = {
  new: { label: STATUS_LABELS.new, tone: 'amber' },
  confirmed: { label: STATUS_LABELS.confirmed, tone: 'brand' },
  delivered: { label: STATUS_LABELS.delivered, tone: 'green' },
  cancelled: { label: STATUS_LABELS.cancelled, tone: 'red' },
};

const PAYMENT_META: Record<PaymentMethod, { label: Tri; tone: Tone }> = {
  naqd: { label: PAYMENT_LABELS.naqd, tone: 'green' },
  nasiya: { label: PAYMENT_LABELS.nasiya, tone: 'red' },
  otkazma: { label: PAYMENT_LABELS.otkazma, tone: 'brand' },
};

const T = {
  printSelected: { uz: 'Yuk xatlarini chop etish', uz_cyrl: 'Юк хатларини чоп этиш', ru: 'Печать накладных' },
  selectAll: { uz: 'Hammasini tanlash', uz_cyrl: 'Ҳаммасини танлаш', ru: 'Выбрать все' },
  clearSel: { uz: 'Bekor qilish', uz_cyrl: 'Бекор қилиш', ru: 'Снять выбор' },
  searchPlaceholder: { uz: 'ID yoki doʻkon nomi', uz_cyrl: 'ID ёки дўкон номи', ru: 'ID или название магазина' },
  allTab: { uz: 'Barchasi', uz_cyrl: 'Барчаси', ru: 'Все' },
  noOrders: { uz: 'Hali buyurtmalar yoʻq', uz_cyrl: 'Ҳали буюртмалар йўқ', ru: 'Заказов пока нет' },
  noOrdersHint: {
    uz: 'Mobil ilovadan yuborilgan buyurtmalar shu yerda chiqadi.',
    uz_cyrl: 'Мобил иловадан юборилган буюртмалар шу ерда чиқади.',
    ru: 'Здесь появятся заказы, отправленные из мобильного приложения.',
  },
  notFound: { uz: 'Buyurtma topilmadi', uz_cyrl: 'Буюртма топилмади', ru: 'Заказы не найдены' },
  notFoundHint: {
    uz: 'Qidiruv yoki filtrni oʻzgartirib koʻring.',
    uz_cyrl: 'Қидирув ёки фильтрни ўзгартириб кўринг.',
    ru: 'Попробуйте изменить поиск или фильтр.',
  },
  delivery: { uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' },
  returnWord: { uz: 'vozvrat', uz_cyrl: 'возврат', ru: 'возврат' },
} satisfies Record<string, Tri>;

export const Orders: React.FC<OrdersProps> = ({ orders, company, onViewOrder }) => {
  // Orders ticked for printing their waybills together (one A4 page each)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { printWaybills, node: printNode } = useWaybillPrint(company);
  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const { lang } = useLanguage();
  const L = useL();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Filter>('all');
  const [period, setPeriod] = usePeriod('day'); // main page: today's orders by default

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (q && !o.id.toLowerCase().includes(q) && !o.shopName.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return inPeriod(dayKey(o.createdAt), period);
    });
  }, [orders, search, statusFilter, period]);

  // Same meaning as the dashboard and reports: cancelled orders excluded, returns taken off
  // Only orders still shown count, in the order they are listed
  const selectedOrders = filteredOrders.filter((o) => selected.has(o.id));
  const allSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;

  const totalSum = filteredOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.finalAmount - (o.returnedAmount || 0), 0);

  // Status counts within the chosen period
  const counts = useMemo(() => {
    const inP = orders.filter((o) => inPeriod(dayKey(o.createdAt), period));
    return {
      all: inP.length,
      new: inP.filter((o) => o.status === 'new').length,
      confirmed: inP.filter((o) => o.status === 'confirmed').length,
      delivered: inP.filter((o) => o.status === 'delivered').length,
    };
  }, [orders, period]);

  const tab = (label: string, n: number) => (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <span className="tabular-nums opacity-70">{n}</span>
    </span>
  );

  return (
    <div className="space-y-5">
      {printNode}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          icon={Search}
          value={search}
          onChange={setSearch}
          placeholder={L(T.searchPlaceholder)}
          className="flex-1 min-w-[14rem] max-w-sm [&_input]:bg-white [&_input]:shadow-card"
        />
        <Segmented<Filter>
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { key: 'all', label: tab(L(T.allTab), counts.all) },
            { key: 'new', label: tab(L(STATUS_LABELS.new), counts.new) },
            { key: 'confirmed', label: tab(L(STATUS_LABELS.confirmed), counts.confirmed) },
            { key: 'delivered', label: tab(L(STATUS_LABELS.delivered), counts.delivered) },
          ]}
        />
        <PeriodPicker value={period} onChange={setPeriod} />
        <div className="flex items-center gap-2 ml-auto">
          {selectedOrders.length > 0 && (
            <>
              <Button size="sm" icon={Printer} onClick={() => printWaybills(selectedOrders)}>
                {L(T.printSelected)} ({selectedOrders.length})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                {L(T.clearSel)}
              </Button>
            </>
          )}
          <Pill tone="gray" className="py-1.5 px-3 text-[13px]">
            <span className="tabular-nums">{filteredOrders.length}</span> {L(COMMON.pcs)}
          </Pill>
          <Pill tone="brand" className="py-1.5 px-3 text-[13px]">
            <Money value={totalSum} />
          </Pill>
        </div>
      </div>

      <Card padded={false} className="p-2 md:p-3">
        {filteredOrders.length === 0 ? (
          orders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={L(T.noOrders)}
              hint={L(T.noOrdersHint)}
            />
          ) : (
            <EmptyState icon={SearchX} title={L(T.notFound)} hint={L(T.notFoundHint)} />
          )
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    aria-label={L(T.selectAll)}
                    title={L(T.selectAll)}
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(filteredOrders.map((o) => o.id)))}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                </Th>
                <Th>№</Th>
                <Th>{L(COMMON.date)}</Th>
                <Th>{L(COMMON.shop)}</Th>
                <Th>{L(COMMON.payment)}</Th>
                <Th align="right">{L(COMMON.sum)}</Th>
                <Th align="center">{L(COMMON.status)}</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const status = STATUS_META[order.status] || STATUS_META.new;
                const pay = PAYMENT_META[order.paymentMethod] || PAYMENT_META.otkazma;
                const returned = order.returnedAmount || 0;
                return (
                  <tr
                    key={order.id}
                    onClick={() => onViewOrder(order)}
                    className={`cursor-pointer transition hover:bg-brand-50/40 ${selected.has(order.id) ? 'bg-brand-50/60' : ''}`}
                  >
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`#${order.id.slice(-6).toUpperCase()}`}
                        checked={selected.has(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggle(order.id)}
                        className="w-4 h-4 accent-brand-500 cursor-pointer"
                      />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <span className="font-mono text-[13px] font-semibold text-brand-500">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="text-ink-700">{formatDateTime(order.createdAt, lang)}</div>
                      {order.deliveryDate && (
                        <div className="text-xs text-ink-400 mt-0.5">{L(T.delivery)}: {formatDate(order.deliveryDate, lang)}</div>
                      )}
                    </Td>
                    <Td className="max-w-[18rem]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-ink-900 truncate">{order.shopName}</span>
                        {order.lineCode && (
                          <Pill tone="gray" className="px-2 py-0.5 text-[11px] shrink-0">
                            {routeLabel(order.lineCode, order.routeDay)}
                          </Pill>
                        )}
                      </div>
                      {order.shopAddress && <div className="text-xs text-ink-400 truncate mt-0.5">{order.shopAddress}</div>}
                    </Td>
                    <Td>
                      <Pill tone={pay.tone}>{L(pay.label)}</Pill>
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <Money value={order.finalAmount} className="font-bold text-ink-900" />
                      {returned > 0 && (
                        <div className="text-xs text-rose-600 mt-0.5">
                          -<Money value={returned} /> {L(T.returnWord)}
                        </div>
                      )}
                    </Td>
                    <Td align="center">
                      <Pill tone={status.tone}>{L(status.label)}</Pill>
                    </Td>
                    <Td align="right">
                      <span onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="secondary" icon={Receipt} onClick={() => onViewOrder(order)}>
                          {L(COMMON.receipt)}
                        </Button>
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
