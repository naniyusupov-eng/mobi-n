import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const filteredOrders = useMemo(() => {
    if (filterMode === 'all') {
      return allOrders;
    }
    return allOrders.filter((order) => {
      const orderDate = order.deliveryDate || (order.createdAt ? order.createdAt.split('T')[0] : '');
      return orderDate === workingDate;
    });
  }, [allOrders, filterMode, workingDate]);

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
        <View style={styles.docIdPill}>
          <Text style={styles.docIdText}>№{item.id.slice(-6).toUpperCase()}</Text>
        </View>

        {item.isSynced ? (
          <View style={styles.syncedBadge}>
            <CheckCircle2 size={11} color={colors.success} />
            <Text style={styles.syncedText}>1C Sync</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Clock size={11} color={colors.warning} />
            <Text style={styles.pendingText}>{t('home_to_export')}</Text>
          </View>
        )}
      </View>

      {/* Client Name */}
      <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>

      {/* Meta Row: Date, Payment Type */}
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>
          {item.deliveryDate ? `📅 ${item.deliveryDate}` : new Date(item.createdAt).toLocaleDateString(numLocale)}
        </Text>
        <Text style={styles.dot}>•</Text>
        <Text style={[styles.paymentMethod, item.paymentMethod === 'nasiya' && { color: colors.danger }]}>
          {getPaymentLabel(item.paymentMethod)}
        </Text>
      </View>

      {/* Footer Strip */}
      <View style={styles.cardFooter}>
        <Text style={styles.totalAmount}>
          {item.finalAmount.toLocaleString(numLocale)} {t('currency')}
        </Text>

        <TouchableOpacity
          style={styles.printBtn}
          onPress={() => handleShareReceipt(item)}
          activeOpacity={0.7}
        >
          <Printer size={14} color={colors.primary} />
          <Text style={styles.printBtnText}>{t('order_print_receipt')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Date Navigation Bar for Daily Archive */}
      <View style={styles.dateRibbon}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(-1)}
          activeOpacity={0.6}
        >
          <ChevronLeft size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.dateCenterContent}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.dateRibbonText}>{getFormattedWorkingDate(lang)}</Text>
        </View>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => shiftWorkingDay(1)}
          activeOpacity={0.6}
        >
          <ChevronRight size={16} color={colors.textSecondary} />
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
              {lang === 'ru' ? 'За этот день' : 'Shu kun'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, filterMode === 'all' && styles.toggleBtnActive]}
            onPress={() => setFilterMode('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleBtnText, filterMode === 'all' && styles.toggleBtnTextActive]}>
              {lang === 'ru' ? 'Все' : 'Barchasi'} ({allOrders.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {dailyStats.count} {t('pcs')}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.statsHighlight}>
            {dailyStats.totalAmount.toLocaleString(numLocale)} {t('currency')}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {filterMode === 'day'
                ? (lang === 'ru' ? 'В этот день заказов не было' : 'Ushbu kunda buyurtmalar mavjud emas')
                : t('history_empty')}
            </Text>
            {filterMode === 'day' && allOrders.length > 0 && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setFilterMode('all')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>
                  {lang === 'ru' ? 'Показать все заказы' : 'Barcha buyurtmalarni koʻrish'}
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
  },
  dateRibbonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  summaryRibbon: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  toggleBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  toggleBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  dot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  docIdPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  docIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.warning,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  paymentMethod: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  printBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyActionBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
