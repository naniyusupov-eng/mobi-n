import { create } from 'zustand';
import { syncRepository } from '../database/syncRepository';
import { syncService, SyncResult } from '../services/syncService';

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
        lastSyncedAt: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        lastResult: result,
      });
      return result;
    } catch (e) {
      set({ isSyncing: false });
      return { success: false, syncedOrders: 0, syncedShops: 0, errors: ['Ulanishda xatolik'] };
    }
  },
}));
