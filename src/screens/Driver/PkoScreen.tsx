import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Banknote, CheckCircle2, CloudOff, Landmark, Store, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useSyncStore } from '../../store/syncStore';
import { getTodayDateString } from '../../store/dateStore';
import { shopRepository } from '../../database/shopRepository';
import { lineService } from '../../services/lineService';
import { CashLine, PaymentRecord, driverService } from '../../services/driverService';
import { colors, space } from '../../theme/colors';
import { AppText, Card, Divider, EmptyState, HeroCard, HeroPill, IconCircle, KeyValue, ListItem, Money, Row, Screen, SearchBar, SectionHeader } from '../../components/ui';
import { PaymentSheet } from '../../components/shared';
import { shopRouteCode } from '../../components/shopHelpers';
import { COMMON, Tri, useL } from '../../i18n/tri';
import { formatMoney, formatNumber, formatShopNum, formatTime } from '../../utils/format';
import { Shop } from '../../types';

const T = {
  todayPko: { uz: 'Bugungi PKO', uz_cyrl: 'Бугунги ПКО', ru: 'ПКО сегодня' },
  payments: { uz: 'ta toʻlov', uz_cyrl: 'та тўлов', ru: 'платежей' },
  totalDebt: { uz: 'Liniya qarzi', uz_cyrl: 'Линия қарзи', ru: 'Долг линии' },
  debtors: { uz: 'Qarzdor doʻkonlar', uz_cyrl: 'Қарздор дўконлар', ru: 'Магазины с долгом' },
  searchPh: { uz: 'Doʻkon nomi, raqami yoki telefon', uz_cyrl: 'Дўкон номи, рақами ёки телефон', ru: 'Название, номер или телефон' },
  accepted: { uz: 'Bugun qabul qilingan', uz_cyrl: 'Бугун қабул қилинган', ru: 'Принято сегодня' },
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

// PKO: the driver collects debt payments from the line's shops
export const PkoScreen = () => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const session = useAuthStore((s) => s.agent);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);
  const lineCode = session?.lineCode || '';
  const by = `driver:${lineCode}`;

  const [shops, setShops] = useState<Shop[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [payShop, setPayShop] = useState<Shop | null>(null);
  const [cash, setCash] = useState<CashLine | null>(null);
  const [cashOffline, setCashOffline] = useState(false);

  const loadLocal = useCallback(() => {
    setShops(shopRepository.getAll().filter((s) => s.debtBalance > 0));
    refreshPendingCount();
  }, [refreshPendingCount]);

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
      const res = await driverService.getCash(getTodayDateString());
      setCash(res.lines.find((l) => l.line === lineCode) || res.lines[0] || null);
      setCashOffline(false);
    } catch {
      // offline: keep the last values
      setCashOffline(true);
    }
  }, [lineCode]);

  useEffect(() => {
    loadLocal();
    loadPayments();
    loadCash();
  }, [loadLocal, loadPayments, loadCash]);
  useFocusEffect(
    useCallback(() => {
      loadLocal();
      loadPayments();
      loadCash();
    }, [loadLocal, loadPayments, loadCash])
  );

  // Pull to refresh also brings fresh debts from the server
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (lineCode) await lineService.downloadShops(lineCode);
    } catch {
      // offline: phone data stays
    }
    loadLocal();
    await Promise.all([loadPayments(), loadCash()]);
    setRefreshing(false);
  };

  const q = search.trim().toLowerCase();
  const shown = useMemo(
    () =>
      shops
        .filter(
          (s) =>
            !q ||
            s.name.toLowerCase().includes(q) ||
            (s.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§') ||
            (s.num != null && formatShopNum(s.num) === q)
        )
        .sort((a, b) => b.debtBalance - a.debtBalance),
    [shops, q]
  );
  const todaySum = payments.reduce((s, p) => s + p.amount, 0);
  const lineDebt = shops.reduce((s, x) => s + x.debtBalance, 0);
  const inHand = cash ? cash.expected - cash.received : 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <HeroCard
        icon={Wallet}
        label={L(T.todayPko)}
        value={formatMoney(todaySum, lang)}
        badge={<HeroPill label={lineCode} />}
      >
        <HeroPill solid icon={CheckCircle2} label={`${formatNumber(payments.length)} ${L(T.payments)}`} />
        {pendingCount > 0 ? <HeroPill label={`${formatNumber(pendingCount)} ${L(T.pending)}`} /> : null}
        <HeroPill label={`${L(T.totalDebt)}: ${formatMoney(lineDebt, lang)}`} />
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
              {L(T.cashOffline)}
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

      <SearchBar value={search} onChangeText={setSearch} placeholder={L(T.searchPh)} />

      <SectionHeader title={`${L(T.debtors)} · ${formatNumber(shown.length)}`} />
      {shown.length === 0 ? (
        <Card>
          <EmptyState icon={Store} title={L(COMMON.noDebt)} />
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {shown.map((s, i) => (
            <View key={s.id}>
              {i > 0 ? <Divider /> : null}
              <ListItem
                title={`${s.num != null ? `№${formatShopNum(s.num)} · ` : ''}${s.name}`}
                subtitle={[shopRouteCode(s), s.address].filter(Boolean).join(' · ') || undefined}
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

      {payments.length > 0 ? (
        <>
          <SectionHeader title={L(T.accepted)} />
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
        </>
      ) : null}

      <PaymentSheet
        shop={payShop}
        onClose={() => setPayShop(null)}
        onDone={() => {
          loadLocal();
          loadPayments();
          loadCash();
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bold: { fontWeight: '600' },
  listCard: { paddingVertical: 0 },
  amount: { maxWidth: '45%', alignItems: 'flex-end' },
});
