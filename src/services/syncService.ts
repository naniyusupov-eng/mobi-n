import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncRepository } from '../database/syncRepository';
import { orderRepository } from '../database/orderRepository';
import { shopRepository } from '../database/shopRepository';
import { apiClient } from './apiClient';
import { lineService } from './lineService';
import { driverOffline } from './driverService';
import { getTodayDateString } from '../store/dateStore';

export interface SyncResult {
  success: boolean;
  syncedOrders: number;
  syncedShops: number;
  syncedPayments?: number;
  syncedDeliveries?: number; // driver: deliver / undeliver / return actions
  errors: string[];
}

const SESSION_KEY = '@mobi_r_agent_session';

const getSession = async (): Promise<{ lineCode: string | null; role: string | null }> => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return { lineCode: session?.lineCode || null, role: session?.role || null };
  } catch {
    return { lineCode: null, role: null };
  }
};

/** No answer from the server (offline, timeout): the rest of the queue would fail the same way */
const isNetworkError = (err: any) => Boolean(err?.isAxiosError) && !err.response;

const runSync = async (): Promise<SyncResult> => {
  const queue = syncRepository.getPending();
  const result: SyncResult = {
    success: true,
    syncedOrders: 0,
    syncedShops: 0,
    syncedPayments: 0,
    syncedDeliveries: 0,
    errors: [],
  };
  // Driver actions of one order must reach the server in the order they were made: once one of an
  // order's actions could not be sent (server error), its later ones wait for the next sync.
  const heldOrders = new Set<string>();
  const driverDates: string[] = [];
  let offline = false;

  for (const item of queue) {
    const isDriverItem = item.entityType === 'delivery' || item.entityType === 'return';
    if (isDriverItem && heldOrders.has(item.entityId)) continue;
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
      } else if (isDriverItem) {
        // POST /orders/:id/deliver | /orders/:id/undeliver | /returns
        const date = await driverOffline.push(item);
        syncRepository.markSuccess(item.id);
        if (date) driverDates.push(date);
        result.syncedDeliveries = (result.syncedDeliveries || 0) + 1;
      }
    } catch (err: any) {
      result.success = false;
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Sinxronizatsiya xatosi';
      console.warn(`[SyncService] Failed item ${item.id}:`, msg);
      // Failed items stay in the queue (counted as pending) and are retried on the next sync.
      // A refusal from the server (4xx) does not hold anything else back.
      syncRepository.markFailed(item.id, msg);
      result.errors.push(`ID ${item.entityId}: ${msg}`);
      if (isNetworkError(err)) {
        offline = true;
        break; // offline: keep the rest queued, in order
      }
      const status = Number(err.response?.status) || 0;
      if (isDriverItem && (status >= 500 || status === 408 || status === 429)) heldOrders.add(item.entityId);
    }
  }

  // Clean up finished entries
  syncRepository.clearSynced();

  const { lineCode, role } = await getSession();

  // Driver: when nothing of theirs is waiting any more, the day copies are replaced with the server's
  if (lineCode && !offline && (driverDates.length > 0 || role === 'driver') && syncRepository.getPendingOfTypes(['delivery', 'return']).length === 0) {
    try {
      await driverOffline.refreshDays(lineCode, [...driverDates, getTodayDateString()]);
    } catch (err: any) {
      console.warn('[SyncService] Driver refresh failed', err?.message || err);
    }
  }

  // Pull the line's shops (debts may have changed on the website). Only when everything
  // was pushed, otherwise local debt changes that are still queued would be overwritten.
  if (lineCode && result.success) {
    try {
      await lineService.downloadShops(lineCode);
    } catch (err: any) {
      result.success = false;
      result.errors.push(`Doʻkonlarni yangilab boʻlmadi: ${err.message || err}`);
    }
    // Fresh catalogue and warehouse stock. Also only after a full push: queued orders
    // already lowered the local stock, the server's figure would not include them yet.
    try {
      await lineService.downloadProducts();
    } catch (err: any) {
      result.success = false;
      result.errors.push(`Tovarlarni yangilab boʻlmadi: ${err.message || err}`);
    }
    // Price lists and today's promotions (agents only; the driver does not take orders)
    if (role !== 'driver') {
      try {
        await lineService.downloadPricing();
      } catch (err: any) {
        result.success = false;
        result.errors.push(`Narxlarni yangilab boʻlmadi: ${err.message || err}`);
      }
    }
  }

  return result;
};

// One sync at a time: a second call waits for the running one, then runs over the queue again
// (two runs side by side could send a deliver after the undeliver that followed it).
let chain: Promise<unknown> = Promise.resolve();

export const syncService = {
  syncPendingData: (): Promise<SyncResult> => {
    const next = chain.then(runSync, runSync);
    chain = next.catch(() => undefined);
    return next;
  },
};
