import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import {
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  Receipt,
  ShoppingBag,
  StickyNote,
  Store,
  User,
} from 'lucide-react-native';
import { AppText, Badge, Button, Card, Divider, EmptyState, Money, Row, Screen, SectionHeader } from '../../components/ui';
import { OrderCard } from '../../components/shared';
import { COMMON, Tri, useL } from '../../i18n/tri';
import { useShopStore } from '../../store/shopStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { formatMoney, formatShopNum } from '../../utils/format';
import { CREDIT_TX, creditLeft, formatDebtDays, isCreditClosed } from '../../utils/credit';
import { Order, Shop } from '../../types';
import { colors, radius, space } from '../../theme/colors';
import { dialPhone, shopDayLabel, shopRouteCode, splitPhones } from '../../components/shopHelpers';

const TX = {
  notFound: { uz: 'Doʻkon maʼlumotlari topilmadi', uz_cyrl: 'Дўкон маълумотлари топилмади', ru: 'Данные магазина не найдены' },
  owner: { uz: 'Masʼul', uz_cyrl: 'Масъул', ru: 'Ответственный' },
  balance: { uz: 'Qarz qoldigʻi', uz_cyrl: 'Қарз қолдиғи', ru: 'Остаток долга' },
  checkIn: { uz: 'Tashrifni belgilash', uz_cyrl: 'Ташрифни белгилаш', ru: 'Отметить визит' },
  openMap: { uz: 'Xaritada', uz_cyrl: 'Харитада', ru: 'На карте' },
  history: { uz: 'Buyurtmalar tarixi', uz_cyrl: 'Буюртмалар тарихи', ru: 'История заказов' },
  noOrders: { uz: 'Hozircha buyurtmalar yoʻq', uz_cyrl: 'Ҳозирча буюртмалар йўқ', ru: 'Заказов пока нет' },
  gpsTitle: { uz: 'Joylashuv', uz_cyrl: 'Жойлашув', ru: 'Геолокация' },
  gpsDenied: { uz: 'Geolokatsiyaga ruxsat berilmadi', uz_cyrl: 'Геолокацияга рухсат берилмади', ru: 'Доступ к геопозиции отклонён' },
  gpsError: { uz: 'Joylashuvni aniqlab boʻlmadi', uz_cyrl: 'Жойлашувни аниқлаб бўлмади', ru: 'Не удалось определить местоположение' },
  visitSaved: {
    uz: 'Doʻkonga tashrifingiz GPS orqali saqlandi.\nKoordinatalar:',
    uz_cyrl: 'Дўконга ташрифингиз GPS орқали сақланди.\nКоординаталар:',
    ru: 'Визит сохранён по GPS.\nКоординаты:',
  },
  noCoords: {
    uz: 'Ushbu doʻkonning GPS koordinatasi kiritilmagan',
    uz_cyrl: 'Ушбу дўконнинг GPS координатаси киритилмаган',
    ru: 'Координаты GPS для этого магазина не указаны',
  },
} satisfies Record<string, Tri>;

