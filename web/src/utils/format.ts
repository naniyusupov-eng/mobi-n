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
export const formatToday = (lang: Language) => {
  const d = new Date();
  return `${WEEKDAYS[lang][d.getDay()]}, ${formatDate(d, lang)}`;
};
