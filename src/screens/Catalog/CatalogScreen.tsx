import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { productRepository } from '../../database/productRepository';
import { useCartStore } from '../../store/cartStore';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { Category, PackagingUnit, Product } from '../../types';
import { colors } from '../../theme/colors';
import {
  Search,
  Plus,
  Minus,
  Store,
  ShoppingCart,
  X,
  ArrowRight,
} from 'lucide-react-native';

export const CatalogScreen = ({ navigation }: { navigation: any }) => {
  const { lang, t } = useLanguageStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('cat_all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Selected packaging unit per product
  const [selectedUnits, setSelectedUnits] = useState<Record<string, PackagingUnit>>({});

  const { shop, items, addItem, updateQuantity, getItemCount, getFinalAmount, setShop } = useCartStore();
  const { currentShop } = useShopStore();

  const units: { key: PackagingUnit; label: string }[] = [
    { key: 'blok', label: t('block') },
    { key: 'korobka', label: t('box') },
    { key: 'dona', label: t('pcs') },
    { key: 'kg', label: t('kg') },
  ];

  useEffect(() => {
    const cats = productRepository.getCategories();
    setCategories([{ id: 'cat_all', name: t('catalog_all') }, ...cats.filter((c) => c.id !== 'cat_all')]);
  }, [lang]);

  useEffect(() => {
    if (!shop && currentShop) {
      setShop(currentShop);
    }
  }, [shop, currentShop, setShop]);

  useEffect(() => {
    const list = productRepository.getAll(selectedCat, search);
    setProducts(list);
  }, [selectedCat, search]);

  const handleUnitChange = (productId: string, unit: PackagingUnit) => {
    setSelectedUnits((prev) => ({ ...prev, [productId]: unit }));
  };

  const getProductCartItem = (productId: string, unit: PackagingUnit) => {
    return items.find((i) => i.product.id === productId && i.unit === unit);
  };

  const handleAddOne = (product: Product, unit: PackagingUnit) => {
    if (!shop) {
      Alert.alert(t('warning'), t('checkout_client') + ' ' + t('warning'), [
        { text: t('confirm'), onPress: () => navigation.navigate('ShopsTab') },
      ]);
      return;
    }
    addItem(product, unit, 1);
  };

  const handleSubtractOne = (productId: string, unit: PackagingUnit) => {
    updateQuantity(productId, unit, -1);
  };

  const getPriceForUnit = (product: Product, unit: PackagingUnit) => {
    switch (unit) {
      case 'dona':
        return product.priceDona;
      case 'blok':
        return product.priceBlok;
      case 'korobka':
        return product.priceKorobka;
      case 'kg':
        return product.priceKg;
    }
  };

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const totalItemsCount = getItemCount();
  const totalAmount = getFinalAmount();

  const renderProductRow = ({ item }: { item: Product }) => {
    const currentUnit = selectedUnits[item.id] || 'blok';
    const unitPrice = getPriceForUnit(item, currentUnit);
    const cartItem = getProductCartItem(item.id, currentUnit);
    const cartQuantity = cartItem?.quantity || 0;
    const isLowStock = item.stockDona <= 20;

    return (
      <View style={[styles.productCard, cartQuantity > 0 && styles.productCardInCart]}>
        {/* Top Info Header */}
        <View style={styles.cardHeader}>
          <View style={styles.codePill}>
            <Text style={styles.codeText}>#{item.code}</Text>
          </View>
          <View style={[styles.stockPill, isLowStock ? styles.stockPillLow : styles.stockPillGood]}>
            <Text style={[styles.stockText, isLowStock ? styles.stockTextLow : styles.stockTextGood]}>
              {t('catalog_in_stock')}: {item.stockDona} {t('pcs')}
            </Text>
          </View>
        </View>

        <Text style={styles.productName}>{item.name}</Text>

        {/* Packaging Unit Switcher with Prices */}
        <View style={styles.unitSelectorRow}>
          {units.map((u) => {
            const isSelected = currentUnit === u.key;
            return (
              <TouchableOpacity
                key={u.key}
                style={[styles.unitChip, isSelected && styles.unitChipActive]}
                onPress={() => handleUnitChange(item.id, u.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.unitChipText, isSelected && styles.unitChipTextActive]}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Bottom Row: Unit Price & Stepper */}
        <View style={styles.cardActionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentPriceText}>
              {unitPrice.toLocaleString(numLocale)}{' '}
              <Text style={styles.currencySub}>{t('currency')}/{currentUnit}</Text>
            </Text>
            {cartQuantity > 0 && (
              <Text style={styles.itemSubtotalText}>
                {t('catalog_cart_total')}: {(cartQuantity * unitPrice).toLocaleString(numLocale)} {t('currency')}
              </Text>
            )}
          </View>

          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={[styles.stepperBtn, cartQuantity === 0 && styles.stepperBtnDisabled]}
              onPress={() => handleSubtractOne(item.id, currentUnit)}
              disabled={cartQuantity === 0}
            >
              <Minus size={16} color={cartQuantity > 0 ? colors.text : colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.qtyBox}>
              <Text style={styles.qtyNumber}>{cartQuantity}</Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnPlus]}
              onPress={() => handleAddOne(item, currentUnit)}
            >
              <Plus size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Selected Client Bar (Mobi-S Style) */}
      <View style={styles.clientTopBar}>
        <View style={styles.clientLeft}>
          <Store size={16} color="#fff" />
          <View>
            <Text style={styles.clientLabel}>{t('checkout_client')}</Text>
            <Text style={styles.clientName}>
              {shop ? `${shop.name} (${shop.ownerName})` : '—'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.switchClientBtn}
          onPress={() => navigation.navigate('ShopsTab')}
        >
          <Text style={styles.switchClientText}>{shop ? t('close') : t('confirm')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('catalog_search_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Horizontal Tabs */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedCat === item.id;
            return (
              <TouchableOpacity
                style={[styles.catTab, isSelected && styles.catTabActive]}
                onPress={() => setSelectedCat(item.id)}
              >
                <Text style={[styles.catTabText, isSelected && styles.catTabTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductRow}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <View style={styles.bottomCartBar}>
          <View style={styles.cartBarInfo}>
            <Text style={styles.cartBarCount}>
              {t('catalog_cart_total')}: {totalItemsCount} {t('items_count')}
            </Text>
            <Text style={styles.cartBarAmount}>
              {totalAmount.toLocaleString(numLocale)} {t('currency')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.goToCartBtn}
            onPress={() => navigation.navigate('CartScreen')}
            activeOpacity={0.85}
          >
            <ShoppingCart size={16} color="#fff" />
            <Text style={styles.goToCartText} numberOfLines={1}>{t('cart_proceed')}</Text>
            <ArrowRight size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  clientTopBar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clientLabel: {
    fontSize: 9,
    color: colors.primaryLight,
    fontWeight: '800',
  },
  clientName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  switchClientBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  switchClientText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchSection: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    padding: 0,
  },
  categoriesSection: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catTabTextActive: {
    color: '#fff',
  },
  clearSearchBtn: {
    padding: 4,
  },
  listContent: {
    padding: 10,
    gap: 10,
    paddingBottom: 85,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productCardInCart: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'monospace',
  },
  stockPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockPillGood: {
    backgroundColor: '#DCFCE7',
  },
  stockPillLow: {
    backgroundColor: '#FEF3C7',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stockTextGood: {
    color: '#15803D',
  },
  stockTextLow: {
    color: '#B45309',
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 18,
  },
  unitSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  unitChipTextActive: {
    color: '#fff',
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  currentPriceText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  currencySub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  itemSubtotalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperBtnPlus: {
    backgroundColor: colors.primary,
  },
  qtyBox: {
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  cartBarInfo: {},
  cartBarCount: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cartBarAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38BDF8',
  },
  goToCartBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
  },
  goToCartText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});

