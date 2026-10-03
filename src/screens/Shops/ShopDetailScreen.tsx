import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useShopStore } from '../../store/shopStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { orderRepository } from '../../database/orderRepository';
import { invoiceService } from '../../services/invoiceService';
import { Order, Shop } from '../../types';
import { colors } from '../../theme/colors';
import {
  Store,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  Receipt,
  Navigation,
  Printer,
} from 'lucide-react-native';

export const ShopDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { shopId } = route.params;
  const { currentShop, markShopVisited, setCurrentShop, shops } = useShopStore();
  const { setShop: setCartShop } = useCartStore();
  const { t, lang } = useLanguageStore();

  const [shop, setShop] = useState<Shop | null>(
    currentShop?.id === shopId ? currentShop : shops.find((s) => s.id === shopId) || null
  );
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  useEffect(() => {
    if (shopId) {
      const orders = orderRepository.getAll(shopId);
      setPastOrders(orders);
    }
  }, [shopId]);

  const handleStartOrder = () => {
    if (shop) {
      setCurrentShop(shop);
      setCartShop(shop);
      navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
    }
  };

  const handleRegisterVisit = async () => {
    try {
      setIsCheckingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'GPS',
          lang === 'ru'
            ? 'Доступ к геопозиции отклонен'
            : lang === 'uz_cyrl'
            ? 'Геолокацияга рухсат берилмади'
            : 'Geolokatsiyaga ruxsat berilmadi'
        );
        setIsCheckingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (shop) {
        markShopVisited(shop.id);
        setShop({ ...shop, lastVisitedAt: new Date().toISOString() });
        Alert.alert(
          t('shop_visited_today') + ' ✅',
          (lang === 'ru'
            ? 'Визит успешно сохранен по GPS.\nКоординаты: '
            : lang === 'uz_cyrl'
            ? 'Дўконга ташрифингиз GPS орқали сақланди.\nКоординаталар: '
            : 'Doʻkonga tashrifingiz GPS orqali saqlandi.\nKoordinatalar: ') +
            `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
        );
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message || 'GPS');
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleOpenMap = () => {
    if (shop?.latitude && shop?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert(
        t('warning'),
        lang === 'ru'
          ? 'Координаты GPS для данной точки не указаны'
          : lang === 'uz_cyrl'
          ? 'Ушбу дўконнинг GPS координатаси киритилмаган'
          : 'Ushbu doʻkonning GPS koordinatasi kiritilmagan'
      );
    }
  };

  const handlePrintReceipt = async (order: Order) => {
    try {
      const fullOrder = orderRepository.getById(order.id);
      if (!fullOrder || !shop) return;
      await invoiceService.printOrSharePdf(fullOrder, shop);
    } catch (e: any) {
      Alert.alert(t('error'), 'PDF error');
    }
  };

  if (!shop) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {lang === 'ru' ? 'Данные точки не найдены' : lang === 'uz_cyrl' ? 'Дўкон маълумотлари топилмади' : 'Doʻkon maʼlumotlari topilmadi'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Document Passport Card */}
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            <View style={styles.dayChip}>
              <Calendar size={12} color={colors.textSecondary} />
              <Text style={styles.dayText}>{shop.visitDay}</Text>
            </View>

            {shop.lastVisitedAt ? (
              <View style={styles.visitedChip}>
                <CheckCircle2 size={12} color={colors.success} />
                <Text style={styles.visitedText}>{t('shop_visited_today')}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{shop.name}</Text>
          <Text style={styles.ownerText}>{t('shop_responsible')}: {shop.ownerName}</Text>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <MapPin size={15} color={colors.textMuted} />
            <Text style={styles.rowText}>{shop.address}</Text>
          </View>

          {shop.phone ? (
            <View style={styles.rowItem}>
              <Phone size={15} color={colors.textMuted} />
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${shop.phone}`)}>
                <Text style={styles.phoneLink}>{shop.phone}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Debt Indicator */}
          <View style={[styles.debtBox, shop.debtBalance > 0 ? styles.debtBoxRed : styles.debtBoxGreen]}>
            <View>
              <Text style={styles.debtLabel}>{t('shop_balance_debt')}</Text>
              <Text
                style={[
                  styles.debtValue,
                  { color: shop.debtBalance > 0 ? colors.danger : colors.success },
                ]}
              >
                {shop.debtBalance > 0
                  ? `${shop.debtBalance.toLocaleString(numLocale)} ${t('currency')}`
                  : t('shop_no_debt_text')}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary Action: Start Order */}
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handleStartOrder}
          activeOpacity={0.8}
        >
          <ShoppingBag size={18} color="#FFFFFF" />
          <Text style={styles.orderBtnText}>{t('shop_action_order')}</Text>
        </TouchableOpacity>

        {/* Secondary Actions: GPS Check-in & Google Maps */}
        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={handleRegisterVisit}
            disabled={isCheckingLocation}
            activeOpacity={0.7}
          >
            {isCheckingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <CheckCircle2 size={16} color={colors.primary} />
            )}
            <Text style={styles.subActionText}>
              {isCheckingLocation
                ? (lang === 'ru' ? 'GPS...' : 'GPS...')
                : t('shop_action_visit')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={handleOpenMap}
            activeOpacity={0.7}
          >
            <Navigation size={16} color={colors.primary} />
            <Text style={styles.subActionText}>{t('shop_open_map')}</Text>
          </TouchableOpacity>
        </View>

        {/* Past Orders for This Shop */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('shop_prev_orders')}</Text>
          <Text style={styles.sectionBadge}>{pastOrders.length}</Text>
        </View>

        {pastOrders.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Receipt size={28} color={colors.textMuted} />
            <Text style={styles.emptyHistoryText}>{t('shop_no_prev_orders')}</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {pastOrders.map((ord) => (
              <View key={ord.id} style={styles.orderItemCard}>
                <View style={styles.orderItemHeader}>
                  <View style={styles.orderIdPill}>
                    <Text style={styles.orderIdText}>#{ord.id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.orderDate}>
                    {new Date(ord.createdAt).toLocaleDateString(numLocale)}
                  </Text>
                </View>

                <View style={styles.orderItemFooter}>
                  <Text style={styles.orderAmount}>
                    {ord.finalAmount.toLocaleString(numLocale)} {t('currency')}
                  </Text>

                  <View style={styles.orderFooterRight}>
                    <Text
                      style={[
                        styles.paymentMethodBadge,
                        ord.paymentMethod === 'nasiya' && { color: colors.danger },
                      ]}
                    >
                      {ord.paymentMethod === 'naqd'
                        ? t('checkout_pay_cash')
                        : ord.paymentMethod === 'nasiya'
                        ? t('checkout_pay_debt')
                        : t('checkout_pay_bank')}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handlePrintReceipt(ord)}
                      style={styles.printBtn}
                    >
                      <Printer size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  visitedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  visitedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  ownerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  phoneLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  debtBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 6,
  },
  debtBoxRed: {
    backgroundColor: colors.dangerLight,
  },
  debtBoxGreen: {
    backgroundColor: colors.successLight,
  },
  debtLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  debtValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  subActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  subActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyHistoryText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  historyList: {
    gap: 8,
  },
  orderItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  orderDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  orderFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  printBtn: {
    padding: 4,
  },
});
