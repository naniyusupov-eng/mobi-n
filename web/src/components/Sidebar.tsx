import React from 'react';
import clsx from 'clsx';
import {
  Home,
  Route,
  Store,
  Package,
  PieChart,
  Settings,
  LucideIcon,
} from 'lucide-react';
import { Tri, useL } from '../i18n/tri';

export type NavPage = 'dashboard' | 'lines' | 'clients' | 'products' | 'reports' | 'settings';

export const PAGE_TITLES: Record<NavPage, Tri> = {
  dashboard: { uz: 'Asosiy', uz_cyrl: 'Асосий', ru: 'Главная' },
  lines: { uz: 'Liniyalar', uz_cyrl: 'Линиялар', ru: 'Линии' },
  clients: { uz: 'Klientlar', uz_cyrl: 'Клиентлар', ru: 'Клиенты' },
  products: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  reports: { uz: 'Hisobotlar', uz_cyrl: 'Ҳисоботлар', ru: 'Отчёты' },
  settings: { uz: 'Sozlamalar', uz_cyrl: 'Созламалар', ru: 'Настройки' },
};

const MENU: { id: NavPage; icon: LucideIcon }[] = [
  { id: 'dashboard', icon: Home },
  { id: 'lines', icon: Route },
  { id: 'clients', icon: Store },
  { id: 'products', icon: Package },
  { id: 'reports', icon: PieChart },
];

interface SidebarProps {
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  newOrdersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, newOrdersCount }) => {
  const L = useL();
  const item = (id: NavPage, Icon: LucideIcon) => {
    const active = activePage === id;
    const badge = id === 'dashboard' && newOrdersCount > 0 ? newOrdersCount : 0; // new orders are on the main page
    return (
      <button
        key={id}
        onClick={() => onPageChange(id)}
        title={L(PAGE_TITLES[id])}
        className={clsx(
          'relative w-full flex items-center gap-3 h-11 px-3.5 rounded-xl2 text-[15px] font-medium transition',
          'justify-center lg:justify-start',
          active ? 'bg-brand-50 text-brand-500' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
        )}
      >
        <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
        <span className="hidden lg:inline">{L(PAGE_TITLES[id])}</span>
        {badge ? (
          <>
            <span className="hidden lg:inline ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
              {badge}
            </span>
            <span className="lg:hidden absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
          </>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="w-[76px] lg:w-[248px] shrink-0 bg-white border-r border-ink-100 flex flex-col px-3 lg:px-4 py-6 no-print select-none">
      <div className="flex items-center gap-2.5 px-1.5 lg:px-2 pb-7 justify-center lg:justify-start">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-500 shrink-0 flex items-center justify-center">
          <img src="/logo.jpg" alt="Mobi_R" className="w-full h-full object-cover" />
        </div>
        <div className="hidden lg:block min-w-0">
          <div className="text-[19px] font-bold tracking-tight text-ink-900 leading-tight">Mobi_R</div>
          <div className="text-xs text-ink-400 truncate">
            {L({ uz: 'Savdo boshqaruvi', uz_cyrl: 'Савдо бошқаруви', ru: 'Управление продажами' })}
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">{MENU.map((m) => item(m.id, m.icon))}</nav>

      <div className="pt-3 border-t border-ink-100">{item('settings', Settings)}</div>
    </aside>
  );
};
