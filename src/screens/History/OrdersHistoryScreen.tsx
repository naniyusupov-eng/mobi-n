import React, { useEffect, useState } from 'react';
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
import { Order } from '../../types';
import { colors } from '../../theme/colors';
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';

export const OrdersHistoryScreen = ({ navigation }: { navigation: any }) => {
  const { lang, t } = useLanguageStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const loadOrders = () => {
    const list = orderRepository.getAll();
    setOrders(list);
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

      {/* Meta Row: Date, Payment Type, Total */}
      <View style={styles.metaRow}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleString(numLocale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.paymentMethod}>
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
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>{t('history_empty')}</Text>
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
  },
});
