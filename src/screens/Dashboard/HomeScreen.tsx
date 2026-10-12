import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  CloudUpload,
  BarChart3,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { useCartStore } from '../../store/cartStore';
import { useShopStore } from '../../store/shopStore';
import { getTodayDateString, useDateStore } from '../../store/dateStore';
import { orderRepository } from '../../database/orderRepository';
import { Order } from '../../types';
import { colors, radius, space } from '../../theme/colors';
import { AppText, Badge, Button, Card, Divider, EmptyState, IconButton, Row, Screen, SectionHeader, Stat } from '../../components/ui';
import { OrderCard } from '../../components/shared';
import { COMMON, useL } from '../../i18n/tri';
import { formatDayLong, formatMoneyShort, formatNumber } from '../../utils/format';

type Stats = { totalSales: number; orderCount: number; cashCollected: number };

const orderDay = (o: Order) => o.deliveryDate || (o.createdAt ? o.createdAt.split('T')[0] : '');

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const agent = useAuthStore((s) => s.agent);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);
  const triggerSync = useSyncStore((s) => s.triggerSync);
  const cartShop = useCartStore((s) => s.shop);
  const currentShop = useShopStore((s) => s.currentShop);
  const activeShop = cartShop || currentShop;
  const { workingDate, shiftWorkingDay, resetToToday } = useDateStore();

  const [todayStats, setTodayStats] = useState<Stats>({ totalSales: 0, orderCount: 0, cashCollected: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isToday = workingDate === getTodayDateString();
  const lineCode = agent?.lineCode || agent?.territory || '';

  const loadData = useCallback(() => {
    if (agent?.id) setTodayStats(orderRepository.getTodayStats(agent.id));
    setOrders(orderRepository.getAll().filter((o) => orderDay(o) === workingDate));
    refreshPendingCount();
  }, [agent?.id, workingDate, refreshPendingCount]);

  useEffect(() => {
    loadData();
    return navigation.addListener('focus', loadData);
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  // Today uses the stored stats; another working day is summed from its orders
  const stats: Stats = useMemo(() => {
    if (isToday) return todayStats;
    return orders.reduce<Stats>(
      (acc, o) => ({
        totalSales: acc.totalSales + o.finalAmount,
        orderCount: acc.orderCount + 1,
        cashCollected: acc.cashCollected + (o.paymentMethod === 'naqd' ? o.finalAmount : 0),
      }),
      { totalSales: 0, orderCount: 0, cashCollected: 0 }
    );
  }, [isToday, todayStats, orders]);
  const debtAmount = Math.max(0, stats.totalSales - stats.cashCollected);

  const handleSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      Alert.alert(
        L({ uz: 'Sinxronlash', uz_cyrl: 'Синхронлаш', ru: 'Синхронизация' }),
        L({ uz: 'Maʼlumotlar yuborildi va yangilandi.', uz_cyrl: 'Маълумотлар юборилди ва янгиланди.', ru: 'Данные отправлены и обновлены.' })
      );
      loadData();
    } else {
      Alert.alert(
        L(COMMON.warning),
        L({
          uz: 'Serverga ulanib boʻlmadi. Maʼlumotlar telefonda saqlangan, keyinroq qayta urinib koʻring.',
          uz_cyrl: 'Серверга уланиб бўлмади. Маълумотлар телефонда сақланган, кейинроқ қайта уриниб кўринг.',
          ru: 'Не удалось связаться с сервером. Данные сохранены на телефоне, попробуйте позже.',
        })
      );
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']} refreshing={refreshing} onRefresh={onRefresh}>
      {/* Top: line + sync */}
      <Row gap={space.md}>
        <View style={styles.flex}>
          <AppText variant="caption" lines={1}>
            {L({ uz: 'Joriy liniya', uz_cyrl: 'Жорий линия', ru: 'Текущая линия' })}
          </AppText>
          <AppText variant="h2" lines={1}>
            {lineCode ? `${lineCode} ${L(COMMON.line)}` : '—'}
          </AppText>
        </View>
        <IconButton
          icon={pendingCount > 0 ? CloudUpload : RefreshCw}
          tone={pendingCount > 0 ? 'warning' : 'primary'}
          onPress={handleSync}
          disabled={isSyncing}
          size={40}
        />
      </Row>

      {/* Working day switcher */}
      <View style={styles.dateBar}>
        <IconButton icon={ChevronLeft} onPress={() => shiftWorkingDay(-1)} size={36} />
        <Pressable onPress={resetToToday} style={({ pressed }) => [styles.dateCenter, pressed && styles.pressed]} hitSlop={4}>
          <AppText variant="strong" align="center" lines={1}>
            {formatDayLong(workingDate, lang)}
          </AppText>
          <AppText variant="caption" align="center" color={isToday ? colors.textMuted : colors.primary} lines={1}>
            {isToday
              ? L(COMMON.today)
              : L({ uz: 'Bugunga qaytish', uz_cyrl: 'Бугунга қайтиш', ru: 'Вернуться к сегодня' })}
          </AppText>
        </Pressable>
        <IconButton icon={ChevronRight} onPress={() => shiftWorkingDay(1)} size={36} />
      </View>

      {/* Sync status (only when something waits) */}
      {pendingCount > 0 || isSyncing ? (
        <Card style={styles.syncCard}>
          <Row gap={space.md}>
            <CloudOff size={18} color={colors.warning} />
            <View style={styles.flex}>
              <AppText variant="strong" lines={1}>
                {isSyncing
                  ? L({ uz: 'Yuborilmoqda…', uz_cyrl: 'Юборилмоқда…', ru: 'Отправка…' })
                  : L({ uz: 'Yuborilmagan hujjatlar', uz_cyrl: 'Юборилмаган ҳужжатлар', ru: 'Неотправленные документы' })}
              </AppText>
              {!isSyncing ? (
                <AppText variant="small" lines={1}>
                  {formatNumber(pendingCount)} {L({ uz: 'ta', uz_cyrl: 'та', ru: 'шт.' })}
                </AppText>
              ) : null}
            </View>
            <Button
              title={L({ uz: 'Yuborish', uz_cyrl: 'Юбориш', ru: 'Отправить' })}
              size="sm"
              variant="secondary"
              onPress={handleSync}
              loading={isSyncing}
            />
          </Row>
        </Card>
      ) : null}

      {/* Active shop */}
      {activeShop ? (
        <Card>
          <Row gap={space.md}>
            <View style={styles.shopIcon}>
              <Store size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="caption" lines={1}>
                {L({ uz: 'Tanlangan doʻkon', uz_cyrl: 'Танланган дўкон', ru: 'Выбранный магазин' })}
              </AppText>
              <AppText variant="title" lines={1}>
                {activeShop.name}
              </AppText>
              {activeShop.address ? (
                <AppText variant="small" lines={1}>
                  {activeShop.address}
                </AppText>
              ) : null}
            </View>
          </Row>
          <Row gap={space.sm} style={styles.topGap}>
            <Button
              title={L({ uz: 'Almashtirish', uz_cyrl: 'Алмаштириш', ru: 'Сменить' })}
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('ShopsTab')}
              style={styles.flex}
            />
            <Button
              title={L({ uz: 'Buyurtmani davom ettirish', uz_cyrl: 'Буюртмани давом эттириш', ru: 'Продолжить заказ' })}
              size="sm"
              icon={ShoppingBag}
              onPress={() => navigation.navigate('CatalogTab')}
              style={styles.grow2}
            />
          </Row>
        </Card>
      ) : (
        <Card onPress={() => navigation.navigate('ShopsTab')}>
          <Row gap={space.md}>
            <View style={styles.shopIcon}>
              <Store size={18} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <AppText variant="strong" lines={1}>
                {L(COMMON.chooseShop)}
              </AppText>
              <AppText variant="small" lines={2}>
                {L({ uz: 'Yangi buyurtma ochish uchun', uz_cyrl: 'Янги буюртма очиш учун', ru: 'Чтобы оформить новый заказ' })}
              </AppText>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Row>
        </Card>
      )}

      {/* KPIs for the working day */}
      <Row gap={space.md} wrap>
        <Stat
          label={L(COMMON.orders)}
          value={formatNumber(stats.orderCount)}
          icon={Receipt}
        />
        <Stat
          label={L({ uz: 'Savdo', uz_cyrl: 'Савдо', ru: 'Продажи' })}
          value={formatMoneyShort(stats.totalSales, lang)}
          icon={TrendingUp}
          tone="primary"
        />
      </Row>
      <Row gap={space.md} wrap>
        <Stat
          label={L({ uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' })}
          value={formatMoneyShort(stats.cashCollected, lang)}
          icon={Banknote}
          tone="success"
        />
        <Stat
          label={L({ uz: 'Nasiya va oʻtkazma', uz_cyrl: 'Насия ва ўтказма', ru: 'В долг и перечисл.' })}
          value={formatMoneyShort(debtAmount, lang)}
          icon={Wallet}
          tone={debtAmount > 0 ? 'danger' : 'neutral'}
        />
      </Row>

      {/* Orders of the working day */}
      <SectionHeader
        title={L({ uz: 'Kun buyurtmalari', uz_cyrl: 'Кун буюртмалари', ru: 'Заказы за день' })}
        action={L(COMMON.all)}
        onAction={() => navigation.navigate('HistoryTab')}
      />
      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title={L({ uz: 'Bu kunda buyurtma yoʻq', uz_cyrl: 'Бу кунда буюртма йўқ', ru: 'Заказов за этот день нет' })}
            action={
              <Button
                title={L({ uz: 'Buyurtma olish', uz_cyrl: 'Буюртма олиш', ru: 'Оформить заказ' })}
                variant="secondary"
                size="sm"
                onPress={() => navigation.navigate('ShopsTab')}
              />
            }
          />
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {orders.map((o, i) => (
            <View key={o.id}>
              {i > 0 ? <Divider /> : null}
              <OrderCard order={o} />
            </View>
          ))}
        </Card>
      )}

      {/* Quick actions (not duplicated by the tab bar) */}
      <Row gap={space.sm}>
        <Button
          title={L({ uz: 'Yangi doʻkon', uz_cyrl: 'Янги дўкон', ru: 'Новый магазин' })}
          icon={Plus}
          variant="outline"
          onPress={() => navigation.navigate('ShopsTab', { screen: 'AddShopModal' })}
          style={styles.flex}
        />
        <Button
          title={L({ uz: 'Hisobotlar', uz_cyrl: 'Ҳисоботлар', ru: 'Отчёты' })}
          icon={BarChart3}
          variant="outline"
          onPress={() => navigation.navigate('ReportsScreen')}
          style={styles.flex}
        />
      </Row>
      {pendingCount === 0 && !isSyncing ? (
        <Row gap={6} style={styles.center}>
          <Badge
            label={L({ uz: 'Hammasi yuborilgan', uz_cyrl: 'Ҳаммаси юборилган', ru: 'Всё отправлено' })}
            tone="success"
          />
        </Row>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  grow2: { flex: 2, minWidth: 0 },
  pressed: { opacity: 0.75 },
  center: { justifyContent: 'center' },
  topGap: { marginTop: space.xs },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dateCenter: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 2 },
  syncCard: { backgroundColor: colors.warningLight, borderColor: colors.border, paddingVertical: space.md },
  shopIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCard: { paddingVertical: 0 },
});
