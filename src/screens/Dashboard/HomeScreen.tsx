import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { useCartStore } from '../../store/cartStore';
import { useShopStore } from '../../store/shopStore';
import { useDateStore } from '../../store/dateStore';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { invoiceService } from '../../services/invoiceService';
import { Order } from '../../types';
import { colors } from '../../theme/colors';
import {
  Calendar,
  Store,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ShoppingBag,
} from 'lucide-react-native';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { agent } = useAuthStore();
  const isSyncing = useSyncStore((state) => state.isSyncing);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const refreshPendingCount = useSyncStore((state) => state.refreshPendingCount);
  const triggerSync = useSyncStore((state) => state.triggerSync);
  const { lang, t } = useLanguageStore();

  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    cashCollected: 0,
  });
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { shop } = useCartStore();
  const { currentShop } = useShopStore();
  const activeShop = shop || currentShop;

  const { workingDate, shiftWorkingDay, resetToToday, getFormattedWorkingDate } = useDateStore();
  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const loadData = useCallback(() => {
    if (agent?.id) {
      const s = orderRepository.getTodayStats(agent.id);
      setStats(s);
    }
    const all = orderRepository.getAll();
    const filtered = all.filter((o) => {
      const orderDate = o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
      return orderDate === workingDate;
    });
    setTodayOrders(filtered);
    refreshPendingCount();
  }, [agent?.id, workingDate, refreshPendingCount]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    const res = await triggerSync();
    if (res.success) {
      Alert.alert(t('home_sync_title'), t('home_sync_success'));
      loadData();
    } else {
      Alert.alert(t('warning'), t('home_sync_failed'));
    }
  };

  const handlePrintReceipt = async (order: Order) => {
    try {
      const fullOrder = orderRepository.getById(order.id);
      if (!fullOrder) return;
      const sh = shopRepository.getById(order.shopId);
      await invoiceService.printOrSharePdf(fullOrder, sh);
    } catch (e: any) {
      Alert.alert(t('error'), 'PDF error');
    }
  };

  const getPaymentLabel = (pm: string) => {
    if (pm === 'naqd') return t('checkout_pay_cash');
    if (pm === 'nasiya') return t('checkout_pay_debt');
    return t('checkout_pay_bank');
  };

  const debtAmount = Math.max(0, stats.totalSales - stats.cashCollected);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Minimalist Top App Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appBrand}>Mobi_R</Text>
          {agent && (
            <View style={styles.agentBadge}>
              <Text style={styles.agentBadgeText}>{agent.code}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.syncHeaderBtn, pendingCount > 0 && styles.syncHeaderBtnPending]}
          onPress={handleSyncNow}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color={pendingCount > 0 ? colors.warning : colors.primary} />
          <Text style={[styles.syncHeaderText, pendingCount > 0 && { color: colors.warning }]}>
            {isSyncing ? t('loading') : pendingCount > 0 ? `+${pendingCount}` : '1C'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Ribbon - Clean & Documental */}
      <View style={styles.dateRibbon}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(-1)}
          activeOpacity={0.6}
        >
          <ChevronLeft size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateCenterContent}
          onPress={resetToToday}
          activeOpacity={0.7}
        >
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.dateRibbonText}>{getFormattedWorkingDate(lang)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(1)}
          activeOpacity={0.6}
        >
          <ChevronRight size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Active Client / Document Session Banner */}
        {activeShop ? (
          <View style={styles.activeShopCard}>
            <View style={styles.activeShopHeader}>
              <View style={styles.activeShopBadge}>
                <Store size={13} color={colors.primary} />
                <Text style={styles.activeShopBadgeText}>{t('checkout_client')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('ShopsTab')}
                activeOpacity={0.7}
              >
                <Text style={styles.changeShopLink}>{lang === 'ru' ? 'Сменить' : 'Almashtirish'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.activeShopName} numberOfLines={1}>{activeShop.name}</Text>
            <Text style={styles.activeShopAddress} numberOfLines={1}>{activeShop.address}</Text>

            <TouchableOpacity
              style={styles.startOrderBtn}
              onPress={() => navigation.navigate('CatalogTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.startOrderBtnText}>{t('tab_catalog')} ({t('home_menu_order')})</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectShopPrompt}
            onPress={() => navigation.navigate('ShopsTab')}
            activeOpacity={0.8}
          >
            <View style={styles.selectShopIconBox}>
              <Store size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectShopTitle}>{lang === 'ru' ? 'Выберите торговую точку' : 'Mijozni tanlang'}</Text>
              <Text style={styles.selectShopSub}>{lang === 'ru' ? 'Для оформления нового заказа' : 'Yangi buyurtma ochish uchun'}</Text>
            </View>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* 4 Clean Micro KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('home_orders_count')}</Text>
            <Text style={styles.kpiValue}>
              {stats.orderCount} <Text style={styles.kpiUnit}>{t('pcs')}</Text>
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('home_sales_today')}</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              {stats.totalSales > 0 ? (stats.totalSales / 1000).toLocaleString(numLocale, { maximumFractionDigits: 1 }) + 'k' : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('reports_cash')}</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>
              {stats.cashCollected > 0 ? (stats.cashCollected / 1000).toLocaleString(numLocale, { maximumFractionDigits: 1 }) + 'k' : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('reports_debt')}</Text>
            <Text style={[styles.kpiValue, { color: debtAmount > 0 ? colors.danger : colors.textSecondary }]}>
              {debtAmount > 0 ? (debtAmount / 1000).toLocaleString(numLocale, { maximumFractionDigits: 1 }) + 'k' : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>
        </View>

        {/* Today's Orders / Live Feed Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('rep_orders_today')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('HistoryTab')} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>{t('tab_history')} →</Text>
          </TouchableOpacity>
        </View>

        {todayOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShoppingBag size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {lang === 'ru' ? 'На эту дату заказов пока нет' : 'Ushbu sanada buyurtmalar mavjud emas'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => navigation.navigate('ShopsTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>{lang === 'ru' ? 'Оформить заказ' : 'Buyurtma olish'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {todayOrders.map((ord) => (
              <View key={ord.id} style={styles.orderItemCard}>
                <View style={styles.orderTopRow}>
                  <View style={styles.orderIdPill}>
                    <Text style={styles.orderIdText}>#{ord.id.slice(-6).toUpperCase()}</Text>
                  </View>

                  <View style={styles.orderTopRight}>
                    {ord.isSynced ? (
                      <View style={styles.syncedChip}>
                        <CheckCircle2 size={11} color={colors.success} />
                        <Text style={styles.syncedChipText}>1C</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingChip}>
                        <Clock size={11} color={colors.warning} />
                        <Text style={styles.pendingChipText}>{t('home_to_export')}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.printIconBtn}
                      onPress={() => handlePrintReceipt(ord)}
                      activeOpacity={0.7}
                    >
                      <Printer size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.orderShopName} numberOfLines={1}>{ord.shopName}</Text>

                <View style={styles.orderBottomRow}>
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderTimeText}>
                      {new Date(ord.createdAt).toLocaleTimeString(numLocale, { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.orderDot}>•</Text>
                    <Text style={[styles.orderPayMethod, ord.paymentMethod === 'nasiya' && { color: colors.danger }]}>
                      {getPaymentLabel(ord.paymentMethod)}
                    </Text>
                  </View>

                  <Text style={styles.orderFinalSum}>
                    {ord.finalAmount.toLocaleString(numLocale)} {t('currency')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Utilities Strip */}
        <View style={styles.quickUtilities}>
          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={() => navigation.navigate('ShopsTab', { screen: 'AddShopModal' })}
            activeOpacity={0.7}
          >
            <PlusCircle size={16} color={colors.primary} />
            <Text style={styles.utilityBtnText}>{t('nav_new_shop')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilityBtn}
            onPress={handleSyncNow}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={colors.primary} />
            <Text style={styles.utilityBtnText}>{t('home_menu_sync')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    height: 52,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBrand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  agentBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  syncHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  syncHeaderBtnPending: {
    backgroundColor: colors.warningLight,
    borderColor: '#FDE68A',
  },
  syncHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  dateRibbon: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateNavBtn: {
    width: 32,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dateRibbonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  activeShopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeShopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeShopBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  changeShopLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  activeShopName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activeShopAddress: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  startOrderBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  startOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectShopPrompt: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectShopIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectShopTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  selectShopSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  kpiUnit: {
    fontSize: 9,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyActionBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  ordersList: {
    gap: 8,
    marginBottom: 14,
  },
  orderItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  orderTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.warning,
  },
  printIconBtn: {
    padding: 3,
  },
  orderShopName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTimeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  orderDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  orderPayMethod: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  orderFinalSum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  quickUtilities: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  utilityBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  utilityBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
});
