import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { orderRepository } from '../../database/orderRepository';
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
} from 'lucide-react-native';

export const ShopDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { shopId } = route.params;
  const { currentShop, markShopVisited, setCurrentShop, shops } = useShopStore();
  const { t, lang } = useLanguageStore();

  const [shop, setShop] = useState<Shop | null>(
    currentShop?.id === shopId ? currentShop : shops.find((s) => s.id === shopId) || null
  );
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  useEffect(() => {
    if (shopId) {
      const orders = orderRepository.getAll(shopId);
      setPastOrders(orders);
    }
  }, [shopId]);

  const handleStartOrder = () => {
    if (shop) {
      setCurrentShop(shop);
      navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
    }
  };

  const handleRegisterVisit = async () => {
    try {
      setIsCheckingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS', lang === 'ru' ? 'Доступ к геопозиции отклонен' : lang === 'uz_cyrl' ? 'Геолокацияга рухсат берилмади' : 'Geolokatsiyaga ruxsat berilmadi');
        setIsCheckingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      if (shop) {
        markShopVisited(shop.id);
        Alert.alert(
          t('shop_visited_today') + ' ✅',
          (lang === 'ru' ? 'Визит успешно сохранен по GPS.\nКоординаты: ' : lang === 'uz_cyrl' ? 'Дўконга ташрифингиз GPS орқали муваффақиятли сақланди.\nКоординаталар: ' : 'Doʻkonga tashrifingiz GPS orqali muvaffaqiyatli saqlandi.\nKoordinatalar: ') +
            `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
        );
        setShop({ ...shop, lastVisitedAt: new Date().toISOString() });
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message || 'GPS xatoligi');
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleOpenMap = () => {
    if (shop?.latitude && shop?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert(t('warning'), lang === 'ru' ? 'Координаты GPS для данной точки не указаны' : lang === 'uz_cyrl' ? 'Ушбу дўконнинг GPS координатаси киритилмаган' : 'Ushbu doʻkonning GPS koordinatasi kiritilmagan');
    }
  };

  if (!shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {lang === 'ru' ? 'Данные точки не найдены' : lang === 'uz_cyrl' ? 'Дўкон маълумотлари топилмади' : 'Doʻkon maʼlumotlari topilmadi'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Shop Info Card */}
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            <View style={styles.dayPill}>
              <Calendar size={12} color={colors.primaryDark} />
              <Text style={styles.dayText}>{shop.visitDay}</Text>
            </View>
            {shop.lastVisitedAt ? (
              <View style={styles.visitedPill}>
                <CheckCircle2 size={12} color={colors.success} />
                <Text style={styles.visitedText}>{t('shop_visited_today')}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.title}>{shop.name}</Text>
          <Text style={styles.ownerText}>{t('shop_responsible')} {shop.ownerName}</Text>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.rowText}>{shop.address}</Text>
          </View>

          <View style={styles.rowItem}>
            <Phone size={16} color={colors.textSecondary} />
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${shop.phone}`)}>
              <Text style={styles.phoneLink}>{shop.phone}</Text>
            </TouchableOpacity>
          </View>

          {/* Debt Alert Box */}
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
                  ? `${shop.debtBalance.toLocaleString('ru-RU')} ${t('currency')}`
                  : t('shop_no_debt_text')}
              </Text>
            </View>
            {shop.debtBalance > 0 && <AlertCircle size={24} color={colors.danger} />}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.orderBtn}
            onPress={handleStartOrder}
            activeOpacity={0.8}
          >
            <ShoppingBag size={20} color="#fff" />
            <Text style={styles.orderBtnText}>{t('shop_action_order')}</Text>
          </TouchableOpacity>

          <View style={styles.subActionsRow}>
            <TouchableOpacity
              style={styles.subActionBtn}
              onPress={handleRegisterVisit}
              disabled={isCheckingLocation}
            >
              <CheckCircle2 size={16} color={colors.secondary} />
              <Text style={styles.subActionText}>
                {isCheckingLocation
                  ? (lang === 'ru' ? 'Проверка GPS...' : lang === 'uz_cyrl' ? 'GPS текширилмоқда...' : 'GPS tekshirilmoqda...')
                  : t('shop_action_visit')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subActionBtn} onPress={handleOpenMap}>
              <Navigation size={16} color={colors.secondary} />
              <Text style={styles.subActionText}>{t('shop_open_map')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Past Orders for This Shop */}
        <Text style={styles.historyTitle}>{t('shop_prev_orders')}</Text>
        {pastOrders.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Receipt size={32} color={colors.textMuted} />
            <Text style={styles.emptyHistoryText}>{t('shop_no_prev_orders')}</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {pastOrders.map((ord) => (
              <View key={ord.id} style={styles.orderItemCard}>
                <View style={styles.orderItemHeader}>
                  <Text style={styles.orderIdText}>#{ord.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(ord.createdAt).toLocaleDateString('ru-RU')}
                  </Text>
                </View>
                <View style={styles.orderItemFooter}>
                  <Text style={styles.orderAmount}>
                    {ord.finalAmount.toLocaleString('ru-RU')} {t('currency')}
                  </Text>
                  <Text
                    style={[
                      styles.paymentMethodBadge,
                      {
                        color: ord.paymentMethod === 'nasiya' ? colors.danger : colors.success,
                      },
                    ]}
                  >
                    {ord.paymentMethod === 'naqd' ? t('checkout_pay_cash') : ord.paymentMethod === 'nasiya' ? t('checkout_pay_debt') : t('checkout_pay_bank')}
                  </Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  visitedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  visitedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  ownerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  phoneLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  debtBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  debtBoxRed: {
    backgroundColor: colors.dangerLight,
    borderColor: '#FECACA',
  },
  debtBoxGreen: {
    backgroundColor: colors.successLight,
    borderColor: '#BBF7D0',
  },
  debtLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  debtValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  orderBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  orderBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subActionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  emptyHistory: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  historyList: {
    gap: 8,
  },
  orderItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  paymentMethodBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});
