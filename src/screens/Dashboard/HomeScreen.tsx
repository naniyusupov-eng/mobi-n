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
import { shopRepository } from '../../database/shopRepository';
import { colors } from '../../theme/colors';
import {
  MapPin,
  FileText,
  Package,
  RefreshCw,
  BarChart3,
  Settings,
  ChevronRight,
  User,
  Store,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react-native';

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { agent } = useAuthStore();
  const { isSyncing, pendingCount, refreshPendingCount, triggerSync, lastSyncedAt } = useSyncStore();
  const { lang, setLang, t } = useLanguageStore();

  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    cashCollected: 0,
  });
  const [routeProgress, setRouteProgress] = useState({ visited: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (agent?.id) {
      const todayStats = orderRepository.getTodayStats(agent.id);
      setStats(todayStats);
    }
    const todayShops = shopRepository.getAll(undefined, 'Dushanba');
    const visitedCount = todayShops.filter((s) => Boolean(s.lastVisitedAt)).length;
    setRouteProgress({ visited: visitedCount, total: todayShops.length });
    refreshPendingCount();
  }, [agent?.id, refreshPendingCount]);

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
      Alert.alert(t('home_sync_title'), `${t('home_sync_success')}\n(${res.syncedOrders} doc, ${res.syncedShops} shop)`);
      loadData();
    } else {
      Alert.alert(t('warning'), t('home_sync_failed'));
    }
  };

  const dateLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const nextLang = lang === 'uz' ? 'ru' : lang === 'ru' ? 'uz_cyrl' : 'uz';
  const langLabel = lang === 'uz' ? '🇺🇿 UZ' : lang === 'ru' ? '🇷🇺 RU' : '🇺🇿 ЎЗБ';

  const { shop } = useCartStore();
  const { currentShop, setCurrentShop } = useShopStore();
  const activeShop = shop || currentShop;

  const progressPct =
    routeProgress.total > 0 ? Math.round((routeProgress.visited / routeProgress.total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Mobi-S Iconic Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.appBrand}>{t('home_brand')}</Text>
          <View style={styles.onlineBadge}>
            <View style={[styles.statusDot, { backgroundColor: pendingCount > 0 ? colors.accent : '#4CAF50' }]} />
            <Text style={styles.onlineText}>
              {pendingCount > 0 ? `${t('home_to_export')} ${pendingCount}` : t('home_base_actual')}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Quick Language Toggle */}
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={() => setLang(nextLang)}
            activeOpacity={0.7}
          >
            <Text style={styles.langToggleText}>{langLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerSyncBtn} onPress={handleSyncNow} disabled={isSyncing}>
            <RefreshCw size={16} color="#fff" style={isSyncing ? { transform: [{ rotate: '45deg' }] } : {}} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Agent Info Strip */}
      <View style={styles.agentStrip}>
        <View style={styles.agentStripRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <User size={14} color={colors.primaryLight} />
            <Text style={styles.agentName}>{agent?.name || 'Agent'}</Text>
          </View>
          <Text style={styles.agentCode}>[{agent?.code || 'ID'}]</Text>
        </View>
        <View style={styles.agentStripRow}>
          <Text style={styles.territoryText}>{t('profile_route')} {agent?.territory || 'Hudud'}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </Text>
        </View>
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

        {/* Route Progress Visual Card */}
        <View style={styles.routeProgressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.progressTitle}>{t('home_route_plan')}</Text>
            </View>
            <Text style={styles.progressRatio}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>{routeProgress.visited}</Text> / {routeProgress.total} ({progressPct}%)
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${Math.max(4, progressPct)}%` }]} />
          </View>
        </View>

        {/* KPI Mini-Dashboard Strip */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('home_route_plan')}</Text>
            <Text style={styles.kpiVal}>
              <Text style={{ color: colors.primary }}>{routeProgress.visited}</Text>/{routeProgress.total}
            </Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('home_orders_count')}</Text>
            <Text style={styles.kpiVal}>{stats.orderCount} {t('pcs')}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>{t('home_sales_today')}</Text>
            <Text style={[styles.kpiVal, { color: colors.primary }]}>
              {stats.totalSales > 0 ? `${(stats.totalSales / 1000).toFixed(0)}k` : '0'}
              <Text style={styles.kpiUnit}> {t('currency')}</Text>
            </Text>
          </View>
        </View>

        {/* Mobi-S 2-Column Ergonomic Grid (6 Core Actions) */}
        <Text style={styles.sectionHeader}>{t('tab_home').toUpperCase()}</Text>
        <View style={styles.grid2Col}>
          {/* Tile 1: Marshrut / Mijozlar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ShopsTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E3F2FD' }]}>
                <MapPin size={22} color={colors.primary} />
              </View>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{routeProgress.total}</Text>
              </View>
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_route')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('shop_visited_today')}</Text>
          </TouchableOpacity>

          {/* Tile 2: Hujjatlar / Zakazlar */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('HistoryTab')}
            activeOpacity={0.75}
          >
            <View style={styles.actionCardTop}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                <FileText size={22} color={colors.success} />
              </View>
              <View style={[styles.actionBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.actionBadgeText, { color: colors.success }]}>{stats.orderCount}</Text>
              </View>
            </View>
            <Text style={styles.actionTitle} numberOfLines={1}>{t('home_menu_docs')}</Text>
            <Text style={styles.actionSub} numberOfLines={1}>{t('history_title')}</Text>
          </TouchableOpacity>

          {/* Tile 3: Tovarlar / Qoldiqlar */}
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

          {/* Tile 4: Maʼlumot almashish */}
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

          {/* Tile 5: Hisobotlar */}
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

          {/* Tile 6: Parametrlar & Til */}
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

        {/* Mobi-S Bottom Status Bar */}
        <View style={styles.systemStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('profile_server_title')}:</Text>
            <Text style={styles.statusValue}>SQLite Offline (NestJS Ready)</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('reports_cash')}:</Text>
            <Text style={[styles.statusValue, { fontWeight: '800', color: colors.primary }]}>
              {stats.cashCollected.toLocaleString(dateLocale)} {t('currency')}
            </Text>
          </View>
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
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appBrand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  langToggleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  headerSyncBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  agentStrip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  agentStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 1,
  },
  agentName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  agentCode: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  territoryText: {
    color: colors.primaryLight,
    fontSize: 11,
  },
  dateText: {
    color: colors.primaryLight,
    fontSize: 11,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: colors.border,
    height: '80%',
    alignSelf: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  kpiUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
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
  routeProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  progressRatio: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
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
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  systemStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});