export const ShopDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { shopId } = route.params;
  const { currentShop, markShopVisited, setCurrentShop, shops, loadShops } = useShopStore();
  const setCartShop = useCartStore((s) => s.setShop);
  const lang = useLanguageStore((s) => s.lang);
  const L = useL();

  const [shop, setShop] = useState<Shop | null>(
    currentShop?.id === shopId ? currentShop : shops.find((s) => s.id === shopId) || null
  );
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const loadOrders = useCallback(() => {
    if (shopId) setPastOrders(orderRepository.getAll(shopId));
  }, [shopId]);

  // Orders made from this page show up when coming back from the cart
  useEffect(() => {
    loadOrders();
    return navigation.addListener('focus', loadOrders);
  }, [navigation, loadOrders]);

  // After a payment: reload the debt from the phone database
  const refreshShop = () => {
    loadShops();
    const fresh = shopRepository.getById(shopId);
    if (fresh) setShop((prev) => ({ ...fresh, lastVisitedAt: fresh.lastVisitedAt ?? prev?.lastVisitedAt }));
  };

  const handleStartOrder = () => {
    if (!shop) return;
    setCurrentShop(shop);
    setCartShop(shop);
    navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
  };

  const handleRegisterVisit = async () => {
    try {
      setIsCheckingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(L(TX.gpsTitle), L(TX.gpsDenied));
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (shop) {
        markShopVisited(shop.id);
        setShop({ ...shop, lastVisitedAt: new Date().toISOString() });
        Alert.alert(
          `${L(COMMON.visited)} ✅`,
          `${L(TX.visitSaved)} ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch {
      Alert.alert(L(COMMON.error), L(TX.gpsError));
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleOpenMap = () => {
    if (shop?.latitude && shop?.longitude) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`);
    } else {
      Alert.alert(L(COMMON.warning), L(TX.noCoords));
    }
  };

  if (!shop) {
    return (
      <Screen>
        <EmptyState icon={Store} title={L(TX.notFound)} />
      </Screen>
    );
  }

  const routeCode = shopRouteCode(shop);
  const phones = splitPhones(shop.phone);
  const hasDebt = shop.debtBalance > 0;
  const limit = shop.creditLimit || 0;
  const left = creditLeft(shop);
  const overLimit = !!shop.overLimit || (limit > 0 && shop.debtBalance > limit);
  const creditClosed = isCreditClosed(shop);

  return (
    <Screen
      footer={<Button title={L(COMMON.newOrder)} icon={ShoppingBag} size="lg" onPress={handleStartOrder} />}
    >
      {/* Passport */}
      <Card>
        <Row gap={6} wrap>
          {shop.num != null ? <Badge label={`№${formatShopNum(shop.num)}`} tone="primary" /> : null}
          {routeCode ? <Badge label={routeCode} /> : null}
          <Badge label={shopDayLabel(shop, lang)} />
          {shop.lastVisitedAt ? <Badge icon={CheckCircle2} label={L(COMMON.visited)} tone="success" /> : null}
        </Row>

        <AppText variant="h2" lines={3}>
          {shop.name}
        </AppText>

        <Divider style={styles.divider} />

        {shop.ownerName ? (
          <InfoRow icon={User} label={L(TX.owner)}>
            <AppText lines={2}>{shop.ownerName}</AppText>
          </InfoRow>
        ) : null}

        {phones.map((p) => (
          <Pressable key={p} onPress={() => dialPhone(p)} style={({ pressed }) => pressed && styles.pressed}>
            <InfoRow icon={Phone} label={L(COMMON.call)}>
              <AppText color={colors.primary} style={styles.bold} lines={1}>
                {p}
              </AppText>
            </InfoRow>
          </Pressable>
        ))}

        {shop.address ? (
          <InfoRow icon={MapPin}>
            <AppText lines={2}>{shop.address}</AppText>
          </InfoRow>
        ) : null}

        {shop.notes ? (
          <InfoRow icon={StickyNote}>
            <AppText lines={2}>{shop.notes}</AppText>
          </InfoRow>
        ) : null}
      </Card>

      {/* Debt */}
      <Card style={hasDebt ? styles.debtCard : undefined}>
        <Row gap={space.md}>
          <View style={styles.flex}>
            <AppText variant="small" color={hasDebt ? colors.danger : colors.textSecondary} lines={1}>
              {L(TX.balance)}
            </AppText>
            {hasDebt ? (
              <Money amount={shop.debtBalance} variant="h2" color={colors.danger} />
            ) : (
              <AppText variant="title" color={colors.success} lines={1}>
                {L(COMMON.noDebt)}
              </AppText>
            )}
            {hasDebt && shop.debtDays != null ? (
              <AppText variant="small" color={colors.danger} lines={1}>
                {`${L(CREDIT_TX.debtAge)}: ${formatDebtDays(shop.debtDays, lang)}`}
              </AppText>
            ) : null}
          </View>
        </Row>
        {shop.overdue || overLimit || creditClosed ? (
          <Row gap={6} wrap>
            {shop.overdue ? <Badge label={L(CREDIT_TX.overdueBadge)} tone="danger" /> : null}
            {overLimit ? <Badge label={L(CREDIT_TX.overLimitBadge)} tone="warning" /> : null}
            {creditClosed && !shop.overdue ? <Badge label={L(CREDIT_TX.closedBadge)} tone="danger" /> : null}
          </Row>
        ) : null}
        {limit > 0 ? (
          <AppText variant="small" lines={2}>
            {`${L(CREDIT_TX.limit)}: ${formatMoney(limit, lang)} · ${L({ uz: 'qoldi', uz_cyrl: 'қолди', ru: 'осталось' })}: ${formatMoney(left ?? 0, lang)}`}
          </AppText>
        ) : null}
      </Card>

      {/* GPS check-in & map */}
      <Row gap={space.sm}>
        <Button
          title={L(TX.checkIn)}
          icon={CheckCircle2}
          variant="outline"
          onPress={handleRegisterVisit}
          loading={isCheckingLocation}
          style={styles.flex}
        />
        <Button title={L(TX.openMap)} icon={Navigation} variant="outline" onPress={handleOpenMap} style={styles.flex} />
      </Row>

      {/* Order history */}
      <SectionHeader title={`${L(TX.history)} · ${pastOrders.length}`} />
      {pastOrders.length === 0 ? (
        <Card>
          <EmptyState icon={Receipt} title={L(TX.noOrders)} />
        </Card>
      ) : (
        <Card style={styles.historyCard}>
          {pastOrders.map((ord, i) => (
            <View key={ord.id}>
              {i > 0 ? <Divider /> : null}
              <OrderCard order={ord} showDate showShop={false} />
            </View>
          ))}
        </Card>
      )}

    </Screen>
  );
};

/** Icon + optional small label + value; the value side wraps instead of overflowing */
const InfoRow: React.FC<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, label, children }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>
      <Icon size={15} color={colors.textSecondary} />
    </View>
    <View style={styles.flex}>
      {label ? (
        <AppText variant="caption" lines={1}>
          {label}
        </AppText>
      ) : null}
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '600' },
  pressed: { opacity: 0.6 },
  divider: { marginVertical: space.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtCard: { backgroundColor: colors.dangerLight, borderColor: colors.dangerLight },
  historyCard: { paddingVertical: 0, gap: 0 },
});
