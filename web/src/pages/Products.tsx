import React, { useMemo, useState } from 'react';
import { Product, Category } from '../types';
import { Plus, Search, Package, Layers, Boxes, AlertTriangle, Pencil, Minus } from 'lucide-react';
import {
  Card,
  Button,
  Pill,
  Segmented,
  SearchInput,
  Field,
  Select,
  StatCard,
  EmptyState,
  Table,
  Th,
  Td,
  Modal,
  Money,
  formatSum,
  Tone,
} from '../components/ui';

interface ProductsProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => Promise<void> | void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void> | void;
}

// ---------------------------------------------------------------- helpers

/** Low stock: no more than one box left, or under 100 pieces */
const isLow = (p: Product) => p.stockDona <= (p.itemsPerBox || 0) || p.stockDona < 100;

const stockTone = (p: Product): Tone => (p.stockDona <= 0 ? 'red' : isLow(p) ? 'amber' : 'green');
const stockLabel = (p: Product) => (p.stockDona <= 0 ? 'Tugagan' : isLow(p) ? 'Kam qolgan' : 'Yetarli');

const errText = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Saqlashda xatolik yuz berdi');

/** Parses a numeric text field; empty or invalid gives NaN */
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/\s/g, '')));

const SEGMENT_LIMIT = 5;

// ---------------------------------------------------------------- page

