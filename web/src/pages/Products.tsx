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
    <div className="space-y-3.5">
      {/* Top Action Toolbar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 stroke-[1.6]" />
            <input
              type="text"
              placeholder={t('search_products_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200/70 rounded-md text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-400 transition"
            />
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-normal px-2.5 py-1.5 bg-white border border-slate-200/70 rounded-md text-slate-600 outline-none cursor-pointer"
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[1.8]" />
          <span>{t('btn_add_product')}</span>
        </button>
      </div>

      {/* Products Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-medium text-[11px]">
                <th className="py-2.5 px-3.5">{t('col_code')}</th>
                <th className="py-2.5 px-3.5">{t('col_product_name')}</th>
                <th className="py-2.5 px-3.5">{t('col_category')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_price_dona')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_price_blok')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_price_box')}</th>
                <th className="py-2.5 px-3.5 text-right">{t('col_price_kg')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('col_stock')}</th>
                <th className="py-2.5 px-3.5 text-center">{t('col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockDona < 500;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3.5 font-mono text-[11px] font-normal text-slate-400">{p.code}</td>
                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-normal text-slate-500">{p.categoryName}</td>
                    <td className="py-2.5 px-3.5 text-right font-normal text-slate-700 tabular-nums">
                      {p.priceDona.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-normal text-slate-700 tabular-nums">
                      {p.priceBlok.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-normal text-slate-700 tabular-nums">
                      {p.priceKorobka.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-normal text-slate-700 tabular-nums">
                      {p.priceKg.toLocaleString(numLocale)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-normal tabular-nums ${
                          isLowStock
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.stockDona} {t('stock_unit')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateStock(p.id, p.stockDona + 100)}
                          className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-normal border border-slate-200/70"
                          title="+100"
                        >
                          +100
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, Math.max(0, p.stockDona - 50))}
                          className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-normal border border-slate-200/70"
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
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-lg max-w-md w-full p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-0.5">{t('modal_add_product_title')}</h3>
            <p className="text-xs text-slate-400 font-normal mb-4">{t('modal_add_product_sub')}</p>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_product_name')} *
                </label>
                <input
                  type="text"
                  placeholder="Marmelad 200g"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 outline-none focus:border-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('col_category')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-normal text-slate-500 mb-1">
                    {t('col_price_dona')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceDona}
                    onChange={(e) => setPriceDona(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded text-xs font-normal tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-slate-500 mb-1">
                    {t('col_price_blok')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceBlok}
                    onChange={(e) => setPriceBlok(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded text-xs font-normal tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-slate-500 mb-1">
                    {t('col_price_box')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceKorobka}
                    onChange={(e) => setPriceKorobka(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded text-xs font-normal tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-normal text-slate-500 mb-1">
                    {t('col_price_kg')} ({t('som')})
                  </label>
                  <input
                    type="number"
                    value={priceKg}
                    onChange={(e) => setPriceKg(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded text-xs font-normal tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-600 mb-1">
                  {t('initial_stock_label')}
                </label>
                <input
                  type="number"
                  value={stockDona}
                  onChange={(e) => setStockDona(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200/80 rounded-md text-xs font-normal text-slate-900 tabular-nums"
                />
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
