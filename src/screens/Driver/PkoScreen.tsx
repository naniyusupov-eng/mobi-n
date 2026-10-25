import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Banknote, CheckCircle2, CloudOff, Landmark, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useSyncStore } from '../../store/syncStore';
import { getTodayDateString } from '../../store/dateStore';
import { CashLine, PaymentRecord, driverOffline, driverService } from '../../services/driverService';
import { colors, space } from '../../theme/colors';
import { AppText, Card, Divider, EmptyState, HeroCard, HeroPill, IconCircle, KeyValue, ListItem, Money, Row, Screen, SectionHeader } from '../../components/ui';
import { Tri, offlineCopyNote, useL } from '../../i18n/tri';
import { formatMoney, formatNumber, formatTime } from '../../utils/format';

const T = {
  todayPko: { uz: 'Bugungi PKO', uz_cyrl: 'Бугунги ПКО', ru: 'ПКО сегодня' },
  payments: { uz: 'ta toʻlov', uz_cyrl: 'та тўлов', ru: 'платежей' },
  accepted: { uz: 'Bugun qabul qilingan', uz_cyrl: 'Бугун қабул қилинган', ru: 'Принято сегодня' },
  noneToday: {
    uz: 'Bugun PKO yoʻq. Qarz toʻlovi uchun "Qarzdorlar" boʻlimidan doʻkonni tanlang',
    uz_cyrl: 'Бугун ПКО йўқ. Қарз тўлови учун "Қарздорлар" бўлимидан дўконни танланг',
    ru: 'Сегодня ПКО нет. Для оплаты долга выберите магазин в разделе «Должники»',
  },
  pending: { uz: 'yuborilmoqda', uz_cyrl: 'юборилмоқда', ru: 'отправляется' },
  cash: { uz: 'Kassa', uz_cyrl: 'Касса', ru: 'Касса' },
  inHand: { uz: 'Bugun qoʻlingizdagi naqd', uz_cyrl: 'Бугун қўлингиздаги нақд', ru: 'Наличные на руках сегодня' },
  fromDeliveries: { uz: 'Yetkazishdan', uz_cyrl: 'Етказишдан', ru: 'С доставок' },
  fromPko: { uz: 'PKO dan', uz_cyrl: 'ПКО дан', ru: 'С ПКО' },
  handed: { uz: 'Ofisga topshirildi', uz_cyrl: 'Офисга топширилди', ru: 'Сдано в офис' },
  handovers: { uz: 'Bugungi topshirishlar', uz_cyrl: 'Бугунги топширишлар', ru: 'Сдачи за сегодня' },
  handover: { uz: 'Kassaga topshirildi', uz_cyrl: 'Кассага топширилди', ru: 'Сдано в кассу' },
  cashOffline: { uz: 'Oxirgi maʼlumot, server bilan aloqa yoʻq', uz_cyrl: 'Охирги маълумот, сервер билан алоқа йўқ', ru: 'Последние данные, нет связи с сервером' },
  cashUnknown: { uz: 'Kassa maʼlumoti yuklanmadi', uz_cyrl: 'Касса маълумоти юкланмади', ru: 'Данные кассы не загружены' },
} satisfies Record<string, Tri>;