export const Products: React.FC<ProductsProps> = ({ products, categories, onAddProduct, onUpdateStock }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.categoryId !== category) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    });
  }, [products, search, category]);

  const totalStock = products.reduce((s, p) => s + (p.stockDona || 0), 0);
  const lowCount = products.filter(isLow).length;
  const outCount = products.filter((p) => p.stockDona <= 0).length;

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => (m[p.categoryId] = (m[p.categoryId] || 0) + 1));
    return m;
  }, [products]);

  // Keep the stock modal in sync with fresh server data
  const liveStockProduct = stockProduct ? products.find((p) => p.id === stockProduct.id) || stockProduct : null;

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} tone="brand" label="Jami tovarlar" value={`${formatSum(products.length)} ta`} />
        <StatCard icon={Layers} tone="violet" label="Kategoriyalar" value={`${formatSum(categories.length)} ta`} />
        <StatCard icon={Boxes} tone="green" label="Ombordagi qoldiq" value={`${formatSum(totalStock)} dona`} />
        <StatCard
          icon={AlertTriangle}
          tone={outCount > 0 ? 'red' : 'amber'}
          label="Kam qolgan"
          value={`${formatSum(lowCount)} ta`}
          note={outCount > 0 ? `${formatSum(outCount)} tasi tugagan` : 'Bir korobka yoki 100 donadan kam'}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          icon={Search}
          value={search}
          onChange={setSearch}
          placeholder="Nomi yoki kodi boʻyicha qidirish"
          className="flex-1 min-w-[220px] max-w-md"
        />
        {categories.length > 0 && categories.length <= SEGMENT_LIMIT ? (
          <Segmented
            value={category}
            onChange={setCategory}
            options={[{ key: 'all', label: 'Hammasi' }, ...categories.map((c) => ({ key: c.id, label: c.name }))]}
          />
        ) : categories.length > SEGMENT_LIMIT ? (
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto min-w-[200px] max-w-[260px] bg-white">
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({categoryCounts[c.id] || 0})
              </option>
            ))}
          </Select>
        ) : null}
        <Button icon={Plus} onClick={() => setAddOpen(true)} className="ml-auto">
          Yangi tovar
        </Button>
      </div>

      {/* Table */}
      <Card padded={false} className="p-3 md:p-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length === 0 ? 'Hali tovar qoʻshilmagan' : 'Hech narsa topilmadi'}
            hint={products.length === 0 ? 'Birinchi tovarni qoʻshing' : 'Qidiruv yoki kategoriya filtrini oʻzgartiring'}
            action={
              products.length === 0 ? (
                <Button icon={Plus} onClick={() => setAddOpen(true)}>
                  Yangi tovar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                  }}
                >
                  Filtrni tozalash
                </Button>
              )
            }
          />
        ) : (
          <Table className="min-w-[1080px]">
            <thead>
              <tr>
                <Th>Tovar</Th>
                <Th>Kategoriya</Th>
                <Th align="right">Dona</Th>
                <Th align="right">Blok</Th>
                <Th align="right">Korobka</Th>
                <Th align="right">Kg</Th>
                <Th>Qadoq</Th>
                <Th align="right">Qoldiq</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-ink-100/40 transition">
                  <Td className="max-w-[300px]">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="font-semibold text-ink-900 truncate" title={p.name}>
                        {p.name}
                      </div>
                      {p.description ? (
                        <div className="text-xs text-ink-400 truncate" title={p.description}>
                          {p.description}
                        </div>
                      ) : null}
                      <div>
                        <Pill tone="brand" className="font-mono !text-[11px] !py-0.5">
                          {p.code}
                        </Pill>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Pill tone="gray" className="max-w-[160px]" title={p.categoryName}>
                      <span className="truncate">{p.categoryName || '—'}</span>
                    </Pill>
                  </Td>
                  <Td align="right" className="font-semibold text-ink-900">
                    <Money value={p.priceDona} unit={false} />
                  </Td>
                  <Td align="right">
                    <Money value={p.priceBlok} unit={false} />
                  </Td>
                  <Td align="right">
                    <Money value={p.priceKorobka} unit={false} />
                  </Td>
                  <Td align="right">
                    <Money value={p.priceKg} unit={false} />
                  </Td>
                  <Td className="text-xs text-ink-500">
                    <div className="whitespace-nowrap">1 blok = {formatSum(p.itemsPerBlock)} dona</div>
                    <div className="whitespace-nowrap">1 korobka = {formatSum(p.itemsPerBox)} dona</div>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-ink-900 tabular-nums whitespace-nowrap">
                          {formatSum(p.stockDona)} <span className="text-xs font-medium text-ink-400">dona</span>
                        </span>
                        <Pill tone={stockTone(p)} className="!py-0.5 !text-[11px]">
                          {stockLabel(p)}
                        </Pill>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        onClick={() => setStockProduct(p)}
                        title="Qoldiqni oʻzgartirish"
                        className="!px-2.5"
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {filtered.length > 0 && filtered.length !== products.length ? (
          <div className="px-2 pt-3 text-[13px] text-ink-400">
            {formatSum(filtered.length)} ta / {formatSum(products.length)} ta tovar koʻrsatilmoqda
          </div>
        ) : null}
      </Card>

      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        products={products}
        onAddProduct={onAddProduct}
      />
      <StockModal product={liveStockProduct} onClose={() => setStockProduct(null)} onUpdateStock={onUpdateStock} />
    </div>
  );
};

// ---------------------------------------------------------------- add product

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  categoryId: '',
  priceDona: '',
  priceBlok: '',
  priceKorobka: '',
  priceKg: '',
  itemsPerBlock: '10',
  itemsPerBox: '40',
  stockDona: '0',
};

type FormState = typeof EMPTY_FORM;

