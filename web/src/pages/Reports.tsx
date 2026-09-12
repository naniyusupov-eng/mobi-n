import React from 'react';
import { Agent, Order, Product, Shop } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReportsProps {
  orders: Order[];
  agents: Agent[];
  products: Product[];
  shops: Shop[];
}

export const Reports: React.FC<ReportsProps> = ({ orders, agents, products }) => {
  const { t, lang } = useLanguage();
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const cashRevenue = orders
    .filter((o) => o.paymentMethod === 'naqd')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const debtRevenue = orders
    .filter((o) => o.paymentMethod === 'nasiya')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const bankRevenue = orders
    .filter((o) => o.paymentMethod === 'otkazma')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Structure Cards */}
      <div>
        <h3 className="font-display text-sm font-bold text-slate-900 tracking-tight mb-2.5">{t('rev_structure')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('rev_total')}</span>
            <div className="font-display text-lg font-black text-slate-900 mt-1 tabular-nums">
              {totalRevenue.toLocaleString(numLocale)} <span className="text-xs font-semibold text-slate-500">{t('som')}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block">
              {t('sales_volume_100')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('rev_cash')}</span>
            <div className="font-display text-lg font-black text-emerald-600 mt-1 tabular-nums">
              {cashRevenue.toLocaleString(numLocale)} <span className="text-xs font-semibold text-emerald-600/70">{t('som')}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block tabular-nums">
              {totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{t('rev_debt')}</span>
            <div className="font-display text-lg font-black text-rose-600 mt-1 tabular-nums">
              {debtRevenue.toLocaleString(numLocale)} <span className="text-xs font-semibold text-rose-600/70">{t('som')}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block tabular-nums">
              {totalRevenue > 0 ? ((debtRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t('rev_bank')}</span>
            <div className="font-display text-lg font-black text-blue-600 mt-1 tabular-nums">
              {bankRevenue.toLocaleString(numLocale)} <span className="text-xs font-semibold text-blue-600/70">{t('som')}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-1 block tabular-nums">
              {totalRevenue > 0 ? ((bankRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>
        </div>
      </div>

      {/* Agents Performance Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4">
        <h3 className="font-display font-bold text-slate-900 text-xs tracking-tight uppercase mb-3">{t('agent_performance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-2.5 px-3">{t('col_agent')}</th>
                <th className="py-2.5 px-3">{t('field_agent_territory')}</th>
                <th className="py-2.5 px-3 text-center">{t('agent_orders')}</th>
                <th className="py-2.5 px-3 text-right">{t('agent_sales')}</th>
                <th className="py-2.5 px-3 text-right">{t('col_avg_check')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => {
                const avgCheck = agent.ordersCount > 0 ? Math.round(agent.totalSales / agent.ordersCount) : 0;
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{agent.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">{agent.territory}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800 tabular-nums">
                      {agent.ordersCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-display font-black text-blue-600 tabular-nums">
                      {agent.totalSales.toLocaleString(numLocale)} {t('som')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-600 tabular-nums">
                      {avgCheck.toLocaleString(numLocale)} {t('som')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Confectionery Products */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-4">
        <h3 className="font-display font-bold text-slate-900 text-xs tracking-tight uppercase mb-3">
          {t('product_turnover')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="p-2.5 bg-slate-50/80 rounded-md border border-slate-200/70 flex items-center justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="font-bold text-xs text-slate-900">{product.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                  {t('col_price_blok')}: {product.priceBlok.toLocaleString(numLocale)} {t('som')} •{' '}
                  {t('col_price_kg')}: {product.priceKg.toLocaleString(numLocale)} {t('som')}
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-xs font-black text-slate-900 tabular-nums">{product.stockDona} {t('stock_unit')}</span>
                <span className="block text-[10px] text-slate-400">{t('warehouse_stock')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
