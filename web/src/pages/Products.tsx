import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Product, Category, Receipt, StockMove, StockMoveType } from '../types';
import {
  Plus,
  Search,
  Package,
  Layers,
  Boxes,
  AlertTriangle,
  Pencil,
  Minus,
  History,
  PackagePlus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Undo2,
} from 'lucide-react';
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
  fieldBase,
  Tone,
} from '../components/ui';
import { COMMON, Tri, UNIT_LABELS, fmt, useL } from '../i18n/tri';
import { useLanguage } from '../context/LanguageContext';
import { currentMonth, formatDateTime, formatMonth, shiftMonth } from '../utils/format';
import { API, apiFetch } from '../api';
import { PriceListsView } from './products/PriceListsView';
import { PromosView } from './products/PromosView';

interface ProductsProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => Promise<void> | void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void> | void;
  /** Fresh product list from the server (after a receipt, its undo or a min-stock change) */
  onProductsChanged: (products: Product[]) => void;
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
  minStock: { uz: 'Minimal qoldiq (dona)', uz_cyrl: 'Минимал қолдиқ (дона)', ru: 'Минимальный остаток (шт)' },
  minStockHint: {
    uz: 'Qoldiq shundan oshmasa "Kam qolgan" deb belgilanadi. Boʻsh: 1 korobka yoki 100 dona',
    uz_cyrl: 'Қолдиқ шундан ошмаса "Кам қолган" деб белгиланади. Бўш: 1 коробка ёки 100 дона',
    ru: 'Если остаток не больше этого числа, товар помечается «Мало осталось». Пусто: 1 коробка или 100 шт',
  },
  errMinStock: {
    uz: 'Minimal qoldiq 0 yoki undan katta butun son boʻlishi kerak',
    uz_cyrl: 'Минимал қолдиқ 0 ёки ундан катта бутун сон бўлиши керак',
    ru: 'Минимальный остаток должен быть целым числом от 0',
  },
  minRule: { uz: 'Minimal qoldiq: {n} dona', uz_cyrl: 'Минимал қолдиқ: {n} дона', ru: 'Мин. остаток: {n} шт' },
  lowOnly: { uz: 'Kam qolgan', uz_cyrl: 'Кам қолган', ru: 'Мало осталось' },
  viewProducts: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  viewReceipts: { uz: 'Kirimlar', uz_cyrl: 'Киримлар', ru: 'Поступления' },
  viewPrices: { uz: 'Narxlar', uz_cyrl: 'Нархлар', ru: 'Цены' },
  viewPromos: { uz: 'Aksiyalar', uz_cyrl: 'Аксиялар', ru: 'Акции' },
  receipt: { uz: 'Kirim', uz_cyrl: 'Кирим', ru: 'Поступление' },
  newReceipt: { uz: 'Yangi kirim', uz_cyrl: 'Янги кирим', ru: 'Новое поступление' },
  receiptSubtitle: {
    uz: 'Omborga kelgan tovarlar qoldiqqa qoʻshiladi',
    uz_cyrl: 'Омборга келган товарлар қолдиққа қўшилади',
    ru: 'Поступившие товары добавляются к остатку',
  },
  supplier: { uz: 'Taʼminotchi', uz_cyrl: 'Таъминотчи', ru: 'Поставщик' },
  supplierPlaceholder: { uz: 'Masalan: Qoʻqon qandolat zavodi', uz_cyrl: 'Масалан: Қўқон қандолат заводи', ru: 'Например: Кокандская кондитерская фабрика' },
  note: { uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Примечание' },
  notePlaceholder: { uz: 'Yuk xati raqami va h.k. (ixtiyoriy)', uz_cyrl: 'Юк хати рақами ва ҳ.к. (ихтиёрий)', ru: 'Номер накладной и т.п. (необязательно)' },
  unit: { uz: 'Birlik', uz_cyrl: 'Бирлик', ru: 'Единица' },
  quantity: { uz: 'Miqdor', uz_cyrl: 'Миқдор', ru: 'Количество' },
  costPerUnit: { uz: 'Tannarx (1 birlik)', uz_cyrl: 'Таннарх (1 бирлик)', ru: 'Себестоимость (за ед.)' },
  pickProduct: { uz: 'Tovarni tanlang', uz_cyrl: 'Товарни танланг', ru: 'Выберите товар' },
  addRow: { uz: 'Qator qoʻshish', uz_cyrl: 'Қатор қўшиш', ru: 'Добавить строку' },
  removeRow: { uz: 'Qatorni oʻchirish', uz_cyrl: 'Қаторни ўчириш', ru: 'Удалить строку' },
  total: { uz: 'Jami', uz_cyrl: 'Жами', ru: 'Итого' },
  errNoItems: {
    uz: 'Kamida bitta tovar va miqdorini kiriting',
    uz_cyrl: 'Камида битта товар ва миқдорини киритинг',
    ru: 'Укажите хотя бы один товар и количество',
  },
  errQty: {
    uz: 'Miqdor 0 dan katta boʻlishi, narx esa manfiy boʻlmasligi kerak',
    uz_cyrl: 'Миқдор 0 дан катта бўлиши, нарх эса манфий бўлмаслиги керак',
    ru: 'Количество должно быть больше 0, а цена — не отрицательной',
  },
  receiptsLoadError: { uz: 'Kirimlarni yuklab boʻlmadi', uz_cyrl: 'Киримларни юклаб бўлмади', ru: 'Не удалось загрузить поступления' },
  noReceipts: { uz: 'Bu oyda kirim yoʻq', uz_cyrl: 'Бу ойда кирим йўқ', ru: 'В этом месяце поступлений нет' },
  noReceiptsHint: {
    uz: 'Omborga tovar kelganda "Kirim" tugmasini bosing',
    uz_cyrl: 'Омборга товар келганда "Кирим" тугмасини босинг',
    ru: 'Когда товар поступит на склад, нажмите «Поступление»',
  },
  items: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  undo: { uz: 'Bekor qilish', uz_cyrl: 'Бекор қилиш', ru: 'Отменить' },
  undoConfirm: {
    uz: 'Bu kirim bekor qilinsinmi? Uning tovarlari qoldiqdan ayriladi.',
    uz_cyrl: 'Бу кирим бекор қилинсинми? Унинг товарлари қолдиқдан айрилади.',
    ru: 'Отменить это поступление? Его товары будут списаны с остатка.',
  },
  undoError: { uz: 'Kirimni bekor qilib boʻlmadi', uz_cyrl: 'Киримни бекор қилиб бўлмади', ru: 'Не удалось отменить поступление' },
  monthTotal: { uz: '{n} ta kirim • {sum} soʻm', uz_cyrl: '{n} та кирим • {sum} сўм', ru: 'Поступлений: {n} • {sum} сум' },
  prevMonth: { uz: 'Oldingi oy', uz_cyrl: 'Олдинги ой', ru: 'Предыдущий месяц' },
  nextMonth: { uz: 'Keyingi oy', uz_cyrl: 'Кейинги ой', ru: 'Следующий месяц' },
  moreItems: { uz: 'yana {n} ta', uz_cyrl: 'яна {n} та', ru: 'ещё {n}' },
  history: { uz: 'Tarix', uz_cyrl: 'Тарих', ru: 'История' },
  historySubtitle: { uz: '{name} • harakatlar tarixi', uz_cyrl: '{name} • ҳаракатлар тарихи', ru: '{name} • история движения' },
  historyLoadError: { uz: 'Tarixni yuklab boʻlmadi', uz_cyrl: 'Тарихни юклаб бўлмади', ru: 'Не удалось загрузить историю' },
  noMoves: { uz: 'Hali harakat yoʻq', uz_cyrl: 'Ҳали ҳаракат йўқ', ru: 'Движений пока нет' },
  type: { uz: 'Turi', uz_cyrl: 'Тури', ru: 'Тип' },
  stockAfter: { uz: 'Qoldiq', uz_cyrl: 'Қолдиқ', ru: 'Остаток' },
} satisfies Record<string, Tri>;

