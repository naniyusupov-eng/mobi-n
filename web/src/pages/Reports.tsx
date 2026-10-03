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
    <div className="space-y-4">
      {/* Revenue Structure Cards */}
      <div>
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">{t('rev_structure')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70">
            <span className="text-xs text-slate-400 font-normal">{t('rev_total')}</span>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {totalRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block">
              {t('sales_volume_100')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70">
            <span className="text-xs text-slate-400 font-normal">{t('rev_cash')}</span>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {cashRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block tabular-nums">
              {totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70">
            <span className="text-xs text-slate-400 font-normal">{t('rev_debt')}</span>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {debtRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block tabular-nums">
              {totalRevenue > 0 ? ((debtRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200/70">
            <span className="text-xs text-slate-400 font-normal">{t('rev_bank')}</span>
            <div className="text-lg font-semibold text-slate-900 mt-1 tabular-nums">
              {bankRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-0.5 block tabular-nums">
              {totalRevenue > 0 ? ((bankRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>
        </div>
      </div>

      {/* Agents Performance Table */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-900">{t('agent_performance')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="py-2.5 px-3.5">{t('col_agent')}</th>
                <th className="py-2.5 px-3.5">{t('field_agent_territory')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('agent_orders')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('agent_sales')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_avg_check')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => {
                const avgCheck = agent.ordersCount > 0 ? Math.round(agent.totalSales / agent.ordersCount) : 0;
                return (
                  <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3.5 font-medium text-slate-900">{agent.name}</td>
                    <td className="py-2.5 px-3.5 text-slate-400 font-normal text-[11px]">{agent.territory}</td>
                    <td className="py-2.5 px-3.5 text-center font-normal text-slate-700 tabular-nums">
                      {agent.ordersCount}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-medium text-slate-900 tabular-nums">
                      {agent.totalSales.toLocaleString(numLocale)} {t('som')}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-normal text-slate-500 tabular-nums">
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
      <div className="bg-white rounded-lg border border-slate-200/70 p-4">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">
          {t('product_turnover')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {products.slice(0, 6).map((product) => (
            <div
              key={product.id}
              className="p-2.5 bg-white rounded-md border border-slate-200/70 flex items-center justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="font-medium text-xs text-slate-900">{product.name}</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5 tabular-nums">
                  {t('col_price_blok')}: {product.priceBlok.toLocaleString(numLocale)} {t('som')} •{' '}
                  {t('col_price_kg')}: {product.priceKg.toLocaleString(numLocale)} {t('som')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-900 tabular-nums">{product.stockDona} {t('stock_unit')}</span>
                <span className="block text-[10px] text-slate-400 font-normal">{t('warehouse_stock')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
