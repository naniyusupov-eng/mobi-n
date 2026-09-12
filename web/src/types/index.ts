export type PackagingUnit = 'dona' | 'blok' | 'korobka' | 'kg';

export interface Agent {
  id: string;
  code: string;
  name: string;
  phone: string;
  territory: string;
  avatarUrl?: string;
  ordersCount: number;
  totalSales: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

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

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  debtBalance: number;
  visitDay: string;
  lastOrderDate?: string;
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
}
