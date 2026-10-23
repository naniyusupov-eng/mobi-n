import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AlertTriangle, BadgePercent, Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { Line, PackagingUnit, Product, Promo, PromoKind } from '../../types';
import { Button, Card, EmptyState, Field, Modal, Pill, Segmented, Select, Table, Td, Th, formatSum } from '../../components/ui';
import { COMMON, Tri, UNIT_LABELS, fmt, useL } from '../../i18n/tri';
import { useLanguage } from '../../context/LanguageContext';
import { useToday } from '../../hooks/useNow';
import { formatDay } from '../../utils/format';
import { API, apiFetch } from '../../api';

const T = {
  newPromo: { uz: 'Yangi aksiya', uz_cyrl: 'Янги аксия', ru: 'Новая акция' },
  editPromo: { uz: 'Aksiyani tahrirlash', uz_cyrl: 'Аксияни таҳрирлаш', ru: 'Изменить акцию' },
  hint: {
    uz: 'Aksiyalar agent ilovasining savatida avtomatik qoʻllanadi.',
    uz_cyrl: 'Аксиялар агент иловасининг саватида автоматик қўлланади.',
    ru: 'Акции применяются автоматически в корзине приложения агента.',
  },
  noPromos: { uz: 'Hali aksiya yoʻq', uz_cyrl: 'Ҳали аксия йўқ', ru: 'Акций пока нет' },
  noPromosHint: {
    uz: 'Masalan: 5 blokdan olsa −10% yoki 2 000 000 soʻmlik buyurtmaga −3%',
    uz_cyrl: 'Масалан: 5 блокдан олса −10% ёки 2 000 000 сўмлик буюртмага −3%',
    ru: 'Например: −10% от 5 блоков или −3% на заказ от 2 000 000 сум',
  },
  loadError: { uz: 'Aksiyalarni yuklab boʻlmadi', uz_cyrl: 'Аксияларни юклаб бўлмади', ru: 'Не удалось загрузить акции' },
  saveError: { uz: 'Saqlashda xatolik yuz berdi', uz_cyrl: 'Сақлашда хатолик юз берди', ru: 'Ошибка при сохранении' },
  deleteError: { uz: 'Oʻchirib boʻlmadi', uz_cyrl: 'Ўчириб бўлмади', ru: 'Не удалось удалить' },
  deleteConfirm: { uz: '"{name}" aksiyasi oʻchirilsinmi?', uz_cyrl: '"{name}" аксияси ўчирилсинми?', ru: 'Удалить акцию «{name}»?' },
  name: { uz: 'Nomi', uz_cyrl: 'Номи', ru: 'Название' },
  namePlaceholder: { uz: 'Kuzgi aksiya', uz_cyrl: 'Кузги аксия', ru: 'Осенняя акция' },
  rule: { uz: 'Shart', uz_cyrl: 'Шарт', ru: 'Условие' },
  period: { uz: 'Muddat', uz_cyrl: 'Муддат', ru: 'Период' },
  lines: { uz: 'Liniyalar', uz_cyrl: 'Линиялар', ru: 'Линии' },
  active: { uz: 'Faol', uz_cyrl: 'Фаол', ru: 'Активна' },
  activeLabel: { uz: 'Aksiya faol', uz_cyrl: 'Аксия фаол', ru: 'Акция активна' },
  kindProduct: { uz: 'Tovar', uz_cyrl: 'Товар', ru: 'Товар' },
  kindOrder: { uz: 'Buyurtma', uz_cyrl: 'Буюртма', ru: 'Заказ' },
  ruleProduct: { uz: '{product}: {n} {unit}dan → −{p}%', uz_cyrl: '{product}: {n} {unit}дан → −{p}%', ru: '{product}: от {n} {unit} → −{p}%' },
  ruleOrder: { uz: 'Buyurtma {sum} soʻmdan → −{p}%', uz_cyrl: 'Буюртма {sum} сўмдан → −{p}%', ru: 'Заказ от {sum} сум → −{p}%' },
  unknownProduct: { uz: 'Oʻchirilgan tovar', uz_cyrl: 'Ўчирилган товар', ru: 'Удалённый товар' },
  always: { uz: 'Muddatsiz', uz_cyrl: 'Муддатсиз', ru: 'Бессрочно' },
  fromOnly: { uz: '{date} dan', uz_cyrl: '{date} дан', ru: 'с {date}' },
  toOnly: { uz: '{date} gacha', uz_cyrl: '{date} гача', ru: 'до {date}' },
  expired: { uz: 'Tugagan', uz_cyrl: 'Тугаган', ru: 'Закончилась' },
  notStarted: { uz: 'Boshlanmagan', uz_cyrl: 'Бошланмаган', ru: 'Не началась' },
  off: { uz: 'Oʻchirilgan', uz_cyrl: 'Ўчирилган', ru: 'Выключена' },
  product: { uz: 'Tovar', uz_cyrl: 'Товар', ru: 'Товар' },
  pickProduct: { uz: 'Tovarni tanlang', uz_cyrl: 'Товарни танланг', ru: 'Выберите товар' },
  unit: { uz: 'Birlik', uz_cyrl: 'Бирлик', ru: 'Единица' },
  minQty: { uz: 'Kamida (miqdor)', uz_cyrl: 'Камида (миқдор)', ru: 'Минимум (кол-во)' },
  minTotal: { uz: 'Buyurtma summasi kamida', uz_cyrl: 'Буюртма суммаси камида', ru: 'Сумма заказа от' },
  percent: { uz: 'Chegirma', uz_cyrl: 'Чегирма', ru: 'Скидка' },
  from: { uz: 'Boshlanishi', uz_cyrl: 'Бошланиши', ru: 'Начало' },
  to: { uz: 'Tugashi', uz_cyrl: 'Тугаши', ru: 'Окончание' },
  dateHint: { uz: 'Boʻsh: cheklovsiz', uz_cyrl: 'Бўш: чекловсиз', ru: 'Пусто: без ограничения' },
  linesHint: {
    uz: 'Hech biri tanlanmasa, barcha liniyalarga amal qiladi',
    uz_cyrl: 'Ҳеч бири танланмаса, барча линияларга амал қилади',
    ru: 'Если ничего не выбрано, действует на все линии',
  },
  errName: { uz: 'Aksiya nomini kiriting', uz_cyrl: 'Аксия номини киритинг', ru: 'Введите название акции' },
  errPercent: { uz: 'Chegirma 1 dan 90 % gacha boʻlishi kerak', uz_cyrl: 'Чегирма 1 дан 90 % гача бўлиши керак', ru: 'Скидка должна быть от 1 до 90 %' },
  errProduct: { uz: 'Tovarni tanlang', uz_cyrl: 'Товарни танланг', ru: 'Выберите товар' },
  errQty: { uz: 'Miqdor butun musbat son boʻlishi kerak', uz_cyrl: 'Миқдор бутун мусбат сон бўлиши керак', ru: 'Количество должно быть целым положительным числом' },
  errTotal: { uz: 'Summa 0 yoki undan katta boʻlishi kerak', uz_cyrl: 'Сумма 0 ёки ундан катта бўлиши керак', ru: 'Сумма должна быть 0 или больше' },
  errDates: { uz: 'Tugash sanasi boshlanishidan oldin', uz_cyrl: 'Тугаш санаси бошланишидан олдин', ru: 'Дата окончания раньше начала' },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
  edit: { uz: 'Tahrirlash', uz_cyrl: 'Таҳрирлаш', ru: 'Изменить' },
  delete: { uz: 'Oʻchirish', uz_cyrl: 'Ўчириш', ru: 'Удалить' },
} satisfies Record<string, Tri>;

