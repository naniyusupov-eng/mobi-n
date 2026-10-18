import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { CheckCircle2, Minus, Navigation, Phone, Plus, RotateCcw, Undo2, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { shopRepository } from '../../database/shopRepository';
import { Delivery, cashToCollect, driverService, netAmount, returnedQty, serverError } from '../../services/driverService';
import { colors, radius, space } from '../../theme/colors';
import { AppText, Badge, Button, Card, Divider, Field, IconButton, IconCircle, KeyValue, Money, Row, Screen, Sheet } from '../../components/ui';
import { PAYMENT_TONE, PaymentSheet } from '../../components/shared';
import { PKO_LABEL, dialPhone, splitPhones } from '../../components/shopHelpers';
import { COMMON, CURRENCY, PAYMENT_LABELS, Tri, UNIT_LABELS, useL } from '../../i18n/tri';
import { formatMoney, formatNumber, formatShopNum, formatTime } from '../../utils/format';
import { Shop } from '../../types';

// Stored reason values stay in Uzbek Latin: the website groups returns by them
const REASONS: { value: string; label: Tri }[] = [
  { value: 'Doʻkon yopiq', label: { uz: 'Doʻkon yopiq', uz_cyrl: 'Дўкон ёпиқ', ru: 'Магазин закрыт' } },
  { value: 'Pul yetmadi', label: { uz: 'Pul yetmadi', uz_cyrl: 'Пул етмади', ru: 'Не хватило денег' } },
  { value: 'Kerak emas', label: { uz: 'Kerak emas', uz_cyrl: 'Керак эмас', ru: 'Не нужно' } },
];

const T = {
  goods: { uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' },
  orderSum: { uz: 'Buyurtma summasi', uz_cyrl: 'Буюртма суммаси', ru: 'Сумма заказа' },
  returns: { uz: 'Vozvrat', uz_cyrl: 'Возврат', ru: 'Возврат' },
  toCollect: { uz: 'Olinadigan naqd', uz_cyrl: 'Олинадиган нақд', ru: 'Получить наличными' },
  creditNote: {
    uz: 'Nasiya: summa doʻkon qarziga yoziladi, naqd olinmaydi',
    uz_cyrl: 'Насия: сумма дўкон қарзига ёзилади, нақд олинмайди',
    ru: 'В долг: сумма записывается в долг магазина, наличные не берутся',
  },
  transferNote: {
    uz: 'Oʻtkazma: pul bank orqali keladi',
    uz_cyrl: 'Ўтказма: пул банк орқали келади',
    ru: 'Перечисление: деньги придут через банк',
  },
  deliver: { uz: 'Topshirildi', uz_cyrl: 'Топширилди', ru: 'Доставлено' },
  deliverTitle: { uz: 'Yukni topshirish', uz_cyrl: 'Юкни топшириш', ru: 'Передать товар' },
  received: { uz: 'Olingan naqd pul', uz_cyrl: 'Олинган нақд пул', ru: 'Получено наличными' },
  returnTitle: { uz: 'Vozvrat kiritish', uz_cyrl: 'Возврат киритиш', ru: 'Оформить возврат' },
  reason: { uz: 'Sabab', uz_cyrl: 'Сабаб', ru: 'Причина' },
  returnTotal: { uz: 'Vozvrat summasi', uz_cyrl: 'Возврат суммаси', ru: 'Сумма возврата' },
  pickQty: { uz: 'Qaytgan miqdorni tanlang', uz_cyrl: 'Қайтган миқдорни танланг', ru: 'Выберите количество' },
  allBack: { uz: 'Hammasi qaytdi', uz_cyrl: 'Ҳаммаси қайтди', ru: 'Вернули всё' },
  deliveredAt: { uz: 'Topshirilgan', uz_cyrl: 'Топширилган', ru: 'Доставлено в' },
  undo: { uz: 'Topshirishni bekor qilish', uz_cyrl: 'Топширишни бекор қилиш', ru: 'Отменить доставку' },
  undoAsk: {
    uz: 'Buyurtma yana "kutilmoqda" holatiga qaytadi.',
    uz_cyrl: 'Буюртма яна "кутилмоқда" ҳолатига қайтади.',
    ru: 'Заказ снова станет ожидающим доставки.',
  },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Internetni tekshirib, qayta urinib koʻring.',
    uz_cyrl: 'Серверга уланиб бўлмади. Интернетни текшириб, қайта уриниб кўринг.',
    ru: 'Нет связи с сервером. Проверьте интернет и попробуйте снова.',
  },
  map: { uz: 'Xaritada', uz_cyrl: 'Харитада', ru: 'На карте' },
  debt: { uz: 'Doʻkon qarzi', uz_cyrl: 'Дўкон қарзи', ru: 'Долг магазина' },
} satisfies Record<string, Tri>;

export const DeliveryDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const session = useAuthStore((s) => s.agent);
  const by = `driver:${session?.lineCode || ''}`;

  const [d, setD] = useState<Delivery>(route.params.delivery);
  const date: string = route.params.date;
  const [busy, setBusy] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [cash, setCash] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(REASONS[0].value);
  const [payShop, setPayShop] = useState<Shop | null>(null);

  const delivered = d.status === 'delivered';
  const phones = splitPhones(d.shopPhone);
  const lineKey = (productId: string, unit: string) => `${productId}|${unit}`;

  // Fresh state from the server after every action
  const reload = useCallback(async () => {
    const list = await driverService.getDeliveries(session?.lineCode || '', date);
    const fresh = list.find((x) => x.id === d.id);
    if (fresh) setD(fresh);
  }, [session?.lineCode, date, d.id]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await reload();
      return true;
    } catch (err) {
      Alert.alert(L(COMMON.error), serverError(err, L(T.offline)));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openDeliver = () => {
    setCash(String(cashToCollect(d)));
    setDeliverOpen(true);
  };
  const confirmDeliver = async () => {
    const amount = Number(cash.replace(/\D/g, '')) || 0;
    if (await run(() => driverService.deliver(d.id, d.paymentMethod === 'naqd' ? amount : 0, by))) setDeliverOpen(false);
  };

  const undoDeliver = () =>
    Alert.alert(L(T.undo), L(T.undoAsk), [
      { text: L(COMMON.cancel), style: 'cancel' },
      { text: L(COMMON.confirm), style: 'destructive', onPress: () => run(() => driverService.undeliver(d.id)) },
    ]);

  // Lines that still have something left to return
  const returnLines = useMemo(
    () =>
      d.items
        .map((i) => ({ ...i, left: i.quantity - returnedQty(d, i.productId, i.unit) }))
        .filter((i) => i.left > 0),
    [d]
  );
  const ratio = d.totalAmount > 0 ? d.finalAmount / d.totalAmount : 1;
  const returnSum = returnLines.reduce((s, i) => s + Math.round((qty[lineKey(i.productId, i.unit)] || 0) * i.unitPrice * ratio), 0);
  const setLineQty = (key: string, value: number, max: number) => setQty((q) => ({ ...q, [key]: Math.max(0, Math.min(max, value)) }));

  const openReturn = () => {
    setQty({});
    setReason(REASONS[0].value);
    setReturnOpen(true);
  };
  const confirmReturn = async () => {
    const items = returnLines
      .map((i) => ({ productId: i.productId, unit: i.unit, quantity: qty[lineKey(i.productId, i.unit)] || 0 }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) return;
    if (await run(() => driverService.createReturn(d.id, reason, items))) setReturnOpen(false);
  };

  const openMap = () => {
    if (d.latitude && d.longitude) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`);
  };

  // PKO works with the shop saved on the phone (falls back to the delivery's details)
  const openPko = () =>
    setPayShop(
      shopRepository.getById(d.shopId) || {
        id: d.shopId,
        name: d.shopName,
        ownerName: '',
        phone: d.shopPhone,
        address: d.shopAddress,
        debtBalance: d.shopDebt,
        visitDay: '',
        createdAt: d.createdAt,
        isSynced: true,
      }
    );

  return (
    <Screen
      footer={
        delivered ? (
          <Button title={L(T.undo)} icon={Undo2} variant="outline" onPress={undoDeliver} loading={busy} />
        ) : (
          <Row gap={space.sm}>
            <Button
              title={L(T.returns)}
              icon={RotateCcw}
              variant="secondary"
              onPress={openReturn}
              disabled={busy || returnLines.length === 0}
              style={styles.flex}
            />
            <Button title={L(T.deliver)} icon={CheckCircle2} onPress={openDeliver} loading={busy} style={styles.grow2} />
          </Row>
        )
      }
    >
      {/* Shop */}
      <Card>
        <Row gap={space.md}>
          <View style={styles.num}>
            <AppText variant="title" color={colors.primary} fit>
              {d.shopNum != null ? formatShopNum(d.shopNum) : '•'}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="title" lines={2}>
              {d.shopName}
            </AppText>
            {d.shopAddress ? (
              <AppText variant="small" lines={2}>
                {d.shopAddress}
              </AppText>
            ) : null}
          </View>
        </Row>
        <Row gap={space.sm} wrap style={styles.topGap}>
          {phones.map((p) => (
            <Button key={p} title={p} icon={Phone} size="sm" variant="secondary" onPress={() => dialPhone(p)} />
          ))}
          {d.latitude && d.longitude ? <Button title={L(T.map)} icon={Navigation} size="sm" variant="outline" onPress={openMap} /> : null}
        </Row>
        <Divider style={styles.divider} />
        <Row gap={space.md}>
          <View style={styles.flex}>
            <AppText variant="small" lines={1}>
              {L(T.debt)}
            </AppText>
            {d.shopDebt > 0 ? (
              <Money amount={d.shopDebt} variant="title" color={colors.danger} />
            ) : (
              <AppText variant="strong" color={colors.success} lines={1}>
                {L(COMMON.noDebt)}
              </AppText>
            )}
          </View>
          <Button title={L(PKO_LABEL)} icon={Wallet} size="sm" variant={d.shopDebt > 0 ? 'danger' : 'outline'} onPress={openPko} />
        </Row>
      </Card>

      {/* Status */}
      {delivered ? (
        <Card style={styles.doneCard}>
          <Row gap={space.md}>
            <IconCircle icon={CheckCircle2} tone="success" size={44} />
            <View style={styles.flex}>
              <AppText variant="strong" color={colors.success} lines={1}>
                {L(T.deliver)}
                {d.deliveredAt ? ` · ${formatTime(d.deliveredAt)}` : ''}
              </AppText>
              {d.paymentMethod === 'naqd' ? (
                <AppText variant="small" lines={1}>
                  {L(T.received)}: {formatMoney(d.collected || 0, lang)}
                </AppText>
              ) : null}
            </View>
          </Row>
        </Card>
      ) : null}

      {/* Goods */}
      <Card>
        <AppText variant="label" lines={1}>
          {L(T.goods)}
        </AppText>
        {d.items.map((i) => {
          const back = returnedQty(d, i.productId, i.unit);
          return (
            <View key={lineKey(i.productId, i.unit)} style={styles.line}>
              <View style={styles.flex}>
                <AppText variant="body" lines={2}>
                  {i.productName}
                </AppText>
                <AppText variant="caption" lines={1}>
                  {formatNumber(i.quantity)} {L(UNIT_LABELS[i.unit])} × {formatNumber(i.unitPrice)}
                  {back > 0 ? `  ·  −${formatNumber(back)} ${L(T.returns).toLowerCase()}` : ''}
                </AppText>
              </View>
              <Money amount={i.totalPrice} variant="body" />
            </View>
          );
        })}
      </Card>

      {/* Money */}
      <Card>
        <KeyValue label={L(T.orderSum)} value={<Money amount={d.finalAmount} />} />
        {d.returnedAmount ? <KeyValue label={L(T.returns)} value={<Money amount={-d.returnedAmount} color={colors.warning} />} /> : null}
        <KeyValue label={L(COMMON.payment)} value={<Badge label={L(PAYMENT_LABELS[d.paymentMethod])} tone={PAYMENT_TONE[d.paymentMethod]} />} />
        <Divider style={styles.divider} />
        {d.paymentMethod === 'naqd' ? (
          <KeyValue label={L(T.toCollect)} value={<Money amount={cashToCollect(d)} variant="h2" color={colors.primary} />} strong />
        ) : (
          <AppText variant="small" lines={3}>
            {L(d.paymentMethod === 'nasiya' ? T.creditNote : T.transferNote)} · {formatMoney(netAmount(d), lang)}
          </AppText>
        )}
      </Card>

      {/* Deliver: cash received */}
      <Sheet
        visible={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        title={L(T.deliverTitle)}
        subtitle={d.shopName}
        footer={
          <>
            <Button title={L(COMMON.cancel)} variant="outline" onPress={() => setDeliverOpen(false)} style={styles.flex} />
            <Button title={L(COMMON.confirm)} onPress={confirmDeliver} loading={busy} style={styles.flex} />
          </>
        }
      >
        {d.paymentMethod === 'naqd' ? (
          <>
            <KeyValue label={L(T.toCollect)} value={<Money amount={cashToCollect(d)} />} strong />
            <Field
              label={L(T.received)}
              value={cash ? formatNumber(Number(cash.replace(/\D/g, '')) || 0) : ''}
              onChangeText={setCash}
              keyboardType="number-pad"
              placeholder="0"
              suffix={L(CURRENCY)}
            />
          </>
        ) : (
          <AppText variant="body" lines={4}>
            {L(d.paymentMethod === 'nasiya' ? T.creditNote : T.transferNote)}
          </AppText>
        )}
      </Sheet>

      {/* Return: what the shop did not take */}
      <Sheet
        visible={returnOpen}
        onClose={() => setReturnOpen(false)}
        title={L(T.returnTitle)}
        subtitle={d.shopName}
        footer={
          <>
            <Button title={L(COMMON.cancel)} variant="outline" onPress={() => setReturnOpen(false)} style={styles.flex} />
            <Button title={L(COMMON.save)} onPress={confirmReturn} loading={busy} disabled={returnSum <= 0} style={styles.flex} />
          </>
        }
      >
        <AppText variant="small">{L(T.reason)}</AppText>
        <Row gap={space.sm} wrap>
          {REASONS.map((r) => (
            <Pressable key={r.value} onPress={() => setReason(r.value)} style={[styles.chip, reason === r.value && styles.chipActive]}>
              <AppText variant="small" color={reason === r.value ? colors.white : colors.secondary} lines={1} style={styles.bold}>
                {L(r.label)}
              </AppText>
            </Pressable>
          ))}
        </Row>
        <Row gap={space.sm}>
          <AppText variant="small" style={styles.flex}>
            {L(T.pickQty)}
          </AppText>
          <Button
            title={L(T.allBack)}
            size="sm"
            variant="secondary"
            onPress={() => setQty(Object.fromEntries(returnLines.map((i) => [lineKey(i.productId, i.unit), i.left])))}
          />
        </Row>
        {returnLines.map((i) => {
          const key = lineKey(i.productId, i.unit);
          const n = qty[key] || 0;
          return (
            <View key={key} style={styles.returnLine}>
              <View style={styles.flex}>
                <AppText variant="body" lines={2}>
                  {i.productName}
                </AppText>
                <AppText variant="caption" lines={1}>
                  max {formatNumber(i.left)} {L(UNIT_LABELS[i.unit])}
                </AppText>
              </View>
              <IconButton icon={Minus} onPress={() => setLineQty(key, n - 1, i.left)} size={36} disabled={n <= 0} />
              <AppText variant="title" align="center" style={styles.qty}>
                {formatNumber(n)}
              </AppText>
              <IconButton icon={Plus} tone="primary" onPress={() => setLineQty(key, n + 1, i.left)} size={36} disabled={n >= i.left} />
            </View>
          );
        })}
        <KeyValue label={L(T.returnTotal)} value={<Money amount={returnSum} color={colors.warning} />} strong />
      </Sheet>

      <PaymentSheet shop={payShop} onClose={() => setPayShop(null)} onDone={reload} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  grow2: { flex: 2, minWidth: 0 },
  bold: { fontWeight: '600' },
  topGap: { marginTop: space.xs },
  divider: { marginVertical: space.xs },
  num: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  doneCard: { backgroundColor: colors.successLight },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 },
  returnLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  qty: { width: 40 },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.primary },
});
