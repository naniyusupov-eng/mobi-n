import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { Shop, Order } from '../../types';
import { colors } from '../../theme/colors';

type ReportTab = 'sales' | 'debts' | 'cash';

export const ReportsScreen = () => {
  const { agent } = useAuthStore();
  const { t, lang } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, cashCollected: 0 });
  const [debtShops, setDebtShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Segmented Sub Tabs */}
      <View style={styles.subTabs}>
        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'sales' && styles.subTabItemActive]}
          onPress={() => setActiveTab('sales')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeTab === 'sales' && styles.subTabTextActive]}>
            {t('rep_sales_day')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'debts' && styles.subTabItemActive]}
          onPress={() => setActiveTab('debts')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeTab === 'debts' && styles.subTabTextActive]}>
            {t('rep_client_debts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeTab === 'cash' && styles.subTabItemActive]}
          onPress={() => setActiveTab('cash')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeTab === 'cash' && styles.subTabTextActive]}>
            {t('rep_agent_cash')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'sales' && (
          <View style={styles.tabContent}>
            {/* KPI Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.cardHeaderTitle}>{t('rep_summary_today')}</Text>

              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_total_orders')}</Text>
                <Text style={styles.rowValBold}>{stats.orderCount} {t('rep_docs_count')}</Text>
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_total_sales')}</Text>
                <Text style={[styles.rowValBold, { color: colors.primary }]}>
                  {stats.totalSales.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_cash')}</Text>
                <Text style={[styles.rowValBold, { color: colors.success }]}>
                  {stats.cashCollected.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>

              <View style={styles.rowItem}>
                <Text style={styles.rowLabel}>{t('reports_debt')}</Text>
                <Text style={[styles.rowValBold, { color: colors.danger }]}>
                  {Math.max(0, stats.totalSales - stats.cashCollected).toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            </View>

            {/* List of Orders */}
            <Text style={styles.sectionTitle}>{t('rep_orders_today')}</Text>
            {orders.slice(0, 10).map((ord) => (
              <View key={ord.id} style={styles.orderRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderShopName} numberOfLines={1}>{ord.shopName}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(ord.createdAt).toLocaleTimeString(numLocale, { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {ord.paymentMethod === 'naqd'
                      ? t('checkout_pay_cash')
                      : ord.paymentMethod === 'nasiya'
                      ? t('checkout_pay_debt')
                      : t('checkout_pay_bank')}
                  </Text>
                </View>
                <Text style={styles.orderFinalSum}>
                  {ord.finalAmount.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'debts' && (
          <View style={styles.tabContent}>
            {/* Total Debt Banner */}
            <View style={[styles.summaryCard, { backgroundColor: colors.dangerLight, borderColor: '#FECDD3' }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.danger }]}>
                {t('rep_debt_receivable')}
              </Text>
              <Text style={styles.totalDebtNumber}>
                {totalDebt.toLocaleString(numLocale)} {t('currency')}
              </Text>
              <Text style={styles.totalDebtSub}>
                {debtShops.length} {t('home_of')}
              </Text>
            </View>

            {/* Debtor Shops List */}
            <Text style={styles.sectionTitle}>{t('rep_client_debts')}</Text>
            {debtShops.map((s) => (
              <View key={s.id} style={styles.orderRowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderShopName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.orderTime}>{s.ownerName} • {s.address}</Text>
                </View>
                <Text style={[styles.orderFinalSum, { color: colors.danger }]}>
                  {s.debtBalance.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'cash' && (
          <View style={styles.tabContent}>
            <View style={[styles.summaryCard, { backgroundColor: colors.successLight, borderColor: '#BBF7D0' }]}>
              <Text style={[styles.cardHeaderTitle, { color: colors.success }]}>
                {t('rep_agent_cash')}
              </Text>
              <Text style={[styles.totalDebtNumber, { color: colors.success }]}>
                {stats.cashCollected.toLocaleString(numLocale)} {t('currency')}
              </Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabItemActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  tabContent: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowValBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 2,
  },
  orderRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  orderShopName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  orderTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  orderFinalSum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  totalDebtNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 4,
  },
  totalDebtSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
