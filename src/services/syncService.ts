import { syncRepository } from '../database/syncRepository';
import { orderRepository } from '../database/orderRepository';
import { shopRepository } from '../database/shopRepository';
import { apiClient } from './apiClient';

export interface SyncResult {
  success: boolean;
  syncedOrders: number;
  syncedShops: number;
  errors: string[];
}

export const syncService = {
  syncPendingData: async (): Promise<SyncResult> => {
    const queue = syncRepository.getPending();
    const result: SyncResult = {
      success: true,
      syncedOrders: 0,
      syncedShops: 0,
      errors: [],
    };

    if (queue.length === 0) {
      return result;
    }

    for (const item of queue) {
      try {
        const payload = JSON.parse(item.payloadJson);

        if (item.entityType === 'order') {
          // Push order to API endpoint: POST /orders/sync
          await apiClient.post('/orders/sync', payload, { timeout: 8000 });
          orderRepository.markSynced(item.entityId);
          syncRepository.markSuccess(item.id);
          result.syncedOrders++;
        } else if (item.entityType === 'shop') {
          // Push new shop to API endpoint: POST /shops/sync
          await apiClient.post('/shops/sync', payload, { timeout: 8000 });
          shopRepository.markSynced(item.entityId);
          syncRepository.markSuccess(item.id);
          result.syncedShops++;
        }
      } catch (err: any) {
        result.success = false;
        const msg = err.response?.data?.message || err.message || 'Sinxronizatsiya xatosi';
        console.warn(`[SyncService] Failed item ${item.id}:`, msg);
        syncRepository.markFailed(item.id, msg);
        result.errors.push(`ID ${item.entityId}: ${msg}`);
      }
    }

    // Clean up finished entries
    syncRepository.clearSynced();

    return result;
  },
};
