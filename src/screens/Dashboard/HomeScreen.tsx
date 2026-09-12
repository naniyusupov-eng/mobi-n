import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { useCartStore } from '../../store/cartStore';
import { useShopStore } from '../../store/shopStore';
import { orderRepository } from '../../database/orderRepository';
import { colors } from '../../theme/colors';
import {
  Calendar,
  Store,
  FileText,
  Package,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react-native';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { agent } = useAuthStore();
  const { isSyncing, pendingCount, refreshPendingCount, triggerSync } = useSyncStore();
  const { lang, t } = useLanguageStore();

  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    cashCollected: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { shop } = useCartStore();
  const { currentShop } = useShopStore();
  const activeShop = shop || currentShop;

  const loadData = useCallback(() => {
    setCurrentDate(new Date());
    if (agent?.id) {
      const todayStats = orderRepository.getTodayStats(agent.id);
      setStats(todayStats);
    }
    refreshPendingCount();
  }, [agent?.id, refreshPendingCount]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
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

  const shiftDay = (days: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = () => {
    const now = new Date();
    return (
      currentDate.getDate() === now.getDate() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()
    );
  };

  const getFormattedDateWithDay = () => {
    const now = currentDate;
    const day = now.getDate();
    const year = now.getFullYear();

    const uzMonths = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    const ruMonths = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    const cyrlMonths = [
      'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
      'Июл', 'Август', 'Сентябр', 'Октабр', 'Ноябр', 'Декабр'
    ];

    const uzWeekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const ruWeekdays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const cyrlWeekdays = ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'];

    const monthIndex = now.getMonth();
    const dayOfWeekIndex = now.getDay();

    if (lang === 'ru') {
      return `${day} ${ruMonths[monthIndex]}, ${year} (${ruWeekdays[dayOfWeekIndex]})`;
    } else if (lang === 'uz_cyrl') {
      return `${day}-${cyrlMonths[monthIndex]}, ${year} (${cyrlWeekdays[dayOfWeekIndex]})`;
    } else {
      return `${day}-${uzMonths[monthIndex]}, ${year} (${uzWeekdays[dayOfWeekIndex]})`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Top Header Bar - Clean Centered Mobi_R without reload icon */}
      <View style={styles.topHeader}>
        <Text style={styles.appBrand}>Mobi_R</Text>
      </View>

      {/* Interactive Date Ribbon with Day navigation */}
      <View style={styles.dateRibbon}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftDay(-1)}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateCenterContent}
          onPress={resetToToday}
          activeOpacity={0.7}
        >
          <View style={styles.dateIconCircle}>
            <Calendar size={15} color={colors.primary} />
          </View>
          <Text style={styles.dateRibbonText}>{getFormattedDateWithDay()}</Text>
          {isToday() ? (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{lang === 'ru' ? 'Сегодня' : 'Bugun'}</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={resetToToday} style={styles.todayActionBtn}>
              <Text style={styles.todayActionText}>{lang === 'ru' ? 'На сегодня' : 'Bugunga'}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftDay(1)}
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Active Selected Shop Banner (If any shop chosen) */}
        {activeShop && (
          <TouchableOpacity
            style={styles.activeShopBanner}
            onPress={() => navigation.navigate('CatalogTab')}
            activeOpacity={0.8}
          >
            <View style={styles.activeShopLeft}>
              <View style={styles.activeShopIcon}>
                <Store size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeShopSubLabel}>{t('checkout_client')}:</Text>
                <Text style={styles.activeShopName} numberOfLines={1}>{activeShop.name}</Text>
              </View>
            </View>
            <View style={styles.activeShopAction}>
              <Text style={styles.activeShopActionText}>{t('tab_catalog')}</Text>
              <ArrowRight size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        )}

        {/* 3 Balanced KPI Business Cards */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('home_orders_count')}</Text>
            <Text style={styles.kpiVal}>
              {stats.orderCount} <Text style={styles.kpiUnit}>{t('pcs')}</Text>
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('home_sales_today')}</Text>
            <Text style={[styles.kpiVal, { color: colors.primary }]}>
              {stats.totalSales > 0 ? `${(stats.totalSales / 1000).toFixed(0)}k` : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('reports_cash')}</Text>
            <Text style={[styles.kpiVal, { color: '#16A34A' }]}>
              {stats.cashCollected > 0 ? `${(stats.cashCollected / 1000).toFixed(0)}k` : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>
        </View>

        {/* 2-Column Action Grid */}
        <Text style={styles.sectionHeader}>{t('tab_home').toUpperCase()}</Text>
        <View style={styles.grid2Col}>
          {/* Tile 1: Doʻkonlar / Mijozlar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ShopsTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                <Store size={22} color={colors.primary} />
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_route')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('tab_shops')}</Text>
          </TouchableOpacity>

          {/* Tile 2: Buyurtmalar / Hujjatlar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('HistoryTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                <FileText size={22} color={colors.success} />
              </View>
              {stats.orderCount > 0 && (
                <View style={[styles.actionBadge, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.actionBadgeText, { color: colors.success }]}>{stats.orderCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_docs')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('history_title')}</Text>
          </TouchableOpacity>

          {/* Tile 3: Tovarlar / Katalog */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('CatalogTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Package size={22} color={colors.accent} />
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('tab_catalog')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('catalog_in_stock')}</Text>
          </TouchableOpacity>

          {/* Tile 4: Hisobotlar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ReportsTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FCE4EC' }]}>
                <BarChart3 size={22} color="#C2185B" />
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_reports')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('reports_total_sales')}</Text>
          </TouchableOpacity>

          {/* Tile 5: Maʼlumotlarni yangilash */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSyncNow}
            activeOpacity={0.75}
            disabled={isSyncing}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#EDE7F6' }]}>
                <RefreshCw size={22} color="#673AB7" />
              </View>
              {pendingCount > 0 && (
                <View style={[styles.actionBadge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.actionBadgeText, { color: colors.danger }]}>+{pendingCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_sync')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>
              {pendingCount > 0 ? `${pendingCount} ${t('home_to_export')}` : t('home_base_actual')}
            </Text>
          </TouchableOpacity>

          {/* Tile 6: Sozlamalar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ProfileTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ECEFF1' }]}>
                <Settings size={22} color={colors.secondary} />
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_settings')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('profile_language_title')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    height: 52,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  appBrand: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  dateRibbon: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
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
  dateIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRibbonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  todayBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  todayActionBtn: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayActionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  activeShopBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeShopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeShopIcon: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeShopSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  activeShopName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  activeShopAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeShopActionText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '75%',
    alignSelf: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  kpiUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
});
