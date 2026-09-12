import { create } from 'zustand';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DateState {
  workingDate: string; // YYYY-MM-DD
  setWorkingDate: (dateStr: string) => void;
  shiftWorkingDay: (delta: number) => void;
  resetToToday: () => void;
  getFormattedWorkingDate: (lang: string) => string;
}

export const useDateStore = create<DateState>((set, get) => ({
  workingDate: getTodayDateString(),

  setWorkingDate: (dateStr: string) => set({ workingDate: dateStr }),

  shiftWorkingDay: (delta: number) => {
    const current = get().workingDate;
    const parts = current.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    set({ workingDate: `${year}-${month}-${day}` });
  },

  resetToToday: () => {
    set({ workingDate: getTodayDateString() });
  },

  getFormattedWorkingDate: (lang: string) => {
    const current = get().workingDate;
    const parts = current.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const day = d.getDate();
    const year = d.getFullYear();

    const uzMonths = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    const ruMonths = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    const cyrlMonths = [
      'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
      'Июл', 'Август', 'Сентябр', 'Октабр', 'Ноябр', 'Декабр'
    ];

    const uzWeekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const ruWeekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const cyrlWeekdays = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'];

    const monthIndex = d.getMonth();
    const dayOfWeekIndex = d.getDay();

    if (lang === 'ru') {
      return `${day} ${ruMonths[monthIndex]}, ${year} (${ruWeekdays[dayOfWeekIndex]})`;
    } else if (lang === 'uz_cyrl') {
      return `${day}-${cyrlMonths[monthIndex]}, ${year} (${cyrlWeekdays[dayOfWeekIndex]})`;
    } else {
      return `${day}-${uzMonths[monthIndex]}, ${year} (${uzWeekdays[dayOfWeekIndex]})`;
    }
  },
}));
