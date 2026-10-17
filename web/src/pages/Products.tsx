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
import { COMMON, Tri, UNIT_LABELS, fmt, useL } from '../i18n/tri';

interface ProductsProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => Promise<void> | void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void> | void;
}

const T = {
  outOfStock: { uz: 'Tugagan', uz_cyrl: 'Тугаган', ru: 'Закончился' },
  low: { uz: 'Kam qolgan', uz_cyrl: 'Кам қолган', ru: 'Мало осталось' },
  enough: { uz: 'Yetarli', uz_cyrl: 'Етарли', ru: 'Достаточно' },
  saveError: { uz: 'Saqlashda xatolik yuz berdi', uz_cyrl: 'Сақлашда хатолик юз берди', ru: 'Ошибка при сохранении' },
  totalProducts: { uz: 'Jami tovarlar', uz_cyrl: 'Жами товарлар', ru: 'Всего товаров' },
  categories: { uz: 'Kategoriyalar', uz_cyrl: 'Категориялар', ru: 'Категории' },
  stockInWarehouse: { uz: 'Ombordagi qoldiq', uz_cyrl: 'Омбордаги қолдиқ', ru: 'Остаток на складе' },
  countPcs: { uz: '{n} ta', uz_cyrl: '{n} та', ru: '{n}' },
  nOut: { uz: '{n} tasi tugagan', uz_cyrl: '{n} таси тугаган', ru: 'Закончились: {n}' },
  lowRule: {
    uz: 'Bir korobka yoki 100 donadan kam',
    uz_cyrl: 'Бир коробка ёки 100 донадан кам',
    ru: 'Меньше одной коробки или 100 шт',
  },
  searchPlaceholder: { uz: 'Nomi yoki kodi boʻyicha qidirish', uz_cyrl: 'Номи ёки коди бўйича қидириш', ru: 'Поиск по названию или коду' },
  allCategories: { uz: 'Barcha kategoriyalar', uz_cyrl: 'Барча категориялар', ru: 'Все категории' },
  newProduct: { uz: 'Yangi tovar', uz_cyrl: 'Янги товар', ru: 'Новый товар' },
  noProductsYet: { uz: 'Hali tovar qoʻshilmagan', uz_cyrl: 'Ҳали товар қўшилмаган', ru: 'Товары ещё не добавлены' },
  nothingFound: { uz: 'Hech narsa topilmadi', uz_cyrl: 'Ҳеч нарса топилмади', ru: 'Ничего не найдено' },
  addFirst: { uz: 'Birinchi tovarni qoʻshing', uz_cyrl: 'Биринчи товарни қўшинг', ru: 'Добавьте первый товар' },
  changeFilter: {
    uz: 'Qidiruv yoki kategoriya filtrini oʻzgartiring',
    uz_cyrl: 'Қидирув ёки категория филтрини ўзгартиринг',
    ru: 'Измените поиск или фильтр категории',
  },
  clearFilter: { uz: 'Filtrni tozalash', uz_cyrl: 'Филтрни тозалаш', ru: 'Сбросить фильтр' },
  product: { uz: 'Tovar', uz_cyrl: 'Товар', ru: 'Товар' },
  category: { uz: 'Kategoriya', uz_cyrl: 'Категория', ru: 'Категория' },
  colDona: { uz: 'Dona', uz_cyrl: 'Дона', ru: 'Шт' },
  colBlok: { uz: 'Blok', uz_cyrl: 'Блок', ru: 'Блок' },
  colKorobka: { uz: 'Korobka', uz_cyrl: 'Коробка', ru: 'Коробка' },
  colKg: { uz: 'Kg', uz_cyrl: 'Кг', ru: 'Кг' },
  packing: { uz: 'Qadoq', uz_cyrl: 'Қадоқ', ru: 'Упаковка' },
  stock: { uz: 'Qoldiq', uz_cyrl: 'Қолдиқ', ru: 'Остаток' },
  editStock: { uz: 'Qoldiqni oʻzgartirish', uz_cyrl: 'Қолдиқни ўзгартириш', ru: 'Изменить остаток' },
  shownOf: {
    uz: '{a} ta / {b} ta tovar koʻrsatilmoqda',
    uz_cyrl: '{a} та / {b} та товар кўрсатилмоқда',
    ru: 'Показано товаров: {a} из {b}',
  },
  errName: { uz: 'Tovar nomini kiriting', uz_cyrl: 'Товар номини киритинг', ru: 'Введите название товара' },
  errCategory: { uz: 'Kategoriyani tanlang', uz_cyrl: 'Категорияни танланг', ru: 'Выберите категорию' },
  errPrices: {
    uz: 'Barcha narxlarni toʻgʻri kiriting (0 yoki undan katta)',
    uz_cyrl: 'Барча нархларни тўғри киритинг (0 ёки ундан катта)',
    ru: 'Введите все цены правильно (0 или больше)',
  },
  errPriceDona: {
    uz: 'Dona narxi 0 dan katta boʻlishi kerak',
    uz_cyrl: 'Дона нархи 0 дан катта бўлиши керак',
    ru: 'Цена за штуку должна быть больше 0',
  },
  errPerBlock: {
    uz: 'Blokdagi dona soni butun musbat son boʻlishi kerak',
    uz_cyrl: 'Блокдаги дона сони бутун мусбат сон бўлиши керак',
    ru: 'Количество штук в блоке должно быть целым положительным числом',
  },
  errPerBox: {
    uz: 'Korobkadagi dona soni butun musbat son boʻlishi kerak',
    uz_cyrl: 'Коробкадаги дона сони бутун мусбат сон бўлиши керак',
    ru: 'Количество штук в коробке должно быть целым положительным числом',
  },
  errBoxLessBlock: {
    uz: 'Korobkadagi dona soni blokdagidan kam boʻlmasligi kerak',
    uz_cyrl: 'Коробкадаги дона сони блокдагидан кам бўлмаслиги керак',
    ru: 'В коробке не может быть меньше штук, чем в блоке',
  },
  errInitialStock: {
    uz: 'Boshlangʻich qoldiq 0 yoki undan katta butun son boʻlishi kerak',
    uz_cyrl: 'Бошланғич қолдиқ 0 ёки ундан катта бутун сон бўлиши керак',
    ru: 'Начальный остаток должен быть целым числом от 0',
  },
  errCodeExists: {
    uz: '"{code}" kodli tovar allaqachon mavjud',
    uz_cyrl: '"{code}" кодли товар аллақачон мавжуд',
    ru: 'Товар с кодом "{code}" уже существует',
  },
  addSubtitle: {
    uz: 'Tovar maʼlumotlari, narxlari va qadoqlash',
    uz_cyrl: 'Товар маълумотлари, нархлари ва қадоқлаш',
    ru: 'Данные товара, цены и упаковка',
  },
  saving: { uz: 'Saqlanmoqda…', uz_cyrl: 'Сақланмоқда…', ru: 'Сохранение…' },
  productName: { uz: 'Tovar nomi *', uz_cyrl: 'Товар номи *', ru: 'Название товара *' },
  namePlaceholder: { uz: 'Marmelad 200 g', uz_cyrl: 'Мармелад 200 г', ru: 'Мармелад 200 г' },
  code: { uz: 'Kod', uz_cyrl: 'Код', ru: 'Код' },
  auto: { uz: 'Avtomatik', uz_cyrl: 'Автоматик', ru: 'Автоматически' },
  codeHint: { uz: 'Boʻsh qolsa, avtomatik beriladi', uz_cyrl: 'Бўш қолса, автоматик берилади', ru: 'Если оставить пустым, присвоится автоматически' },
  categoryReq: { uz: 'Kategoriya *', uz_cyrl: 'Категория *', ru: 'Категория *' },
  noCategory: { uz: 'Kategoriya yoʻq', uz_cyrl: 'Категория йўқ', ru: 'Нет категорий' },
  description: { uz: 'Tavsif', uz_cyrl: 'Тавсиф', ru: 'Описание' },
  descPlaceholder: { uz: 'Qisqacha tavsif (ixtiyoriy)', uz_cyrl: 'Қисқача тавсиф (ихтиёрий)', ru: 'Краткое описание (необязательно)' },
  prices: { uz: 'Narxlar', uz_cyrl: 'Нархлар', ru: 'Цены' },
  donaReq: { uz: 'Dona *', uz_cyrl: 'Дона *', ru: 'Шт *' },
  packAndStock: { uz: 'Qadoq va qoldiq', uz_cyrl: 'Қадоқ ва қолдиқ', ru: 'Упаковка и остаток' },
  inBlock: { uz: '1 blokda', uz_cyrl: '1 блокда', ru: 'В 1 блоке' },
  inBox: { uz: '1 korobkada', uz_cyrl: '1 коробкада', ru: 'В 1 коробке' },
  initialStock: { uz: 'Boshlangʻich qoldiq', uz_cyrl: 'Бошланғич қолдиқ', ru: 'Начальный остаток' },
  errStock: {
    uz: 'Qoldiq 0 yoki undan katta butun son boʻlishi kerak',
    uz_cyrl: 'Қолдиқ 0 ёки ундан катта бутун сон бўлиши керак',
    ru: 'Остаток должен быть целым числом от 0',
  },
  currentStock: { uz: 'Joriy qoldiq', uz_cyrl: 'Жорий қолдиқ', ru: 'Текущий остаток' },
  newStock: { uz: 'Yangi qoldiq', uz_cyrl: 'Янги қолдиқ', ru: 'Новый остаток' },
  change: { uz: 'Oʻzgarish', uz_cyrl: 'Ўзгариш', ru: 'Изменение' },
} satisfies Record<string, Tri>;

