import { create } from 'zustand';
import { CartItem, PackagingUnit, PaymentMethod, Product, Shop, Order } from '../types';
import { orderRepository } from '../database/orderRepository';
import { useDateStore } from './dateStore';

interface CartState {
  shop: Shop | null;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountPercent: number;
  deliveryDate: string;
  notes: string;

  setShop: (shop: Shop | null) => void;
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
  getDiscountAmount: () => number;
  getFinalAmount: () => number;
  getItemCount: () => number;

  // Submit
  submitOrder: (agentId: string, agentName: string, coords?: { latitude?: number; longitude?: number }) => Order | null;
}

const getWorkingDate = () => useDateStore.getState().workingDate;

const getUnitPrice = (product: Product, unit: PackagingUnit): number => {
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
      set({ shop });
    }
  },

  addItem: (product, unit, quantity = 1) => {
    const { items } = get();
    const unitPrice = getUnitPrice(product, unit);
    const existingIndex = items.findIndex(
      (item) => item.product.id === product.id && item.unit === unit
    );

    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + quantity;
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
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
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
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
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

    const updated = items.map((item) => {
      if (item.product.id === productId && item.unit === unit) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice,
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

  getDiscountAmount: () => {
    const total = get().getTotalAmount();
    const percent = get().discountPercent;
    return Math.round((total * percent) / 100);
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
