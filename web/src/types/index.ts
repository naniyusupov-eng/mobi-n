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
}