const MOVE_LABELS: Record<StockMoveType, { label: Tri; tone: Tone }> = {
  receipt: { label: { uz: 'Kirim', uz_cyrl: 'Кирим', ru: 'Поступление' }, tone: 'green' },
  'receipt-undo': { label: { uz: 'Kirim bekor qilindi', uz_cyrl: 'Кирим бекор қилинди', ru: 'Отмена поступления' }, tone: 'gray' },
  sale: { label: { uz: 'Sotuv', uz_cyrl: 'Сотув', ru: 'Продажа' }, tone: 'brand' },
  return: { label: { uz: 'Vozvrat', uz_cyrl: 'Возврат', ru: 'Возврат' }, tone: 'amber' },
  'return-undo': { label: { uz: 'Vozvrat bekor qilindi', uz_cyrl: 'Возврат бекор қилинди', ru: 'Отмена возврата' }, tone: 'gray' },
  cancel: { label: { uz: 'Buyurtma bekor qilindi', uz_cyrl: 'Буюртма бекор қилинди', ru: 'Заказ отменён' }, tone: 'red' },
  uncancel: { label: { uz: 'Buyurtma tiklandi', uz_cyrl: 'Буюртма тикланди', ru: 'Заказ восстановлен' }, tone: 'violet' },
  adjust: { label: { uz: 'Qoʻlda tuzatish', uz_cyrl: 'Қўлда тузатиш', ru: 'Ручная корректировка' }, tone: 'gray' },
};

