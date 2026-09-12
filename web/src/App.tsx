import React, { useState, useEffect } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Agents } from './pages/Agents';
import { Products } from './pages/Products';
import { Shops } from './pages/Shops';
import { Reports } from './pages/Reports';
import { QRBadgeModal } from './components/QRBadgeModal';
import { InvoiceModal } from './components/InvoiceModal';
import { useLanguage } from './context/LanguageContext';
import {
  INITIAL_ORDERS,
  INITIAL_AGENTS,
  INITIAL_PRODUCTS,
  INITIAL_SHOPS,
  INITIAL_CATEGORIES,
} from './data/mockData';
import { Agent, Order, OrderStatus, Product, Shop } from './types';

export default function App() {
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState<NavPage>('dashboard');

  // Application Data States (Clean 0 start)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const categories = INITIAL_CATEGORIES;

  const [isServerConnected, setIsServerConnected] = useState(false);

  // Modals state
  const [qrBadgeAgent, setQrBadgeAgent] = useState<Agent | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Live polling from Mobi_R Sync Server (port 3000)
  useEffect(() => {
    let isMounted = true;

    const fetchServerData = async () => {
      try {
        const [ordersRes, shopsRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/orders').then((r) => r.json()),
          fetch('http://localhost:3000/api/v1/shops').then((r) => r.json()),
        ]);

        if (!isMounted) return;

        setIsServerConnected(true);

        if (ordersRes && Array.isArray(ordersRes.orders)) {
          setOrders(ordersRes.orders);

          // Dynamically compute agent stats based on real synced orders
          setAgents((prevAgents) =>
            prevAgents.map((ag) => {
              const agentOrders = ordersRes.orders.filter((o: Order) => o.agentId === ag.id);
              const totalSales = agentOrders.reduce((sum: number, o: Order) => sum + (o.finalAmount || 0), 0);
              return {
                ...ag,
                ordersCount: agentOrders.length,
                totalSales,
              };
            })
          );
        }

        if (shopsRes && Array.isArray(shopsRes.shops)) {
          setShops(shopsRes.shops);
        }
      } catch {
        if (isMounted) {
          setIsServerConnected(false);
        }
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
      await fetch('http://localhost:3000/api/v1/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Reset server call failed:', e);
    }
    setOrders([]);
    setShops((prev) => prev.map((s) => ({ ...s, debtBalance: 0 })));
    setAgents((prev) => prev.map((a) => ({ ...a, ordersCount: 0, totalSales: 0 })));
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

  const handleAddAgent = (newAgent: Agent) => {
    setAgents((prev) => [newAgent, ...prev]);
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockDona: newStock } : p))
    );
  };

  const handleAddShop = (newShop: Shop) => {
    setShops((prev) => [newShop, ...prev]);
  };

  const handleRecordPayment = (shopId: string, amount: number) => {
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId ? { ...s, debtBalance: Math.max(0, s.debtBalance - amount) } : s
      )
    );
  };

  const pendingOrdersCount = orders.filter((o) => o.status === 'new').length;
  const totalTodaySales = orders.reduce((sum, o) => sum + o.finalAmount, 0);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: t('dash_title'), sub: t('dash_sub') };
      case 'orders':
        return { title: t('orders_title'), sub: t('orders_sub') };
      case 'agents':
        return { title: t('agents_title'), sub: t('agents_sub') };
      case 'products':
        return { title: t('products_title'), sub: t('products_sub') };
      case 'shops':
        return { title: t('shops_title'), sub: t('shops_sub') };
      case 'reports':
        return { title: t('reports_title'), sub: t('reports_sub') };
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
        <Header
          title={pageInfo.title}
          subtitle={pageInfo.sub}
          totalTodaySales={totalTodaySales}
          activeAgentsCount={agents.length}
          isServerConnected={isServerConnected}
          onResetData={handleResetData}
        />

        <main className="flex-1 overflow-y-auto p-5 md:p-6">
          {activePage === 'dashboard' && (
            <Dashboard
              orders={orders}
              agents={agents}
              shops={shops}
              products={products}
              onViewOrder={setInvoiceOrder}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'orders' && (
            <Orders orders={orders} onViewOrder={setInvoiceOrder} />
          )}

          {activePage === 'agents' && (
            <Agents
              agents={agents}
              onOpenQRBadge={setQrBadgeAgent}
              onAddAgent={handleAddAgent}
            />
          )}

          {activePage === 'products' && (
            <Products
              products={products}
              categories={categories}
              onAddProduct={handleAddProduct}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activePage === 'shops' && (
            <Shops
              shops={shops}
              onAddShop={handleAddShop}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activePage === 'reports' && (
            <Reports
              orders={orders}
              agents={agents}
              products={products}
              shops={shops}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <QRBadgeModal
        agent={qrBadgeAgent}
        onClose={() => setQrBadgeAgent(null)}
      />

      <InvoiceModal
        order={invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
