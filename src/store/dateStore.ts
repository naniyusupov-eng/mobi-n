import { create } from 'zustand';

/** Phone's local calendar day of a date as YYYY-MM-DD */
export const localDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => localDateString(new Date());

/** Local calendar day of an ISO timestamp (createdAt is UTC; 00:00-05:00 Tashkent is still that local day) */
export const localDayOf = (iso: string | undefined | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso.slice(0, 10) : localDateString(d);
};

interface DateState {
  workingDate: string; // YYYY-MM-DD
  setWorkingDate: (dateStr: string) => void;
  shiftWorkingDay: (delta: number) => void;
  resetToToday: () => void;
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

}));