type ReceiptUnit = 'dona' | 'blok' | 'korobka';
const RECEIPT_UNITS: ReceiptUnit[] = ['dona', 'blok', 'korobka'];

// ---------------------------------------------------------------- helpers

/** Low stock: at or under the product's own minimum, otherwise no more than one box left or under 100 pieces */
const isLow = (p: Product) =>
  p.minStock != null ? p.stockDona <= p.minStock : p.stockDona <= (p.itemsPerBox || 0) || p.stockDona < 100;

/** POST/DELETE with JSON; throws the server's error text */
const send = async (path: string, method: 'POST' | 'DELETE', body?: unknown) => {
  const res = await apiFetch(`${API}${path}`, {
    method,
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const unitDona = (p: Product, unit: ReceiptUnit) =>
  unit === 'korobka' ? p.itemsPerBox || 1 : unit === 'blok' ? p.itemsPerBlock || 1 : 1;

const stockTone = (p: Product): Tone => (p.stockDona <= 0 ? 'red' : isLow(p) ? 'amber' : 'green');
const stockLabel = (p: Product): Tri => (p.stockDona <= 0 ? T.outOfStock : isLow(p) ? T.low : T.enough);

const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Parses a numeric text field; empty or invalid gives NaN */
const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/\s/g, '')));

const SEGMENT_LIMIT = 5;

// ---------------------------------------------------------------- page

