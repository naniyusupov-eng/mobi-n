import { create } from 'zustand';
import { CartItem, PackagingUnit, PaymentMethod, Product, Shop, Order } from '../types';
import { orderRepository } from '../database/orderRepository';
import { productRepository } from '../database/productRepository';
import { shopRepository } from '../database/shopRepository';
import { PromoLine, pricingService } from '../services/pricingService';
import { useDateStore } from './dateStore';
import { useLanguageStore } from './languageStore';
import { pick } from '../i18n/tri';
import { Alert } from 'react-native';

/** How many dona one unit takes from the warehouse stock; 0 = not counted (kg) */
export const donaPerUnit = (product: Product, unit: PackagingUnit): number => {
  switch (unit) {
    case 'dona':
      return 1;
    case 'blok':
      return Math.max(1, product.itemsPerBlock || 1);
    case 'korobka':
      return Math.max(1, product.itemsPerBox || 1);
    default:
      return 0;
  }
};

const showStockAlert = (stock: number) => {
  const lang = useLanguageStore.getState().lang;
  const n = String(Math.max(0, stock));
  const text =
    stock > 0
      ? pick({ uz: `Omborda faqat ${n} dona qoldi`, uz_cyrl: `Омборда фақат ${n} дона қолди`, ru: `На складе осталось только ${n} шт` }, lang)
      : pick({ uz: 'Omborda qolmagan', uz_cyrl: 'Омборда қолмаган', ru: 'На складе нет остатка' }, lang);
  Alert.alert(pick({ uz: 'Qoldiq yetarli emas', uz_cyrl: 'Қолдиқ етарли эмас', ru: 'Недостаточно остатка' }, lang), text);
};

/**
 * Caps the wanted quantity of one product/unit line to the known warehouse stock,
 * counting what the cart already holds in the other units. Shows an alert when capped.
 */
const capToStock = (items: CartItem[], product: Product, unit: PackagingUnit, wanted: number): number => {
  const perUnit = donaPerUnit(product, unit);
  if (perUnit === 0 || wanted <= 0) return wanted;
  // The catalogue on the phone is the freshest figure (orders made today already lowered it)
  const fresh = productRepository.getById(product.id) || product;
  const stock = Number(fresh.stockDona);
  if (!Number.isFinite(stock)) return wanted; // stock unknown: no limit
  const usedByOtherUnits = items
    .filter((i) => i.product.id === product.id && i.unit !== unit)
    .reduce((sum, i) => sum + i.quantity * donaPerUnit(fresh, i.unit), 0);
  const maxQty = Math.max(0, Math.floor((stock - usedByOtherUnits) / perUnit));
  if (wanted > maxQty) {
    showStockAlert(stock);
    return maxQty;
  }
  return wanted;
};

interface CartState {
  shop: Shop | null;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountPercent: number;
  deliveryDate: string;
  notes: string;

