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

    return (
      <View style={[styles.productRow, cartQuantity > 0 && styles.productRowInCart]}>
        {/* Left Info Column */}
        <View style={styles.productMain}>
          <View style={styles.codeAndStock}>
            <Text style={styles.productCode}>{item.code}</Text>
            <Text style={styles.stockBadge}>{t('catalog_in_stock')} {item.stockDona} {t('pcs')}</Text>
          </View>
          <Text style={styles.productName}>{item.name}</Text>

          {/* Mobi-S Unit selector row */}
          <View style={styles.unitPillsRow}>
            {units.map((u) => {
              const isSelected = currentUnit === u.key;
              return (
                <TouchableOpacity
                  key={u.key}
                  style={[styles.unitPill, isSelected && styles.unitPillActive]}
                  onPress={() => handleUnitChange(item.id, u.key)}
                >
                  <Text style={[styles.unitPillText, isSelected && styles.unitPillTextActive]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.unitPriceText}>
              {unitPrice.toLocaleString(numLocale)} {t('currency')}
            </Text>
          </View>
        </View>

        {/* Right Stepper Column */}
        <View style={styles.stepperColumn}>
          <View style={styles.stepperBox}>
            <TouchableOpacity
              style={[styles.stepperBtn, cartQuantity === 0 && styles.stepperBtnDisabled]}
              onPress={() => handleSubtractOne(item.id, currentUnit)}
              disabled={cartQuantity === 0}
            >
              <Minus size={16} color={cartQuantity > 0 ? colors.text : colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.qtyBox}>
              <Text style={styles.qtyNumber}>{cartQuantity}</Text>
              <Text style={styles.qtyUnitLabel}>{currentUnit}</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => handleAddOne(item, currentUnit)}
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {cartQuantity > 0 && (
            <Text style={styles.rowSubtotal}>
              {(cartQuantity * unitPrice).toLocaleString(numLocale)} {t('currency')}
            </Text>
          )}
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
              {t('catalog_cart_total')} {totalItemsCount} {t('items_count')}
            </Text>
            <Text style={styles.cartBarAmount}>
              {totalAmount.toLocaleString(numLocale)} {t('currency')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.goToCartBtn}
            onPress={() => navigation.navigate('CartScreen')}
            activeOpacity={0.8}
          >
            <ShoppingCart size={16} color="#fff" />
            <Text style={styles.goToCartText}>{t('cart_proceed')}</Text>
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
  listContent: {
    padding: 10,
    gap: 8,
    paddingBottom: 70,
  },
  productRow: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  productRowInCart: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFF',
  },
  productMain: {
    flex: 1,
  },
  codeAndStock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productCode: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stockBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 3,
  },
  unitPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  unitPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  unitPillTextActive: {
    color: '#fff',
  },
  unitPriceText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    marginLeft: 'auto',
  },
  stepperColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    padding: 6,
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  qtyBox: {
    alignItems: 'center',
    paddingHorizontal: 6,
    minWidth: 32,
  },
  qtyNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  qtyUnitLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowSubtotal: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
    marginTop: 4,
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartBarInfo: {},
  cartBarCount: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cartBarAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  goToCartBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  goToCartText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
