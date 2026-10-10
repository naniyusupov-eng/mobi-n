import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncRepository } from '../database/syncRepository';
import { orderRepository } from '../database/orderRepository';
import { shopRepository } from '../database/shopRepository';
import { apiClient } from './apiClient';
import { lineService } from './lineService';

export interface SyncResult {
  success: boolean;
  syncedOrders: number;
  syncedShops: number;
  syncedPayments?: number;
  errors: string[];
}

const SESSION_KEY = '@mobi_r_agent_session';

const getSessionLineCode = async (): Promise<string | null> => {
  try {
    const session = await AsyncStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session).lineCode || null : null;
  } catch {
    return null;
  }
};

export const syncService = {
  syncPendingData: async (): Promise<SyncResult> => {
    const queue = syncRepository.getPending();
    const result: SyncResult = {
      success: true,
      syncedOrders: 0,
      syncedShops: 0,
      syncedPayments: 0,
      errors: [],
    };

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
        } else if (item.entityType === 'payment') {
          // Push debt payment (PKO): POST /payments/sync
          await apiClient.post('/payments/sync', payload, { timeout: 8000 });
          syncRepository.markSuccess(item.id);
          result.syncedPayments = (result.syncedPayments || 0) + 1;
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

    // Pull the line's shops (debts may have changed on the website). Only when everything
    // was pushed, otherwise local debt changes that are still queued would be overwritten.
    const lineCode = await getSessionLineCode();
    if (lineCode && result.success) {
      try {
        await lineService.downloadShops(lineCode);
      } catch (err: any) {
        result.success = false;
        result.errors.push(`Doʻkonlarni yangilab boʻlmadi: ${err.message || err}`);
      }
    }

    return result;
  },
};
