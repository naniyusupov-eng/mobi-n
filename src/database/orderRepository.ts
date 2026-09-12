import { getDatabase } from './db';
import { Order, OrderItem, PaymentMethod, OrderStatus } from '../types';
import { shopRepository } from './shopRepository';
import { productRepository } from './productRepository';

export const orderRepository = {
  create: (data: {
    shopId: string;
    shopName: string;
    agentId: string;
    agentName: string;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paymentMethod: PaymentMethod;
    deliveryDate?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      unit: 'dona' | 'blok' | 'korobka' | 'kg';
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      itemsPerBlock: number;
      itemsPerBox: number;
    }>;
  }): Order => {
    const db = getDatabase();
    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const status: OrderStatus = 'confirmed';

    // Format notes with delivery date if present
    let finalNotes = data.notes || '';
    if (data.deliveryDate) {
      finalNotes = finalNotes ? `${finalNotes} (Yetkazish: ${data.deliveryDate})` : `Yetkazish: ${data.deliveryDate}`;
    }

    // Insert Order inside transaction
    db.runSync(
      `INSERT INTO orders (
        id, shopId, shopName, agentId, agentName,
        totalAmount, discountAmount, finalAmount,
        paymentMethod, status, latitude, longitude,
        notes, createdAt, isSynced
      ) VALUES (
        $id, $shopId, $shopName, $agentId, $agentName,
        $totalAmount, $discountAmount, $finalAmount,
        $paymentMethod, $status, $latitude, $longitude,
        $notes, $createdAt, 0
      )`,
      {
        $id: orderId,
        $shopId: data.shopId,
        $shopName: data.shopName,
        $agentId: data.agentId,
        $agentName: data.agentName,
        $totalAmount: data.totalAmount,
        $discountAmount: data.discountAmount,
        $finalAmount: data.finalAmount,
        $paymentMethod: data.paymentMethod,
        $status: status,
        $latitude: data.latitude || null,
        $longitude: data.longitude || null,
        $notes: finalNotes,
        $createdAt: createdAt,
      }
    );

    // Insert items and decrease stock
    const insertedItems: OrderItem[] = [];
    data.items.forEach((item) => {
      const itemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      db.runSync(
        `INSERT INTO order_items (id, orderId, productId, productName, unit, quantity, unitPrice, totalPrice)
         VALUES ($id, $orderId, $productId, $productName, $unit, $quantity, $unitPrice, $totalPrice)`,
        {
          $id: itemId,
          $orderId: orderId,
          $productId: item.productId,
          $productName: item.productName,
          $unit: item.unit,
          $quantity: item.quantity,
          $unitPrice: item.unitPrice,
          $totalPrice: item.totalPrice,
        }
      );

      insertedItems.push({
        id: itemId,
        orderId,
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });

      // Calculate quantity in "dona" for stock reduction
      let donaEquivalent = item.quantity;
      if (item.unit === 'blok') donaEquivalent = item.quantity * item.itemsPerBlock;
      else if (item.unit === 'korobka') donaEquivalent = item.quantity * item.itemsPerBox;

      productRepository.decreaseStock(item.productId, donaEquivalent);
    });

    // If payment method is 'nasiya' (credit/debt), increase shop's debt
    if (data.paymentMethod === 'nasiya') {
      shopRepository.updateDebt(data.shopId, data.finalAmount);
    }

    // Mark shop visited
    shopRepository.markVisited(data.shopId);

    // Add to sync queue for NestJS
    db.runSync(
      `INSERT INTO sync_queue (id, entityType, entityId, action, payloadJson, status, createdAt)
       VALUES ($id, 'order', $entityId, 'create', $payload, 'pending', $createdAt)`,
      {
        $id: `sync_${Date.now()}`,
        $entityId: orderId,
        $payload: JSON.stringify({
          id: orderId,
          ...data,
          status,
          createdAt,
          items: insertedItems,
        }),
        $createdAt: createdAt,
      }
    );

    return {
      id: orderId,
      shopId: data.shopId,
      shopName: data.shopName,
      agentId: data.agentId,
      agentName: data.agentName,
      totalAmount: data.totalAmount,
      discountAmount: data.discountAmount,
      finalAmount: data.finalAmount,
      paymentMethod: data.paymentMethod,
      status,
      latitude: data.latitude,
      longitude: data.longitude,
      notes: finalNotes,
      deliveryDate: data.deliveryDate,
      createdAt,
      isSynced: false,
      items: insertedItems,
    };
  },

  getAll: (shopId?: string): Order[] => {
    const db = getDatabase();
    let query = 'SELECT * FROM orders';
    const params: Record<string, any> = {};

    if (shopId) {
      query += ' WHERE shopId = $shopId';
      params.$shopId = shopId;
    }

    query += ' ORDER BY createdAt DESC';

    const orders = db.getAllSync<any>(query, params);
    return orders.map((o) => ({
      ...o,
      isSynced: Boolean(o.isSynced),
    }));
  },

  getById: (id: string): Order | null => {
    const db = getDatabase();
    const order = db.getFirstSync<any>('SELECT * FROM orders WHERE id = $id', { $id: id });
    if (!order) return null;

    const items = db.getAllSync<OrderItem>('SELECT * FROM order_items WHERE orderId = $id', { $id: id });

    return {
      ...order,
      isSynced: Boolean(order.isSynced),
      items,
    };
  },

  getTodayStats: (agentId?: string): { totalSales: number; orderCount: number; cashCollected: number } => {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let query = `
      SELECT 
        COALESCE(SUM(finalAmount), 0) as totalSales,
        COUNT(*) as orderCount,
        COALESCE(SUM(CASE WHEN paymentMethod = 'naqd' THEN finalAmount ELSE 0 END), 0) as cashCollected
      FROM orders 
      WHERE createdAt LIKE $todayPrefix
    `;
    const params: Record<string, any> = { $todayPrefix: `${today}%` };

    if (agentId) {
      query += ' AND agentId = $agentId';
      params.$agentId = agentId;
    }

    const row = db.getFirstSync<any>(query, params);
    return {
      totalSales: row?.totalSales || 0,
      orderCount: row?.orderCount || 0,
      cashCollected: row?.cashCollected || 0,
    };
  },

  markSynced: (id: string) => {
    const db = getDatabase();
    db.runSync('UPDATE orders SET isSynced = 1 WHERE id = $id', { $id: id });
  },
};
