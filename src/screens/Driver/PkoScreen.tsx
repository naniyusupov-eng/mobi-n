import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle2, Store, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useSyncStore } from '../../store/syncStore';
import { getTodayDateString } from '../../store/dateStore';
import { shopRepository } from '../../database/shopRepository';
import { lineService } from '../../services/lineService';
import { PaymentRecord, driverService } from '../../services/driverService';
import { colors, space } from '../../theme/colors';
import { Card, Divider, EmptyState, HeroCard, HeroPill, ListItem, Money, Screen, SearchBar, SectionHeader } from '../../components/ui';
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

  useEffect(() => {
    loadLocal();
    loadPayments();
  }, [loadLocal, loadPayments]);
  useFocusEffect(
    useCallback(() => {
      loadLocal();
      loadPayments();
    }, [loadLocal, loadPayments])
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
    await loadPayments();
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
        }}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listCard: { paddingVertical: 0 },
  amount: { maxWidth: '45%', alignItems: 'flex-end' },
});
