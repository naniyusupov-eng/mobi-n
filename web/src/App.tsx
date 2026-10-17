import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage, PAGE_TITLES } from './components/Sidebar';
import { Header, SearchPick } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';
import { Reports } from './pages/Reports';
import { Lines } from './pages/Lines';
import { Clients } from './pages/Clients';
import { Settings } from './pages/Settings';
import { InvoiceModal } from './components/InvoiceModal';
import { INITIAL_ORDERS, INITIAL_CATEGORIES } from './data/mockData';
import { CompanySettings, Order, OrderStatus, Product } from './types';
import { COMMON, useL } from './i18n/tri';

const API = 'http://localhost:3000/api/v1';

/** Current page plus optional parameters (e.g. the route to open on the Clients page) */
export interface AppRoute {
  page: NavPage;
  line?: string;
  day?: number;
  shopId?: string;
}

export default function App() {
  const L = useL();
  const [route, setRoute] = useState<AppRoute>({ page: 'dashboard' });
  const navigate = (page: NavPage, params: Omit<AppRoute, 'page'> = {}) => setRoute({ page, ...params });

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [products, setProducts] = useState<Product[]>([]);
  const [debt, setDebt] = useState({ total: 0, count: 0 });
  const [company, setCompany] = useState<CompanySettings>({});
  const categories = INITIAL_CATEGORIES;
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Live polling of orders, shop debts and warehouse stock (orders and returns change stock)
  useEffect(() => {
    let isMounted = true;
    const fetchServerData = async () => {
      try {
        const [ordersRes, debtsRes, productsRes] = await Promise.all([
          fetch(`${API}/orders`).then((r) => r.json()),
          fetch(`${API}/debts`).then((r) => r.json()),
          fetch(`${API}/products`).then((r) => r.json()),
        ]);
        if (!isMounted) return;
        if (ordersRes && Array.isArray(ordersRes.orders)) setOrders(ordersRes.orders);
        if (debtsRes && typeof debtsRes.totalDebt === 'number') setDebt({ total: debtsRes.totalDebt, count: debtsRes.count });
        if (productsRes && Array.isArray(productsRes.products)) setProducts(productsRes.products);
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

  // Company requisites for invoices, edited on the Settings page
  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((d) => setCompany(d.settings || {}))
      .catch(() => {});
  }, []);

  const postJson = async (path: string, body: unknown) => {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  const handleSaveCompany = async (next: CompanySettings) => {
    const d = await postJson('/settings', next);
    setCompany(d.settings || next);
  };

  // Status is saved on the server, otherwise the next poll would bring the old one back
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    setInvoiceOrder((cur) => (cur && cur.id === orderId ? { ...cur, status: newStatus } : cur));
    try {
      await postJson(`/orders/${orderId}/status`, { status: newStatus });
    } catch (e) {
      console.warn('Status save failed:', e);
    }
  };

  // After a return the order (returned amount), stock and debts change on the server
  const handleReturnSaved = (order: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...order } : o)));
    setInvoiceOrder((cur) => (cur && cur.id === order.id ? { ...cur, ...order } : cur));
  };

  const handleAddProduct = async (newProd: Product) => {
    const data = await postJson('/products', newProd);
    setProducts(data.products);
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    const data = await postJson(`/products/${productId}/stock`, { stockDona: newStock });
    setProducts(data.products);
  };

  const handleSearchPick = (p: SearchPick) => {
    if (p.kind === 'order') setInvoiceOrder(p.order);
    else navigate('clients', { line: p.client.lineCode, day: p.client.day, shopId: p.client.id });
  };

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const page = route.page;

  return (
    <div className="flex h-screen bg-canvas text-ink-900 overflow-hidden">
      <Sidebar activePage={page} onPageChange={(p) => navigate(p)} newOrdersCount={newOrdersCount} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={L(PAGE_TITLES[page])}
          orders={orders}
          newOrdersCount={newOrdersCount}
          onPick={handleSearchPick}
          onBell={() => {
            // New orders live on the main page, under today's figures
            navigate('dashboard');
            window.setTimeout(() => document.getElementById('orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }}
        />

        <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] px-5 lg:px-8 pt-4 pb-10">
          {page === 'dashboard' && (
            <div className="space-y-6">
              <Dashboard orders={orders} totalDebt={debt.total} debtorsCount={debt.count} />
              <section id="orders" className="space-y-3 scroll-mt-4">
                <h2 className="px-1 text-[19px] font-bold tracking-tight text-ink-900">{L(COMMON.orders)}</h2>
                <Orders orders={orders} onViewOrder={setInvoiceOrder} />
              </section>
            </div>
          )}
          {page === 'lines' && <Lines onOpenRoute={(line, day) => navigate('clients', { line, day })} />}
          {page === 'clients' && (
            <Clients
              key={`${route.line}-${route.day}-${route.shopId}`}
              initialRoute={route.line && route.day ? { line: route.line, day: route.day } : null}
              highlightShopId={route.shopId}
            />
          )}
          {page === 'products' && (
            <Products products={products} categories={categories} onAddProduct={handleAddProduct} onUpdateStock={handleUpdateStock} />
          )}
          {page === 'reports' && <Reports orders={orders} company={company} onViewOrder={setInvoiceOrder} />}
          {page === 'settings' && <Settings company={company} onSaveCompany={handleSaveCompany} />}
        </main>
      </div>

      <InvoiceModal
        order={invoiceOrder}
        company={company}
        onClose={() => setInvoiceOrder(null)}
        onStatusChange={handleStatusChange}
        onReturnSaved={handleReturnSaved}
      />
    </div>
  );
}
