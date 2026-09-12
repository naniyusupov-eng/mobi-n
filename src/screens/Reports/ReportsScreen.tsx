import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { Shop, Order } from '../../types';
import { colors } from '../../theme/colors';
import {
  BarChart2,
  AlertCircle,
  Banknote,
  TrendingUp,
  FileText,
  Users,
} from 'lucide-react-native';

type ReportTab = 'sales' | 'debts' | 'cash';

export const ReportsScreen = () => {
  const { agent } = useAuthStore();
  const { t, lang } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, cashCollected: 0 });
  const [debtShops, setDebtShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (agent?.id) {
      const todayStats = orderRepository.getTodayStats(agent.id);
      setStats(todayStats);
    }
    const allShops = shopRepository.getAll();
    const withDebts = allShops.filter((s) => s.debtBalance > 0).sort((a, b) => b.debtBalance - a.debtBalance);
    setDebtShops(withDebts);

    const allOrders = orderRepository.getAll();
    setOrders(allOrders);
  }, [agent?.id]);

  const totalDebt = debtShops.reduce((sum, s) => sum + s.debtBalance, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobi-S Sub-navigation Tabs */}
      <View style={styles.subTabs}>
        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'sales' && styles.subTabItemActive]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.subTabText, activeTab === 'sales' && styles.subTabTextActive]}>
            {t('rep_sales_day')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'debts' && styles.subTabItemActive]}
          onPress={() => setActiveTab('debts')}
        >
          <Text style={[styles.subTabText, activeTab === 'debts' && styles.subTabTextActive]}>
            {t('rep_client_debts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'cash' && styles.subTabItemActive]}
          onPress={() => setActiveTab('cash')}
        >
          <Text style={[styles.subTabText, activeTab === 'cash' && styles.subTabTextActive]}>
            {t('rep_agent_cash')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'sales' && (
          <View style={styles.tabContent}>
            {/* KPI Cards */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>{t('rep_summary_today')}</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_total_orders')}</Text>
                <Text style={styles.rowValBold}>{stats.orderCount} {t('rep_docs_count')}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_total_sales')}</Text>
                <Text style={[styles.rowValBold, { color: colors.primary, fontSize: 16 }]}>
                  {stats.totalSales.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_cash')}</Text>
                <Text style={[styles.rowValBold, { color: colors.success }]}>
                  {stats.cashCollected.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_debt')}</Text>
                <Text style={[styles.rowValBold, { color: colors.danger }]}>
                  {(stats.totalSales - stats.cashCollected).toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
            </View>

            {/* List of Today's Orders */}
            <Text style={styles.sectionTitle}>{t('rep_orders_today')}</Text>
            {orders.slice(0, 10).map((ord) => (
              <View key={ord.id} style={styles.orderRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderShopName}>{ord.shopName}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(ord.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {ord.paymentMethod === 'naqd' ? t('checkout_pay_cash') : ord.paymentMethod === 'nasiya' ? t('checkout_pay_debt') : t('checkout_pay_bank')}
                  </Text>
                </View>
                <Text style={styles.orderFinalSum}>
                  {ord.finalAmount.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'debts' && (
          <View style={styles.tabContent}>
            {/* Total Debt Banner */}
            <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.danger }]}>
                {t('rep_debt_receivable')}
              </Text>
              <Text style={styles.totalDebtNumber}>
                {totalDebt.toLocaleString('ru-RU')} <Text style={{ fontSize: 14 }}>{t('currency')}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {t('rep_debtors_count')} {debtShops.length}
              </Text>
            </View>

            {/* Table of Debtor Shops */}
            <Text style={styles.sectionTitle}>{t('rep_debtors_list')}</Text>
            {debtShops.map((shop, idx) => (
              <View key={shop.id} style={styles.debtShopRow}>
                <Text style={styles.debtShopIdx}>{idx + 1}.</Text>
                <View style={{ flex: 1, paddingHorizontal: 8 }}>
                  <Text style={styles.debtShopName}>{shop.name}</Text>
                  <Text style={styles.debtShopOwner}>{shop.ownerName} • {shop.address}</Text>
                </View>
                <Text style={styles.debtShopAmount}>
                  {shop.debtBalance.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'cash' && (
          <View style={styles.tabContent}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>{t('rep_cash_movement')}</Text>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('rep_cash_received')}</Text>
                <Text style={[styles.rowValBold, { color: colors.success, fontSize: 16 }]}>
                  {stats.cashCollected.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('rep_cash_turned_in')}</Text>
                <Text style={styles.rowValBold}>0 {t('currency')}</Text>
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('rep_cash_balance')}</Text>
                <Text style={[styles.rowValBold, { color: colors.primary, fontSize: 16 }]}>
                  {stats.cashCollected.toLocaleString('ru-RU')} {t('currency')}
                </Text>
              </View>
            </View>
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
  subTabs: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: colors.accent,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CFD8DC',
  },
  subTabTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  tabContent: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 6,
    marginLeft: 4,
  },
  orderRowCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderShopName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  orderTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orderFinalSum: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
  },
  totalDebtNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.danger,
  },
  debtShopRow: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtShopIdx: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    width: 20,
  },
  debtShopName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  debtShopOwner: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  debtShopAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.danger,
  },
});
