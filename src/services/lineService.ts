import { apiClient } from './apiClient';
import { shopRepository } from '../database/shopRepository';
import { productRepository } from '../database/productRepository';
import { pricingService } from './pricingService';
import { Product, Shop, UserRole } from '../types';

// Route day number (1-6) -> visit day label used across the app
export const ROUTE_DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

/** Today's route day: 1 = Dushanba ... 6 = Shanba, null on Sunday */
export const todayRouteDay = (): number | null => {
  const jsDay = new Date().getDay(); // 0 = Sunday
  return jsDay === 0 ? null : jsDay;
};

export interface LineSignIn {
  token: string;
  role: UserRole;
  line: { id: string; code: string; name?: string };
}

interface ServerClient {
  id: string;
  num?: number;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  lineCode?: string;
  day?: number;
  notes?: string;
  debtBalance?: number;
  creditLimit?: number;
  debtSince?: string | null;
  debtDays?: number | null;
  overLimit?: boolean;
  overdue?: boolean;
  creditBlocked?: boolean;
  creditLeft?: number | null;
  priceListId?: string | null;
}

/**
 * Reads the line key from a scanned QR payload or typed text.
 * Line QR codes from the website are JSON: { type: 'line', line: '4-3', role, key: 'K7QM-29XP', ... }.
 * A typed key ("K7QM-29XP", "k7qm29xp") is sent as it is; the server ignores case and dashes.
 * Returns null when there is no key (e.g. an old QR code without one).
 */
export const parseLineKey = (raw: string): string | null => {
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const key = parsed && typeof parsed.key === 'string' ? parsed.key.trim() : '';
      return key || null;
    } catch {
      return null;
    }
  }
  // Typed key: letters and digits, dashes/spaces allowed
  return /^[A-Za-z0-9][A-Za-z0-9\s-]*$/.test(text) ? text : null;
};

/**
 * Server address from a line QR code: { ..., api: 'https://rcandy.uz/api/v1' }.
 * QR codes printed from the hosted website carry it, so an installed APK finds the server itself.
 */
export const parseServerUrl = (raw: string): string | null => {
  const text = raw.trim();
  if (!text.startsWith('{')) return null;
  try {
    const api = JSON.parse(text)?.api;
    return typeof api === 'string' && /^https?:\/\/[^\s]+$/.test(api.trim()) ? api.trim().replace(/\/+$/, '') : null;
  } catch {
    return null;
  }
};

export const lineService = {
  /** Exchanges a line key for a session token: POST /auth/line */
  signIn: async (key: string): Promise<LineSignIn> => {
    const res = await apiClient.post('/auth/line', { key }, { timeout: 10000 });
    const data = res.data || {};
    if (!data.token || !data.line?.code) throw new Error('Bad sign-in response');
    return {
      token: String(data.token),
      role: data.role === 'driver' ? 'driver' : 'agent',
      line: { id: String(data.line.id || data.line.code), code: String(data.line.code), name: data.line.name },
    };
  },

  /** Downloads the warehouse catalogue (with stock) and replaces the local products. */
  downloadProducts: async (): Promise<number> => {
    const res = await apiClient.get('/products', { timeout: 15000 });
    const list: any[] = res.data?.products;
    if (!Array.isArray(list)) throw new Error('Bad products response');
    const products: Product[] = list
      .filter((p) => p && p.id && p.name)
      .map((p) => ({
        id: String(p.id),
        code: String(p.code || ''),
        name: String(p.name),
        categoryId: String(p.categoryId || 'cat_other'),
        categoryName: p.categoryName || '',
        description: p.description || '',
        priceDona: Number(p.priceDona) || 0,
        priceBlok: Number(p.priceBlok) || 0,
        priceKorobka: Number(p.priceKorobka) || 0,
        priceKg: Number(p.priceKg) || 0,
        itemsPerBlock: Number(p.itemsPerBlock) || 1,
        itemsPerBox: Number(p.itemsPerBox) || 1,
        stockDona: Math.max(0, Number(p.stockDona) || 0),
        imageUrl: p.imageUrl || undefined,
      }));
    productRepository.replaceAll(products);
    return products.length;
  },

  /** Downloads the price lists and today's promotions (GET /pricing) and stores them on the phone. */
  downloadPricing: async (): Promise<void> => {
    await pricingService.download();
  },

  /** Downloads all shops of the line (every week day) and stores them on the phone. */
  downloadShops: async (lineCode: string): Promise<number> => {
    // The server forces the signed-in line; the param is kept for clarity
    const res = await apiClient.get('/clients', { params: { line: lineCode }, timeout: 15000 });
    const clients: ServerClient[] = res.data?.clients || [];
    const now = new Date().toISOString();
    const shops: Shop[] = clients.map((c) => ({
      id: c.id,
      name: c.name,
      ownerName: c.ownerName || '',
      phone: c.phone || '',
      address: c.address || '',
      latitude: c.latitude,
      longitude: c.longitude,
      debtBalance: c.debtBalance || 0,
      visitDay: c.day ? ROUTE_DAYS[c.day - 1] : 'Barchasi',
      createdAt: now,
      isSynced: true,
      lineCode,
      routeDay: c.day,
      num: c.num,
      notes: c.notes,
      creditLimit: Number(c.creditLimit) || 0,
      debtSince: c.debtSince || null,
      debtDays: c.debtDays == null ? null : Number(c.debtDays),
      overLimit: Boolean(c.overLimit),
      overdue: Boolean(c.overdue),
      creditBlocked: Boolean(c.creditBlocked),
      creditLeft: c.creditLeft == null ? null : Number(c.creditLeft),
      priceListId: c.priceListId ? String(c.priceListId) : null,
    }));
    shopRepository.replaceLineShops(lineCode, shops);
    return shops.length;
  },
};
