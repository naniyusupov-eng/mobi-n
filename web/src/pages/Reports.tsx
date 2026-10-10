import React from 'react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReportsProps {
  orders: Order[];
}

export const Reports: React.FC<ReportsProps> = ({ orders }) => {
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

  // Sales per product from order lines, best sellers first
  const productSales = Object.values(
    orders.reduce<Record<string, { name: string; total: number; orders: number }>>((acc, o) => {
      for (const item of o.items || []) {
        const row = (acc[item.productName] ||= { name: item.productName, total: 0, orders: 0 });
        row.total += item.totalPrice;
        row.orders += 1;
      }
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      {/* Revenue Structure Cards */}
      <div>
        <h3 className="text-xs font-semibold text-slate-900 mb-2.5">{t('rev_structure')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-lg border border-slate-200/70 hover:border-sky-300 transition shadow-2xs">
            <span className="text-xs text-slate-400 font-normal">{t('rev_total')}</span>
            <div className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
              {totalRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-sky-500 rounded-full w-full" />
            </div>
            <span className="text-[11px] text-slate-400 font-normal mt-1.5 block">
              {t('sales_volume_100')}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200/70 hover:border-sky-300 transition shadow-2xs">
            <span className="text-xs text-slate-400 font-normal">{t('rev_cash')}</span>
            <div className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
              {cashRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-sky-700 font-normal mt-1.5 block tabular-nums">
              {totalRevenue > 0 ? ((cashRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200/70 hover:border-amber-300 transition shadow-2xs">
            <span className="text-xs text-slate-400 font-normal">{t('rev_debt')}</span>
            <div className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
              {debtRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <div className="w-full h-1 bg-amber-50 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${totalRevenue > 0 ? (debtRevenue / totalRevenue) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-amber-700 font-normal mt-1.5 block tabular-nums">
              {totalRevenue > 0 ? ((debtRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200/70 hover:border-sky-300 transition shadow-2xs">
            <span className="text-xs text-slate-400 font-normal">{t('rev_bank')}</span>
            <div className="text-xl font-semibold text-slate-900 mt-1 tabular-nums">
              {bankRevenue.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-400">{t('som')}</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-slate-500 rounded-full"
                style={{ width: `${totalRevenue > 0 ? (bankRevenue / totalRevenue) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-normal mt-1.5 block tabular-nums">
              {totalRevenue > 0 ? ((bankRevenue / totalRevenue) * 100).toFixed(0) : 0}% {t('share')}
            </span>
          </div>
        </div>
      </div>

      {/* Top Confectionery Products */}
      <div className="bg-white rounded-lg border border-slate-200/70 p-4 shadow-2xs">
        <h3 className="text-xs font-semibold text-slate-900 mb-3">
          {t('product_turnover')}
        </h3>
        {productSales.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Hali sotuvlar yoʻq</div>
        ) : (
          <div className="space-y-2.5">
            {productSales.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-900 truncate">{p.name}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-medium text-slate-900">{p.total.toLocaleString(numLocale)} {t('som')}</span>
                    <span className="text-[10px] text-slate-400 ml-2">{p.orders} ta buyurtmada</span>
                  </span>
                </div>
                <div className="w-full h-1 bg-sky-50 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(p.total / productSales[0].total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
