/**
 * Orders journal: one working day at a time (prev / next / today) or all days at once,
 * with a short summary and the order list.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react-native';
import { AppText, Button, Card, Divider, EmptyState, IconButton, KeyValue, Money, Row, Screen, Segmented } from '../../components/ui';
import { OrderCard } from '../../components/shared';
import { orderRepository } from '../../database/orderRepository';
import { useLanguageStore } from '../../store/languageStore';
import { getTodayDateString, useDateStore } from '../../store/dateStore';
import { COMMON, PAYMENT_LABELS, useL } from '../../i18n/tri';
import { formatDayLong } from '../../utils/format';
import { Order } from '../../types';
import { colors, space } from '../../theme/colors';

type Mode = 'day' | 'all';

const TEXT = {
  thisDay: { uz: 'Shu kun', uz_cyrl: 'Шу кун', ru: 'За день' },
  emptyDay: { uz: 'Bu kunda buyurtmalar yoʻq', uz_cyrl: 'Бу кунда буюртмалар йўқ', ru: 'В этот день заказов не было' },
  showAll: { uz: 'Barcha buyurtmalarni koʻrish', uz_cyrl: 'Барча буюртмаларни кўриш', ru: 'Показать все заказы' },
};

const orderDay = (o: Order) => o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');

export const OrdersHistoryScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const { lang, t } = useLanguageStore();
  const { workingDate, shiftWorkingDay, resetToToday } = useDateStore();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [mode, setMode] = useState<Mode>('day');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(() => setAllOrders(orderRepository.getAll()), []);

  useEffect(() => {
    loadOrders();
    return navigation.addListener('focus', loadOrders);
  }, [navigation, loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
    setRefreshing(false);
  };

  const orders = useMemo(
    () => (mode === 'all' ? allOrders : allOrders.filter((o) => orderDay(o) === workingDate)),
    [allOrders, mode, workingDate]
  );

  const summary = useMemo(() => {
    const sum = (list: Order[]) => list.reduce((s, o) => s + (o.finalAmount || 0), 0);
    return {
      count: orders.length,
      total: sum(orders),
      cash: sum(orders.filter((o) => o.paymentMethod === 'naqd')),
      debt: sum(orders.filter((o) => o.paymentMethod === 'nasiya')),
      transfer: sum(orders.filter((o) => o.paymentMethod === 'otkazma')),
    };
  }, [orders]);

  const isToday = workingDate === getTodayDateString();

  const header = (
    <View style={styles.header}>
      <Card style={styles.summary}>
        <Row gap={space.md}>
          <View style={styles.flex}>
            <AppText variant="small" lines={1}>
              {L(COMMON.total)}
            </AppText>
            <Money amount={summary.total} variant="h2" />
          </View>
          <AppText variant="small" lines={1} style={styles.count}>
            {summary.count} {L(COMMON.ordersCount)}
          </AppText>
        </Row>
        {summary.count > 0 ? (
          <>
            <Divider />
            <KeyValue label={L(PAYMENT_LABELS.naqd)} value={<Money amount={summary.cash} variant="body" color={colors.success} />} />
            <KeyValue label={L(PAYMENT_LABELS.nasiya)} value={<Money amount={summary.debt} variant="body" color={colors.danger} />} />
            {summary.transfer > 0 ? (
              <KeyValue label={L(PAYMENT_LABELS.otkazma)} value={<Money amount={summary.transfer} variant="body" />} />
            ) : null}
          </>
        ) : null}
      </Card>
    </View>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.toolbar}>
        <Segmented<Mode>
          options={[
            { key: 'day', label: L(TEXT.thisDay) },
            { key: 'all', label: t('history_all'), count: allOrders.length },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'day' ? (
          <Row gap={space.sm}>
            <IconButton icon={ChevronLeft} onPress={() => shiftWorkingDay(-1)} />
            <Pressable onPress={resetToToday} disabled={isToday} style={styles.dayCenter}>
              <AppText variant="strong" align="center" lines={1}>
                {formatDayLong(workingDate, lang)}
              </AppText>
              <AppText variant="caption" align="center" lines={1} color={isToday ? colors.textMuted : colors.primary}>
                {L(COMMON.today)}
              </AppText>
            </Pressable>
            <IconButton icon={ChevronRight} onPress={() => shiftWorkingDay(1)} />
          </Row>
        ) : null}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card padded={false} style={styles.item}>
            <OrderCard order={item} showDate={mode === 'all'} />
          </Card>
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={FileText}
            title={mode === 'day' ? L(TEXT.emptyDay) : t('history_empty')}
            action={
              mode === 'day' && allOrders.length > 0 ? (
                <Button title={L(TEXT.showAll)} variant="secondary" size="sm" onPress={() => setMode('all')} />
              ) : undefined
            }
          />
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  toolbar: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayCenter: { flex: 1, minWidth: 0, alignItems: 'center' },
  header: { marginBottom: space.xs },
  summary: { gap: space.sm },
  count: { flexShrink: 0, maxWidth: '45%' },
  list: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  item: { paddingHorizontal: space.md },
});
