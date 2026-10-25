import { create } from 'zustand';
import { syncRepository } from '../database/syncRepository';
import { syncService, SyncResult } from '../services/syncService';
import { Alert } from 'react-native';
import { formatTime } from '../utils/format';
import { useLanguageStore } from './languageStore';
import { Tri, pick } from '../i18n/tri';

const REJECTED_TITLE: Tri = { uz: 'Server qabul qilmadi', uz_cyrl: 'Сервер қабул қилмади', ru: 'Сервер не принял' };
const rejectedText = (n: number): Tri => ({
  uz: `${n} ta amal serverda rad etildi va bekor qilindi (masalan, buyurtma ofisda bekor qilingan). Ma'lumotlar serverdan yangilandi.`,
  uz_cyrl: `${n} та амал серверда рад этилди ва бекор қилинди (масалан, буюртма офисда бекор қилинган). Маълумотлар сервердан янгиланди.`,
  ru: `${n} действ. отклонено сервером и отменено (например, заказ отменён в офисе). Данные обновлены с сервера.`,
});

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastResult: SyncResult | null;
  refreshPendingCount: () => void;
  triggerSync: () => Promise<SyncResult>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastResult: null,

  refreshPendingCount: () => {
    const count = syncRepository.getPendingCount();
    set({ pendingCount: count });
  },

  triggerSync: async () => {
    set({ isSyncing: true });
    try {
      const result = await syncService.syncPendingData();
      const count = syncRepository.getPendingCount();
      set({
        isSyncing: false,
        pendingCount: count,
        lastSyncedAt: formatTime(new Date()),
        lastResult: result,
      });
      const rejected = result.rejected || [];
      if (rejected.length > 0) {
        const lang = useLanguageStore.getState().lang;
        Alert.alert(pick(REJECTED_TITLE, lang), `${pick(rejectedText(rejected.length), lang)}\n\n${rejected.slice(0, 3).join('\n')}`);
      }
      return result;
    } catch (e) {
      set({ isSyncing: false });
      return { success: false, syncedOrders: 0, syncedShops: 0, errors: ['Ulanishda xatolik'] };
    }
  },
}));
