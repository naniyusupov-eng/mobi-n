import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <View style={[styles.productCard, cartQuantity > 0 && styles.productCardActive]}>
        {/* Top Header: Code & Stock */}
        <View style={styles.cardHeader}>
          <View style={styles.codePill}>
            <Text style={styles.codeText}>#{item.code}</Text>
          </View>
          <View style={[styles.stockPill, isLowStock ? styles.stockPillLow : styles.stockPillNormal]}>
            <Text style={[styles.stockText, isLowStock ? styles.stockTextLow : styles.stockTextNormal]}>
              {t('catalog_in_stock')}: {item.stockDona} {t('pcs')}
            </Text>
          </View>
        </View>

        <Text style={styles.productName}>{item.name}</Text>

        {/* Packaging Unit Switcher */}
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

        {/* Price & Stepper Row */}
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
              activeOpacity={0.7}
            >
              <Minus size={14} color={cartQuantity === 0 ? colors.textMuted : colors.text} />
            </TouchableOpacity>

            <View style={styles.qtyDisplay}>
              <Text style={[styles.qtyText, cartQuantity > 0 && styles.qtyTextActive]}>
                {cartQuantity}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnAdd]}
              onPress={() => handleAddOne(item, currentUnit)}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Active Client Strip */}
      <View style={styles.clientStrip}>
        <Store size={14} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.clientStripLabel}>{t('checkout_client')}:</Text>
          <Text style={styles.clientStripName} numberOfLines={1}>
            {shop ? shop.name : (lang === 'ru' ? 'Клиент не выбран' : 'Mijoz tanlanmagan')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ShopsTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.switchShopText}>
            {shop ? (lang === 'ru' ? 'Сменить' : 'Almashtirish') : (lang === 'ru' ? 'Выбрать' : 'Tanlash')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search') + '...'}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips Scroll */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCat === item.id;
            return (
              <TouchableOpacity
                style={[styles.catChip, isSelected && styles.catChipActive]}
                onPress={() => setSelectedCat(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductRow}
        contentContainerStyle={[styles.listContent, totalItemsCount > 0 && { paddingBottom: 80 }]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('search')} — {t('error')}</Text>
          </View>
        }
      />

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartInfo}>
            <View style={styles.cartBadge}>
              <ShoppingCart size={14} color={colors.primary} />
              <Text style={styles.cartBadgeText}>{totalItemsCount}</Text>
            </View>
            <View>
              <Text style={styles.cartLabel}>{t('checkout_total_final')}</Text>
              <Text style={styles.cartTotal}>
                {totalAmount.toLocaleString(numLocale)} {t('currency')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.goToCartBtn}
            onPress={() => navigation.navigate('CartScreen')}
            activeOpacity={0.8}
          >
            <Text style={styles.goToCartText}>{t('nav_cart')}</Text>
            <ArrowRight size={14} color="#FFFFFF" />
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
  clientStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientStripLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  clientStripName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  switchShopText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  categoriesWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  catChipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  productCardActive: {
    borderColor: colors.primaryBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  codePill: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockPillNormal: {
    backgroundColor: colors.successLight,
  },
  stockPillLow: {
    backgroundColor: colors.warningLight,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stockTextNormal: {
    color: colors.success,
  },
  stockTextLow: {
    color: colors.warning,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  unitSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  unitChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  currentPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  currencySub: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  itemSubtotalText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    height: 32,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperBtnAdd: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  qtyDisplay: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  qtyTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  cartTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  goToCartBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