export const Products: React.FC<ProductsProps> = ({ products, categories, onAddProduct, onUpdateStock, onProductsChanged }) => {
  const L = useL();
  const [view, setView] = useState<'products' | 'receipts' | 'prices' | 'promos'>('products');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [lowOnly, setLowOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptsVersion, setReceiptsVersion] = useState(0); // bumps to reload the receipts list
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.categoryId !== category) return false;
      if (lowOnly && !isLow(p)) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    });
  }, [products, search, category, lowOnly]);

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

      {/* View switch */}
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { key: 'products', label: L(T.viewProducts) },
            { key: 'receipts', label: L(T.viewReceipts) },
            { key: 'prices', label: L(T.viewPrices) },
            { key: 'promos', label: L(T.viewPromos) },
          ]}
        />
        <Button icon={PackagePlus} variant="secondary" onClick={() => setReceiptOpen(true)} className="ml-auto" disabled={products.length === 0}>
          {L(T.receipt)}
        </Button>
      </div>

      {view === 'prices' ? (
        <PriceListsView products={products} />
      ) : view === 'promos' ? (
        <PromosView products={products} />
      ) : view === 'receipts' ? (
        <ReceiptsView version={receiptsVersion} onProductsChanged={onProductsChanged} />
      ) : (
        <>
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
            <Button
              icon={AlertTriangle}
              variant={lowOnly ? 'primary' : 'white'}
              onClick={() => setLowOnly((v) => !v)}
              className={lowOnly ? '' : '!text-amber-600'}
            >
              {L(T.lowOnly)} ({formatSum(lowCount)})
            </Button>
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
                        setLowOnly(false);
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
                            <Pill
                              tone={stockTone(p)}
                              className="!py-0.5 !text-[11px]"
                              title={p.minStock != null ? fmt(L(T.minRule), { n: formatSum(p.minStock) }) : L(T.lowRule)}
                            >
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
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={History}
                            onClick={() => setHistoryProduct(p)}
                            title={L(T.history)}
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
        </>
      )}

      <AddProductModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        products={products}
        onAddProduct={onAddProduct}
      />
      <StockModal
        product={liveStockProduct}
        onClose={() => setStockProduct(null)}
        onUpdateStock={onUpdateStock}
        onProductsChanged={onProductsChanged}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        products={products}
        onSaved={(next) => {
          onProductsChanged(next);
          setReceiptsVersion((v) => v + 1);
        }}
      />
      <HistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
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
  minStock: '',
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
    const minStock = form.minStock.trim() === '' ? undefined : num(form.minStock);
    if (minStock !== undefined && (!Number.isInteger(minStock) || minStock < 0)) return setError(L(T.errMinStock));

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
      ...(minStock !== undefined ? { minStock } : {}),
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label={L(T.inBlock)} type="number" min={1} suffix={dona} value={form.itemsPerBlock} onChange={set('itemsPerBlock')} />
            <Field label={L(T.inBox)} type="number" min={1} suffix={dona} value={form.itemsPerBox} onChange={set('itemsPerBox')} />
            <Field label={L(T.initialStock)} type="number" min={0} suffix={dona} value={form.stockDona} onChange={set('stockDona')} />
            <Field label={L(T.minStock)} type="number" min={0} suffix={dona} placeholder="—" value={form.minStock} onChange={set('minStock')} />
          </div>
          {Number.isFinite(perBlock) && Number.isFinite(perBox) && perBlock > 0 && perBox > 0 ? (
            <div className="mt-3 text-xs text-ink-400">
              1 {L(UNIT_LABELS.blok)} = {formatSum(perBlock)} {dona} • 1 {L(UNIT_LABELS.korobka)} = {formatSum(perBox)} {dona}
            </div>
          ) : null}
          <div className="mt-1 text-xs text-ink-400">{L(T.minStockHint)}</div>
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
  onProductsChanged: ProductsProps['onProductsChanged'];
}> = ({ product, onClose, onUpdateStock, onProductsChanged }) => {
  const L = useL();
  const [value, setValue] = useState('');
  const [minValue, setMinValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [forId, setForId] = useState<string | null>(null);
  const [openedStock, setOpenedStock] = useState(0); // stock when the modal opened

  // Reset the field whenever a different product is opened
  if (product && product.id !== forId) {
    setForId(product.id);
    setValue(String(product.stockDona));
    setMinValue(product.minStock != null ? String(product.minStock) : '');
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
    const min = minValue.trim() === '' ? null : num(minValue);
    if (min !== null && (!Number.isInteger(min) || min < 0)) return setError(L(T.errMinStock));
    const minChanged = min !== (product.minStock ?? null);
    // A phone sale may have arrived while the modal was open: apply the change on top of it
    const n = Math.max(0, product.stockDona + (typed - openedStock));
    if (n === product.stockDona && !minChanged) return onClose();
    setSaving(true);
    setError('');
    try {
      // Only the threshold is sent, so the upsert cannot overwrite a fresher stock figure
      if (minChanged) onProductsChanged((await send('/products', 'POST', { id: product.id, name: product.name, minStock: min })).products);
      if (n !== product.stockDona) await onUpdateStock(product.id, n);
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

        <Field
          label={L(T.minStock)}
          type="number"
          min={0}
          suffix={dona}
          placeholder="—"
          value={minValue}
          onChange={(e) => {
            setError('');
            setMinValue(e.target.value);
          }}
          hint={L(T.minStockHint)}
          className="tabular-nums"
        />

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

// ---------------------------------------------------------------- receipt (kirim)

interface ReceiptRow {
  key: number;
  productId: string;
  unit: ReceiptUnit;
  quantity: string;
  cost: string;
}

let rowSeq = 0;
const newRow = (): ReceiptRow => ({ key: ++rowSeq, productId: '', unit: 'korobka', quantity: '', cost: '' });

const ReceiptModal: React.FC<{
  open: boolean;
  onClose: () => void;
  products: Product[];
  onSaved: (products: Product[]) => void;
}> = ({ open, onClose, products, onSaved }) => {
  const L = useL();
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<ReceiptRow[]>(() => [newRow()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const reset = () => {
    setSupplier('');
    setNote('');
    setRows([newRow()]);
    setError('');
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const patch = (key: number, p: Partial<ReceiptRow>) => {
    setError('');
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));
  };

  const rowTotal = (r: ReceiptRow) => {
    const q = num(r.quantity);
    const c = num(r.cost);
    return Number.isFinite(q) && Number.isFinite(c) && q > 0 && c > 0 ? q * c : 0;
  };
  const total = rows.reduce((s, r) => s + rowTotal(r), 0);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    const filled = rows.filter((r) => r.productId && r.quantity.trim() !== '');
    if (filled.length === 0) return setError(L(T.errNoItems));
    const items = [];
    for (const r of filled) {
      const quantity = num(r.quantity);
      const cost = r.cost.trim() === '' ? undefined : num(r.cost);
      if (!Number.isFinite(quantity) || quantity <= 0) return setError(L(T.errQty));
      if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) return setError(L(T.errQty));
      items.push({ productId: r.productId, unit: r.unit, quantity, ...(cost !== undefined ? { cost } : {}) });
    }
    setSaving(true);
    setError('');
    try {
      const data = await send('/receipts', 'POST', { supplier: supplier.trim(), note: note.trim(), items });
      if (Array.isArray(data.products)) onSaved(data.products);
      setSaving(false);
      reset();
      onClose();
    } catch (err) {
      setSaving(false);
      setError(errText(err, L(T.saveError)));
    }
  };

  const dona = L(UNIT_LABELS.dona);
  const grid = 'grid grid-cols-[minmax(0,1fr)_110px_90px_120px_104px_36px] gap-2 items-center';

  return (
    <Modal
      open={open}
      onClose={close}
      width="lg"
      title={L(T.newReceipt)}
      subtitle={L(T.receiptSubtitle)}
      footer={
        <>
          <span className="mr-auto text-sm text-ink-500">
            {L(T.total)}: <Money value={total} className="font-bold text-ink-900" />
          </span>
          <Button variant="ghost" onClick={close} disabled={saving}>
            {L(COMMON.cancel)}
          </Button>
          <Button icon={PackagePlus} onClick={() => submit()} disabled={saving}>
            {saving ? L(T.saving) : L(COMMON.save)}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={L(T.supplier)}
            placeholder={L(T.supplierPlaceholder)}
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            autoFocus
          />
          <Field label={L(T.note)} placeholder={L(T.notePlaceholder)} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px] space-y-2">
            <div className={clsx(grid, 'text-xs font-medium text-ink-400 px-1')}>
              <span>{L(T.product)}</span>
              <span>{L(T.unit)}</span>
              <span>{L(T.quantity)}</span>
              <span>{L(T.costPerUnit)}</span>
              <span className="text-right">{L(COMMON.sum)}</span>
              <span />
            </div>
            {rows.map((r) => {
              const p = byId.get(r.productId);
              const q = num(r.quantity);
              return (
                <div key={r.key} className={grid}>
                  <select
                    value={r.productId}
                    onChange={(e) => patch(r.key, { productId: e.target.value })}
                    className={clsx(fieldBase, 'px-3 cursor-pointer')}
                    aria-label={L(T.product)}
                  >
                    <option value="">{L(T.pickProduct)}</option>
                    {sorted.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} ({x.code})
                      </option>
                    ))}
                  </select>
                  <select
                    value={r.unit}
                    onChange={(e) => patch(r.key, { unit: e.target.value as ReceiptUnit })}
                    className={clsx(fieldBase, 'px-3 cursor-pointer')}
                    aria-label={L(T.unit)}
                  >
                    {RECEIPT_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {L(UNIT_LABELS[u])}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={r.quantity}
                    onChange={(e) => patch(r.key, { quantity: e.target.value })}
                    className={clsx(fieldBase, 'px-3 tabular-nums')}
                    aria-label={L(T.quantity)}
                  />
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={r.cost}
                    onChange={(e) => patch(r.key, { cost: e.target.value })}
                    className={clsx(fieldBase, 'px-3 tabular-nums')}
                    aria-label={L(T.costPerUnit)}
                  />
                  <div className="text-right leading-tight">
                    <Money value={rowTotal(r)} unit={false} className="text-sm font-semibold text-ink-900" />
                    {p && Number.isFinite(q) && q > 0 ? (
                      <div className="text-[11px] text-ink-400 whitespace-nowrap">
                        +{formatSum(q * unitDona(p, r.unit))} {dona}
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : [newRow()]))}
                    title={L(T.removeRow)}
                    aria-label={L(T.removeRow)}
                    className="w-9 h-9 rounded-full bg-ink-100 text-ink-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setRows((rs) => [...rs, newRow()])}>
          {L(T.addRow)}
        </Button>

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

// ---------------------------------------------------------------- receipts history

const ReceiptsView: React.FC<{ version: number; onProductsChanged: ProductsProps['onProductsChanged'] }> = ({
  version,
  onProductsChanged,
}) => {
  const L = useL();
  const { lang } = useLanguage();
  const [month, setMonth] = useState(currentMonth);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiFetch(`${API}/receipts?month=${month}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setReceipts(Array.isArray(d.receipts) ? d.receipts : []);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [month, version]);

  const undo = async (r: Receipt) => {
    if (busyId || !window.confirm(L(T.undoConfirm))) return;
    setBusyId(r.id);
    try {
      const data = await send(`/receipts/${encodeURIComponent(r.id)}`, 'DELETE');
      if (Array.isArray(data.products)) onProductsChanged(data.products);
      setReceipts((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      window.alert(errText(err, L(T.undoError)));
    } finally {
      setBusyId('');
    }
  };

  const monthSum = receipts.reduce((s, r) => s + (r.total || 0), 0);
  const isCurrent = month >= currentMonth();
  const navBtn =
    'w-9 h-9 rounded-full bg-ink-100 text-ink-500 hover:text-ink-900 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none';

  return (
    <Card padded={false} className="p-3 md:p-4">
      <div className="flex flex-wrap items-center gap-3 px-2 pb-3">
        <div className="flex items-center gap-2">
          <button type="button" className={navBtn} onClick={() => setMonth((m) => shiftMonth(m, -1))} title={L(T.prevMonth)}>
            <ChevronLeft className="w-[18px] h-[18px]" />
          </button>
          <span className="min-w-[130px] text-center text-[15px] font-semibold text-ink-900">{formatMonth(month, lang)}</span>
          <button
            type="button"
            className={navBtn}
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            disabled={isCurrent}
            title={L(T.nextMonth)}
          >
            <ChevronRight className="w-[18px] h-[18px]" />
          </button>
        </div>
        {receipts.length > 0 ? (
          <span className="ml-auto text-[13px] text-ink-500 tabular-nums">
            {fmt(L(T.monthTotal), { n: formatSum(receipts.length), sum: formatSum(monthSum) })}
          </span>
        ) : null}
      </div>

      {loading && receipts.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
      ) : failed ? (
        <div className="flex items-center gap-2.5 mx-2 px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">
          <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
          {L(T.receiptsLoadError)}
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState icon={PackagePlus} title={L(T.noReceipts)} hint={L(T.noReceiptsHint)} />
      ) : (
        <Table className="min-w-[860px]">
          <thead>
            <tr>
              <Th>{L(COMMON.date)}</Th>
              <Th>{L(T.supplier)}</Th>
              <Th>{L(T.items)}</Th>
              <Th align="right">{L(T.total)}</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => {
              const shown = r.items.slice(0, 3);
              const more = r.items.length - shown.length;
              return (
                <tr key={r.id} className="hover:bg-ink-100/40 transition align-top">
                  <Td className="whitespace-nowrap tabular-nums text-ink-500">{formatDateTime(r.createdAt, lang)}</Td>
                  <Td className="min-w-[160px] max-w-[240px]">
                    <div className="font-semibold text-ink-900 break-words">{r.supplier || '—'}</div>
                    {r.note ? <div className="text-xs text-ink-400 break-words">{r.note}</div> : null}
                  </Td>
                  <Td className="min-w-[260px]">
                    {shown.map((it, i) => (
                      <div key={i} className="text-[13px]">
                        <span className="text-ink-900">{it.productName}</span>{' '}
                        <span className="text-ink-400 tabular-nums whitespace-nowrap">
                          × {formatSum(it.quantity)} {L(UNIT_LABELS[it.unit] || UNIT_LABELS.dona)}
                        </span>
                      </div>
                    ))}
                    {more > 0 ? <div className="text-xs text-ink-400">{fmt(L(T.moreItems), { n: more })}</div> : null}
                  </Td>
                  <Td align="right" className="font-bold text-ink-900">
                    <Money value={r.total || 0} />
                  </Td>
                  <Td align="right">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Undo2}
                      onClick={() => undo(r)}
                      disabled={Boolean(busyId)}
                      title={L(T.undo)}
                    >
                      {busyId === r.id ? L(T.saving) : L(T.undo)}
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------- stock history

const HistoryModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
  const L = useL();
  const { lang } = useLanguage();
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const productId = product?.id;

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    setMoves([]);
    setLoading(true);
    setFailed(false);
    apiFetch(`${API}/stock/moves?productId=${encodeURIComponent(productId)}&limit=200`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        const list: StockMove[] = Array.isArray(d.moves) ? d.moves : [];
        setMoves([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [productId]);

  const dona = L(UNIT_LABELS.dona);

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      width="lg"
      title={L(T.history)}
      subtitle={product ? <span className="block truncate">{fmt(L(T.historySubtitle), { name: product.name })}</span> : undefined}
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>
      ) : failed ? (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl2 bg-rose-50 text-sm text-rose-600">
          <AlertTriangle className="w-[18px] h-[18px] shrink-0" />
          {L(T.historyLoadError)}
        </div>
      ) : moves.length === 0 ? (
        <EmptyState icon={History} title={L(T.noMoves)} />
      ) : (
        <Table className="min-w-[640px]">
          <thead>
            <tr>
              <Th>{L(COMMON.date)}</Th>
              <Th>{L(T.type)}</Th>
              <Th align="right">{L(T.change)}</Th>
              <Th align="right">{L(T.stockAfter)}</Th>
              <Th>{L(T.note)}</Th>
            </tr>
          </thead>
          <tbody>
            {moves.map((m) => {
              const kind = MOVE_LABELS[m.type];
              return (
                <tr key={m.id} className="align-top">
                  <Td className="whitespace-nowrap tabular-nums text-ink-500">{formatDateTime(m.createdAt, lang)}</Td>
                  <Td>
                    <Pill tone={kind?.tone || 'gray'} className="!py-0.5 !text-[11px]">
                      {kind ? L(kind.label) : m.type}
                    </Pill>
                  </Td>
                  <Td
                    align="right"
                    className={
                      m.deltaDona > 0
                        ? 'font-semibold tabular-nums whitespace-nowrap !text-emerald-600'
                        : m.deltaDona < 0
                          ? 'font-semibold tabular-nums whitespace-nowrap !text-rose-600'
                          : 'tabular-nums whitespace-nowrap'
                    }
                  >
                    {m.deltaDona > 0 ? '+' : m.deltaDona < 0 ? '−' : ''}
                    {formatSum(Math.abs(m.deltaDona))} {dona}
                  </Td>
                  <Td align="right" className="tabular-nums whitespace-nowrap font-semibold text-ink-900">
                    {formatSum(m.stockAfter)} {dona}
                  </Td>
                  <Td className="text-[13px] text-ink-500 break-words max-w-[240px]">{m.note || m.ref || '—'}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Modal>
  );
};
