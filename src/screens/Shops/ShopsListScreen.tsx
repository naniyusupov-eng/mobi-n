import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CalendarOff, CheckCircle2, MapPin, Phone, Plus, ShoppingBag, Store } from 'lucide-react-native';
import { AppText, Badge, Button, Card, Divider, EmptyState, IconButton, Money, Row, Screen, SearchBar, Segmented } from '../../components/ui';
import { COMMON, Tri, useL } from '../../i18n/tri';
import { useShopStore } from '../../store/shopStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { useSyncStore } from '../../store/syncStore';
import { todayRouteDay } from '../../services/lineService';
import { formatShopNum } from '../../utils/format';
import { callShop, shopDayLabel, shopRouteCode, splitPhones } from '../../components/shopHelpers';
import { Shop } from '../../types';
import { colors, space } from '../../theme/colors';

// ---------------------------------------------------------------- Texts

type FilterTab = 'today' | 'all' | 'debt' | 'visited';

const TX = {
  search: { uz: 'Nomi, egasi yoki manzil', uz_cyrl: 'Номи, эгаси ёки манзил', ru: 'Название, владелец или адрес' },
  today: { uz: 'Bugungi marshrut', uz_cyrl: 'Бугунги маршрут', ru: 'Маршрут на сегодня' },
  withDebt: { uz: 'Qarzdorlar', uz_cyrl: 'Қарздорлар', ru: 'С долгом' },
  sunday: {
    uz: 'Bugun yakshanba — marshrut yoʻq. Faqat kuni belgilanmagan doʻkonlar koʻrsatilgan.',
    uz_cyrl: 'Бугун якшанба — маршрут йўқ. Фақат куни белгиланмаган дўконлар кўрсатилган.',
    ru: 'Сегодня воскресенье — маршрута нет. Показаны только магазины без дня визита.',
  },
  emptyToday: { uz: 'Bugungi marshrutda doʻkon yoʻq', uz_cyrl: 'Бугунги маршрутда дўкон йўқ', ru: 'На сегодня магазинов нет' },
  emptyDebt: { uz: 'Qarzdor doʻkonlar yoʻq', uz_cyrl: 'Қарздор дўконлар йўқ', ru: 'Магазинов с долгом нет' },
  emptyVisited: { uz: 'Hali hech qayerga borilmagan', uz_cyrl: 'Ҳали ҳеч қаерга борилмаган', ru: 'Посещений пока нет' },
  emptyAll: { uz: 'Doʻkonlar hali yuklanmagan', uz_cyrl: 'Дўконлар ҳали юкланмаган', ru: 'Магазины ещё не загружены' },
  emptyHint: {
    uz: 'Yangilash uchun roʻyxatni pastga torting',
    uz_cyrl: 'Янгилаш учун рўйхатни пастга тортинг',
    ru: 'Потяните список вниз, чтобы обновить',
  },
} satisfies Record<string, Tri>;

// ---------------------------------------------------------------- Shop card

interface ShopCardProps {
  shop: Shop;
  onOpen: (shop: Shop) => void;
  onOrder: (shop: Shop) => void;
  onCall: (shop: Shop) => void;
}

const ShopCard = memo(({ shop, onOpen, onOrder, onCall }: ShopCardProps) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const routeCode = shopRouteCode(shop);
  const hasPhone = splitPhones(shop.phone).length > 0;

  return (
    <Card onPress={() => onOpen(shop)}>
      <Row gap={6}>
        <Row gap={6} wrap style={styles.flex}>
          {shop.num != null ? <Badge label={`№${formatShopNum(shop.num)}`} tone="primary" /> : null}
          <Badge label={routeCode ?? shopDayLabel(shop, lang)} />
        </Row>
        {shop.lastVisitedAt ? <Badge icon={CheckCircle2} label={L(COMMON.visited)} tone="success" /> : null}
      </Row>

      <View style={styles.textBlock}>
        <AppText variant="title" lines={2}>
          {shop.name}
        </AppText>
        {shop.ownerName ? (
          <AppText variant="small" lines={1}>
            {shop.ownerName}
          </AppText>
        ) : null}
        {shop.address ? (
          <Row gap={6} style={styles.alignTop}>
            <MapPin size={13} color={colors.textMuted} style={styles.iconNudge} />
            <AppText variant="caption" lines={2} style={styles.flex}>
              {shop.address}
            </AppText>
          </Row>
        ) : null}
      </View>

      <Row gap={6} wrap>
        {shop.notes ? <Badge label={shop.notes} tone="warning" /> : null}
        {shop.debtBalance > 0 ? (
          <Row gap={6} style={styles.debt}>
            <AppText variant="small" color={colors.danger}>
              {L(COMMON.debt)}
            </AppText>
            <Money amount={shop.debtBalance} variant="small" color={colors.danger} style={styles.bold} />
          </Row>
        ) : (
          <Badge label={L(COMMON.noDebt)} tone="success" />
        )}
      </Row>

      <Divider style={styles.divider} />

      <Row gap={space.sm}>
        <Button title={L(COMMON.newOrder)} icon={ShoppingBag} size="sm" onPress={() => onOrder(shop)} style={styles.flex} />
        {hasPhone ? <IconButton icon={Phone} onPress={() => onCall(shop)} size={34} tone="primary" /> : null}
      </Row>
    </Card>
  );
});

