export type PackagingUnit = 'dona' | 'blok' | 'korobka' | 'kg';

export interface Agent {
  id: string;
  code: string;           // Agent kodi / QR payload (e.g. AGENT-007)
  name: string;           // Ism-familiyasi
  phone: string;          // Telefon raqami
  territory: string;      // Biriktirilgan hudud (e.g. "Chilonzor tumani")
  token: string;          // NestJS JWT token
  avatarUrl?: string;
  loginAt?: string;
  lineCode?: string;      // Liniya (e.g. "4-3"); session comes from the line QR code
  role?: UserRole;        // Line QR has two codes: agent (orders) and driver (delivery, money, PKO)
}

export type UserRole = 'agent' | 'driver';

export interface Category {
  id: string;
  name: string;           // Kategoriya nomi (e.g. "Pechenyelar", "Shokoladlar", "Karamellar", "Vafli")
  iconName?: string;
}

export interface Product {
  id: string;
  code: string;           // Tovar shtrix kodi yoki artukuli (e.g. "QND-101")
  name: string;           // Mahsulot nomi (e.g. "Olvali vafli 250g")
  categoryId: string;
  categoryName?: string;
  description?: string;
  // Narxlar turli qadoqlarga ko'ra:
  priceDona: number;      // 1 dona narxi
  priceBlok: number;      // 1 blok narxi
  priceKorobka: number;   // 1 korobka narxi
  priceKg: number;        // 1 kg narxi
  itemsPerBlock: number;  // 1 blokda nechta dona bor (e.g. 10)
  itemsPerBox: number;    // 1 korobkada nechta dona/blok bor (e.g. 40)
  stockDona: number;      // Ombordagi qoldiq (dona hisobida)
  imageUrl?: string;
}

export interface Shop {
  id: string;
  name: string;           // Do'kon nomi (e.g. "Oqtepa Market", "Afrosiyob Baqqollik")
  ownerName: string;      // Do'kon egasi / sotuvchi
  phone: string;          // Bog'lanish telefoni
  address: string;        // Do'kon manzili
  latitude?: number;      // GPS kenglik
  longitude?: number;     // GPS uzunlik
  debtBalance: number;    // Oldingi qarzdorlik (so'mda)
  visitDay: string;       // Qaysi kunlari boriladi (e.g. "Dushanba", "Barchasi")
  lastVisitedAt?: string;
  createdAt: string;
  isSynced: boolean;      // Serverga yuborilganmi
  lineCode?: string;      // Liniya (e.g. "4-3")
  routeDay?: number;      // Hafta kuni: 1 = Dushanba ... 6 = Shanba (marshrut 4-3-1)
  num?: number;           // Doʻkonning marshrutdagi raqami
  notes?: string;         // e.g. "Стелаж"
  // Credit control (from GET /clients)
  creditLimit?: number;        // 0 = no limit
  debtSince?: string | null;   // ISO, when the current debt started
  debtDays?: number | null;    // Debt age in days
  overLimit?: boolean;
  overdue?: boolean;
  creditBlocked?: boolean;     // Nasiya not allowed
  creditLeft?: number | null;  // Limit minus debt (null = no limit)
  priceListId?: string | null; // Narx roʻyxati (GET /clients); none = base product prices
}

export type PaymentMethod = 'naqd' | 'nasiya' | 'otkazma';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
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
  agentId: string;
  agentName: string;
  totalAmount: number;    // Mahsulotlarning jami narxi
  discountAmount: number; // Chegirma summasi
  finalAmount: number;    // To'lanishi kerak bo'lgan summa
  paymentMethod: PaymentMethod; // To'lov turi (naqd / nasiya / o'tkazma)
  status: OrderStatus;
  latitude?: number;
  longitude?: number;
  notes?: string;
  deliveryDate?: string;  // Yetkazish sanasi (e.g. 2026-09-13)
  createdAt: string;
  isSynced: boolean;
  items?: OrderItem[];
  promos?: AppliedPromo[]; // Aksiyalar (already included in discountAmount)
}

/** Price per packaging unit in one price list; a missing unit falls back to the product price */
export type UnitPrices = Partial<Record<PackagingUnit, number>>;

export interface PriceList {
  id: string;
  name: string;
  prices: Record<string, UnitPrices>; // productId -> prices
}

/** Today's active promotion for the line (GET /pricing) */
export interface Promo {
  id: string;
  name: string;
  kind: 'product' | 'order';
  percent: number;
  productId?: string;
  unit?: PackagingUnit;
  minQty?: number;
  minTotal?: number;
}

export interface Pricing {
  priceLists: PriceList[];
  promos: Promo[];
}

/** A promotion applied to a cart / order and the money it took off */
export interface AppliedPromo {
  id: string;
  name: string;
  amount: number;
}

export interface CartItem {
  product: Product;
  unit: PackagingUnit;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'order' | 'shop' | 'payment' | 'delivery' | 'return';
  entityId: string; // for 'delivery' and 'return': the order id
  action: 'create' | 'update' | 'deliver' | 'undeliver';
  payloadJson: string;
  status: 'pending' | 'failed' | 'synced';
  attempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
}
