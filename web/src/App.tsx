import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { InvoiceModal } from './components/InvoiceModal';
import { useLanguage } from './context/LanguageContext';
import {
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
} from './data/mockData';
import { Order, OrderStatus, Product } from './types';

const API = 'http://localhost:3000/api/v1';

export default function App() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<NavPage>('dashboard');

  // Application Data States (Clean 0 start)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [debt, setDebt] = useState({ total: 0, count: 0 });
  const categories = INITIAL_CATEGORIES;

  // Modals state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Live polling of orders and shop debts synced from the mobile app
  useEffect(() => {
    let isMounted = true;

    const fetchServerData = async () => {
      try {
        const [ordersRes, debtsRes] = await Promise.all([
          fetch(`${API}/orders`).then((r) => r.json()),
          fetch(`${API}/debts`).then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (ordersRes && Array.isArray(ordersRes.orders)) {
          setOrders(ordersRes.orders);
        }

        if (debtsRes && typeof debtsRes.totalDebt === 'number') {
          setDebt({ total: debtsRes.totalDebt, count: debtsRes.count });
        }
      } catch {
        // Keep the last known data until the next poll succeeds
      }
    };

    fetchServerData();
    const interval = setInterval(fetchServerData, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleResetData = async () => {
    if (!window.confirm('Barcha buyurtma va qarzlarni 0 ga tushirishni tasdiqlaysizmi?')) {
      return;
    }
    try {
      await fetch(`${API}/reset`, { method: 'POST' });
    } catch (e) {
      console.warn('Reset server call failed:', e);
    }
    setOrders([]);
    setDebt({ total: 0, count: 0 });
  };

  // Handlers
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (invoiceOrder && invoiceOrder.id === orderId) {
      setInvoiceOrder({ ...invoiceOrder, status: newStatus });
    }
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockDona: newStock } : p))
    );
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'new').length;

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: t('dash_title'), sub: t('dash_sub') };
      case 'orders':
        return { title: t('orders_title'), sub: t('orders_sub') };
      case 'products':
        return { title: t('products_title'), sub: t('products_sub') };
      case 'clients':
        return { title: t('clients_title'), sub: t('clients_sub') };
      case 'reports':
        return { title: t('reports_title'), sub: t('reports_sub') };
      case 'settings':
        return { title: t('settings_title'), sub: t('settings_sub') };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc]">
        <Header title={pageInfo.title} subtitle={pageInfo.sub} />

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {activePage === 'dashboard' && (
            <Dashboard
              orders={orders}
              totalDebt={debt.total}
              debtorsCount={debt.count}
              onViewOrder={setInvoiceOrder}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'orders' && (
            <Orders orders={orders} onViewOrder={setInvoiceOrder} />
          )}

          {activePage === 'products' && (
            <Products
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activePage === 'clients' && <Clients />}

          {activePage === 'reports' && <Reports orders={orders} />}

          {activePage === 'settings' && <Settings onResetData={handleResetData} />}
        </main>
      </div>

      {/* Modals */}
      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
