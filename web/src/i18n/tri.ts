import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from './translations';
import { OrderStatus, PaymentMethod } from '../types';

/**
 * A text in all three site languages. Every field is required, so a page can never
 * show Latin text when Cyrillic (or Russian) is selected.
 */
export type Tri = Record<Language, string>;

/** `const L = useL(); L({ uz: 'Saqlash', uz_cyrl: 'Сақлаш', ru: 'Сохранить' })` */
export const useL = () => {
  const { lang } = useLanguage();
  return useCallback((text: Tri) => text[lang] ?? text.uz, [lang]);
};

export const pick = (text: Tri, lang: Language) => text[lang] ?? text.uz;

/** Fill {name} placeholders: fmt(L(T.shops), { n: 5 }) */
export const fmt = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));

// ---- Shared vocabulary ----

export const STATUS_LABELS: Record<OrderStatus, Tri> = {
  new: { uz: 'Yangi', uz_cyrl: 'Янги', ru: 'Новый' },
  confirmed: { uz: 'Tasdiqlangan', uz_cyrl: 'Тасдиқланган', ru: 'Подтверждён' },
  delivered: { uz: 'Yetkazilgan', uz_cyrl: 'Етказилган', ru: 'Доставлен' },
  cancelled: { uz: 'Bekor qilingan', uz_cyrl: 'Бекор қилинган', ru: 'Отменён' },
};

export const PAYMENT_LABELS: Record<PaymentMethod, Tri> = {
  naqd: { uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' },
  nasiya: { uz: 'Nasiya', uz_cyrl: 'Насия', ru: 'В долг' },
  otkazma: { uz: 'Oʻtkazma', uz_cyrl: 'Ўтказма', ru: 'Перечисление' },
};

export const UNIT_LABELS: Record<string, Tri> = {
  dona: { uz: 'dona', uz_cyrl: 'дона', ru: 'шт' },
  blok: { uz: 'blok', uz_cyrl: 'блок', ru: 'блок' },
  korobka: { uz: 'korobka', uz_cyrl: 'коробка', ru: 'коробка' },
  kg: { uz: 'kg', uz_cyrl: 'кг', ru: 'кг' },
};

/** Route week days, index 1 = Dushanba ... 6 = Shanba (0 = Yakshanba) */
export const WEEKDAY_LABELS: Tri[] = [
  { uz: 'Yakshanba', uz_cyrl: 'Якшанба', ru: 'Воскресенье' },
  { uz: 'Dushanba', uz_cyrl: 'Душанба', ru: 'Понедельник' },
  { uz: 'Seshanba', uz_cyrl: 'Сешанба', ru: 'Вторник' },
  { uz: 'Chorshanba', uz_cyrl: 'Чоршанба', ru: 'Среда' },
  { uz: 'Payshanba', uz_cyrl: 'Пайшанба', ru: 'Четверг' },
  { uz: 'Juma', uz_cyrl: 'Жума', ru: 'Пятница' },
  { uz: 'Shanba', uz_cyrl: 'Шанба', ru: 'Суббота' },
];

export const WEEKDAY_SHORT: Tri[] = [
  { uz: 'Ya', uz_cyrl: 'Як', ru: 'Вс' },
  { uz: 'Du', uz_cyrl: 'Ду', ru: 'Пн' },
  { uz: 'Se', uz_cyrl: 'Се', ru: 'Вт' },
  { uz: 'Ch', uz_cyrl: 'Чо', ru: 'Ср' },
  { uz: 'Pa', uz_cyrl: 'Па', ru: 'Чт' },
  { uz: 'Ju', uz_cyrl: 'Жу', ru: 'Пт' },
  { uz: 'Sh', uz_cyrl: 'Ша', ru: 'Сб' },
];

/** Common words used on many pages */
export const COMMON = {
  som: { uz: 'soʻm', uz_cyrl: 'сўм', ru: 'сум' },
  pcs: { uz: 'ta', uz_cyrl: 'та', ru: 'шт' },
  all: { uz: 'Hammasi', uz_cyrl: 'Ҳаммаси', ru: 'Все' },
  allLines: { uz: 'Barcha liniyalar', uz_cyrl: 'Барча линиялар', ru: 'Все линии' },
  line: { uz: 'Liniya', uz_cyrl: 'Линия', ru: 'Линия' },
  route: { uz: 'Marshrut', uz_cyrl: 'Маршрут', ru: 'Маршрут' },
  shop: { uz: 'Doʻkon', uz_cyrl: 'Дўкон', ru: 'Магазин' },
  shops: { uz: 'doʻkon', uz_cyrl: 'дўкон', ru: 'магазинов' },
  today: { uz: 'Bugun', uz_cyrl: 'Бугун', ru: 'Сегодня' },
  yesterday: { uz: 'Kecha', uz_cyrl: 'Кеча', ru: 'Вчера' },
  save: { uz: 'Saqlash', uz_cyrl: 'Сақлаш', ru: 'Сохранить' },
  cancel: { uz: 'Bekor qilish', uz_cyrl: 'Бекор қилиш', ru: 'Отмена' },
  close: { uz: 'Yopish', uz_cyrl: 'Ёпиш', ru: 'Закрыть' },
  search: { uz: 'Qidirish', uz_cyrl: 'Қидириш', ru: 'Поиск' },
  receipt: { uz: 'Chek', uz_cyrl: 'Чек', ru: 'Чек' },
  loading: { uz: 'Yuklanmoqda…', uz_cyrl: 'Юкланмоқда…', ru: 'Загрузка…' },
  noData: { uz: 'Maʼlumot yoʻq', uz_cyrl: 'Маълумот йўқ', ru: 'Нет данных' },
  returns: { uz: 'Vozvrat', uz_cyrl: 'Возврат', ru: 'Возврат' },
  sales: { uz: 'Savdo', uz_cyrl: 'Савдо', ru: 'Продажи' },
  netSales: { uz: 'Sof savdo', uz_cyrl: 'Соф савдо', ru: 'Чистые продажи' },
  debt: { uz: 'Qarz', uz_cyrl: 'Қарз', ru: 'Долг' },
  orders: { uz: 'Buyurtmalar', uz_cyrl: 'Буюртмалар', ru: 'Заказы' },
  date: { uz: 'Sana', uz_cyrl: 'Сана', ru: 'Дата' },
  sum: { uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' },
  status: { uz: 'Holat', uz_cyrl: 'Ҳолат', ru: 'Статус' },
  payment: { uz: 'Toʻlov', uz_cyrl: 'Тўлов', ru: 'Оплата' },
  phone: { uz: 'Telefon', uz_cyrl: 'Телефон', ru: 'Телефон' },
  error: { uz: 'Xatolik', uz_cyrl: 'Хатолик', ru: 'Ошибка' },
  loadError: {
    uz: 'Maʼlumotlarni yuklab boʻlmadi. Birozdan soʻng sahifani yangilang.',
    uz_cyrl: 'Маълумотларни юклаб бўлмади. Бироздан сўнг саҳифани янгиланг.',
    ru: 'Не удалось загрузить данные. Обновите страницу чуть позже.',
  },
} satisfies Record<string, Tri>;
