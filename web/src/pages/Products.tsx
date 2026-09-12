import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { Plus, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProductsProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export const Products: React.FC<ProductsProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateStock,
}) => {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [priceDona, setPriceDona] = useState(12000);
  const [priceBlok, setPriceBlok] = useState(110000);
  const [priceKorobka, setPriceKorobka] = useState(420000);
  const [priceKg, setPriceKg] = useState(55000);
  const [stockDona, setStockDona] = useState(500);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchText =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase());

      if (!matchText) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      return true;
    });
  }, [products, search, selectedCategory]);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cat = categories.find((c) => c.id === categoryId);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      code: `QND-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      categoryId,
      categoryName: cat?.name || 'Qandolat',
      priceDona,
      priceBlok,
      priceKorobka,
      priceKg,
      itemsPerBlock: 10,
      itemsPerBox: 40,
      stockDona,
    };

    onAddProduct(newProduct);
    setShowAddModal(false);
    setName('');
  };

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('search_products_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">{t('all_categories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('btn_add_product')}
        </button>
      </div>

      {/* Products Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-2.5 px-4">{t('col_code')}</th>
                <th className="py-2.5 px-4">{t('col_product_name')}</th>
                <th className="py-2.5 px-4">{t('col_category')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_price_dona')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_price_blok')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_price_box')}</th>
                <th className="py-2.5 px-4 text-right">{t('col_price_kg')}</th>
                <th className="py-2.5 px-4 text-center">{t('col_stock')}</th>
                <th className="py-2.5 px-4 text-center">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockDona < 500;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{p.code}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-extrabold text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-600">{p.categoryName}</td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {p.priceDona.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-blue-800 tabular-nums">
                      {p.priceBlok.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {p.priceKorobka.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums">
                      {p.priceKg.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-extrabold text-[11px] tabular-nums border ${
                          isLowStock
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {p.stockDona} {t('stock_unit')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateStock(p.id, p.stockDona + 100)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px] border border-slate-200"
                          title="+100"
                        >
                          +100
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stockDona - 50))}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px] border border-slate-200"
                          title="-50"
                        >
                          -50
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-in fade-in duration-200">
            <h3 className="font-display text-base font-black text-slate-900 mb-1">{t('modal_add_product_title')}</h3>
            <p className="text-xs text-slate-500 mb-5">{t('modal_add_product_sub')}</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_product_name')} *
                </label>
                <input
                  type="text"
                  placeholder="Marmelad 200g"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('col_category')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t('col_price_dona')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceDona}
                    onChange={(e) => setPriceDona(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t('col_price_blok')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceBlok}
                    onChange={(e) => setPriceBlok(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-blue-700 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t('col_price_box')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceKorobka}
                    onChange={(e) => setPriceKorobka(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {t('col_price_kg')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceKg}
                    onChange={(e) => setPriceKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('initial_stock_label')}
                </label>
                <input
                  type="number"
                  value={stockDona}
                  onChange={(e) => setStockDona(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900 tabular-nums"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  {t('btn_save_product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
