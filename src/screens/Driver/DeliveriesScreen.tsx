import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Banknote, CheckCircle2, ChevronLeft, ChevronRight, CloudOff, MapPin, PackageCheck, Truck } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { getTodayDateString } from '../../store/dateStore';
import { Delivery, cashToCollect, driverService, netAmount } from '../../services/driverService';
import { colors, space } from '../../theme/colors';
import { AppText, Badge, Card, EmptyState, HeroCard, HeroPill, IconButton, Money, Row, Screen, Segmented } from '../../components/ui';
import { PAYMENT_TONE } from '../../components/shared';
import { COMMON, PAYMENT_LABELS, Tri, useL } from '../../i18n/tri';
import { formatDayLong, formatMoney, formatMoneyShort, formatNumber, formatShopNum } from '../../utils/format';

type Filter = 'todo' | 'done' | 'all';

const T = {
  todayDelivery: { uz: 'Bugungi yetkazish', uz_cyrl: 'Бугунги етказиш', ru: 'Доставка сегодня' },
  dayDelivery: { uz: 'Kun yetkazishi', uz_cyrl: 'Кун етказиши', ru: 'Доставка за день' },
  toCollect: { uz: 'Naqd olinadigan pul', uz_cyrl: 'Нақд олинадиган пул', ru: 'Наличные к получению' },
  collected: { uz: 'Olindi', uz_cyrl: 'Олинди', ru: 'Получено' },
  delivered: { uz: 'Topshirildi', uz_cyrl: 'Топширилди', ru: 'Доставлено' },
  todo: { uz: 'Kutilmoqda', uz_cyrl: 'Кутилмоқда', ru: 'Ожидают' },
  backToday: { uz: 'Bugunga qaytish', uz_cyrl: 'Бугунга қайтиш', ru: 'Вернуться к сегодня' },
  none: { uz: 'Bu kunga yetkazish yoʻq', uz_cyrl: 'Бу кунга етказиш йўқ', ru: 'На этот день доставок нет' },
  noneTodo: { uz: 'Hammasi topshirildi', uz_cyrl: 'Ҳаммаси топширилди', ru: 'Всё доставлено' },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Internetni tekshirib, pastga tortib yangilang',
    uz_cyrl: 'Серверга уланиб бўлмади. Интернетни текшириб, пастга тортиб янгиланг',
    ru: 'Нет связи с сервером. Проверьте интернет и потяните вниз, чтобы обновить',
  },
  returned: { uz: 'vozvrat', uz_cyrl: 'возврат', ru: 'возврат' },
} satisfies Record<string, Tri>;

