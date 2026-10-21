import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, HandCoins, ReceiptText, RefreshCw, Trash2, Wallet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatDateTime, formatDay } from '../../utils/format';
import { Button, Card, CardTitle, EmptyState, Field, Modal, Money, Pill, StatCard, Table, Td, Th, formatSum } from '../../components/ui';
import { COMMON, Tri, fmt, useL } from '../../i18n/tri';
import { API, apiFetch } from '../../api';

interface Handover {
  id: string;
  line: string;
  date: string;
  amount: number;
  note: string;
  createdAt: string;
}

interface CashLine {
  line: string;
  deliveredOrders: number;
  deliveryCash: number;
  pkoCount: number;
  pkoCash: number;
  expected: number;
  received: number;
  difference: number; // received - expected; below zero = short
  handovers: Handover[];
}

const T = {
  title: { uz: 'Kassa', uz_cyrl: 'Касса', ru: 'Касса' },
  subtitle: {
    uz: 'Haydovchilar yetkazish va PKO boʻyicha olgan naqd pul va kassaga topshirgani',
    uz_cyrl: 'Ҳайдовчилар етказиш ва ПКО бўйича олган нақд пул ва кассага топширгани',
    ru: 'Наличные, собранные водителями при доставке и по ПКО, и сданные в кассу',
  },
  expected: { uz: 'Kutilgan', uz_cyrl: 'Кутилган', ru: 'Ожидается' },
  received: { uz: 'Topshirilgan', uz_cyrl: 'Топширилган', ru: 'Сдано' },
  difference: { uz: 'Farq', uz_cyrl: 'Фарқ', ru: 'Разница' },
  pko: { uz: 'PKO', uz_cyrl: 'ПКО', ru: 'ПКО' },
  delivered: { uz: 'Yetkazilgan', uz_cyrl: 'Етказилган', ru: 'Доставлено' },
  deliveryCash: { uz: 'Yetkazishdan naqd', uz_cyrl: 'Етказишдан нақд', ru: 'Наличные с доставки' },
  short: { uz: 'Kam topshirildi', uz_cyrl: 'Кам топширилди', ru: 'Недостача' },
  ok: { uz: 'Hammasi topshirildi', uz_cyrl: 'Ҳаммаси топширилди', ru: 'Всё сдано' },
  accept: { uz: 'Qabul qilish', uz_cyrl: 'Қабул қилиш', ru: 'Принять' },
  acceptTitle: { uz: '{line}: pul qabul qilish', uz_cyrl: '{line}: пул қабул қилиш', ru: '{line}: приём денег' },
  amount: { uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' },
  note: { uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Комментарий' },
  notePh: { uz: 'Masalan: kechki topshiriq', uz_cyrl: 'Масалан: кечки топшириқ', ru: 'Например: вечерняя сдача' },
  remaining: { uz: 'Qolgan: {sum} soʻm', uz_cyrl: 'Қолган: {sum} сўм', ru: 'Осталось: {sum} сум' },
  badAmount: { uz: 'Summani toʻgʻri kiriting', uz_cyrl: 'Суммани тўғри киритинг', ru: 'Введите правильную сумму' },
  saveError: { uz: 'Saqlab boʻlmadi', uz_cyrl: 'Сақлаб бўлмади', ru: 'Не удалось сохранить' },
  undo: { uz: 'Topshiriqni oʻchirish', uz_cyrl: 'Топшириқни ўчириш', ru: 'Удалить сдачу' },
  undoConfirm: {
    uz: '{line}: {sum} soʻm topshiriqni oʻchirasizmi?',
    uz_cyrl: '{line}: {sum} сўм топшириқни ўчирасизми?',
    ru: '{line}: удалить сдачу на {sum} сум?',
  },
  showAll: { uz: 'Barcha liniyalar ({n})', uz_cyrl: 'Барча линиялар ({n})', ru: 'Все линии ({n})' },
  showActive: { uz: 'Faqat pulli liniyalar', uz_cyrl: 'Фақат пулли линиялар', ru: 'Только линии с деньгами' },
  refresh: { uz: 'Yangilash', uz_cyrl: 'Янгилаш', ru: 'Обновить' },
  empty: { uz: 'Bu kunda naqd pul yoʻq', uz_cyrl: 'Бу кунда нақд пул йўқ', ru: 'В этот день наличных нет' },
  nPcs: { uz: '{n} ta', uz_cyrl: '{n} та', ru: '{n} шт' },
  linesShort: { uz: '{n} ta liniyada kamomad', uz_cyrl: '{n} та линияда камомад', ru: 'Недостача на {n} линиях' },
} satisfies Record<string, Tri>;

const Diff: React.FC<{ value: number; className?: string }> = ({ value, className }) => (
  <span className={clsx('font-semibold', value < 0 ? 'text-rose-600' : 'text-emerald-600', className)}>
    {value > 0 ? '+' : ''}
    <Money value={value} />
  </span>
);

interface CashTabProps {
  day: string; // YYYY-MM-DD
}

// Cash each line's driver should hand in for a day and what the cashier has taken
export const CashTab: React.FC<CashTabProps> = ({ day }) => {
  const { lang } = useLanguage();
  const L = useL();
  const [lines, setLines] = useState<CashLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Handover modal
  const [target, setTarget] = useState<CashLine | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/cash?date=${day}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setLines(d.lines || []);
        setError(false);
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [day, reload]);

  const openAccept = (l: CashLine) => {
    setTarget(l);
    setAmount(String(Math.max(0, l.expected - l.received)));
    setNote('');
    setFormError('');
  };

  const closeModal = () => setTarget(null);

  const handleSave = async () => {
    if (!target) return;
    const value = Math.round(Number(amount.replace(/\s/g, '').replace(',', '.')));
    if (!(value > 0)) return setFormError(L(T.badAmount));
    setSaving(true);
    try {
      const res = await apiFetch(`${API}/cash/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: target.line, date: day, amount: value, note: note.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ? `${L(T.saveError)}: ${d.error}` : L(T.saveError));
        return;
      }
      setTarget(null);
      setReload((n) => n + 1);
    } catch {
      setFormError(L(T.saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h: Handover) => {
    if (!window.confirm(fmt(L(T.undoConfirm), { line: h.line, sum: formatSum(h.amount) }))) return;
    await apiFetch(`${API}/cash/handover/${h.id}`, { method: 'DELETE' }).catch(() => {});
    setReload((n) => n + 1);
  };

  const active = lines.filter((l) => l.expected !== 0 || l.handovers.length > 0);
  const shown = showAll ? lines : active;
  const sum = (k: 'expected' | 'received' | 'pkoCash' | 'pkoCount' | 'deliveryCash' | 'deliveredOrders') =>
    lines.reduce((s, l) => s + l[k], 0);
  const expected = sum('expected');
  const received = sum('received');
  const difference = received - expected;
  const shortLines = lines.filter((l) => l.difference < 0).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} tone="brand" label={L(T.expected)} value={<Money value={expected} />} note={formatDay(day, lang)} />
        <StatCard
          icon={HandCoins}
          tone="green"
          label={L(T.received)}
          value={<Money value={received} />}
          note={fmt(L(T.nPcs), { n: lines.reduce((s, l) => s + l.handovers.length, 0) })}
        />
        <StatCard
          icon={difference < 0 ? AlertTriangle : CheckCircle2}
          tone={difference < 0 ? 'red' : 'green'}
          label={L(T.difference)}
          value={<Diff value={difference} />}
          note={shortLines ? fmt(L(T.linesShort), { n: shortLines }) : L(T.ok)}
        />
        <StatCard
          icon={ReceiptText}
          tone="violet"
          label={L(T.pko)}
          value={<Money value={sum('pkoCash')} />}
          note={fmt(L(T.nPcs), { n: sum('pkoCount') })}
        />
      </div>

      <Card>
        <CardTitle
          title={
            <span className="flex items-center gap-2">
              {L(T.title)} <Pill tone="gray">{formatDay(day, lang)}</Pill>
            </span>
          }
          subtitle={L(T.subtitle)}
          action={
            <div className="flex items-center gap-2">
              {lines.length > active.length && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? L(T.showActive) : fmt(L(T.showAll), { n: lines.length })}
                </Button>
              )}
              <Button variant="white" size="sm" icon={RefreshCw} onClick={() => setReload((n) => n + 1)} title={L(T.refresh)} />
            </div>
          }
        />

        {shown.length === 0 ? (
          error ? (
            <EmptyState icon={Wallet} title={L(COMMON.error)} hint={L(COMMON.loadError)} />
          ) : (
            <EmptyState icon={Wallet} title={L(loading ? COMMON.loading : T.empty)} />
          )
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{L(COMMON.line)}</Th>
                <Th align="right">{L(T.delivered)}</Th>
                <Th align="right">{L(T.deliveryCash)}</Th>
                <Th align="right">{L(T.pko)}</Th>
                <Th align="right">{L(T.expected)}</Th>
                <Th align="right">{L(T.received)}</Th>
                <Th align="right">{L(T.difference)}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <React.Fragment key={l.line}>
                  <tr className="hover:bg-ink-100/40 transition">
                    <Td>
                      <Pill tone="brand">{l.line}</Pill>
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {l.deliveredOrders}
                    </Td>
                    <Td align="right">
                      <Money value={l.deliveryCash} />
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <span className="text-ink-400 mr-1.5">{fmt(L(T.nPcs), { n: l.pkoCount })}</span>
                      <Money value={l.pkoCash} />
                    </Td>
                    <Td align="right" className="font-semibold text-ink-900">
                      <Money value={l.expected} />
                    </Td>
                    <Td align="right" className="font-semibold text-ink-900">
                      <Money value={l.received} />
                    </Td>
                    <Td align="right" className="whitespace-nowrap">
                      <Diff value={l.difference} />
                    </Td>
                    <Td align="right">
                      <Button size="sm" variant={l.difference < 0 ? 'primary' : 'secondary'} icon={HandCoins} onClick={() => openAccept(l)}>
                        {L(T.accept)}
                      </Button>
                    </Td>
                  </tr>
                  {l.handovers.length > 0 && (
                    <tr>
                      <Td colSpan={8} className="pt-0">
                        <div className="rounded-xl2 bg-ink-100/50 divide-y divide-ink-100">
                          {l.handovers.map((h) => (
                            <div key={h.id} className="flex items-center gap-4 px-4 py-2 text-[13px]">
                              <span className="text-ink-400 whitespace-nowrap">{formatDateTime(h.createdAt, lang)}</span>
                              <Money value={h.amount} className="font-semibold text-emerald-600" />
                              <span className="flex-1 min-w-0 truncate text-ink-500" title={h.note}>
                                {h.note}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelete(h)}
                                title={L(T.undo)}
                                aria-label={L(T.undo)}
                                className="w-8 h-8 rounded-full inline-flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!target}
        onClose={closeModal}
        title={target ? fmt(L(T.acceptTitle), { line: target.line }) : ''}
        subtitle={formatDay(day, lang)}
        width="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              {L(COMMON.cancel)}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {L(COMMON.save)}
            </Button>
          </>
        }
      >
        {target && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <Field
              label={L(T.amount)}
              suffix={L(COMMON.som)}
              inputMode="numeric"
              autoFocus
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setFormError('');
              }}
              hint={fmt(L(T.remaining), { sum: formatSum(Math.max(0, target.expected - target.received)) })}
            />
            <Field label={L(T.note)} placeholder={L(T.notePh)} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
            {formError && <p className="text-sm text-rose-600">{formError}</p>}
            <button type="submit" className="hidden" />
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CashTab;