// ---------------------------------------------------------------- helpers

/** Low stock: no more than one box left, or under 100 pieces */
const isLow = (p: Product) => p.stockDona <= (p.itemsPerBox || 0) || p.stockDona < 100;

const stockTone = (p: Product): Tone => (p.stockDona <= 0 ? 'red' : isLow(p) ? 'amber' : 'green');
const stockLabel = (p: Product): Tri => (p.stockDona <= 0 ? T.outOfStock : isLow(p) ? T.low : T.enough);

const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Parses a numeric text field; empty or invalid gives NaN */
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/\s/g, '')));

const SEGMENT_LIMIT = 5;

// ---------------------------------------------------------------- page

export const Products: React.FC<ProductsProps> = ({ products, categories, onAddProduct, onUpdateStock }) => {
  const L = useL();
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

  const dona = L(UNIT_LABELS.dona);
  const pcs = (n: number) => fmt(L(T.countPcs), { n: formatSum(n) });

  return (
    <div className="space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Package} tone="brand" label={L(T.totalProducts)} value={pcs(products.length)} />
        <StatCard icon={Layers} tone="violet" label={L(T.categories)} value={pcs(categories.length)} />
        <StatCard icon={Boxes} tone="green" label={L(T.stockInWarehouse)} value={`${formatSum(totalStock)} ${dona}`} />
        <StatCard
          icon={AlertTriangle}
          tone={outCount > 0 ? 'red' : 'amber'}
          label={L(T.low)}
          value={pcs(lowCount)}
          note={outCount > 0 ? fmt(L(T.nOut), { n: formatSum(outCount) }) : L(T.lowRule)}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          icon={Search}
          value={search}
          onChange={setSearch}
          placeholder={L(T.searchPlaceholder)}
          className="flex-1 min-w-[220px] max-w-md"
        />
        {categories.length > 0 && categories.length <= SEGMENT_LIMIT ? (
          <Segmented
            value={category}
            onChange={setCategory}
            options={[{ key: 'all', label: L(COMMON.all) }, ...categories.map((c) => ({ key: c.id, label: c.name }))]}
          />
        ) : categories.length > SEGMENT_LIMIT ? (
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto min-w-[200px] max-w-[260px] bg-white">
            <option value="all">{L(T.allCategories)}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({categoryCounts[c.id] || 0})
              </option>
            ))}
          </Select>
        ) : null}
        <Button icon={Plus} onClick={() => setAddOpen(true)} className="ml-auto">
          {L(T.newProduct)}
        </Button>
      </div>

      {/* Table */}
      <Card padded={false} className="p-3 md:p-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length === 0 ? L(T.noProductsYet) : L(T.nothingFound)}
            hint={products.length === 0 ? L(T.addFirst) : L(T.changeFilter)}
            action={
              products.length === 0 ? (
                <Button icon={Plus} onClick={() => setAddOpen(true)}>
                  {L(T.newProduct)}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                  }}
                >
                  {L(T.clearFilter)}
                </Button>
              )
            }
          />
        ) : (
          <Table className="min-w-[1080px]">
            <thead>
              <tr>
                <Th>{L(T.product)}</Th>
                <Th>{L(T.category)}</Th>
                <Th align="right">{L(T.colDona)}</Th>
                <Th align="right">{L(T.colBlok)}</Th>
                <Th align="right">{L(T.colKorobka)}</Th>
                <Th align="right">{L(T.colKg)}</Th>
                <Th>{L(T.packing)}</Th>
                <Th align="right">{L(T.stock)}</Th>
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
                    <div className="whitespace-nowrap">
                      1 {L(UNIT_LABELS.blok)} = {formatSum(p.itemsPerBlock)} {dona}
                    </div>
                    <div className="whitespace-nowrap">
                      1 {L(UNIT_LABELS.korobka)} = {formatSum(p.itemsPerBox)} {dona}
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-ink-900 tabular-nums whitespace-nowrap">
                          {formatSum(p.stockDona)} <span className="text-xs font-medium text-ink-400">{dona}</span>
                        </span>
                        <Pill tone={stockTone(p)} className="!py-0.5 !text-[11px]">
                          {L(stockLabel(p))}
                        </Pill>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Pencil}
                        onClick={() => setStockProduct(p)}
                        title={L(T.editStock)}
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
            {fmt(L(T.shownOf), { a: formatSum(filtered.length), b: formatSum(products.length) })}
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
  const L = useL();
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
    if (!name) return setError(L(T.errName));
    if (!categoryId) return setError(L(T.errCategory));

    const prices = {
      priceDona: num(form.priceDona),
      priceBlok: num(form.priceBlok),
      priceKorobka: num(form.priceKorobka),
      priceKg: num(form.priceKg),
    };
    if (Object.values(prices).some((v) => !Number.isFinite(v) || v < 0)) return setError(L(T.errPrices));
    if (prices.priceDona <= 0) return setError(L(T.errPriceDona));

    const itemsPerBlock = num(form.itemsPerBlock);
    const itemsPerBox = num(form.itemsPerBox);
    if (!Number.isInteger(itemsPerBlock) || itemsPerBlock < 1) return setError(L(T.errPerBlock));
    if (!Number.isInteger(itemsPerBox) || itemsPerBox < 1) return setError(L(T.errPerBox));
    if (itemsPerBox < itemsPerBlock) return setError(L(T.errBoxLessBlock));

    const stockDona = num(form.stockDona);
    if (!Number.isInteger(stockDona) || stockDona < 0) return setError(L(T.errInitialStock));

    let code = form.code.trim();
    if (code && products.some((p) => p.code.toLowerCase() === code.toLowerCase()))
      return setError(fmt(L(T.errCodeExists), { code }));
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
      setError(errText(err, L(T.saveError)));
    }
  };

  const perBlock = num(form.itemsPerBlock);
  const perBox = num(form.itemsPerBox);
  const som = L(COMMON.som);
  const dona = L(UNIT_LABELS.dona);

  return (
    <Modal
      open={open}
      onClose={close}
      width="lg"
      title={L(T.newProduct)}
      subtitle={L(T.addSubtitle)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={L(T.productName)} placeholder={L(T.namePlaceholder)} value={form.name} onChange={set('name')} autoFocus />
          </div>
          <Field label={L(T.code)} placeholder={L(T.auto)} value={form.code} onChange={set('code')} hint={L(T.codeHint)} />
          <Select label={L(T.categoryReq)} value={categoryId} onChange={set('categoryId')}>
            {categories.length === 0 ? <option value="">{L(T.noCategory)}</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Field label={L(T.description)} placeholder={L(T.descPlaceholder)} value={form.description} onChange={set('description')} />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-ink-900 mb-3">{L(T.prices)}</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label={L(T.donaReq)} type="number" min={0} inputMode="numeric" suffix={som} placeholder="0" value={form.priceDona} onChange={set('priceDona')} />
            <Field label={L(T.colBlok)} type="number" min={0} inputMode="numeric" suffix={som} placeholder="0" value={form.priceBlok} onChange={set('priceBlok')} />
            <Field label={L(T.colKorobka)} type="number" min={0} inputMode="numeric" suffix={som} placeholder="0" value={form.priceKorobka} onChange={set('priceKorobka')} />
            <Field label={L(T.colKg)} type="number" min={0} inputMode="numeric" suffix={som} placeholder="0" value={form.priceKg} onChange={set('priceKg')} />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold text-ink-900 mb-3">{L(T.packAndStock)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={L(T.inBlock)} type="number" min={1} suffix={dona} value={form.itemsPerBlock} onChange={set('itemsPerBlock')} />
            <Field label={L(T.inBox)} type="number" min={1} suffix={dona} value={form.itemsPerBox} onChange={set('itemsPerBox')} />
            <Field label={L(T.initialStock)} type="number" min={0} suffix={dona} value={form.stockDona} onChange={set('stockDona')} />
          </div>
          {Number.isFinite(perBlock) && Number.isFinite(perBox) && perBlock > 0 && perBox > 0 ? (
            <div className="mt-3 text-xs text-ink-400">
              1 {L(UNIT_LABELS.blok)} = {formatSum(perBlock)} {dona} • 1 {L(UNIT_LABELS.korobka)} = {formatSum(perBox)} {dona}
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
  const L = useL();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [forId, setForId] = useState<string | null>(null);
  const [openedStock, setOpenedStock] = useState(0); // stock when the modal opened

  // Reset the field whenever a different product is opened
  if (product && product.id !== forId) {
    setForId(product.id);
    setValue(String(product.stockDona));
    setOpenedStock(product.stockDona);
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
  const diff = Number.isFinite(num(value)) ? num(value) - openedStock : 0;
  const box = product.itemsPerBox > 0 ? product.itemsPerBox : 0;
  const block = product.itemsPerBlock > 0 ? product.itemsPerBlock : 0;
  const dona = L(UNIT_LABELS.dona);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const typed = num(value);
    if (!Number.isInteger(typed) || typed < 0) return setError(L(T.errStock));
    // A phone sale may have arrived while the modal was open: apply the change on top of it
    const n = Math.max(0, product.stockDona + (typed - openedStock));
    if (n === product.stockDona) return onClose();
    setSaving(true);
    setError('');
    try {
      await onUpdateStock(product.id, n);
      setSaving(false);
      onClose();
    } catch (err) {
      setSaving(false);
      setError(errText(err, L(T.saveError)));
    }
  };

  const quick: { label: string; d: number }[] = [
    { label: '−100', d: -100 },
    { label: '−10', d: -10 },
    { label: '+10', d: 10 },
    { label: '+100', d: 100 },
    ...(block > 1 ? [{ label: `+1 ${L(UNIT_LABELS.blok)}`, d: block }] : []),
    ...(box > 1 ? [{ label: `+1 ${L(UNIT_LABELS.korobka)}`, d: box }] : []),
  ];

  return (
    <Modal
      open
      onClose={close}
      width="sm"
      title={L(T.editStock)}
      subtitle={<span className="block truncate">{product.name}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            {L(COMMON.cancel)}
          </Button>
          <Button onClick={() => save()} disabled={saving}>
            {saving ? L(T.saving) : L(COMMON.save)}
          </Button>
        </>
      }
    >
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl2 bg-ink-100/70">
          <span className="text-sm text-ink-500">{L(T.currentStock)}</span>
          <span className="flex items-center gap-2">
            <span className="font-bold text-ink-900 tabular-nums whitespace-nowrap">
              {formatSum(product.stockDona)} {dona}
            </span>
            <Pill tone={stockTone(product)} className="!py-0.5 !text-[11px]">
              {L(stockLabel(product))}
            </Pill>
          </span>
        </div>

        <div className="flex items-end gap-2">
          <Button variant="secondary" icon={Minus} onClick={() => bump(-1)} title="−1" className="!px-3 shrink-0" />
          <div className="flex-1 min-w-0">
            <Field
              label={L(T.newStock)}
              type="number"
              min={0}
              suffix={dona}
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
            {L(T.change)}:{' '}
            <span className={diff > 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
              {diff > 0 ? '+' : '−'}
              {formatSum(Math.abs(diff))} {dona}
            </span>
            {box > 0 && Number.isFinite(num(value)) ? (
              <span className="text-ink-400">
                {' '}
                • ≈ {formatSum(Math.floor(num(value) / box))} {L(UNIT_LABELS.korobka)}
              </span>
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
