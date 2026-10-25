import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Store, Users } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { shopRepository } from '../../database/shopRepository';
import { lineService } from '../../services/lineService';
import { colors } from '../../theme/colors';
import { Card, Divider, EmptyState, HeroCard, HeroPill, ListItem, Money, Screen, SearchBar, SectionHeader } from '../../components/ui';
import { PaymentSheet } from '../../components/shared';
import { shopRouteCode } from '../../components/shopHelpers';
import { COMMON, Tri, useL } from '../../i18n/tri';
import { formatMoney, formatNumber, formatShopNum } from '../../utils/format';
import { Shop } from '../../types';

const T = {
  title: { uz: 'Liniya qarzi', uz_cyrl: 'Линия қарзи', ru: 'Долг линии' },
  shops: { uz: 'ta qarzdor doʻkon', uz_cyrl: 'та қарздор дўкон', ru: 'магазинов с долгом' },
  debtors: { uz: 'Qarzdor doʻkonlar', uz_cyrl: 'Қарздор дўконлар', ru: 'Магазины с долгом' },
  searchPh: { uz: 'Doʻkon nomi, raqami yoki telefon', uz_cyrl: 'Дўкон номи, рақами ёки телефон', ru: 'Название, номер или телефон' },
} satisfies Record<string, Tri>;

// The line's shops that owe money; tapping one takes a PKO payment
export const DebtorsScreen = () => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const lineCode = useAuthStore((s) => s.agent?.lineCode || '');

  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [payShop, setPayShop] = useState<Shop | null>(null);

  const load = useCallback(() => setShops(shopRepository.getAll().filter((s) => s.debtBalance > 0)), []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Pull to refresh brings fresh debts from the server
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (lineCode) await lineService.downloadShops(lineCode);
    } catch {
      // offline: phone data stays
    }
    load();
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
  const lineDebt = shops.reduce((s, x) => s + x.debtBalance, 0);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <HeroCard icon={Users} label={L(T.title)} value={formatMoney(lineDebt, lang)} badge={<HeroPill label={lineCode} />}>
        <HeroPill solid label={`${formatNumber(shops.length)} ${L(T.shops)}`} />
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

      <PaymentSheet shop={payShop} onClose={() => setPayShop(null)} onDone={load} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listCard: { paddingVertical: 0 },
  amount: { maxWidth: '45%', alignItems: 'flex-end' },
});
