export type PackagingUnit = 'dona' | 'blok' | 'korobka' | 'kg';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description?: string;
  priceDona: number;
  priceBlok: number;
  priceKorobka: number;
  priceKg: number;
  itemsPerBlock: number;
  itemsPerBox: number;
  stockDona: number;
  minStock?: number; // low-stock alert threshold, dona
}

// Goods arrived at the warehouse (kirim)
export interface ReceiptItem {
  productId: string;
  productName: string;
  unit: 'dona' | 'blok' | 'korobka';
  quantity: number;
  cost: number; // per unit
  total: number;
}

export interface Receipt {
  id: string;
  supplier: string;
  note: string;
  items: ReceiptItem[];
  total: number;
  createdAt: string;
}

export type StockMoveType = 'receipt' | 'receipt-undo' | 'sale' | 'return' | 'return-undo' | 'cancel' | 'uncancel' | 'adjust';

export interface StockMove {
  id: string;
  productId: string;
  productName: string;
  type: StockMoveType;
  deltaDona: number; // signed
  stockAfter: number;
  ref?: string;
  note?: string;
  createdAt: string;
}

export type PaymentMethod = 'naqd' | 'nasiya' | 'otkazma';

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  unit: PackagingUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  shopAddress: string;
  agentId: string;
  agentName: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  deliveryDate?: string;
  createdAt: string;
  items: OrderItem[];
  // Route of the order's shop, added by the server for reports
  lineCode?: string;
  routeDay?: number;
  shopNum?: number;
  returnedAmount?: number; // value of goods brought back (vozvrat)
}

// Goods brought back by the delivery driver; counted against the day the order was taken
export interface ReturnItem {
  productId: string;
  productName: string;
  unit: PackagingUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  shopId: string;
  shopName: string;
  lineCode: string | null;
  routeDay: number | null;
  salesDate: string; // YYYY-MM-DD
  reason: string;
  items: ReturnItem[];
  total: number;
  createdAt: string;
}

export interface DayStats {
  orders: number;
  gross: number;
  returns: number;
  net: number;
}

export interface LineMonthStats {
  code: string;
  days: Record<string, DayStats>; // key: YYYY-MM-DD
  totals: DayStats;
  streak: { current: number; best: number; lastReturnDate: string | null };
}

// Company requisites printed on invoices (Settings page)
export interface CompanySettings {
  companyName?: string;
  address?: string;
  phone?: string;
  inn?: string;
  bankAccount?: string;
  bankMfo?: string;
  bonusStreakDays?: number; // days in a row without returns that earn a bonus
  bonusAmount?: number;
  creditLimitDefault?: number; // soʻm, 0 = no limit
  debtMaxDays?: number; // days, 0 = no limit (server default 14)
}

// Liniya, masalan '4-3'. QR kod liniyaniki: istalgan agent skanerlab shu liniyaga ulanadi.
export interface Line {
  id: string;
  code: string;
}

// 1 = Dushanba ... 6 = Shanba. Marshrut kodi: `${lineCode}-${day}`, masalan 4-3-1.
export type RouteDay = 1 | 2 | 3 | 4 | 5 | 6;

export interface Client {
  id: string;
  num?: number; // do'kon raqami (Yandex xaritadagi №)
  debtBalance?: number; // nasiya qarzi, so'm
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  lineCode?: string;
  day?: RouteDay;
  notes?: string;
  // Credit control, computed by the server
  creditLimit?: number; // effective limit, 0 = no limit
  debtSince?: string | null;
  debtDays?: number | null;
  overLimit?: boolean;
  overdue?: boolean;
  creditBlocked?: boolean;
  creditLeft?: number | null; // null when no limit
}
