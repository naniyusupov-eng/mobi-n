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
