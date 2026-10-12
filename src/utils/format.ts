import { MobileLanguage } from '../i18n/mobileTranslations';
import { CURRENCY, MONTHS_SHORT, WEEKDAYS, pick } from '../i18n/tri';

const pad = (n: number) => String(n).padStart(2, '0');

/** 1250000 -> "1 250 000" (Hermes toLocaleString differs between devices, so group by hand) */
export const formatNumber = (n: number) => {
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/** 1250000 -> "1 250 000 soʻm" / "сўм" / "сум" */
export const formatMoney = (n: number, lang: MobileLanguage) => `${formatNumber(n)} ${pick(CURRENCY, lang)}`;

/** Short money for tight places: 1250000 -> "1,3 mln", 164000 -> "164 ming" */
export const formatMoneyShort = (n: number, lang: MobileLanguage) => {
  const mln = { uz: 'mln', uz_cyrl: 'млн', ru: 'млн' }[lang];
  const k = { uz: 'ming', uz_cyrl: 'минг', ru: 'тыс' }[lang];
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')} ${mln}`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} ${k}`;
  return formatNumber(n);
};

const toDate = (value: string | Date) => {
  // "YYYY-MM-DD" is a local calendar day, not UTC midnight
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
};

/** "3 okt" */
export const formatDate = (value: string | Date, lang: MobileLanguage) => {
  const d = toDate(value);
  return `${d.getDate()} ${pick(MONTHS_SHORT[d.getMonth()], lang)}`;
};

/** "3 okt, 23:43" */
export const formatDateTime = (value: string | Date, lang: MobileLanguage) => {
  const d = toDate(value);
  return `${formatDate(d, lang)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "23:43" */
export const formatTime = (value: string | Date) => {
  const d = toDate(value);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "Shanba, 10 okt" */
export const formatDayLong = (value: string | Date, lang: MobileLanguage) => {
  const d = toDate(value);
  return `${pick(WEEKDAYS[d.getDay()], lang)}, ${formatDate(d, lang)}`;
};

/** Route day 1-6 -> "Dushanba" ... */
export const routeDayName = (day: number, lang: MobileLanguage) => pick(WEEKDAYS[day % 7], lang);

/** Shop number from the map; a half step is an unnumbered point between two ("30a") */
export const formatShopNum = (num: number) => (Number.isInteger(num) ? String(num) : `${Math.floor(num)}a`);
