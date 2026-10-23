import { apiClient } from './apiClient';
import { cacheRepository } from '../database/cacheRepository';
import { AppliedPromo, CartItem, PackagingUnit, PriceList, Pricing, Product, Promo, UnitPrices } from '../types';

// Price lists and today's promotions for the line (GET /pricing), kept on the phone under one key
const PRICING_KEY = 'pricing';
const UNITS: PackagingUnit[] = ['dona', 'blok', 'korobka', 'kg'];

/** A promotion in the cart with the money it takes off */
export interface PromoLine extends AppliedPromo {
  percent: number;
  kind: Promo['kind'];
}

export const basePrice = (product: Product, unit: PackagingUnit): number => {
  switch (unit) {
    case 'dona':
      return product.priceDona;
    case 'blok':
      return product.priceBlok;
    case 'korobka':
      return product.priceKorobka;
    case 'kg':
      return product.priceKg;
    default:
      return product.priceDona;
  }
};

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return v != null && v !== '' && Number.isFinite(n) ? n : undefined;
};

const parsePricing = (data: any): Pricing => {
  const priceLists: PriceList[] = (Array.isArray(data?.priceLists) ? data.priceLists : [])
    .filter((l: any) => l && l.id)
    .map((l: any) => {
      const prices: Record<string, UnitPrices> = {};
      for (const [productId, raw] of Object.entries<any>(l.prices || {})) {
        const unitPrices: UnitPrices = {};
        for (const u of UNITS) {
          const n = num(raw?.[u]);
          if (n != null && n > 0) unitPrices[u] = n;
        }
        prices[productId] = unitPrices;
      }
      return { id: String(l.id), name: String(l.name || ''), prices };
    });
  const promos: Promo[] = (Array.isArray(data?.promos) ? data.promos : [])
    .filter((p: any) => p && p.id && (p.kind === 'product' || p.kind === 'order') && Number(p.percent) > 0)
    .map((p: any) => ({
      id: String(p.id),
      name: String(p.name || ''),
      kind: p.kind,
      percent: Math.min(100, Number(p.percent)),
      productId: p.productId ? String(p.productId) : undefined,
      unit: UNITS.includes(p.unit) ? p.unit : undefined,
      minQty: num(p.minQty),
      minTotal: num(p.minTotal),
    }));
  return { priceLists, promos };
};

let memo: Pricing | null = null;

export const pricingService = {
  /** GET /pricing -> phone. Called at sign-in and with every successful sync. */
  download: async (): Promise<Pricing> => {
    const res = await apiClient.get('/pricing', { timeout: 15000 });
    if (!res.data || typeof res.data !== 'object') throw new Error('Bad pricing response');
    const pricing = parsePricing(res.data);
    cacheRepository.set(PRICING_KEY, pricing);
    memo = pricing;
    return pricing;
  },

  get: (): Pricing => {
    if (!memo) memo = cacheRepository.get<Pricing>(PRICING_KEY)?.data || { priceLists: [], promos: [] };
    return memo;
  },

  /** Shop's price list price for the product and unit when there is one, else the product's base price */
  unitPrice: (product: Product, unit: PackagingUnit, priceListId?: string | null): number => {
    if (priceListId) {
      const list = pricingService.get().priceLists.find((l) => l.id === priceListId);
      const price = list?.prices[product.id]?.[unit];
      if (price != null && price > 0) return price;
    }
    return basePrice(product, unit);
  },

  /** Product promotions of one product (catalogue badge) */
  productPromos: (productId: string): Promo[] =>
    pricingService.get().promos.filter((p) => p.kind === 'product' && p.productId === productId),

  /**
   * Promotions that apply to the cart, applied on list prices:
   * - product promo: percent off all lines of its product when the line in promo.unit holds >= minQty
   *   (no unit set: all lines of the product together); several promos of one product add up;
   * - order promo: percent off the items total when it is >= minTotal; only the best one.
   */
  applyPromos: (items: CartItem[], promos: Promo[] = pricingService.get().promos): PromoLine[] => {
    const lines: PromoLine[] = [];
    const itemsTotal = items.reduce((s, i) => s + i.totalPrice, 0);

    const percentUsed = new Map<string, number>(); // productId -> percent so far (never above 100)
    for (const p of promos) {
      if (p.kind !== 'product' || !p.productId) continue;
      const productLines = items.filter((i) => i.product.id === p.productId);
      if (productLines.length === 0) continue;
      const qty = productLines.filter((i) => !p.unit || i.unit === p.unit).reduce((s, i) => s + i.quantity, 0);
      if (qty <= 0 || qty < (p.minQty || 0)) continue;
      const used = percentUsed.get(p.productId) || 0;
      const percent = Math.min(p.percent, 100 - used);
      if (percent <= 0) continue;
      percentUsed.set(p.productId, used + percent);
      const base = productLines.reduce((s, i) => s + i.totalPrice, 0);
      const amount = Math.round((base * percent) / 100);
      if (amount > 0) lines.push({ id: p.id, name: p.name, amount, percent, kind: 'product' });
    }

    let best: PromoLine | null = null;
    for (const p of promos) {
      if (p.kind !== 'order' || itemsTotal <= 0 || itemsTotal < (p.minTotal || 0)) continue;
      const amount = Math.round((itemsTotal * p.percent) / 100);
      if (amount > 0 && (!best || amount > best.amount)) best = { id: p.id, name: p.name, amount, percent: p.percent, kind: 'order' };
    }
    if (best) lines.push(best);
    return lines;
  },
};
