import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banknote, Receipt, Store, TrendingUp, Wallet } from 'lucide-react-native';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { getTodayDateString } from '../../store/dateStore';
import { Order, Shop } from '../../types';
import { colors, space } from '../../theme/colors';
import { AppText, Card, Divider, EmptyState, KeyValue, ListItem, Money, Row, Screen, SectionHeader, Segmented, Stat } from '../../components/ui';
import { OrderCard, PaymentSheet } from '../../components/shared';
import { COMMON, useL } from '../../i18n/tri';
import { formatMoneyShort, formatNumber } from '../../utils/format';

type ReportTab = 'sales' | 'debts' | 'cash';
type Stats = { totalSales: number; orderCount: number; cashCollected: number };

const localDay = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const ReportsScreen = ({ navigation }: { navigation?: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const agent = useAuthStore((s) => s.agent);

  const [tab, setTab] = useState<ReportTab>('sales');
  const [stats, setStats] = useState<Stats>({ totalSales: 0, orderCount: 0, cashCollected: 0 });
  const [debtShops, setDebtShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payShop, setPayShop] = useState<Shop | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (agent?.id) setStats(orderRepository.getTodayStats(agent.id));
    setDebtShops(
      shopRepository
        .getAll()
        .filter((s) => s.debtBalance > 0)
        .sort((a, b) => b.debtBalance - a.debtBalance)
    );
    const today = getTodayDateString();
    setOrders(orderRepository.getAll().filter((o) => o.createdAt && localDay(o.createdAt) === today));
  }, [agent?.id]);

  useEffect(() => {
    load();
    return navigation?.addListener?.('focus', load);
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const totalDebt = useMemo(() => debtShops.reduce((sum, s) => sum + s.debtBalance, 0), [debtShops]);
  const creditSales = Math.max(0, stats.totalSales - stats.cashCollected);

  const tabs: { key: ReportTab; label: string; count?: number }[] = [
    { key: 'sales', label: L({ uz: 'Kunlik savdo', uz_cyrl: 'Кунлик савдо', ru: 'Продажи за день' }) },
    { key: 'debts', label: L({ uz: 'Qarzdorlar', uz_cyrl: 'Қарздорлар', ru: 'Должники' }), count: debtShops.length },
    { key: 'cash', label: L({ uz: 'Kassa', uz_cyrl: 'Касса', ru: 'Касса' }) },
  ];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Segmented options={tabs} value={tab} onChange={setTab} />

      {tab === 'sales' ? (
        <>
          <Row gap={space.md} wrap>
            <Stat label={L(COMMON.orders)} value={formatNumber(stats.orderCount)} icon={Receipt} />
            <Stat
              label={L({ uz: 'Savdo', uz_cyrl: 'Савдо', ru: 'Продажи' })}
              value={formatMoneyShort(stats.totalSales, lang)}
              icon={TrendingUp}
              tone="primary"
            />
          </Row>
          <Card>
            <KeyValue label={L(COMMON.orders)} value={formatNumber(stats.orderCount)} />
            <KeyValue
              label={L({ uz: 'Jami savdo', uz_cyrl: 'Жами савдо', ru: 'Сумма продаж' })}
              value={<Money amount={stats.totalSales} color={colors.primaryDark} />}
            />
            <Divider style={styles.divider} />
            <KeyValue
              label={L({ uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' })}
              value={<Money amount={stats.cashCollected} color={colors.success} />}
            />
            <KeyValue
              label={L({ uz: 'Nasiya va oʻtkazma', uz_cyrl: 'Насия ва ўтказма', ru: 'В долг и перечисл.' })}
              value={<Money amount={creditSales} color={creditSales > 0 ? colors.danger : colors.text} />}
            />
          </Card>

          <SectionHeader title={L({ uz: 'Bugungi buyurtmalar', uz_cyrl: 'Бугунги буюртмалар', ru: 'Заказы за сегодня' })} />
          {orders.length === 0 ? (
            <Card>
              <EmptyState
                icon={Receipt}
                title={L({ uz: 'Bugun buyurtma yoʻq', uz_cyrl: 'Бугун буюртма йўқ', ru: 'Сегодня заказов нет' })}
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
        </>
      ) : null}

      {tab === 'debts' ? (
        <>
          <Card style={styles.debtCard}>
            <AppText variant="small" color={colors.danger} lines={1}>
              {L({ uz: 'Umumiy qarz', uz_cyrl: 'Умумий қарз', ru: 'Общий долг' })}
            </AppText>
            <Money amount={totalDebt} variant="h1" color={colors.danger} />
            <AppText variant="small" lines={1}>
              {formatNumber(debtShops.length)} {L(COMMON.shopsCount)}
            </AppText>
          </Card>

          <SectionHeader title={L({ uz: 'Qarzdor doʻkonlar', uz_cyrl: 'Қарздор дўконлар', ru: 'Магазины с долгом' })} />
          {debtShops.length === 0 ? (
            <Card>
              <EmptyState icon={Store} title={L(COMMON.noDebt)} />
            </Card>
          ) : (
            <Card style={styles.listCard}>
              {debtShops.map((s, i) => (
                <View key={s.id}>
                  {i > 0 ? <Divider /> : null}
                  <ListItem
                    title={s.name}
                    subtitle={[s.ownerName, s.address].filter(Boolean).join(' · ') || undefined}
                    icon={Store}
                    iconTone="danger"
                    onPress={() => setPayShop(s)}
                    right={
                      <View style={styles.amount}>
                        <Money amount={s.debtBalance} color={colors.danger} />
                      </View>
                    }
                  />
                </View>
              ))}
            </Card>
          )}
          {debtShops.length > 0 ? (
            <AppText variant="caption" align="center">
              {L({
                uz: 'Toʻlov qabul qilish uchun doʻkonni bosing',
                uz_cyrl: 'Тўлов қабул қилиш учун дўконни босинг',
                ru: 'Нажмите на магазин, чтобы принять оплату',
              })}
            </AppText>
          ) : null}
        </>
      ) : null}

      {tab === 'cash' ? (
        <>
          <Card style={styles.cashCard}>
            <Row gap={space.sm}>
              <Banknote size={18} color={colors.success} />
              <AppText variant="small" color={colors.success} lines={1} style={styles.flex}>
                {L({ uz: 'Bugun olingan naqd pul', uz_cyrl: 'Бугун олинган нақд пул', ru: 'Наличные за сегодня' })}
              </AppText>
            </Row>
            <Money amount={stats.cashCollected} variant="h1" color={colors.success} />
          </Card>
          <Card>
            <KeyValue
              label={L({ uz: 'Jami savdo', uz_cyrl: 'Жами савдо', ru: 'Сумма продаж' })}
              value={<Money amount={stats.totalSales} />}
            />
            <KeyValue
              label={L({ uz: 'Naqd', uz_cyrl: 'Нақд', ru: 'Наличные' })}
              value={<Money amount={stats.cashCollected} color={colors.success} />}
            />
            <KeyValue
              label={L({ uz: 'Nasiya va oʻtkazma', uz_cyrl: 'Насия ва ўтказма', ru: 'В долг и перечисл.' })}
              value={<Money amount={creditSales} />}
            />
          </Card>
          <Row gap={space.sm} style={styles.hint}>
            <Wallet size={14} color={colors.textMuted} />
            <AppText variant="caption" style={styles.flex}>
              {L({
                uz: 'Faqat naqd toʻlangan buyurtmalar hisoblanadi.',
                uz_cyrl: 'Фақат нақд тўланган буюртмалар ҳисобланади.',
                ru: 'Учитываются только заказы, оплаченные наличными.',
              })}
            </AppText>
          </Row>
        </>
      ) : null}

      <PaymentSheet shop={payShop} onClose={() => setPayShop(null)} onDone={load} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  divider: { marginVertical: space.xs },
  listCard: { paddingVertical: 0 },
  amount: { maxWidth: '45%' },
  debtCard: { backgroundColor: colors.dangerLight, gap: space.xs },
  cashCard: { backgroundColor: colors.successLight, gap: space.xs },
  hint: { paddingHorizontal: 2 },
});