const AddProductModal: React.FC<{
  open: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onAddProduct: ProductsProps['onAddProduct'];
}> = ({ open, onClose, categories, products, onAddProduct }) => {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
    setError('');
    onClose();
  };

  const categoryId = form.categoryId || categories[0]?.id || '';

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const name = form.name.trim();
    if (!name) return setError('Tovar nomini kiriting');
    if (!categoryId) return setError('Kategoriyani tanlang');

    const prices = {
      priceDona: num(form.priceDona),
      priceBlok: num(form.priceBlok),
      priceKorobka: num(form.priceKorobka),
      priceKg: num(form.priceKg),
    };
    if (Object.values(prices).some((v) => !Number.isFinite(v) || v < 0))
      return setError('Barcha narxlarni toʻgʻri kiriting (0 yoki undan katta)');
    if (prices.priceDona <= 0) return setError('Dona narxi 0 dan katta boʻlishi kerak');

    const itemsPerBlock = num(form.itemsPerBlock);
    const itemsPerBox = num(form.itemsPerBox);
    if (!Number.isInteger(itemsPerBlock) || itemsPerBlock < 1) return setError('Blokdagi dona soni butun musbat son boʻlishi kerak');
    if (!Number.isInteger(itemsPerBox) || itemsPerBox < 1) return setError('Korobkadagi dona soni butun musbat son boʻlishi kerak');
    if (itemsPerBox < itemsPerBlock) return setError('Korobkadagi dona soni blokdagidan kam boʻlmasligi kerak');

    const stockDona = num(form.stockDona);
    if (!Number.isInteger(stockDona) || stockDona < 0) return setError('Boshlangʻich qoldiq 0 yoki undan katta butun son boʻlishi kerak');

    let code = form.code.trim();
    if (code && products.some((p) => p.code.toLowerCase() === code.toLowerCase()))
      return setError(`"${code}" kodli tovar allaqachon mavjud`);
    if (!code) {
      const used = new Set(products.map((p) => p.code));
      do code = `QND-${Math.floor(100 + Math.random() * 900)}`;
      while (used.has(code) && used.size < 900);
    }

    const cat = categories.find((c) => c.id === categoryId);
    const product: Product = {
      id: `prod_${Date.now()}`,
      code,
      name,
      categoryId,
      categoryName: cat?.name || 'Qandolat',
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...prices,
      itemsPerBlock,
      itemsPerBox,
      stockDona,
    };

    setSaving(true);
    try {
      await onAddProduct(product);
      setSaving(false);
      setForm(EMPTY_FORM);
      onClose();
    } catch (err) {
      setSaving(false);
      setError(errText(err));
    }
  };

  const perBlock = num(form.itemsPerBlock);
  const perBox = num(form.itemsPerBox);

  return (
    <Modal
      open={open}
      onClose={close}
      width="lg"
      title="Yangi tovar"
      subtitle="Tovar maʼlumotlari, narxlari va qadoqlash"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={() => submit()} disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Tovar nomi *" placeholder="Marmelad 200 g" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <Field label="Kod" placeholder="Avtomatik" value={form.code} onChange={set('code')} hint="Boʻsh qolsa, avtomatik beriladi" />
          <Select label="Kategoriya *" value={categoryId} onChange={set('categoryId')}>
            {categories.length === 0 ? <option value="">Kategoriya yoʻq</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Field label="Tavsif" placeholder="Qisqacha tavsif (ixtiyoriy)" value={form.description} onChange={set('description')} />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-ink-900 mb-3">Narxlar</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Dona *" type="number" min={0} inputMode="numeric" suffix="soʻm" placeholder="0" value={form.priceDona} onChange={set('priceDona')} />
            <Field label="Blok" type="number" min={0} inputMode="numeric" suffix="soʻm" placeholder="0" value={form.priceBlok} onChange={set('priceBlok')} />
            <Field label="Korobka" type="number" min={0} inputMode="numeric" suffix="soʻm" placeholder="0" value={form.priceKorobka} onChange={set('priceKorobka')} />
            <Field label="Kg" type="number" min={0} inputMode="numeric" suffix="soʻm" placeholder="0" value={form.priceKg} onChange={set('priceKg')} />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-ink-900 mb-3">Qadoq va qoldiq</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="1 blokda" type="number" min={1} suffix="dona" value={form.itemsPerBlock} onChange={set('itemsPerBlock')} />
            <Field label="1 korobkada" type="number" min={1} suffix="dona" value={form.itemsPerBox} onChange={set('itemsPerBox')} />
            <Field label="Boshlangʻich qoldiq" type="number" min={0} suffix="dona" value={form.stockDona} onChange={set('stockDona')} />
          </div>
          {Number.isFinite(perBlock) && Number.isFinite(perBox) && perBlock > 0 && perBox > 0 ? (
            <div className="mt-3 text-xs text-ink-400">
              1 blok = {formatSum(perBlock)} dona • 1 korobka = {formatSum(perBox)} dona
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl2 bg-rose-50 text-rose-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        ) : null}
        {/* lets Enter submit the form */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
};

// ---------------------------------------------------------------- stock edit

const StockModal: React.FC<{
  product: Product | null;
  onClose: () => void;
  onUpdateStock: ProductsProps['onUpdateStock'];
}> = ({ product, onClose, onUpdateStock }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [forId, setForId] = useState<string | null>(null);

  // Reset the field whenever a different product is opened
  if (product && product.id !== forId) {
    setForId(product.id);
    setValue(String(product.stockDona));
    setError('');
  }
  if (!product && forId !== null) setForId(null);

  const close = () => {
    if (saving) return;
    onClose();
  };

  if (!product) return null;

  const current = Number.isFinite(num(value)) ? num(value) : product.stockDona;
  const bump = (d: number) => {
    setError('');
    setValue(String(Math.max(0, current + d)));
  };
  const diff = Number.isFinite(num(value)) ? num(value) - product.stockDona : 0;
  const box = product.itemsPerBox > 0 ? product.itemsPerBox : 0;
  const block = product.itemsPerBlock > 0 ? product.itemsPerBlock : 0;

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = num(value);
    if (!Number.isInteger(n) || n < 0) return setError('Qoldiq 0 yoki undan katta butun son boʻlishi kerak');
    if (n === product.stockDona) return onClose();
    setSaving(true);
    setError('');
    try {
      await onUpdateStock(product.id, n);
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      setError(errText(err));
    }
  };

  const quick: { label: string; d: number }[] = [
    { label: '−100', d: -100 },
    { label: '−10', d: -10 },
    { label: '+10', d: 10 },
    { label: '+100', d: 100 },
    ...(block > 1 ? [{ label: '+1 blok', d: block }] : []),
    ...(box > 1 ? [{ label: '+1 korobka', d: box }] : []),
  ];

  return (
    <Modal
      open
      onClose={close}
      width="sm"
      title="Qoldiqni oʻzgartirish"
      subtitle={<span className="block truncate">{product.name}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Bekor qilish
          </Button>
          <Button onClick={() => save()} disabled={saving}>
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl2 bg-ink-100/70">
          <span className="text-sm text-ink-500">Joriy qoldiq</span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-ink-900 tabular-nums whitespace-nowrap">{formatSum(product.stockDona)} dona</span>
            <Pill tone={stockTone(product)} className="!py-0.5 !text-[11px]">
              {stockLabel(product)}
            </Pill>
          </span>
        </div>

        <div className="flex items-end gap-2">
          <Button variant="secondary" icon={Minus} onClick={() => bump(-1)} title="−1" className="!px-3 shrink-0" />
          <div className="flex-1 min-w-0">
            <Field
              label="Yangi qoldiq"
              type="number"
              min={0}
              suffix="dona"
              value={value}
              onChange={(e) => {
                setError('');
                setValue(e.target.value);
              }}
              autoFocus
              className="text-center font-semibold tabular-nums"
            />
          </div>
          <Button variant="secondary" icon={Plus} onClick={() => bump(1)} title="+1" className="!px-3 shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          {quick.map((q) => (
            <Button key={q.label} variant="white" size="sm" onClick={() => bump(q.d)} className="border border-ink-200 !shadow-none">
              {q.label}
            </Button>
          ))}
        </div>

        {diff !== 0 ? (
          <div className="text-[13px] text-ink-500">
            Oʻzgarish:{' '}
            <span className={diff > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
              {diff > 0 ? '+' : '−'}
              {formatSum(Math.abs(diff))} dona
            </span>
            {box > 0 && Number.isFinite(num(value)) ? (
              <span className="text-ink-400"> • ≈ {formatSum(Math.floor(num(value) / box))} korobka</span>
            ) : null}
          </div>
        ) : null}

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