// ---------------------------------------------------------------- Screen

export const ShopsListScreen = ({ navigation }: { navigation: any }) => {
  const { shops, loadShops, searchQuery, setSearchQuery, setCurrentShop } = useShopStore();
  const setCartShop = useCartStore((s) => s.setShop);
  const { triggerSync, isSyncing } = useSyncStore();
  const L = useL();

  const [activeTab, setActiveTab] = useState<FilterTab>('today');

  useEffect(() => {
    loadShops();
  }, []);

  // Pull to refresh: push queued orders/payments, then reload the line's shops and debts
  const handleRefresh = async () => {
    await triggerSync();
    loadShops();
  };

  const todayDay = todayRouteDay();

  const searched = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.ownerName || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
    );
  }, [shops, searchQuery]);

  const groups = useMemo(() => {
    // Today's route of the line, e.g. 4-3-6 on Saturday; shops added on the phone show every day
    const today = searched.filter((s) => s.routeDay == null || s.routeDay === todayDay);
    const debt = searched.filter((s) => s.debtBalance > 0);
    const visited = searched.filter((s) => Boolean(s.lastVisitedAt));
    return { today, all: searched, debt, visited } as Record<FilterTab, Shop[]>;
  }, [searched, todayDay]);

  const data = groups[activeTab];

  const handleOpen = useCallback(
    (shop: Shop) => {
      setCurrentShop(shop);
      navigation.navigate('ShopDetail', { shopId: shop.id });
    },
    [navigation, setCurrentShop]
  );

  const handleOrder = useCallback(
    (shop: Shop) => {
      setCurrentShop(shop);
      setCartShop(shop);
      navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
    },
    [navigation, setCurrentShop, setCartShop]
  );

  const handleCall = useCallback((shop: Shop) => callShop(shop, L(COMMON.call), L(COMMON.cancel)), [L]);

  const renderItem = useCallback(
    ({ item }: { item: Shop }) => (
      <ShopCard shop={item} onOpen={handleOpen} onOrder={handleOrder} onCall={handleCall} />
    ),
    [handleOpen, handleOrder, handleCall]
  );

  const emptyTitle = searchQuery.trim()
    ? L(COMMON.empty)
    : L({ today: TX.emptyToday, all: TX.emptyAll, debt: TX.emptyDebt, visited: TX.emptyVisited }[activeTab]);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Row gap={space.sm}>
          <View style={styles.flex}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={L(TX.search)} />
          </View>
          <IconButton icon={Plus} tone="primary" size={44} onPress={() => navigation.navigate('AddShopModal')} />
        </Row>
        <Segmented<FilterTab>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { key: 'today', label: L(TX.today), count: groups.today.length },
            { key: 'all', label: L(COMMON.all), count: groups.all.length },
            { key: 'debt', label: L(TX.withDebt), count: groups.debt.length },
            { key: 'visited', label: L(COMMON.visited), count: groups.visited.length },
          ]}
        />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          activeTab === 'today' && todayDay == null ? (
            <Card style={styles.notice}>
              <Row gap={space.sm} style={styles.alignTop}>
                <CalendarOff size={18} color={colors.warning} />
                <AppText variant="small" style={styles.flex}>
                  {L(TX.sunday)}
                </AppText>
              </Row>
            </Card>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon={Store} title={emptyTitle} hint={L(TX.emptyHint)} />}
      />

    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '700' },
  alignTop: { alignItems: 'flex-start' },
  iconNudge: { marginTop: 1 },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
    backgroundColor: colors.background,
  },
  list: { paddingHorizontal: space.lg, paddingTop: space.xs, paddingBottom: space.xxl, gap: space.md },
  textBlock: { gap: 3 },
  debt: { flexShrink: 1, minWidth: 0 },
  divider: { marginVertical: 2 },
  notice: { backgroundColor: colors.warningLight, borderColor: colors.warningLight },
});