  setShop: (shop: Shop | null) => void;
  /** Prices of the cart lines again from the shop's price list (after a shop change or a sync) */
  reprice: () => void;
  addItem: (product: Product, unit: PackagingUnit, quantity?: number) => void;
  updateQuantity: (productId: string, unit: PackagingUnit, delta: number) => void;
  setQuantity: (productId: string, unit: PackagingUnit, quantity: number) => void;
  removeItem: (productId: string, unit: PackagingUnit) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscountPercent: (percent: number) => void;
  setDeliveryDate: (date: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Calculators
  getTotalAmount: () => number;
  /** The agent's own discount (discountPercent) */
  getManualDiscount: () => number;
  /** Promotions that apply to the cart right now */
  getPromoLines: () => PromoLine[];
  /** Manual discount + promotions */
  getDiscountAmount: () => number;
  getFinalAmount: () => number;
  getItemCount: () => number;

  // Submit
  submitOrder: (agentId: string, agentName: string, coords?: { latitude?: number; longitude?: number }) => Order | null;
}

const getWorkingDate = () => useDateStore.getState().workingDate;

/** The shop's price list as stored on the phone (refreshed with the shops), else what the cart holds */
const priceListOf = (shop: Shop | null): string | null =>
  shop ? (shopRepository.getById(shop.id)?.priceListId ?? shop.priceListId ?? null) : null;

/** Unit price for the cart's shop: its price list price when there is one, else the product's price */
export const getUnitPrice = (product: Product, unit: PackagingUnit, shop: Shop | null): number =>
  pricingService.unitPrice(product, unit, priceListOf(shop));

const repriceItems = (items: CartItem[], shop: Shop | null): CartItem[] => {
  const priceListId = priceListOf(shop);
  return items.map((item) => {
    const unitPrice = pricingService.unitPrice(item.product, item.unit, priceListId);
    return unitPrice === item.unitPrice ? item : { ...item, unitPrice, totalPrice: item.quantity * unitPrice };
  });
};

export const useCartStore = create<CartState>((set, get) => ({
  shop: null,
  items: [],
  paymentMethod: 'naqd',
  discountPercent: 0,
  deliveryDate: getWorkingDate(),
  notes: '',

  setDeliveryDate: (deliveryDate: string) => set({ deliveryDate }),

  setShop: (shop) => {
    // If selecting a different shop, reset cart items
    const current = get().shop;
    if (current && shop && current.id !== shop.id) {
      set({ shop, items: [], discountPercent: 0, notes: '', paymentMethod: 'naqd', deliveryDate: getWorkingDate() });
    } else {
      // Same shop again (fresh data) or the first shop for a cart: prices follow its price list
      set({ shop, items: repriceItems(get().items, shop) });
    }
  },

  reprice: () => {
    const { items, shop } = get();
    if (items.length > 0) set({ items: repriceItems(items, shop) });
  },

  addItem: (product, unit, quantity = 1) => {
    const { items } = get();
    const unitPrice = getUnitPrice(product, unit, get().shop);
    const existingIndex = items.findIndex(
      (item) => item.product.id === product.id && item.unit === unit
    );

    const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const newQty = capToStock(items, product, unit, currentQty + quantity);
    if (newQty <= currentQty) {
      return; // nothing more fits in the stock
    }

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        totalPrice: newQty * unitPrice,
      };
      set({ items: updated });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            unit,
            quantity: newQty,
            unitPrice,
            totalPrice: newQty * unitPrice,
          },
        ],
      });
    }
  },

  updateQuantity: (productId, unit, delta) => {
    const { items } = get();
    const updated = items
      .map((item) => {
        if (item.product.id === productId && item.unit === unit) {
          const wanted = item.quantity + delta;
          if (wanted <= 0) return null;
          const newQty = delta > 0 ? capToStock(items, item.product, unit, wanted) : wanted;
          if (newQty <= 0) return null;
          if (newQty === item.quantity) return item;
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    set({ items: updated });
  },

  setQuantity: (productId, unit, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      get().removeItem(productId, unit);
      return;
    }

    const existing = items.find((item) => item.product.id === productId && item.unit === unit);
    if (!existing) return;
    const capped = quantity > existing.quantity ? capToStock(items, existing.product, unit, quantity) : quantity;
    if (capped <= 0) {
      get().removeItem(productId, unit);
      return;
    }

    const updated = items.map((item) => {
      if (item === existing) {
        return {
          ...item,
          quantity: capped,
          totalPrice: capped * item.unitPrice,
        };
      }
      return item;
    });

    set({ items: updated });
  },

  removeItem: (productId, unit) => {
    set({
      items: get().items.filter(
        (item) => !(item.product.id === productId && item.unit === unit)
      ),
    });
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDiscountPercent: (percent) => set({ discountPercent: Math.max(0, Math.min(100, percent)) }),
  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      discountPercent: 0,
      notes: '',
      paymentMethod: 'naqd',
      deliveryDate: getWorkingDate(),
    }),

  getTotalAmount: () => {
    return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getManualDiscount: () => {
    const total = get().getTotalAmount();
    const percent = get().discountPercent;
    return Math.round((total * percent) / 100);
  },

  getPromoLines: () => pricingService.applyPromos(get().items),

  // Items keep their list prices; manual discount and promotions together make the order's discount
  getDiscountAmount: () => {
    const total = get().getTotalAmount();
    const promos = get().getPromoLines().reduce((s, p) => s + p.amount, 0);
    return Math.min(total, get().getManualDiscount() + promos);
  },

  getFinalAmount: () => {
    const total = get().getTotalAmount();
    const discount = get().getDiscountAmount();
    return Math.max(0, total - discount);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  submitOrder: (agentId, agentName, coords) => {
    const { shop, items, paymentMethod, discountPercent, deliveryDate, notes } = get();
    if (!shop || items.length === 0) return null;

    const totalAmount = get().getTotalAmount();
    const discountAmount = get().getDiscountAmount();
    const finalAmount = get().getFinalAmount();
    const promos = get()
      .getPromoLines()
      .map((p) => ({ id: p.id, name: p.name, amount: p.amount }));

    const order = orderRepository.create({
      shopId: shop.id,
      shopName: shop.name,
      agentId,
      agentName,
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod,
      deliveryDate,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      notes,
      promos,
      items: items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        itemsPerBlock: i.product.itemsPerBlock,
        itemsPerBox: i.product.itemsPerBox,
      })),
    });

    // Reset cart after creation
    get().clearCart();
    return order;
  },
}));