// PKO: today's debt payments and the cash the driver holds (debtors are in their own tab)
export const PkoScreen = () => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const session = useAuthStore((s) => s.agent);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);
  const lineCode = session?.lineCode || '';
  const by = `driver:${lineCode}`;

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cash, setCash] = useState<CashLine | null>(null);
  const [cashOffline, setCashOffline] = useState(false);
  const [cashAt, setCashAt] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setPayments(await driverService.getPayments(by, getTodayDateString()));
    } catch {
      // offline: keep what is shown
    }
  }, [by]);

  // Cash in hand: the server knows deliveries, PKO and what the office cashier received
  const loadCash = useCallback(async () => {
    try {
      // Falls back to the copy saved on the phone when the server does not answer
      const res = await driverOffline.loadCash(getTodayDateString());
      setCash(res.data.lines.find((l) => l.line === lineCode) || res.data.lines[0] || null);
      setCashOffline(res.offline);
      setCashAt(res.savedAt);
    } catch {
      // offline and no copy yet: keep the last values
      setCashOffline(true);
    }
  }, [lineCode]);

  const loadAll = useCallback(() => {
    refreshPendingCount();
    loadPayments();
    loadCash();
  }, [refreshPendingCount, loadPayments, loadCash]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    refreshPendingCount();
    await Promise.all([loadPayments(), loadCash()]);
    setRefreshing(false);
  };

  const todaySum = payments.reduce((s, p) => s + p.amount, 0);
  const inHand = cash ? cash.expected - cash.received : 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <HeroCard icon={Wallet} label={L(T.todayPko)} value={formatMoney(todaySum, lang)} badge={<HeroPill label={lineCode} />}>
        <HeroPill solid icon={CheckCircle2} label={`${formatNumber(payments.length)} ${L(T.payments)}`} />
        {pendingCount > 0 ? <HeroPill label={`${formatNumber(pendingCount)} ${L(T.pending)}`} /> : null}
      </HeroCard>

      {/* Kassa: cash the driver still holds today */}
      <Card>
        <Row gap={space.md}>
          <IconCircle icon={Banknote} tone="primary" size={44} />
          <View style={styles.flex}>
            <AppText variant="small" lines={1}>
              {`${L(T.cash)} · ${L(T.inHand)}`}
            </AppText>
            {cash ? (
              <Money amount={inHand} variant="h2" color={inHand < 0 ? colors.danger : colors.text} />
            ) : (
              <AppText variant="small" color={colors.textMuted} lines={2}>
                {L(T.cashUnknown)}
              </AppText>
            )}
          </View>
        </Row>
        {cashOffline && cash ? (
          <Row gap={6}>
            <CloudOff size={14} color={colors.warning} />
            <AppText variant="caption" color={colors.warning} lines={2} style={styles.flex}>
              {cashAt ? L(offlineCopyNote(formatTime(cashAt))) : L(T.cashOffline)}
            </AppText>
          </Row>
        ) : null}
        {cash ? (
          <>
            <Divider />
            <KeyValue
              label={`${L(T.fromDeliveries)} · ${formatNumber(cash.deliveredOrders)}`}
              value={<Money amount={cash.deliveryCash} variant="body" />}
            />
            <KeyValue label={`${L(T.fromPko)} · ${formatNumber(cash.pkoCount)}`} value={<Money amount={cash.pkoCash} variant="body" />} />
            <KeyValue label={L(T.handed)} value={<Money amount={-cash.received} variant="body" color={colors.success} />} />
            {(cash.handovers || []).length > 0 ? (
              <>
                <Divider />
                <AppText variant="small" lines={1} style={styles.bold}>
                  {L(T.handovers)}
                </AppText>
                {(cash.handovers || []).map((h, i) => (
                  <View key={h.id}>
                    {i > 0 ? <Divider /> : null}
                    <ListItem
                      title={h.note || L(T.handover)}
                      subtitle={formatTime(h.createdAt)}
                      icon={Landmark}
                      iconTone="success"
                      right={
                        <View style={styles.amount}>
                          <Money amount={h.amount} color={colors.success} />
                        </View>
                      }
                    />
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </Card>

      <SectionHeader title={L(T.accepted)} />
      {payments.length === 0 ? (
        <Card>
          <EmptyState icon={Wallet} title={L(T.noneToday)} />
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {payments.map((p, i) => (
            <View key={p.id}>
              {i > 0 ? <Divider /> : null}
              <ListItem
                title={p.shopName}
                subtitle={formatTime(p.createdAt)}
                icon={CheckCircle2}
                iconTone="success"
                right={
                  <View style={styles.amount}>
                    <Money amount={p.amount} color={colors.success} />
                  </View>
                }
              />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '600' },
  listCard: { paddingVertical: 0 },
  amount: { maxWidth: '45%', alignItems: 'flex-end' },
});
