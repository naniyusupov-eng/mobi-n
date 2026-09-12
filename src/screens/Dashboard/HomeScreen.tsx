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

        {/* Mobi-S Legendary 6 Big Action Tiles */}
        <Text style={styles.sectionHeader}>{t('tab_home').toUpperCase()}</Text>
        <View style={styles.gridContainer}>
          {/* Tile 1: Marshrut / Mijozlar */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => navigation.navigate('ShopsTab')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#E3F2FD' }]}>
              <MapPin size={26} color={colors.primary} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('home_menu_route')}</Text>
              <Text style={styles.tileDesc}>{t('shop_visited_today')}, {t('shop_debt')}</Text>
            </View>
            <View style={styles.tileBadge}>
              <Text style={styles.tileBadgeText}>{routeProgress.total}</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 2: Hujjatlar / Zakazlar */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => navigation.navigate('HistoryTab')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <FileText size={26} color={colors.success} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('home_menu_docs')}</Text>
              <Text style={styles.tileDesc}>{t('history_title')}</Text>
            </View>
            <View style={[styles.tileBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.tileBadgeText, { color: colors.success }]}>{stats.orderCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 3: Tovarlar / Qoldiqlar */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => navigation.navigate('CatalogTab')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Package size={26} color={colors.accent} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('tab_catalog')}</Text>
              <Text style={styles.tileDesc}>{t('catalog_in_stock')}, {t('catalog_price_dona')}, {t('catalog_price_blok')}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Tile 4: Maʼlumot almashish */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={handleSyncNow}
            activeOpacity={0.75}
            disabled={isSyncing}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#EDE7F6' }]}>
              <RefreshCw size={26} color="#673AB7" />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('home_menu_sync')}</Text>
              <Text style={styles.tileDesc}>
                {lastSyncedAt ? `${t('profile_last_sync')} ${lastSyncedAt}` : t('profile_never_synced')}
              </Text>
            </View>
            {pendingCount > 0 && (
              <View style={[styles.tileBadge, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.tileBadgeText, { color: colors.danger }]}>+{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Tile 5: Hisobotlar */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => navigation.navigate('ReportsTab')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#FCE4EC' }]}>
              <BarChart3 size={26} color="#C2185B" />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('home_menu_reports')}</Text>
              <Text style={styles.tileDesc}>{t('reports_total_sales')}, {t('reports_cash')}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Tile 6: Parametrlar & Til */}
          <TouchableOpacity
            style={styles.gridTile}
            onPress={() => navigation.navigate('ProfileTab')}
            activeOpacity={0.75}
          >
            <View style={[styles.tileIconCircle, { backgroundColor: '#ECEFF1' }]}>
              <Settings size={26} color={colors.secondary} />
            </View>
            <View style={styles.tileTextContainer}>
              <Text style={styles.tileTitle}>{t('home_menu_settings')}</Text>
              <Text style={styles.tileDesc}>{t('profile_language_title')}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Mobi-S Bottom Status Bar */}
        <View style={styles.systemStatusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('profile_server_title')}:</Text>
            <Text style={styles.statusValue}>SQLite Offline</Text>
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
  gridContainer: {
    gap: 8,
    marginBottom: 14,
  },
  gridTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  tileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileTextContainer: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tileDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tileBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tileBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
