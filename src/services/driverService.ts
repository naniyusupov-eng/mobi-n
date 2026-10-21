import { apiClient } from './apiClient';
import { PackagingUnit, PaymentMethod } from '../types';

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

// The driver works online: every action goes straight to the server
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
