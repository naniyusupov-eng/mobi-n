import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart3,
  MapPinned,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type NavPage = 'dashboard' | 'orders' | 'products' | 'clients' | 'reports' | 'settings';

interface SidebarProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  pendingOrdersCount: number;
}

interface MenuItem {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  pendingOrdersCount,
}) => {
  const { t } = useLanguage();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'orders', label: t('nav_orders'), icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'products', label: t('nav_products'), icon: Package },
    { id: 'clients', label: t('nav_clients'), icon: MapPinned },
    { id: 'reports', label: t('nav_reports'), icon: BarChart3 },
  ];

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onPageChange(item.id)}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition ${
          isActive
            ? 'bg-sky-50 text-sky-900 font-medium border-r-2 border-sky-600'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-normal'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 stroke-[1.6] ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
          <span>{item.label}</span>
        </div>
        {Boolean(item.badge) && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
              isActive ? 'bg-sky-100 text-sky-800 font-medium' : 'bg-slate-100 text-slate-600 font-normal'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-60 bg-white text-slate-700 flex flex-col shrink-0 border-r border-slate-200/70 no-print select-none">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md overflow-hidden border border-sky-100 shrink-0 bg-white flex items-center justify-center p-0.5 shadow-2xs">
          <img src="/logo.jpg" alt="Mobi_R" className="w-full h-full object-cover rounded-xs" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs font-semibold text-slate-900 tracking-tight leading-none truncate">Mobi_R</h1>
          <span className="text-[10px] text-slate-400 font-normal block mt-0.5 truncate">Savdo Boshqaruvi</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider px-2.5 py-1.5 font-normal">
          {t('nav_section')}
        </div>
        {menuItems.map(renderItem)}
      </nav>

      {/* Settings */}
      <div className="p-2.5 border-t border-slate-100">
        {renderItem({ id: 'settings', label: t('nav_settings'), icon: Settings })}
      </div>
    </aside>
  );
};
