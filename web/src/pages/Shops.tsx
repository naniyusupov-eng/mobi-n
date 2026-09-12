import React, { useState, useMemo } from 'react';
import { Shop } from '../types';
import { Plus, Search, AlertCircle, CreditCard } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ShopsProps {
  shops: Shop[];
  onAddShop: (shop: Shop) => void;
  onRecordPayment: (shopId: string, amount: number) => void;
}

export const Shops: React.FC<ShopsProps> = ({ shops, onAddShop, onRecordPayment }) => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [debtOnly, setDebtOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentModalShop, setPaymentModalShop] = useState<Shop | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Add shop state
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [visitDay, setVisitDay] = useState('Dushanba');

  const daysList = [
    { key: 'Dushanba', labelKey: 'day_mon' as const },
    { key: 'Seshanba', labelKey: 'day_tue' as const },
    { key: 'Chorshanba', labelKey: 'day_wed' as const },
    { key: 'Payshanba', labelKey: 'day_thu' as const },
    { key: 'Juma', labelKey: 'day_fri' as const },
    { key: 'Shanba', labelKey: 'day_sat' as const },
  ];

  const getDayName = (d: string) => {
    const found = daysList.find((item) => item.key.toLowerCase() === d.toLowerCase());
    return found ? t(found.labelKey) : d;
  };

  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const matchText =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase());

      if (!matchText) return false;
      if (debtOnly && s.debtBalance === 0) return false;
      return true;
    });
  }, [shops, search, debtOnly]);

  const totalDebt = shops.reduce((sum, s) => sum + s.debtBalance, 0);
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) return;

    const newShop: Shop = {
      id: `shop_${Date.now()}`,
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      debtBalance: 0,
      visitDay,
    };

    onAddShop(newShop);
    setShowAddModal(false);
    setName('');
    setOwnerName('');
    setPhone('+998 ');
    setAddress('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalShop) return;
    const amount = Number(payAmount);
    if (amount <= 0) return;

    onRecordPayment(paymentModalShop.id, amount);
    setPaymentModalShop(null);
    setPayAmount('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Filters */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_shops_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setDebtOnly(!debtOnly)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              debtOnly
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {t('filter_debt_only')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[10px] uppercase font-bold text-slate-400">{t('total_debt_ledger')}</div>
            <div className="font-display text-sm font-black text-rose-600 tabular-nums">
              {totalDebt.toLocaleString(numLocale)} {t('som')}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('btn_add_shop')}
          </button>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-4">{t('col_shop_name')}</th>
                <th className="py-2.5 px-4">{t('col_owner')}</th>
                <th className="py-2.5 px-4">{t('col_phone')}</th>
                <th className="py-2.5 px-4">{t('col_address')}</th>
                <th className="py-2.5 px-4 text-center">{t('col_route_day')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_debt')}</th>
                <th className="py-2.5 px-4 text-center">{t('btn_accept_payment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-4">
                    <div className="font-extrabold text-slate-900">{shop.name}</div>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">{shop.ownerName}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium tabular-nums">{shop.phone}</td>
                  <td className="py-2.5 px-4 text-slate-500">{shop.address}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold text-[11px] border border-blue-200/50">
                      {getDayName(shop.visitDay)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {shop.debtBalance > 0 ? (
                      <span className="font-display font-black text-rose-600 text-sm tabular-nums">
                        {shop.debtBalance.toLocaleString(numLocale)} {t('som')}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 text-xs">{t('no_debt')}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {shop.debtBalance > 0 ? (
                      <button
                        onClick={() => {
                          setPaymentModalShop(shop);
                          setPayAmount(String(shop.debtBalance));
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs transition inline-flex items-center gap-1 border border-emerald-200/60"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {t('btn_accept_payment')}
                      </button>
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalShop && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
            <h3 className="font-display text-base font-black text-slate-900 mb-1">{t('modal_payment_title')}</h3>
            <p className="text-xs text-slate-500 mb-4">
              {paymentModalShop.name} • {t('current_debt')}{' '}
              <strong className="text-rose-600 font-display tabular-nums">
                {paymentModalShop.debtBalance.toLocaleString(numLocale)} {t('som')}
              </strong>
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('payment_amount')}
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalShop(null)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md shadow-xs"
                >
                  {t('btn_save_payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in duration-200">
            <h3 className="font-display text-base font-black text-slate-900 mb-1">{t('modal_add_shop_title')}</h3>
            <p className="text-xs text-slate-500 mb-5">{t('shops_sub')}</p>

            <form onSubmit={handleCreateShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_shop_name')} *
                </label>
                <input
                  type="text"
                  placeholder="Fayz Supermarket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_owner')} *
                </label>
                <input
                  type="text"
                  placeholder="Sobir aka"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_phone')} *
                </label>
                <input
                  type="text"
                  placeholder="+998 90 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_address')} *
                </label>
                <input
                  type="text"
                  placeholder="Chilonzor 18-mavze, 4-uy"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_route_day')}
                </label>
                <select
                  value={visitDay}
                  onChange={(e) => setVisitDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold"
                >
                  {daysList.map((d) => (
                    <option key={d.key} value={d.key}>
                      {t(d.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs"
                >
                  {t('btn_save_shop')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
