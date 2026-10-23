import { apiClient } from './apiClient';
import { PackagingUnit, PaymentMethod, SyncQueueItem } from '../types';
import { cacheRepository } from '../database/cacheRepository';
import { syncRepository } from '../database/syncRepository';

/** A return already entered for an order (from the server) */
export interface DeliveryReturn {
  id: string;
  reason: string;
  total: number;
  items: { productId: string; productName: string; unit: PackagingUnit; quantity: number }[];
}

/** One stop of the driver's day: an order with its shop's contact details */
export interface Delivery {
  id: string;
  shopId: string;
  shopName: string;
  shopNum?: number;
  shopPhone: string;
  shopAddress: string;
  shopDebt: number;
  latitude?: number;
  longitude?: number;
  routeDay?: number;
  paymentMethod: PaymentMethod;
  status: 'new' | 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  returnedAmount?: number;
  collected?: number;
  deliveredAt?: string;
  createdAt: string;
  items: { productId: string; productName: string; unit: PackagingUnit; quantity: number; unitPrice: number; totalPrice: number }[];
  returns: DeliveryReturn[];
}

export interface PaymentRecord {
  id: string;
  shopId: string;
  shopName: string;
  amount: number;
  by: string;
  createdAt: string;
}

/** What the order is worth after returns */
export const netAmount = (d: Delivery) => Math.max(0, d.finalAmount - (d.returnedAmount || 0));

/** Cash the driver takes for an order: cash orders only; credit goes to the shop's debt */
export const cashToCollect = (d: Delivery) => (d.paymentMethod === 'naqd' ? netAmount(d) : 0);

/** Quantity of an order line already returned */
export const returnedQty = (d: Delivery, productId: string, unit: string) =>
  d.returns.flatMap((r) => r.items).filter((i) => i.productId === productId && i.unit === unit).reduce((s, i) => s + i.quantity, 0);

/** One product on the day's load list; units holds the quantity per packaging unit */
export interface LoadingProduct {
  productId: string;
  code?: string;
  name: string;
  units: Partial<Record<PackagingUnit, number>>;
  totalDona: number;
  hasKg?: boolean;
}

export interface LoadingStop {
  orderId: string;
  num?: number;
  shopName: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: string;
}

/** What one line has to load for a delivery day */
export interface LoadingSheet {
  line: string;
  orders: number;
  total: number;
  products: LoadingProduct[];
  stops: LoadingStop[];
}

export interface LoadingList {
  date: string;
  sheets: LoadingSheet[];
}

export interface CashHandover {
  id: string;
  amount: number;
  note?: string;
  createdAt: string;
}

/** The line's cash for a day: what the driver took and what the office cashier received */
export interface CashLine {
  line: string;
  deliveredOrders: number;
  deliveryCash: number;
  pkoCount: number;
  pkoCash: number;
  expected: number;
  received: number;
  difference: number;
  handovers: CashHandover[];
}

export interface CashSummary {
  date: string;
  lines: CashLine[];
}

// Direct server calls. Screens use driverOffline below (day copies on the phone + the sync queue).
export const driverService = {
  getDeliveries: async (lineCode: string, date: string): Promise<Delivery[]> => {
    const res = await apiClient.get('/deliveries', { params: { line: lineCode, date }, timeout: 12000 });
    return res.data?.orders || [];
  },

  deliver: async (orderId: string, collected: number, by: string) => {
    await apiClient.post(`/orders/${orderId}/deliver`, { collected, by }, { timeout: 10000 });
  },

  undeliver: async (orderId: string) => {
    await apiClient.post(`/orders/${orderId}/undeliver`, {}, { timeout: 10000 });
  },

  /** Goods the shop did not take; the server puts them back in stock and lowers the debt */
  createReturn: async (orderId: string, reason: string, items: { productId: string; unit: string; quantity: number }[]) => {
    const res = await apiClient.post('/returns', { orderId, reason, items }, { timeout: 10000 });
    return res.data;
  },

  getPayments: async (by: string, date: string): Promise<PaymentRecord[]> => {
    const res = await apiClient.get('/payments', { params: { by, date }, timeout: 10000 });
    return res.data?.payments || [];
  },

  /** The day's load list; the server limits a driver to their own line */
  getLoading: async (date: string): Promise<LoadingList> => {
    const res = await apiClient.get('/loading', { params: { date }, timeout: 12000 });
    return { date: res.data?.date || date, sheets: res.data?.sheets || [] };
  },

  /** The day's cash for the driver's line; only the office records what it received */
  getCash: async (date: string): Promise<CashSummary> => {
    const res = await apiClient.get('/cash', { params: { date }, timeout: 10000 });
    return { date: res.data?.date || date, lines: res.data?.lines || [] };
  },
};

