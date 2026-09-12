import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Store,
  BarChart3,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type NavPage = 'dashboard' | 'orders' | 'agents' | 'products' | 'shops' | 'reports';

interface SidebarProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  pendingOrdersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onPageChange,
  pendingOrdersCount,
}) => {
  const { t } = useLanguage();

  const menuItems: { id: NavPage; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'orders', label: t('nav_orders'), icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'agents', label: t('nav_agents'), icon: Users },
    { id: 'products', label: t('nav_products'), icon: Package },
    { id: 'shops', label: t('nav_shops'), icon: Store },
    { id: 'reports', label: t('nav_reports'), icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-[#090d16] text-slate-200 flex flex-col shrink-0 border-r border-slate-800/80 no-print">
      {/* Brand Header with Logo */}
      <div className="p-4 border-b border-slate-800/90 flex items-center gap-3 bg-[#05080f]">
        <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-700/80 shrink-0 bg-white flex items-center justify-center p-0.5 shadow-xs">
          <img src="/logo.jpg" alt="Mobi_R Logo" className="w-full h-full object-cover rounded" />
        </div>
        <div>
          <h1 className="font-display font-black text-sm tracking-wider text-white leading-none">
            MOBI_R
          </h1>
          <span className="text-[10px] font-extrabold text-amber-400 tracking-widest uppercase mt-1 block">
            QANDOLAT TRADE
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 mb-1">
          {t('nav_section')}
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-semibold text-xs tracking-wide transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {Boolean(item.badge) && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3.5 border-t border-slate-800/90 bg-[#060a12] text-xs text-slate-400">
        <div className="flex items-center justify-between font-medium">
          <span className="text-[11px] text-slate-400">{t('system_status')}</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('server_active')}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1 font-mono">{t('version')}</div>
      </div>
    </aside>
  );
};
