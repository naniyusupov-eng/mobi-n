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
    <div className="space-y-3.5">
      {/* Top Banner & Filters */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.6]" />
            <input
              type="text"
              placeholder={t('search_shops_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/70 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 transition"
            />
          </div>

          <button
            onClick={() => setDebtOnly(!debtOnly)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-normal transition flex items-center gap-1.5 shrink-0 border ${
              debtOnly
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 stroke-[1.6]" />
            <span>{t('filter_debt_only')}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right hidden md:block">
            <div className="text-[10px] text-slate-400 font-normal">{t('total_debt_ledger')}</div>
            <div className="text-xs font-medium text-slate-900 tabular-nums">
              {totalDebt.toLocaleString(numLocale)} {t('som')}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[1.8]" />
            <span>{t('btn_add_shop')}</span>
          </button>
        </div>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="py-2.5 px-3.5">{t('col_shop_name')}</th>
                <th className="py-2.5 px-3.5">{t('col_owner')}</th>
                <th className="py-2.5 px-3.5">{t('col_phone')}</th>
                <th className="py-2.5 px-3.5">{t('col_address')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('col_route_day')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_debt')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('btn_accept_payment')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-2.5 px-3.5">
                    <div className="font-medium text-slate-900">{shop.name}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-normal text-slate-600">{shop.ownerName}</td>
                  <td className="py-2.5 px-3.5 text-slate-500 font-normal tabular-nums">{shop.phone}</td>
                  <td className="py-2.5 px-3.5 text-slate-400 font-normal">{shop.address}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-normal text-[10px]">
                      {getDayName(shop.visitDay)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-medium tabular-nums">
                    {shop.debtBalance > 0 ? (
                      <span className="text-rose-600">
                        {shop.debtBalance.toLocaleString(numLocale)} {t('som')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal text-xs">{t('no_debt')}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {shop.debtBalance > 0 ? (
                      <button
                        onClick={() => {
                          setPaymentModalShop(shop);
                          setPayAmount(String(shop.debtBalance));
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-normal rounded text-xs transition inline-flex items-center gap-1 border border-slate-200/80"
                      >
                        <CreditCard className="w-3.5 h-3.5 stroke-[1.6]" />
                        <span>{t('btn_accept_payment')}</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 font-normal">—</span>
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
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-lg max-w-sm w-full p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{t('modal_payment_title')}</h3>
            <p className="text-xs text-slate-400 font-normal mb-3.5">
              {paymentModalShop.name} • {t('current_debt')}{' '}
              <span className="text-rose-600 font-medium tabular-nums">
                {paymentModalShop.debtBalance.toLocaleString(numLocale)} {t('som')}
              </span>
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('payment_amount')}
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-sm font-normal text-slate-900 outline-none focus:border-slate-400 tabular-nums"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentModalShop(null)}
                  className="px-3 py-1.5 text-xs font-normal text-slate-500 hover:text-slate-800 rounded-md"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition"
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
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-lg max-w-md w-full p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{t('modal_add_shop_title')}</h3>
            <p className="text-xs text-slate-400 font-normal mb-4">{t('shops_sub')}</p>

            <form onSubmit={handleCreateShop} className="space-y-3">
              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_shop_name')} *
                </label>
                <input
                  type="text"
                  placeholder="Fayz Supermarket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_owner')} *
                </label>
                <input
                  type="text"
                  placeholder="Sobir aka"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_phone')} *
                </label>
                <input
                  type="text"
                  placeholder="+998 90 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_address')} *
                </label>
                <input
                  type="text"
                  placeholder="Chilonzor 18-mavze, 4-uy"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_route_day')}
                </label>
                <select
                  value={visitDay}
                  onChange={(e) => setVisitDay(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal outline-none"
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
                  className="px-3 py-1.5 text-xs font-normal text-slate-500 hover:text-slate-800 rounded-md"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition"
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