const shiftDay = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const DeliveriesScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const session = useAuthStore((s) => s.agent);
  const lineCode = session?.lineCode || '';

  const today = getTodayDateString();
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<Filter>('todo');
  const [items, setItems] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    if (!lineCode) return;
    setLoading(true);
    try {
      setItems(await driverService.getDeliveries(lineCode, date));
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, [lineCode, date]);

  useEffect(() => {
    load();
  }, [load]);
  // Coming back from an order page shows its new state
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const done = items.filter((d) => d.status === 'delivered');
  const todo = items.filter((d) => d.status !== 'delivered');
  const shown = filter === 'todo' ? todo : filter === 'done' ? done : items;
  const totals = useMemo(
    () => ({
      toCollect: items.reduce((s, d) => s + cashToCollect(d), 0),
      collected: done.reduce((s, d) => s + (d.collected || 0), 0),
    }),
    [items, done]
  );
  const isToday = date === today;

  return (
    <Screen refreshing={loading && items.length > 0} onRefresh={load}>
      <HeroCard
        icon={Truck}
        label={L(isToday ? T.todayDelivery : T.dayDelivery)}
        value={`${formatNumber(done.length)} / ${formatNumber(items.length)}`}
        badge={<HeroPill label={`${lineCode} · ${formatDayLong(date, lang)}`} />}
      >
        <HeroPill solid icon={Banknote} label={`${L(T.toCollect)}: ${formatMoneyShort(totals.toCollect, lang)}`} />
        <HeroPill icon={CheckCircle2} label={`${L(T.collected)}: ${formatMoneyShort(totals.collected, lang)}`} />
      </HeroCard>

      {/* Day switcher */}
      <View style={styles.dateBar}>
        <IconButton icon={ChevronLeft} onPress={() => setDate(shiftDay(date, -1))} size={38} />
        <Pressable onPress={() => setDate(today)} style={styles.dateCenter} hitSlop={4}>
          <AppText variant="strong" align="center" lines={1}>
            {isToday ? L(COMMON.today) : formatDayLong(date, lang)}
          </AppText>
          {!isToday ? (
            <AppText variant="caption" align="center" color={colors.primary} lines={1}>
              {L(T.backToday)}
            </AppText>
          ) : null}
        </Pressable>
        <IconButton icon={ChevronRight} onPress={() => setDate(shiftDay(date, 1))} size={38} />
      </View>

      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { key: 'todo', label: L(T.todo), count: todo.length },
          { key: 'done', label: L(T.delivered), count: done.length },
          { key: 'all', label: L(COMMON.all), count: items.length },
        ]}
      />

      {offline ? (
        <Card style={styles.warn}>
          <Row gap={space.md}>
            <CloudOff size={20} color={colors.warning} />
            <AppText variant="small" color={colors.warning} lines={3} style={styles.flex}>
              {L(T.offline)}
            </AppText>
          </Row>
        </Card>
      ) : null}

      {!loading && shown.length === 0 && !offline ? (
        <Card>
          <EmptyState icon={PackageCheck} title={L(filter === 'todo' && items.length > 0 ? T.noneTodo : T.none)} />
        </Card>
      ) : null}

      {shown.map((d) => (
        <Card key={d.id} onPress={() => navigation.navigate('DeliveryDetail', { delivery: d, date })} style={styles.item}>
          <Row gap={space.md}>
            <View style={[styles.num, d.status === 'delivered' && styles.numDone]}>
              {d.status === 'delivered' ? (
                <CheckCircle2 size={20} color={colors.white} />
              ) : (
                <AppText variant="strong" color={colors.primary} fit>
                  {d.shopNum != null ? formatShopNum(d.shopNum) : '•'}
                </AppText>
              )}
            </View>
            <View style={styles.flex}>
              <AppText variant="strong" lines={1}>
                {d.shopName}
              </AppText>
              {d.shopAddress ? (
                <Row gap={4}>
                  <MapPin size={12} color={colors.textMuted} />
                  <AppText variant="caption" lines={1} style={styles.flex}>
                    {d.shopAddress}
                  </AppText>
                </Row>
              ) : null}
              <Row gap={6} wrap style={styles.badges}>
                <Badge label={L(PAYMENT_LABELS[d.paymentMethod])} tone={PAYMENT_TONE[d.paymentMethod]} />
                {d.returnedAmount ? <Badge label={`${L(T.returned)} −${formatMoneyShort(d.returnedAmount, lang)}`} tone="warning" /> : null}
                {d.status === 'delivered' ? <Badge label={L(T.delivered)} tone="success" /> : null}
              </Row>
            </View>
            <View style={styles.right}>
              <Money amount={netAmount(d)} />
              {d.status === 'delivered' && d.paymentMethod === 'naqd' ? (
                <AppText variant="caption" color={colors.success} lines={1}>
                  {formatMoney(d.collected || 0, lang)}
                </AppText>
              ) : null}
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: 6,
    backgroundColor: colors.card,
    borderRadius: 18,
  },
  dateCenter: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: 2 },
  warn: { backgroundColor: colors.warningLight },
  item: { paddingVertical: space.md },
  num: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  numDone: { backgroundColor: colors.success },
  badges: { marginTop: 4 },
  right: { alignItems: 'flex-end', maxWidth: '40%', gap: 2 },
});
