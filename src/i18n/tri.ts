import { useCallback } from 'react';
import { useLanguageStore } from '../store/languageStore';
import { MobileLanguage } from './mobileTranslations';
import { OrderStatus, PackagingUnit, PaymentMethod } from '../types';

/**
 * A text in all three app languages. Every field is required, so a screen can never
 * show Latin text when Cyrillic (or Russian) is selected.
 */
export type Tri = Record<MobileLanguage, string>;

/** `const L = useL(); L({ uz: 'Saqlash', uz_cyrl: 'Сақлаш', ru: 'Сохранить' })` */
export const useL = () => {
  const lang = useLanguageStore((s) => s.lang);
  return useCallback((text: Tri) => text[lang] ?? text.uz, [lang]);
};

export const pick = (text: Tri, lang: MobileLanguage) => text[lang] ?? text.uz;

// ---- Shared vocabulary (one place instead of per-screen ternaries) ----

export const PAYMENT_LABELS: Record<PaymentMethod, Tri> = {
  naqd: { uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' },
  nasiya: { uz: 'Nasiya', uz_cyrl: 'Насия', ru: 'В долг' },
  otkazma: { uz: 'Oʻtkazma', uz_cyrl: 'Ўтказма', ru: 'Перечисление' },
};

export const STATUS_LABELS: Record<OrderStatus, Tri> = {
  pending: { uz: 'Yangi', uz_cyrl: 'Янги', ru: 'Новый' },
  confirmed: { uz: 'Tasdiqlangan', uz_cyrl: 'Тасдиқланган', ru: 'Подтверждён' },
  delivered: { uz: 'Yetkazilgan', uz_cyrl: 'Етказилган', ru: 'Доставлен' },
  cancelled: { uz: 'Bekor qilingan', uz_cyrl: 'Бекор қилинган', ru: 'Отменён' },
};

export const UNIT_LABELS: Record<PackagingUnit, Tri> = {
  dona: { uz: 'dona', uz_cyrl: 'дона', ru: 'шт' },
  blok: { uz: 'blok', uz_cyrl: 'блок', ru: 'блок' },
  korobka: { uz: 'korobka', uz_cyrl: 'коробка', ru: 'коробка' },
  kg: { uz: 'kg', uz_cyrl: 'кг', ru: 'кг' },
};

export const CURRENCY: Tri = { uz: 'soʻm', uz_cyrl: 'сўм', ru: 'сум' };

// Index 0 = Sunday, like Date.getDay()
export const WEEKDAYS: Tri[] = [
  { uz: 'Yakshanba', uz_cyrl: 'Якшанба', ru: 'Воскресенье' },
  { uz: 'Dushanba', uz_cyrl: 'Душанба', ru: 'Понедельник' },
  { uz: 'Seshanba', uz_cyrl: 'Сешанба', ru: 'Вторник' },
  { uz: 'Chorshanba', uz_cyrl: 'Чоршанба', ru: 'Среда' },
  { uz: 'Payshanba', uz_cyrl: 'Пайшанба', ru: 'Четверг' },
  { uz: 'Juma', uz_cyrl: 'Жума', ru: 'Пятница' },
  { uz: 'Shanba', uz_cyrl: 'Шанба', ru: 'Суббота' },
];

export const MONTHS_SHORT: Tri[] = [
  { uz: 'yan', uz_cyrl: 'янв', ru: 'янв' },
  { uz: 'fev', uz_cyrl: 'фев', ru: 'фев' },
  { uz: 'mar', uz_cyrl: 'мар', ru: 'мар' },
  { uz: 'apr', uz_cyrl: 'апр', ru: 'апр' },
  { uz: 'may', uz_cyrl: 'май', ru: 'мая' },
  { uz: 'iyn', uz_cyrl: 'июн', ru: 'июн' },
  { uz: 'iyl', uz_cyrl: 'июл', ru: 'июл' },
  { uz: 'avg', uz_cyrl: 'авг', ru: 'авг' },
  { uz: 'sen', uz_cyrl: 'сен', ru: 'сен' },
  { uz: 'okt', uz_cyrl: 'окт', ru: 'окт' },
  { uz: 'noy', uz_cyrl: 'ноя', ru: 'ноя' },
  { uz: 'dek', uz_cyrl: 'дек', ru: 'дек' },
];

/** Common words used on many screens */
export const COMMON = {
  save: { uz: 'Saqlash', uz_cyrl: 'Сақлаш', ru: 'Сохранить' },
  cancel: { uz: 'Bekor qilish', uz_cyrl: 'Бекор қилиш', ru: 'Отмена' },
  confirm: { uz: 'Tasdiqlash', uz_cyrl: 'Тасдиқлаш', ru: 'Подтвердить' },
  close: { uz: 'Yopish', uz_cyrl: 'Ёпиш', ru: 'Закрыть' },
  search: { uz: 'Qidirish', uz_cyrl: 'Қидириш', ru: 'Поиск' },
  all: { uz: 'Hammasi', uz_cyrl: 'Ҳаммаси', ru: 'Все' },
  error: { uz: 'Xatolik', uz_cyrl: 'Хатолик', ru: 'Ошибка' },
  warning: { uz: 'Diqqat', uz_cyrl: 'Диққат', ru: 'Внимание' },
  print: { uz: 'Chek', uz_cyrl: 'Чек', ru: 'Чек' },
  printError: { uz: 'Chekni chiqarib boʻlmadi', uz_cyrl: 'Чекни чиқариб бўлмади', ru: 'Не удалось сформировать чек' },
  debt: { uz: 'Qarz', uz_cyrl: 'Қарз', ru: 'Долг' },
  noDebt: { uz: 'Qarz yoʻq', uz_cyrl: 'Қарз йўқ', ru: 'Долгов нет' },
  orders: { uz: 'Buyurtmalar', uz_cyrl: 'Буюртмалар', ru: 'Заказы' },
  ordersCount: { uz: 'ta buyurtma', uz_cyrl: 'та буюртма', ru: 'заказ(ов)' },
  shops: { uz: 'Doʻkonlar', uz_cyrl: 'Дўконлар', ru: 'Магазины' },
  shopsCount: { uz: 'ta doʻkon', uz_cyrl: 'та дўкон', ru: 'магазин(ов)' },
  today: { uz: 'Bugun', uz_cyrl: 'Бугун', ru: 'Сегодня' },
  total: { uz: 'Jami', uz_cyrl: 'Жами', ru: 'Итого' },
  discount: { uz: 'Chegirma', uz_cyrl: 'Чегирма', ru: 'Скидка' },
  toPay: { uz: 'Toʻlanadi', uz_cyrl: 'Тўланади', ru: 'К оплате' },
  payment: { uz: 'Toʻlov', uz_cyrl: 'Тўлов', ru: 'Оплата' },
  paymentAccepted: { uz: 'Toʻlov qabul qilindi', uz_cyrl: 'Тўлов қабул қилинди', ru: 'Оплата принята' },
  acceptPayment: { uz: 'Toʻlov qabul qilish', uz_cyrl: 'Тўлов қабул қилиш', ru: 'Принять оплату' },
  newOrder: { uz: 'Buyurtma', uz_cyrl: 'Буюртма', ru: 'Заказ' },
  chooseShop: { uz: 'Doʻkonni tanlang', uz_cyrl: 'Дўконни танланг', ru: 'Выберите магазин' },
  call: { uz: 'Qoʻngʻiroq', uz_cyrl: 'Қўнғироқ', ru: 'Позвонить' },
  map: { uz: 'Xarita', uz_cyrl: 'Харита', ru: 'Карта' },
  visited: { uz: 'Borildi', uz_cyrl: 'Борилди', ru: 'Посещён' },
  empty: { uz: 'Hech narsa topilmadi', uz_cyrl: 'Ҳеч нарса топилмади', ru: 'Ничего не найдено' },
  line: { uz: 'liniya', uz_cyrl: 'линия', ru: 'линия' },
} satisfies Record<string, Tri>;

/** Product categories from the catalogue; unknown ones are shown as stored */
export const CATEGORY_LABELS: Record<string, Tri> = {
  cat_wafers: { uz: 'Vaflilar', uz_cyrl: 'Вафлилар', ru: 'Вафли' },
  cat_chocolate: { uz: 'Shokoladlar', uz_cyrl: 'Шоколадлар', ru: 'Шоколад' },
  cat_cookies: { uz: 'Pechenyelar', uz_cyrl: 'Печенелар', ru: 'Печенье' },
  cat_candies: { uz: 'Karamellar', uz_cyrl: 'Карамеллар', ru: 'Карамель' },
  cat_marmalade: { uz: 'Marmeladlar', uz_cyrl: 'Мармеладлар', ru: 'Мармелад' },
};