const UNITS: PackagingUnit[] = ['dona', 'blok', 'korobka', 'kg'];

const send = async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
  const res = await apiFetch(`${API}${path}`, {
    method,
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/\s/g, '').replace(',', '.')));

export const PromosView: React.FC<{ products: Product[] }> = ({ products }) => {
  const L = useL();
  const { lang } = useLanguage();
  const today = useToday();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [editing, setEditing] = useState<Promo | 'new' | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch(`${API}/promos`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => alive && setPromos(Array.isArray(d.promos) ? d.promos : []))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    apiFetch(`${API}/lines`)
      .then((r) => r.json())
      .then((d) => alive && setLines(Array.isArray(d.lines) ? d.lines : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const ruleText = (p: Promo) =>
    p.kind === 'product'
      ? fmt(L(T.ruleProduct), {
          product: byId.get(p.productId || '')?.name || L(T.unknownProduct),
          n: formatSum(p.minQty || 1),
          unit: L(UNIT_LABELS[p.unit || 'blok'] || UNIT_LABELS.blok),
          p: p.percent,
        })
      : fmt(L(T.ruleOrder), { sum: formatSum(p.minTotal || 0), p: p.percent });

  const periodText = (p: Promo) =>
    p.from && p.to
      ? `${formatDay(p.from, lang)} – ${formatDay(p.to, lang)}`
      : p.from
        ? fmt(L(T.fromOnly), { date: formatDay(p.from, lang) })
        : p.to
          ? fmt(L(T.toOnly), { date: formatDay(p.to, lang) })
          : L(T.always);

  const toggle = async (p: Promo) => {
    if (busyId) return;
    setBusyId(p.id);
    try {
      const d = await send('/promos', 'POST', { ...p, active: !p.active });
      if (Array.isArray(d.promos)) setPromos(d.promos);
    } catch (e) {
      window.alert(errText(e, L(T.saveError)));
    } finally {
      setBusyId('');
    }
  };

  const remove = async (p: Promo) => {
    if (busyId || !window.confirm(fmt(L(T.deleteConfirm), { name: p.name }))) return;
    setBusyId(p.id);
    try {
      const d = await send(`/promos/${encodeURIComponent(p.id)}`, 'DELETE');
      if (Array.isArray(d.promos)) setPromos(d.promos);
      else setPromos((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      window.alert(errText(e, L(T.deleteError)));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-[13px] text-ink-500">
          <Info className="w-4 h-4 shrink-0 text-brand-500" />
          {L(T.hint)}
        </div>
        <Button icon={Plus} onClick={() => setEditing('new')} className="ml-auto" disabled={failed}>
          {L(T.newPromo)}
        </Button>
      </div>

      <Card padded={false} className="p-3 md:p-4">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
        ) : failed ? (
          <div className="flex items-center gap-2.5 mx-2 px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">
            <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
            {L(T.loadError)}
          </div>
        ) : promos.length === 0 ? (
          <EmptyState
            icon={BadgePercent}
            title={L(T.noPromos)}
            hint={L(T.noPromosHint)}
            action={
              <Button icon={Plus} onClick={() => setEditing('new')}>
                {L(T.newPromo)}
              </Button>
            }
          />
        ) : (
          <Table className="min-w-[980px]">
            <thead>
              <tr>
                <Th>{L(T.name)}</Th>
                <Th>{L(T.rule)}</Th>
                <Th>{L(T.period)}</Th>
                <Th>{L(T.lines)}</Th>
                <Th align="center">{L(T.active)}</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => {
                const expired = Boolean(p.to && p.to < today);
                const notStarted = Boolean(p.from && p.from > today);
                return (
                  <tr key={p.id} className={clsx('hover:bg-ink-100/40 transition align-top', (!p.active || expired) && 'opacity-60')}>
                    <Td className="min-w-[160px] max-w-[240px]">
                      <div className="font-semibold text-ink-900 break-words">{p.name}</div>
                      <Pill tone="green" className="mt-1 !py-0.5 !text-[11px]">
                        −{p.percent}%
                      </Pill>
                    </Td>
                    <Td className="min-w-[220px] max-w-[320px] text-[13px] text-ink-700 break-words">{ruleText(p)}</Td>
                    <Td className="whitespace-nowrap text-[13px] tabular-nums text-ink-500">
                      <div>{periodText(p)}</div>
                      {expired || notStarted ? (
                        <Pill tone="gray" className="mt-1 !py-0.5 !text-[11px]">
                          {L(expired ? T.expired : T.notStarted)}
                        </Pill>
                      ) : null}
                    </Td>
                    <Td className="max-w-[220px]">
                      {p.lines && p.lines.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.lines.map((c) => (
                            <Pill key={c} tone="brand" className="!py-0.5 !text-[11px] tabular-nums">
                              {c}
                            </Pill>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[13px] text-ink-500">{L(COMMON.allLines)}</span>
                      )}
                    </Td>
                    <Td align="center">
                      <Toggle on={p.active} disabled={Boolean(busyId)} onClick={() => toggle(p)} title={p.active ? L(T.active) : L(T.off)} />
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Pencil}
                          onClick={() => setEditing(p)}
                          title={L(T.edit)}
                          className="!px-2.5"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => remove(p)}
                          disabled={Boolean(busyId)}
                          title={L(T.delete)}
                          className="!px-2.5"
                        />
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <PromoModal
        promo={editing}
        products={products}
        lines={lines}
        onClose={() => setEditing(null)}
        onSaved={(next) => {
          setPromos(next);
          setEditing(null);
        }}
      />
    </div>
  );
};

const Toggle: React.FC<{ on: boolean; onClick: () => void; disabled?: boolean; title?: string }> = ({ on, onClick, disabled, title }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={clsx(
      'relative inline-flex w-11 h-6 rounded-full transition disabled:opacity-50',
      on ? 'bg-brand-500' : 'bg-ink-200'
    )}
  >
    <span className={clsx('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
  </button>
);

// ---------------------------------------------------------------- create / edit

interface PromoForm {
  name: string;
  kind: PromoKind;
  productId: string;
  unit: PackagingUnit;
  minQty: string;
  minTotal: string;
  percent: string;
  from: string;
  to: string;
  lines: string[];
  active: boolean;
}

const EMPTY: PromoForm = {
  name: '',
  kind: 'product',
  productId: '',
  unit: 'blok',
  minQty: '5',
  minTotal: '',
  percent: '',
  from: '',
  to: '',
  lines: [],
  active: true,
};

const toForm = (p: Promo): PromoForm => ({
  name: p.name,
  kind: p.kind,
  productId: p.productId || '',
  unit: p.unit || 'blok',
  minQty: p.minQty != null ? String(p.minQty) : '',
  minTotal: p.minTotal != null ? String(p.minTotal) : '',
  percent: String(p.percent),
  from: p.from || '',
  to: p.to || '',
  lines: p.lines || [],
  active: p.active !== false,
});

const PromoModal: React.FC<{
  promo: Promo | 'new' | null;
  products: Product[];
  lines: Line[];
  onClose: () => void;
  onSaved: (promos: Promo[]) => void;
}> = ({ promo, products, lines, onClose, onSaved }) => {
  const L = useL();
  const [form, setForm] = useState<PromoForm>(EMPTY);
  const [forKey, setForKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset the form whenever a different promo (or "new") is opened
  const key = promo === null ? null : promo === 'new' ? 'new' : promo.id;
  if (key !== forKey) {
    setForKey(key);
    setForm(promo && promo !== 'new' ? toForm(promo) : EMPTY);
    setError('');
  }

  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  };

  const close = () => {
    if (saving) return;
    onClose();
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || !promo) return;
    const name = form.name.trim();
    if (!name) return setError(L(T.errName));
    const percent = num(form.percent);
    if (!(percent >= 1 && percent <= 90)) return setError(L(T.errPercent));
    if (form.from && form.to && form.to < form.from) return setError(L(T.errDates));
    const body: Record<string, unknown> = {
      ...(promo !== 'new' ? { id: promo.id } : {}),
      name,
      active: form.active,
      from: form.from || null,
      to: form.to || null,
      lines: form.lines,
      kind: form.kind,
      percent,
    };
    if (form.kind === 'product') {
      if (!form.productId) return setError(L(T.errProduct));
      const minQty = num(form.minQty);
      if (!Number.isInteger(minQty) || minQty < 1) return setError(L(T.errQty));
      Object.assign(body, { productId: form.productId, unit: form.unit, minQty });
    } else {
      const minTotal = form.minTotal.trim() === '' ? 0 : num(form.minTotal);
      if (!Number.isFinite(minTotal) || minTotal < 0) return setError(L(T.errTotal));
      body.minTotal = Math.round(minTotal);
    }
    setSaving(true);
    setError('');
    try {
      const d = await send('/promos', 'POST', body);
      setSaving(false);
      onSaved(Array.isArray(d.promos) ? d.promos : []);
    } catch (err) {
      setSaving(false);
      setError(errText(err, L(T.saveError)));
    }
  };

  const toggleLine = (code: string) =>
    set('lines', form.lines.includes(code) ? form.lines.filter((c) => c !== code) : [...form.lines, code]);

  const chip = (on: boolean) =>
    clsx(
      'h-8 px-3 rounded-full text-[13px] font-semibold tabular-nums transition',
      on ? 'bg-brand-500 text-white' : 'bg-ink-100/70 text-ink-700 hover:bg-brand-50 hover:text-brand-500'
    );

  return (
    <Modal
      open={Boolean(promo)}
      onClose={close}
      width="lg"
      title={promo === 'new' ? L(T.newPromo) : L(T.editPromo)}
      subtitle={L(T.hint)}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            {L(COMMON.cancel)}
          </Button>
          <Button onClick={() => submit()} disabled={saving}>
            {saving ? L(T.saving) : L(COMMON.save)}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field
          label={L(T.name)}
          placeholder={L(T.namePlaceholder)}
          value={form.name}
          maxLength={80}
          onChange={(e) => set('name', e.target.value)}
          autoFocus
        />

        <Segmented
          value={form.kind}
          onChange={(k) => set('kind', k)}
          options={[
            { key: 'product', label: L(T.kindProduct) },
            { key: 'order', label: L(T.kindOrder) },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {form.kind === 'product' ? (
            <>
              <div className="sm:col-span-2">
                <Select label={L(T.product)} value={form.productId} onChange={(e) => set('productId', e.target.value)}>
                  <option value="">{L(T.pickProduct)}</option>
                  {sorted.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </Select>
              </div>
              <Select label={L(T.unit)} value={form.unit} onChange={(e) => set('unit', e.target.value as PackagingUnit)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {L(UNIT_LABELS[u])}
                  </option>
                ))}
              </Select>
              <Field
                label={L(T.minQty)}
                type="number"
                min={1}
                inputMode="numeric"
                suffix={L(UNIT_LABELS[form.unit])}
                value={form.minQty}
                onChange={(e) => set('minQty', e.target.value)}
              />
            </>
          ) : (
            <div className="sm:col-span-3">
              <Field
                label={L(T.minTotal)}
                type="number"
                min={0}
                inputMode="numeric"
                suffix={L(COMMON.som)}
                placeholder="2000000"
                value={form.minTotal}
                onChange={(e) => set('minTotal', e.target.value)}
              />
            </div>
          )}
          <div>
            <Field
              label={L(T.percent)}
              type="number"
              min={1}
              max={90}
              step="0.1"
              inputMode="decimal"
              suffix="%"
              placeholder="10"
              value={form.percent}
              onChange={(e) => set('percent', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 grid grid-cols-2 gap-4 sm:col-start-1">
            <Field label={L(T.from)} type="date" value={form.from} onChange={(e) => set('from', e.target.value)} hint={L(T.dateHint)} />
            <Field label={L(T.to)} type="date" value={form.to} min={form.from || undefined} onChange={(e) => set('to', e.target.value)} />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-medium text-ink-700 mb-1.5">{L(T.lines)}</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(form.lines.length === 0)} onClick={() => set('lines', [])}>
              {L(COMMON.allLines)}
            </button>
            {lines.map((l) => (
              <button key={l.id} type="button" className={chip(form.lines.includes(l.code))} onClick={() => toggleLine(l.code)}>
                {l.code}
              </button>
            ))}
          </div>
          <div className="text-xs text-ink-400 mt-1.5">{L(T.linesHint)}</div>
        </div>

        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
            className="w-[18px] h-[18px] accent-brand-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-ink-900">{L(T.activeLabel)}</span>
        </label>

        {error ? (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl2 bg-rose-50 text-rose-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        ) : null}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
};