/** Server error text if there is one, otherwise the fallback */
export const serverError = (err: any, fallback: string): string => err?.response?.data?.error || fallback;
// ---------------------------------------------------------------- Offline work
//
// The last good answer of every driver GET is kept on the phone per day (`${kind}:${date}`).
// Deliver / undeliver / return change that copy at once and go to the sync queue
// (entityType 'delivery' / 'return', the order id as entityId). Every fresh server answer gets the
// still-queued actions laid over it again, so a refresh never hides work that has not been sent yet.

export type DriverCacheKind = 'deliveries' | 'loading' | 'cash';

/** A day list plus where it came from: offline = the server did not answer, savedAt = time of that copy */
export interface Cached<T> {
  data: T;
  offline: boolean;
  savedAt: string;
}

const cacheKey = (kind: DriverCacheKind, date: string) => `${kind}:${date}`;

interface DeliverPayload {
  orderId: string;
  collected: number;
  by: string;
  at: string;
  date: string;
}
interface UndeliverPayload {
  orderId: string;
  date: string;
}
interface ReturnPayload {
  id: string;
  orderId: string;
  reason: string;
  items: { productId: string; unit: PackagingUnit; quantity: number }[];
  date: string;
  total: number;
}

type DriverAction =
  | { type: 'deliver'; payload: DeliverPayload }
  | { type: 'undeliver'; payload: UndeliverPayload }
  | { type: 'return'; payload: ReturnPayload };

const DRIVER_TYPES: SyncQueueItem['entityType'][] = ['delivery', 'return'];

const queuedActions = (): DriverAction[] =>
  syncRepository.getPendingOfTypes(DRIVER_TYPES).flatMap((item): DriverAction[] => {
    try {
      const payload = JSON.parse(item.payloadJson);
      if (item.entityType === 'return') return [{ type: 'return', payload }];
      return [{ type: item.action === 'undeliver' ? 'undeliver' : 'deliver', payload }];
    } catch {
      return [];
    }
  });

/** One action applied to an order. Safe to apply twice (a return is added once, by its id). */
const applyAction = (d: Delivery, a: DriverAction): Delivery => {
  if (d.id !== a.payload.orderId) return d;
  if (a.type === 'deliver') {
    return { ...d, status: 'delivered', collected: a.payload.collected, deliveredAt: a.payload.at };
  }
  if (a.type === 'undeliver') {
    return { ...d, status: 'confirmed', collected: 0, deliveredAt: undefined };
  }
  if (d.returns.some((r) => r.id === a.payload.id)) return d;
  const names = new Map(d.items.map((i) => [`${i.productId}|${i.unit}`, i.productName]));
  const ret: DeliveryReturn = {
    id: a.payload.id,
    reason: a.payload.reason,
    total: a.payload.total,
    items: a.payload.items.map((i) => ({ ...i, productName: names.get(`${i.productId}|${i.unit}`) || '' })),
  };
  return { ...d, returns: [...d.returns, ret], returnedAmount: (d.returnedAmount || 0) + ret.total };
};

const applyQueued = (list: Delivery[], actions = queuedActions()): Delivery[] =>
  actions.length === 0 ? list : list.map((d) => actions.reduce(applyAction, d));

/** Changes the cached day list right away (the copy keeps the time of its last server answer) */
const applyToCache = (date: string, action: DriverAction): Delivery | null => {
  const cached = cacheRepository.get<Delivery[]>(cacheKey('deliveries', date));
  if (!cached) return null;
  const list = cached.data.map((d) => applyAction(d, action));
  cacheRepository.set(cacheKey('deliveries', date), list, cached.savedAt);
  return list.find((d) => d.id === action.payload.orderId) || null;
};

