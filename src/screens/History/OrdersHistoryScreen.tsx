import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { invoiceService } from '../../services/invoiceService';
import { useLanguageStore } from '../../store/languageStore';
import { useDateStore } from '../../store/dateStore';
import { Order } from '../../types';
import { colors } from '../../theme/colors';
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

export const OrdersHistoryScreen = ({ navigation }: { navigation: any }) => {
  const { lang, t } = useLanguageStore();
  const { workingDate, shiftWorkingDay, getFormattedWorkingDate } = useDateStore();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filterMode, setFilterMode] = useState<'day' | 'all'>('day');
  const [refreshing, setRefreshing] = useState(false);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const loadOrders = () => {
    const list = orderRepository.getAll();
    setAllOrders(list);
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
    setRefreshing(false);
  };

  // Filter orders by working date or show all
  const filteredOrders = useMemo(() => {
    if (filterMode === 'all') {
      return allOrders;
    }
    return allOrders.filter((order) => {
      const orderDate = order.deliveryDate || (order.createdAt ? order.createdAt.split('T')[0] : '');
      return orderDate === workingDate;
    });
  }, [allOrders, filterMode, workingDate]);

  // Daily statistics
  const dailyStats = useMemo(() => {
    const count = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    return { count, totalAmount };
  }, [filteredOrders]);

  const handleShareReceipt = async (order: Order) => {
    try {
      const fullOrder = orderRepository.getById(order.id);
      if (!fullOrder) return;
      const shop = shopRepository.getById(order.shopId);
      await invoiceService.printOrSharePdf(fullOrder, shop);
    } catch (e: any) {
      Alert.alert(t('error'), 'PDF error');
    }
  };

  const getPaymentLabel = (pm: string) => {
    if (pm === 'naqd') return t('checkout_pay_cash');
    if (pm === 'nasiya') return t('checkout_pay_debt');
    return t('checkout_pay_bank');
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      {/* Top Document Header Line */}
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <FileText size={15} color={colors.primary} />
          <Text style={styles.docType}>№{item.id.slice(-6).toUpperCase()}</Text>
        </View>

        {item.isSynced ? (
          <View style={styles.syncedBadge}>
            <CheckCircle2 size={12} color={colors.success} />
            <Text style={styles.syncedText}>1C Sync</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Clock size={12} color={colors.warning} />
            <Text style={styles.pendingText}>{t('home_to_export')}</Text>
          </View>
        )}
      </View>

      {/* Client Name */}
      <Text style={styles.shopName}>{item.shopName}</Text>

      {/* Meta Row: Date, Payment Type */}
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>
          {item.deliveryDate ? `📅 ${item.deliveryDate}` : new Date(item.createdAt).toLocaleDateString(numLocale)}
        </Text>
        <Text style={[styles.paymentMethod, item.paymentMethod === 'nasiya' && { color: colors.danger }]}>
          {getPaymentLabel(item.paymentMethod)}
        </Text>
      </View>

      {/* Footer Strip */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>{t('checkout_total_final')}</Text>
          <Text style={styles.totalAmount}>
            {item.finalAmount.toLocaleString(numLocale)} {t('currency')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.printBtn}
          onPress={() => handleShareReceipt(item)}
          activeOpacity={0.8}
        >
          <Printer size={15} color={colors.primary} />
          <Text style={styles.printBtnText}>{t('order_print_receipt')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Date Navigation Bar for Daily Archive */}
      <View style={styles.dateRibbon}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(-1)}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.dateCenterContent}>
          <Calendar size={15} color={colors.primary} />
          <Text style={styles.dateRibbonText}>{getFormattedWorkingDate(lang)}</Text>
        </View>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(1)}
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Mode Toggle & Daily Summary Ribbon */}
      <View style={styles.summaryRibbon}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, filterMode === 'day' && styles.toggleBtnActive]}
            onPress={() => setFilterMode('day')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleBtnText, filterMode === 'day' && styles.toggleBtnTextActive]}>
              {lang === 'ru' ? 'За этот день' : lang === 'uz_cyrl' ? 'Шу кун' : 'Shu kun'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, filterMode === 'all' && styles.toggleBtnActive]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleBtnText, filterMode === 'all' && styles.toggleBtnTextActive]}>
              {lang === 'ru' ? 'Все заказы' : lang === 'uz_cyrl' ? 'Барчаси' : 'Barchasi'} ({allOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {lang === 'ru' ? 'Заказов:' : 'Buyurtmalar:'}{' '}
            <Text style={styles.statsHighlight}>{dailyStats.count} {t('pcs')}</Text>
          </Text>
          <Text style={styles.statsText}>
            {lang === 'ru' ? 'Сумма:' : 'Jami:'}{' '}
            <Text style={styles.statsHighlight}>{dailyStats.totalAmount.toLocaleString(numLocale)} {t('currency')}</Text>
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>
              {filterMode === 'day'
                ? (lang === 'ru' ? 'В этот день заказов не было' : 'Ushbu kunda zakazlar mavjud emas')
                : t('history_empty')}
            </Text>
            {filterMode === 'day' && allOrders.length > 0 && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setFilterMode('all')}
              >
                <Text style={styles.emptyActionBtnText}>
                  {lang === 'ru' ? 'Показать все заказы' : 'Barcha arxivni koʻrish'} ({allOrders.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 10,
    gap: 8,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  docType: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  paymentMethod: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primaryDark,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primaryLight,
  },
  printBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  emptyActionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dateRibbon: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
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
  },
  dateRibbonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  summaryRibbon: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statsHighlight: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
