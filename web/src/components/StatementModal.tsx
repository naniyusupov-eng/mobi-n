import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import clsx from 'clsx';
import { FileText, Printer } from 'lucide-react';
import { Client, CompanySettings, PaymentMethod } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useToday } from '../hooks/useNow';
import { formatDateTime, formatDay, routeLabel, shiftMonth } from '../utils/format';
import { Button, EmptyState, Modal, Money, Segmented, fieldBase } from './ui';
import { RETURN_REASON_LABELS } from './ReturnModal';
import { COMMON, PAYMENT_LABELS, Tri, useL } from '../i18n/tri';
import { API, apiFetch } from '../api';

type EntryType = 'sale' | 'paid' | 'return' | 'payment' | 'cancel';

interface Entry {
  at: string;
  date: string;
  type: EntryType;
  doc: string;
  debit: number;
  credit: number;
  note: string;
  balance: number;
}

interface Statement {
  shop: { id: string; name: string; ownerName: string; phone: string; address: string; lineCode: string | null; day: number | null; num: number | null };
  from: string;
  to: string;
  opening: number;
  closing: number;
  totals: { debit: number; credit: number };
  entries: Entry[];
}

type Range = 'this' | 'last' | 'custom';

const T = {
  title: { uz: 'Akt sverka', uz_cyrl: 'Акт сверка', ru: 'Акт сверки' },
  fullTitle: { uz: 'Oʻzaro hisob-kitoblarni solishtirish dalolatnomasi', uz_cyrl: 'Ўзаро ҳисоб-китобларни солиштириш далолатномаси', ru: 'Акт сверки взаимных расчётов' },
  thisMonth: { uz: 'Shu oy', uz_cyrl: 'Шу ой', ru: 'Этот месяц' },
  lastMonth: { uz: 'Oʻtgan oy', uz_cyrl: 'Ўтган ой', ru: 'Прошлый месяц' },
  custom: { uz: 'Boshqa', uz_cyrl: 'Бошқа', ru: 'Другой' },
  from: { uz: 'dan', uz_cyrl: 'дан', ru: 'с' },
  to: { uz: 'gacha', uz_cyrl: 'гача', ru: 'по' },
  period: { uz: 'Davr', uz_cyrl: 'Давр', ru: 'Период' },
  supplier: { uz: 'Yetkazib beruvchi', uz_cyrl: 'Етказиб берувчи', ru: 'Поставщик' },
  buyer: { uz: 'Xaridor', uz_cyrl: 'Харидор', ru: 'Покупатель' },
  owner: { uz: 'Egasi', uz_cyrl: 'Эгаси', ru: 'Владелец' },
  address: { uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' },
  route: { uz: 'Marshrut', uz_cyrl: 'Маршрут', ru: 'Маршрут' },
  inn: { uz: 'STIR', uz_cyrl: 'СТИР', ru: 'ИНН' },
  account: { uz: 'H/r', uz_cyrl: 'Ҳ/р', ru: 'Р/с' },
  mfo: { uz: 'MFO', uz_cyrl: 'МФО', ru: 'МФО' },
  doc: { uz: 'Hujjat', uz_cyrl: 'Ҳужжат', ru: 'Документ' },
  note: { uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Примечание' },
  debit: { uz: 'Debet', uz_cyrl: 'Дебет', ru: 'Дебет' },
  credit: { uz: 'Kredit', uz_cyrl: 'Кредит', ru: 'Кредит' },
  balance: { uz: 'Qoldiq', uz_cyrl: 'Қолдиқ', ru: 'Сальдо' },
  opening: { uz: 'Davr boshidagi qoldiq', uz_cyrl: 'Давр бошидаги қолдиқ', ru: 'Сальдо на начало периода' },
  closing: { uz: 'Davr oxiridagi qoldiq', uz_cyrl: 'Давр охиридаги қолдиқ', ru: 'Сальдо на конец периода' },
  turnover: { uz: 'Davr aylanmasi', uz_cyrl: 'Давр айланмаси', ru: 'Обороты за период' },
  debtHint: { uz: 'Qoldiq — xaridorning qarzi', uz_cyrl: 'Қолдиқ — харидорнинг қарзи', ru: 'Сальдо — долг покупателя' },
  empty: { uz: 'Bu davrda harakat yoʻq', uz_cyrl: 'Бу даврда ҳаракат йўқ', ru: 'За период движений нет' },
  print: { uz: 'Chop etish', uz_cyrl: 'Чоп этиш', ru: 'Печать' },
  signature: { uz: 'imzo', uz_cyrl: 'имзо', ru: 'подпись' },
} satisfies Record<string, Tri>;

export const ENTRY_LABELS: Record<EntryType, Tri> = {
  sale: { uz: 'Sotuv', uz_cyrl: 'Сотув', ru: 'Продажа' },
  paid: { uz: 'Yetkazishda toʻlov', uz_cyrl: 'Етказишда тўлов', ru: 'Оплата при доставке' },
  return: { uz: 'Vozvrat', uz_cyrl: 'Возврат', ru: 'Возврат' },
  payment: { uz: 'Qarz toʻlovi (PKO)', uz_cyrl: 'Қарз тўлови (ПКО)', ru: 'Оплата долга (ПКО)' },
  cancel: { uz: 'Bekor qilingan', uz_cyrl: 'Бекор қилинган', ru: 'Отмена заказа' },
};

const lastDayOf = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
};

const formatNum = (n: number | null) => (n == null ? '' : Number.isInteger(n) ? String(n) : `${Math.floor(n)}a`);

interface StatementModalProps {
  shop: Client | null;
  onClose: () => void;
}

// Reconciliation statement of one shop for a period; printable on its own
export const StatementModal: React.FC<StatementModalProps> = ({ shop, onClose }) => {
  const { lang } = useLanguage();
  const L = useL();
  const today = useToday();
  const [range, setRange] = useState<Range>('this');
  const [customFrom, setCustomFrom] = useState(`${today.slice(0, 7)}-01`);
  const [customTo, setCustomTo] = useState(today);
  const [data, setData] = useState<Statement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [company, setCompany] = useState<CompanySettings>({});
  // The id is set only while printing (same as the loading sheet)
  const [printing, setPrinting] = useState(false);

  const thisMonth = today.slice(0, 7);
  const lastMonth = shiftMonth(thisMonth, -1);
  const [from, to] =
    range === 'this' ? [`${thisMonth}-01`, today] : range === 'last' ? [`${lastMonth}-01`, lastDayOf(lastMonth)] : [customFrom, customTo];
  const validRange = Boolean(from && to && from <= to);

  // A new shop starts from this month again
  useEffect(() => {
    if (!shop) return;
    setRange('this');
    setData(null);
  }, [shop?.id]);

  useEffect(() => {
    if (!shop) return;
    apiFetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => setCompany(d.settings || {}))
      .catch(() => {});
  }, [shop?.id]);

  useEffect(() => {
    if (!shop || !validRange) return;
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/statement?shopId=${encodeURIComponent(shop.id)}&from=${from}&to=${to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [shop?.id, from, to, validRange]);

  // Ctrl+P while the statement is open prints it too
  useEffect(() => {
    if (!shop) return;
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
  }, [shop]);

  const handlePrint = () => {
    flushSync(() => setPrinting(true));
    window.print();
    setPrinting(false);
  };

  const noteText = (e: Entry) => {
    if (!e.note) return '';
    if (PAYMENT_LABELS[e.note as PaymentMethod]) return L(PAYMENT_LABELS[e.note as PaymentMethod]);
    if (RETURN_REASON_LABELS[e.note]) return L(RETURN_REASON_LABELS[e.note]);
    return e.note;
  };

  const debtClass = (n: number) => (n > 0 ? 'text-rose-600' : 'text-ink-900');
  const s = data?.shop;
  const route = s ? routeLabel(s.lineCode, s.day) : '';

  return (
    <Modal
      open={Boolean(shop)}
      onClose={onClose}
      width="xl"
      title={L(T.title)}
      subtitle={shop?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {L(COMMON.close)}
          </Button>
          <Button icon={Printer} onClick={handlePrint} disabled={!data || loading || error}>
            {L(T.print)}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Segmented
          options={[
            { key: 'this' as Range, label: L(T.thisMonth) },
            { key: 'last' as Range, label: L(T.lastMonth) },
            { key: 'custom' as Range, label: L(T.custom) },
          ]}
          value={range}
          onChange={setRange}
        />
        {range === 'custom' && (
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <input
              type="date"
              value={customFrom}
              max={customTo || today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className={clsx(fieldBase, 'w-[160px]')}
              aria-label={L(T.from)}
            />
            <span>—</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={today}
              onChange={(e) => setCustomTo(e.target.value)}
              className={clsx(fieldBase, 'w-[160px]')}
              aria-label={L(T.to)}
            />
          </div>
        )}
      </div>

      {!data ? (
        error ? (
          <EmptyState icon={FileText} title={L(COMMON.error)} hint={L(COMMON.loadError)} />
        ) : (
          <EmptyState icon={FileText} title={L(COMMON.loading)} />
        )
      ) : (
        <div
          id={printing ? 'print-section' : undefined}
          className={clsx('text-sm text-ink-700', printing && 'print-plain', loading && 'opacity-60')}
        >
          <div className="text-center mb-5">
            <h2 className="text-[18px] font-bold tracking-tight text-ink-900">{L(T.fullTitle)}</h2>
            <p className="text-[13px] text-ink-500 mt-1">
              {L(T.period)}: {formatDay(data.from, lang)} — {formatDay(data.to, lang)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl2 bg-ink-100/60 p-4 print-box">
              <div className="text-xs text-ink-400 mb-1">{L(T.supplier)}</div>
              <div className="font-bold text-ink-900">{company.companyName || '—'}</div>
              {company.address ? <div className="text-[13px]">{company.address}</div> : null}
              {company.phone ? <div className="text-[13px]">{L(COMMON.phone)}: {company.phone}</div> : null}
              {company.inn ? <div className="text-[13px]">{L(T.inn)}: {company.inn}</div> : null}
              {company.bankAccount ? (
                <div className="text-[13px]">
                  {L(T.account)}: {company.bankAccount}
                  {company.bankMfo ? `, ${L(T.mfo)}: ${company.bankMfo}` : ''}
                </div>
              ) : null}
            </div>
            <div className="rounded-xl2 bg-ink-100/60 p-4 print-box">
              <div className="text-xs text-ink-400 mb-1">{L(T.buyer)}</div>
              <div className="font-bold text-ink-900">{s?.name}</div>
              {s?.ownerName ? <div className="text-[13px]">{L(T.owner)}: {s.ownerName}</div> : null}
              {s?.phone ? <div className="text-[13px]">{L(COMMON.phone)}: {s.phone}</div> : null}
              {s?.address ? <div className="text-[13px]">{L(T.address)}: {s.address}</div> : null}
              {route ? (
                <div className="text-[13px]">
                  {L(T.route)}: {route}
                  {s?.num != null ? ` №${formatNum(s.num)}` : ''}
                </div>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs font-medium text-ink-400 bg-ink-100/60">
                  <th className="px-3 py-2.5 text-left">{L(COMMON.date)}</th>
                  <th className="px-3 py-2.5 text-left">{L(T.doc)}</th>
                  <th className="px-3 py-2.5 text-left">№</th>
                  <th className="px-3 py-2.5 text-left">{L(T.note)}</th>
                  <th className="px-3 py-2.5 text-right">{L(T.debit)}</th>
                  <th className="px-3 py-2.5 text-right">{L(T.credit)}</th>
                  <th className="px-3 py-2.5 text-right">{L(T.balance)}</th>
                </tr>
              </thead>
              <tbody className="[&_td]:px-3 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-ink-100">
                <tr className="font-semibold text-ink-900">
                  <td colSpan={6}>{L(T.opening)}</td>
                  <td className={clsx('text-right', debtClass(data.opening))}>
                    <Money value={data.opening} unit={false} />
                  </td>
                </tr>
                {data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-ink-400">
                      {L(T.empty)}
                    </td>
                  </tr>
                ) : (
                  data.entries.map((e, i) => (
                    <tr key={`${e.type}-${e.doc}-${i}`}>
                      <td className="whitespace-nowrap tabular-nums">{formatDateTime(e.at, lang)}</td>
                      <td className="whitespace-nowrap">{L(ENTRY_LABELS[e.type] || { uz: e.type, uz_cyrl: e.type, ru: e.type })}</td>
                      <td className="whitespace-nowrap font-mono text-ink-500">#{e.doc.slice(-6).toUpperCase()}</td>
                      <td className="text-ink-500">{noteText(e)}</td>
                      <td className="text-right">{e.debit ? <Money value={e.debit} unit={false} /> : ''}</td>
                      <td className="text-right">{e.credit ? <Money value={e.credit} unit={false} /> : ''}</td>
                      <td className={clsx('text-right font-semibold', debtClass(e.balance))}>
                        <Money value={e.balance} unit={false} />
                      </td>
                    </tr>
                  ))
                )}
                <tr className="font-semibold text-ink-900">
                  <td colSpan={4}>{L(T.turnover)}</td>
                  <td className="text-right">
                    <Money value={data.totals.debit} unit={false} />
                  </td>
                  <td className="text-right">
                    <Money value={data.totals.credit} unit={false} />
                  </td>
                  <td />
                </tr>
                <tr className="font-bold text-ink-900">
                  <td colSpan={6}>{L(T.closing)}</td>
                  <td className={clsx('text-right', debtClass(data.closing))}>
                    <Money value={data.closing} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-400 mt-2">{L(T.debtHint)}</p>

          <div className="mt-8 grid grid-cols-2 gap-8 text-[13px] text-ink-500">
            <div>
              <div className="font-semibold text-ink-900 mb-6">{L(T.supplier)}</div>
              <div className="border-b border-ink-300 print-box" />
              <div className="text-xs text-ink-400 mt-1">({L(T.signature)})</div>
            </div>
            <div>
              <div className="font-semibold text-ink-900 mb-6">{L(T.buyer)}</div>
              <div className="border-b border-ink-300 print-box" />
              <div className="text-xs text-ink-400 mt-1">({L(T.signature)})</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StatementModal;
