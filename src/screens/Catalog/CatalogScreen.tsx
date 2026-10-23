import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ChevronRight, PackageSearch, ShoppingCart, Store } from 'lucide-react-native';
import { productRepository } from '../../database/productRepository';
import { getUnitPrice, useCartStore } from '../../store/cartStore';
import { pricingService } from '../../services/pricingService';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { useSyncStore } from '../../store/syncStore';
import { Category, PackagingUnit, Product } from '../../types';
import { AppText, Badge, Button, Card, Money, Row, Screen, SearchBar, Segmented } from '../../components/ui';
import { CATEGORY_LABELS, COMMON, UNIT_LABELS, promoBadge, useL } from '../../i18n/tri';
import { EqualSegments, QtyStepper, UNIT_ORDER } from '../../components/orderControls';
import { formatMoney, formatNumber } from '../../utils/format';
import { colors, radius, shadow, space } from '../../theme/colors';

// ---------------------------------------------------------------- Screen

export const CatalogScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('cat_all');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  // Selected packaging unit per product
  const [selectedUnits, setSelectedUnits] = useState<Record<string, PackagingUnit>>({});

  const { shop, items, addItem, updateQuantity, setQuantity, getItemCount, getFinalAmount, setShop, reprice } = useCartStore();
  const { currentShop } = useShopStore();

  // Products come from the server on sign-in and on every sync; reload after each sync
  const lastSync = useSyncStore((s) => s.lastResult);
  const triggerSync = useSyncStore((s) => s.triggerSync);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCategories(productRepository.getCategories().filter((c) => c.id !== 'cat_all'));
  }, [lastSync]);

  useEffect(() => {
    if (!shop && currentShop) setShop(currentShop);
  }, [shop, currentShop, setShop]);

  useEffect(() => {
    setProducts(productRepository.getAll(selectedCat, search));
  }, [selectedCat, search, lastSync]);

  // A sync may bring new price lists (and the shop's list): cart lines follow them
  useEffect(() => {
    if (lastSync) reprice();
  }, [lastSync, reprice]);

  // Pull to refresh: push the queue, then download shops and the catalogue with fresh stock
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerSync();
    } finally {
      setRefreshing(false);
      setCategories(productRepository.getCategories().filter((c) => c.id !== 'cat_all'));
      setProducts(productRepository.getAll(selectedCat, search));
    }
  }, [triggerSync, selectedCat, search]);

  const categoryOptions = useMemo(
    () => [{ key: 'cat_all', label: L(COMMON.all) }, ...categories.map((c) => ({ key: c.id, label: CATEGORY_LABELS[c.id] ? L(CATEGORY_LABELS[c.id]) : c.name }))],
    [categories, L]
  );

  const unitOptions = useMemo(() => UNIT_ORDER.map((u) => ({ key: u, label: L(UNIT_LABELS[u]) })), [L]);

  const goToShops = () => navigation.navigate('ShopsTab');

  const handleAddOne = (product: Product, unit: PackagingUnit) => {
    if (!shop) {
      Alert.alert(L(COMMON.warning), L(COMMON.chooseShop), [
        { text: L(COMMON.cancel), style: 'cancel' },
        { text: L(COMMON.confirm), onPress: goToShops },
      ]);
      return;
    }
    addItem(product, unit, 1);
  };

  const qtyInCart = (productId: string, unit: PackagingUnit) =>
    items.find((i) => i.product.id === productId && i.unit === unit)?.quantity || 0;

  const totalItemsCount = getItemCount();
  const totalAmount = getFinalAmount();
  const addLabel = L({ uz: 'Qoʻshish', uz_cyrl: 'Қўшиш', ru: 'Добавить' });

  const renderProduct = ({ item }: { item: Product }) => {
    const unit = selectedUnits[item.id] || 'blok';
    const price = getUnitPrice(item, unit, shop);
    const promos = pricingService.productPromos(item.id);
    const qty = qtyInCart(item.id, unit);
    const inCartAny = items.some((i) => i.product.id === item.id);
    const lowStock = item.stockDona <= 20;

    return (
      <Card style={[styles.product, inCartAny && styles.productActive]}>
        <AppText variant="strong" lines={2}>
          {item.name}
        </AppText>
        <Row gap={space.sm} wrap>
          <AppText variant="caption" lines={1}>
            #{item.code}
          </AppText>
          <Badge
            tone={lowStock ? 'warning' : 'success'}
            label={`${L({ uz: 'Qoldiq', uz_cyrl: 'Қолдиқ', ru: 'Остаток' })}: ${formatNumber(item.stockDona)} ${L(UNIT_LABELS.dona)}`}
          />
          {promos.map((p) => (
            <Badge
              key={p.id}
              tone="danger"
              label={L(promoBadge(p.percent, p.minQty ? formatNumber(p.minQty) : '', p.unit ? L(UNIT_LABELS[p.unit]) : ''))}
            />
          ))}
        </Row>

        <EqualSegments
          options={unitOptions}
          value={unit}
          onChange={(u) => setSelectedUnits((prev) => ({ ...prev, [item.id]: u }))}
        />

        <View style={styles.priceRow}>
          <View style={styles.flex}>
            <Money amount={price} variant="title" />
            <AppText variant="caption" lines={1}>
              {qty > 0
                ? `${L({ uz: 'Savatchada', uz_cyrl: 'Саватчада', ru: 'В корзине' })}: ${formatMoney(qty * price, lang)}`
                : `1 ${L(UNIT_LABELS[unit])}`}
            </AppText>
          </View>
          <QtyStepper
            value={qty}
            addLabel={addLabel}
            onInc={() => handleAddOne(item, unit)}
            onDec={() => updateQuantity(item.id, unit, -1)}
            onSet={(n) => setQuantity(item.id, unit, n)}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen
      scroll={false}
      footer={
        totalItemsCount > 0 ? (
          <Pressable
            onPress={() => navigation.navigate('CartScreen')}
            style={({ pressed }) => [styles.cartBar, pressed && styles.pressed]}
          >
            <View style={styles.cartCount}>
              <ShoppingCart size={16} color={colors.white} strokeWidth={2.2} />
              <AppText variant="strong" color={colors.white} fit>
                {formatNumber(totalItemsCount)}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="caption" color={colors.primaryLight} lines={1}>
                {L({ uz: 'Savatchaga oʻtish', uz_cyrl: 'Саватчага ўтиш', ru: 'Перейти в корзину' })}
              </AppText>
              <Money amount={totalAmount} variant="title" color={colors.white} />
            </View>
            <ChevronRight size={22} color={colors.white} />
          </Pressable>
        ) : undefined
      }
    >
      <View style={styles.header}>
        {shop ? (
          <Pressable onPress={goToShops} style={({ pressed }) => [styles.shopStrip, pressed && styles.pressed]}>
            <View style={styles.shopIcon}>
              <Store size={16} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption" lines={1}>
                {L({ uz: 'Doʻkon', uz_cyrl: 'Дўкон', ru: 'Магазин' })}
              </AppText>
              <AppText variant="strong" lines={1}>
                {shop.name}
              </AppText>
            </View>
            <AppText variant="small" color={colors.primary} lines={1}>
              {L({ uz: 'Almashtirish', uz_cyrl: 'Алмаштириш', ru: 'Сменить' })}
            </AppText>
          </Pressable>
        ) : (
          <View style={[styles.shopStrip, styles.shopStripEmpty]}>
            <View style={[styles.shopIcon, styles.shopIconWarn]}>
              <Store size={16} color={colors.warning} />
            </View>
            <AppText variant="strong" lines={2} style={styles.flex}>
              {L({
                uz: 'Buyurtma uchun avval doʻkonni tanlang',
                uz_cyrl: 'Буюртма учун аввал дўконни танланг',
                ru: 'Для заказа сначала выберите магазин',
              })}
            </AppText>
            <Button title={L({ uz: 'Tanlash', uz_cyrl: 'Танлаш', ru: 'Выбрать' })} size="sm" onPress={goToShops} />
          </View>
        )}

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={L({ uz: 'Tovar nomi yoki kodi', uz_cyrl: 'Товар номи ёки коди', ru: 'Название или код товара' })}
        />
        <Segmented options={categoryOptions} value={selectedCat} onChange={setSelectedCat} />
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderProduct}
        extraData={[items, selectedUnits, shop, lang]}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <PackageSearch size={28} color={colors.textMuted} />
            <AppText variant="small" align="center">
              {L(COMMON.empty)}
            </AppText>
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
    backgroundColor: colors.background,
  },
  shopStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  shopStripEmpty: { backgroundColor: colors.warningLight },
  shopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopIconWarn: { backgroundColor: colors.card },

  list: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xl, gap: space.md },
  product: { gap: space.md },
  productActive: { borderColor: colors.primaryBorder },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl },



  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  cartCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 90,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryDark,
  },
});
