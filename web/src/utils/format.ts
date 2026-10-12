import { Language } from '../i18n/translations';

// Browsers have no Uzbek month names (uz-UZ renders "M10"), so names are kept here
const MONTHS: Record<Language, string[]> = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  uz_cyrl: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
};

const WEEKDAYS: Record<Language, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  uz_cyrl: ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

const pad = (n: number) => String(n).padStart(2, '0');

/** "3 okt" */
export const formatDate = (value: string | Date, lang: Language) => {
  const d = new Date(value);
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`;
};

/** "3 okt, 23:43" */
export const formatDateTime = (value: string | Date, lang: Language) => {
  const d = new Date(value);
  return `${formatDate(d, lang)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "Shanba, 10 okt" */
export const formatToday = (lang: Language) => formatWeekdayDay(dayKey(), lang);

const MONTHS_FULL: Record<Language, string[]> = {
  uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
  uz_cyrl: ['Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн', 'Июл', 'Август', 'Сентабр', 'Октабр', 'Ноябр', 'Декабр'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

/** "2026-10" -> "Oktabr 2026" */
export const formatMonth = (month: string, lang: Language) => {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS_FULL[lang][m - 1]} ${y}`;
};

/** Current month as YYYY-MM (Tashkent time) */
export const currentMonth = () => dayKey().slice(0, 7);

/** Shift a YYYY-MM month by n months */
export const shiftMonth = (month: string, n: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/** Short money for narrow cells: 164 000 -> "164k", 1 250 000 -> "1,3 mln" */
export const compactMoney = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')} mln`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

/* ---------- Business calendar (all day grouping uses Asia/Tashkent) ---------- */

export const BUSINESS_TZ = 'Asia/Tashkent';

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Calendar day (YYYY-MM-DD) of a moment in Tashkent time */
export const dayKey = (value: string | number | Date = Date.now()) => dayFmt.format(new Date(value));

/** Shift a YYYY-MM-DD day by n days */
export const shiftDay = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Weekday of a YYYY-MM-DD day, 0 = Sunday */
export const weekdayOf = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay();

export const WEEKDAYS_SHORT: Record<Language, string[]> = {
  uz: ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
  uz_cyrl: ['Як', 'Ду', 'Се', 'Чо', 'Па', 'Жу', 'Ша'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};

/** "2026-10-12" -> "12 okt 2026" */
export const formatDay = (day: string, lang: Language) => {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[lang][m - 1]} ${y}`;
};

/** "2026-10-12" -> "Dushanba, 12 okt" */
export const formatWeekdayDay = (day: string, lang: Language) => {
  const [, m, d] = day.split('-').map(Number);
  return `${WEEKDAYS[lang][weekdayOf(day)]}, ${d} ${MONTHS[lang][m - 1]}`;
};

export const monthName = (m: number, lang: Language) => MONTHS_FULL[lang][m - 1];
