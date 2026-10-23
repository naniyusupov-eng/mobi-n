import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CheckCircle2, Circle, ClipboardList, CloudOff, Package, PackageCheck } from 'lucide-react-native';
import { useLanguageStore } from '../../store/languageStore';
import { getTodayDateString } from '../../store/dateStore';
import { LoadingProduct, LoadingSheet, driverOffline } from '../../services/driverService';
import { colors, space } from '../../theme/colors';
import { AppText, Card, Divider, EmptyState, HeroCard, HeroPill, Row, Screen, SectionHeader } from '../../components/ui';
import { COMMON, Tri, UNIT_LABELS, offlineCopyNote, useL } from '../../i18n/tri';
import { formatDayLong, formatMoney, formatNumber, formatTime } from '../../utils/format';
import { PackagingUnit } from '../../types';

export const LOADING_TITLE: Tri = { uz: 'Yuk roʻyxati', uz_cyrl: 'Юк рўйхати', ru: 'Список загрузки' };

const T = {
  products: { uz: 'Mahsulotlar', uz_cyrl: 'Маҳсулотлар', ru: 'Товары' },
  loaded: { uz: 'yuklandi', uz_cyrl: 'юкланди', ru: 'загружено' },
  totalDona: { uz: 'jami', uz_cyrl: 'жами', ru: 'всего' },
  none: { uz: 'Bu kunga yuklanadigan narsa yoʻq', uz_cyrl: 'Бу кунга юкланадиган нарса йўқ', ru: 'На этот день загружать нечего' },
  allLoaded: { uz: 'Hammasi yuklandi', uz_cyrl: 'Ҳаммаси юкланди', ru: 'Всё загружено' },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Pastga tortib yangilang',
    uz_cyrl: 'Серверга уланиб бўлмади. Пастга тортиб янгиланг',
    ru: 'Нет связи с сервером. Потяните вниз, чтобы обновить',
  },
} satisfies Record<string, Tri>;

// Bigger packaging first: "2 korobka + 7 blok + 9 dona"
const UNIT_ORDER: PackagingUnit[] = ['korobka', 'blok', 'dona', 'kg'];

const formatQty = (n: number) => (Number.isInteger(n) ? formatNumber(n) : String(Math.round(n * 100) / 100).replace('.', ','));

export const LoadingListScreen = ({ route }: { route: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const date: string = route?.params?.date || getTodayDateString();

  const [sheet, setSheet] = useState<LoadingSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  // Ticks live only on this screen, per day
  const [ticked, setTicked] = useState<Record<string, boolean>>({});

  const [copyAt, setCopyAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Falls back to the copy saved on the phone when the server does not answer
      const res = await driverOffline.loadLoading(date);
      setSheet(res.data.sheets[0] || null);
      setOffline(res.offline);
      setCopyAt(res.offline ? res.savedAt : null);
    } catch {
      setOffline(true);
      setCopyAt(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setTicked({});
    load();
  }, [load]);

  const products = useMemo(() => sheet?.products || [], [sheet]);
  const doneCount = products.filter((p) => ticked[p.productId]).length;
  const toggle = (id: string) => setTicked((t) => ({ ...t, [id]: !t[id] }));

  const unitsText = (p: LoadingProduct) =>
    UNIT_ORDER.filter((u) => (p.units?.[u] || 0) > 0)
      .map((u) => `${formatQty(p.units[u] as number)} ${L(UNIT_LABELS[u])}`)
      .join(' + ') || '—';

  return (
    <Screen refreshing={loading && !!sheet} onRefresh={load}>
      <HeroCard
        icon={ClipboardList}
        label={formatDayLong(date, lang)}
        value={formatMoney(sheet?.total || 0, lang)}
        badge={sheet?.line ? <HeroPill label={sheet.line} /> : undefined}
      >
        <HeroPill solid icon={Package} label={`${formatNumber(sheet?.orders || 0)} ${L(COMMON.ordersCount)}`} />
        <HeroPill icon={CheckCircle2} label={`${formatNumber(doneCount)} / ${formatNumber(products.length)} ${L(T.loaded)}`} />
      </HeroCard>

      {offline ? (
        <Card style={styles.warn}>
          <Row gap={space.md}>
            <CloudOff size={20} color={colors.warning} />
            <AppText variant="small" color={colors.warning} lines={3} style={styles.flex}>
              {copyAt ? L(offlineCopyNote(formatTime(copyAt))) : L(T.offline)}
            </AppText>
          </Row>
        </Card>
      ) : null}

      {!loading && (!offline || !!copyAt) && products.length === 0 ? (
        <Card>
          <EmptyState icon={PackageCheck} title={L(T.none)} />
        </Card>
      ) : null}

      {products.length > 0 ? (
        <>
          <SectionHeader
            title={`${L(T.products)} · ${formatNumber(products.length)}${doneCount === products.length ? ` · ${L(T.allLoaded)}` : ''}`}
          />
          <Card style={styles.listCard}>
            {products.map((p, i) => {
              const on = !!ticked[p.productId];
              return (
                <View key={p.productId}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable onPress={() => toggle(p.productId)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on ? (
                        <CheckCircle2 size={22} color={colors.white} strokeWidth={2.2} />
                      ) : (
                        <Circle size={22} color={colors.primary} strokeWidth={2} />
                      )}
                    </View>
                    <View style={styles.flex}>
                      <AppText variant="strong" lines={2} color={on ? colors.textMuted : undefined} style={on ? styles.strike : undefined}>
                        {p.code ? `${p.code} · ${p.name}` : p.name}
                      </AppText>
                      <AppText variant="small" lines={2} color={on ? colors.textMuted : colors.primary}>
                        {unitsText(p)}
                      </AppText>
                    </View>
                    {!p.hasKg || p.totalDona > 0 ? (
                      <View style={styles.right}>
                        <AppText variant="strong" fit align="right">
                          {formatNumber(p.totalDona)}
                        </AppText>
                        <AppText variant="caption" lines={1} align="right">
                          {`${L(T.totalDona)}, ${L(UNIT_LABELS.dona)}`}
                        </AppText>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  warn: { backgroundColor: colors.warningLight },
  listCard: { paddingVertical: 0 },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  pressed: { opacity: 0.75 },
  check: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.success },
  strike: { textDecorationLine: 'line-through' },
  right: { alignItems: 'flex-end', maxWidth: '32%' },
});