/** GET with the day copy as fallback; throws only when there is no copy yet */
const withCache = async <T>(kind: DriverCacheKind, date: string, fetch: () => Promise<T>, overlay: (data: T) => T = (x) => x): Promise<Cached<T>> => {
  const key = cacheKey(kind, date);
  try {
    const data = overlay(await fetch());
    const savedAt = new Date().toISOString();
    cacheRepository.set(key, data, savedAt);
    return { data, offline: false, savedAt };
  } catch (err) {
    const cached = cacheRepository.get<T>(key);
    if (!cached) throw err;
    return { data: overlay(cached.data), offline: true, savedAt: cached.savedAt };
  }
};

const newReturnId = () => `ret_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const driverOffline = {
  loadDeliveries: (lineCode: string, date: string) =>
    withCache('deliveries', date, () => driverService.getDeliveries(lineCode, date), (list) => applyQueued(list)),
  loadLoading: (date: string) => withCache('loading', date, () => driverService.getLoading(date)),
  loadCash: (date: string) => withCache('cash', date, () => driverService.getCash(date)),

  /** The day copy without asking the server (e.g. right after a sync); null when there is none */
  cachedDeliveries: (date: string): Cached<Delivery[]> | null => {
    const cached = cacheRepository.get<Delivery[]>(cacheKey('deliveries', date));
    return cached ? { data: applyQueued(cached.data), offline: false, savedAt: cached.savedAt } : null;
  },

  /** The order from the day copy (with queued actions), e.g. after a sync */
  cachedDelivery: (date: string, orderId: string): Delivery | null => {
    const cached = cacheRepository.get<Delivery[]>(cacheKey('deliveries', date));
    const d = cached?.data.find((x) => x.id === orderId);
    return d ? applyQueued([d])[0] : null;
  },

  /** Order ids that still have an action waiting in the queue */
  pendingOrderIds: (): Set<string> => new Set(syncRepository.getPendingOfTypes(DRIVER_TYPES).map((i) => i.entityId)),

  deliver: (d: Delivery, date: string, collected: number, by: string): Delivery => {
    const action: DriverAction = { type: 'deliver', payload: { orderId: d.id, collected, by, at: new Date().toISOString(), date } };
    syncRepository.enqueue('delivery', d.id, 'deliver', action.payload);
    return applyToCache(date, action) || applyAction(d, action);
  },

  undeliver: (d: Delivery, date: string): Delivery => {
    const action: DriverAction = { type: 'undeliver', payload: { orderId: d.id, date } };
    syncRepository.enqueue('delivery', d.id, 'undeliver', action.payload);
    return applyToCache(date, action) || applyAction(d, action);
  },

  /** Goods the shop did not take; total is what the order loses (same share of the discount as the order) */
  createReturn: (d: Delivery, date: string, reason: string, items: ReturnPayload['items'], total: number): Delivery => {
    const action: DriverAction = { type: 'return', payload: { id: newReturnId(), orderId: d.id, reason, items, date, total } };
    syncRepository.enqueue('return', d.id, 'create', action.payload);
    return applyToCache(date, action) || applyAction(d, action);
  },

  /** Sends one queued driver item to the server (used by the sync) */
  push: async (item: SyncQueueItem) => {
    const p = JSON.parse(item.payloadJson);
    if (item.entityType === 'return') {
      // The id makes retries safe: the server answers duplicate:true for one it already has
      await apiClient.post('/returns', { id: p.id, orderId: p.orderId, reason: p.reason, items: p.items }, { timeout: 10000 });
    } else if (item.action === 'undeliver') {
      await apiClient.post(`/orders/${p.orderId}/undeliver`, {}, { timeout: 10000 });
    } else {
      await apiClient.post(`/orders/${p.orderId}/deliver`, { collected: p.collected, by: p.by, at: p.at }, { timeout: 10000 });
    }
    return p.date as string | undefined;
  },

  /** After the queue is sent: fresh day lists from the server replace the copies */
  refreshDays: async (lineCode: string, dates: string[]) => {
    for (const date of Array.from(new Set(dates))) {
      await driverOffline.loadDeliveries(lineCode, date);
      await driverOffline.loadCash(date);
    }
  },
};
