import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import * as Location from 'expo-location';
import { AlertTriangle, Check } from 'lucide-react-native';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { getTodayDateString } from '../../store/dateStore';
import { PaymentMethod } from '../../types';
import { AppText, Button, Card, Divider, Field, KeyValue, Money, Row, Screen, SectionHeader } from '../../components/ui';
import { COMMON, PAYMENT_LABELS, Tri, promoLabel, useL } from '../../i18n/tri';
import { formatDayLong, formatNumber } from '../../utils/format';
import { nasiyaBlockReason } from '../../utils/credit';
import { shopRepository } from '../../database/shopRepository';
import { colors, radius, space } from '../../theme/colors';
import { EqualSegments } from '../../components/orderControls';
import { readFix } from '../../services/workdayService';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day N days from today as YYYY-MM-DD */
const datePlusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const isValidDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const PAYMENT_HINTS: Record<PaymentMethod, Tri> = {
  naqd: { uz: 'Darhol toʻlov', uz_cyrl: 'Дарҳол тўлов', ru: 'Оплата сразу' },
  nasiya: { uz: 'Keyinchalik toʻlov (qarzga)', uz_cyrl: 'Кейинчалик тўлов (қарзга)', ru: 'Отсрочка платежа' },
  otkazma: { uz: 'Hisob raqam orqali', uz_cyrl: 'Ҳисоб рақам орқали', ru: 'Через расчётный счёт' },
};

const PAYMENT_ORDER: PaymentMethod[] = ['naqd', 'nasiya', 'otkazma'];

export const CheckoutScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const {
    shop,
    items,
    paymentMethod,
    setPaymentMethod,
    deliveryDate,
    setDeliveryDate,
    notes,
    setNotes,
    discountPercent,
    getTotalAmount,
    getManualDiscount,
    getPromoLines,
    getFinalAmount,
    submitOrder,
  } = useCartStore();
  const promoLines = getPromoLines();
  const { agent } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = getFinalAmount();
  const dateOk = isValidDate(deliveryDate);

  // Credit state from the phone database (refreshed at sign-in and on every sync)
  const creditShop = useMemo(() => (shop ? shopRepository.getById(shop.id) ?? shop : null), [shop]);
  const nasiyaBlocked = nasiyaBlockReason(creditShop, finalAmount, lang);

  // Nasiya not allowed: fall back to cash
  useEffect(() => {
    if (nasiyaBlocked && paymentMethod === 'nasiya') setPaymentMethod('naqd');
  }, [nasiyaBlocked, paymentMethod, setPaymentMethod]);

  // A cart left from an earlier day: move its delivery date to today
  useEffect(() => {
    const today = getTodayDateString();
    if (isValidDate(deliveryDate) && deliveryDate < today) setDeliveryDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickDates = [
    { key: datePlusDays(0), label: L(COMMON.today) },
    { key: datePlusDays(1), label: L({ uz: 'Ertaga', uz_cyrl: 'Эртага', ru: 'Завтра' }) },
    { key: datePlusDays(2), label: L({ uz: 'Indinga', uz_cyrl: 'Индинга', ru: 'Послезавтра' }) },
  ];

  const handleConfirmOrder = async () => {
    if (!shop || items.length === 0) {
      Alert.alert(L(COMMON.error), L({ uz: 'Savatcha boʻsh', uz_cyrl: 'Саватча бўш', ru: 'Корзина пуста' }));
      return;
    }
    if (!agent) {
      Alert.alert(L(COMMON.error), L({ uz: 'Avtorizatsiya xatosi', uz_cyrl: 'Авторизация хатоси', ru: 'Ошибка авторизации' }));
      return;
    }
    if (paymentMethod === 'nasiya' && nasiyaBlocked) {
      Alert.alert(L(COMMON.warning), nasiyaBlocked);
      return;
    }
    if (!dateOk) {
      Alert.alert(
        L(COMMON.warning),
        L({ uz: 'Yetkazish sanasini toʻgʻri kiriting', uz_cyrl: 'Етказиш санасини тўғри киритинг', ru: 'Укажите корректную дату доставки' })
      );
      return;
    }
    if (deliveryDate < getTodayDateString()) {
      Alert.alert(
        L(COMMON.warning),
        L({
          uz: 'Yetkazish sanasi oʻtgan kun boʻlishi mumkin emas',
          uz_cyrl: 'Етказиш санаси ўтган кун бўлиши мумкин эмас',
          ru: 'Дата доставки не может быть в прошлом',
        })
      );
      return;
    }

    try {
      setSubmitting(true);

      let coords: { latitude?: number; longitude?: number } = {};
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          // At most ~8s for a fix (then a recent last-known one); no fix = order without coordinates
          const pos = await readFix();
          if (pos) coords = { latitude: pos.lat, longitude: pos.lng };
        }
      } catch {
        // Location is optional; the order is saved without it
      }

      const createdOrder = submitOrder(agent.id, agent.name, coords);

      if (createdOrder) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'OrderSuccessScreen', params: { orderId: createdOrder.id, shopId: shop.id } }],
        });
      }
    } catch (e: any) {
      Alert.alert(L(COMMON.error), e?.message || L(COMMON.error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Row gap={space.md}>
            <AppText variant="small" lines={1} style={styles.flex}>
              {L(COMMON.toPay)}
            </AppText>
            <Money amount={finalAmount} variant="h2" style={styles.footerMoney} />
          </Row>
          <Button
            title={L({ uz: 'Buyurtmani tasdiqlash', uz_cyrl: 'Буюртмани тасдиқлаш', ru: 'Подтвердить заказ' })}
            icon={Check}
            size="lg"
            loading={submitting}
            onPress={handleConfirmOrder}
          />
        </>
      }
    >
      {/* Order document */}
      <Card>
        <AppText variant="label" lines={1}>
          {L({ uz: 'Buyurtma hujjati', uz_cyrl: 'Буюртма ҳужжати', ru: 'Документ заказа' })}
        </AppText>
        <KeyValue label={L({ uz: 'Doʻkon', uz_cyrl: 'Дўкон', ru: 'Магазин' })} value={shop?.name || '—'} />
        {shop?.address ? (
          <KeyValue label={L({ uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' })} value={shop.address} />
        ) : null}
        <KeyValue label={L({ uz: 'Liniya', uz_cyrl: 'Линия', ru: 'Линия' })} value={agent?.lineCode || '—'} />
        <Divider style={styles.divider} />
        <KeyValue
          label={L({ uz: 'Pozitsiyalar', uz_cyrl: 'Позициялар', ru: 'Позиций' })}
          value={formatNumber(items.length)}
        />
        <KeyValue label={L({ uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' })} value={<Money amount={getTotalAmount()} variant="body" />} />
        {discountPercent > 0 ? (
          <KeyValue
            label={`${L(COMMON.discount)} ${discountPercent}%`}
            value={<Money amount={-getManualDiscount()} variant="body" color={colors.danger} />}
          />
        ) : null}
        {promoLines.map((p) => (
          <KeyValue
            key={p.id}
            label={L(promoLabel(p.name, p.percent))}
            value={<Money amount={-p.amount} variant="body" color={colors.danger} />}
          />
        ))}
        {shop && shop.debtBalance > 0 ? (
          <View style={styles.debtBox}>
            <AlertTriangle size={16} color={colors.danger} />
            <AppText variant="small" color={colors.danger} lines={1} style={styles.flex}>
              {L({ uz: 'Oldingi qarz', uz_cyrl: 'Олдинги қарз', ru: 'Прежний долг' })}
            </AppText>
            <Money amount={shop.debtBalance} variant="strong" color={colors.danger} style={styles.debtMoney} />
          </View>
        ) : null}
      </Card>

      {/* Delivery date */}
      <SectionHeader title={L({ uz: 'Yetkazish sanasi', uz_cyrl: 'Етказиш санаси', ru: 'Дата доставки' })} />
      <Card>
        <EqualSegments options={quickDates} value={deliveryDate} onChange={setDeliveryDate} />
        <Field
          label={L({ uz: 'Boshqa sana', uz_cyrl: 'Бошқа сана', ru: 'Другая дата' })}
          value={deliveryDate}
          onChangeText={setDeliveryDate}
          placeholder={getTodayDateString()}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          error={
            deliveryDate && !dateOk
              ? L({ uz: 'Format: 2026-01-31', uz_cyrl: 'Формат: 2026-01-31', ru: 'Формат: 2026-01-31' })
              : undefined
          }
          hint={dateOk ? formatDayLong(deliveryDate, lang) : undefined}
        />
      </Card>

      {/* Payment method */}
      <SectionHeader title={L(COMMON.payment)} />
      <Card padded={false} style={styles.clip}>
        {PAYMENT_ORDER.map((pm, index) => {
          const blockReason = pm === 'nasiya' ? nasiyaBlocked : null;
          const disabled = !!blockReason;
          const active = paymentMethod === pm && !disabled;
          return (
            <View key={pm}>
              {index > 0 ? <Divider style={styles.optionDivider} /> : null}
              <Pressable
                onPress={() => setPaymentMethod(pm)}
                disabled={disabled}
                accessibilityState={{ disabled, selected: active }}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  disabled && styles.optionDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.flex}>
                  <AppText
                    variant="strong"
                    lines={1}
                    color={disabled ? colors.textSecondary : active ? colors.primaryDark : colors.text}
                  >
                    {L(PAYMENT_LABELS[pm])}
                  </AppText>
                  <AppText variant="small" lines={1}>
                    {L(PAYMENT_HINTS[pm])}
                  </AppText>
                  {blockReason ? (
                    <AppText variant="small" color={colors.danger} lines={2}>
                      {blockReason}
                    </AppText>
                  ) : null}
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </Card>

      {/* Notes */}
      <Field
        label={L({ uz: 'Izoh', uz_cyrl: 'Изоҳ', ru: 'Комментарий' })}
        placeholder={L({ uz: 'Buyurtma uchun izoh', uz_cyrl: 'Буюртма учун изоҳ', ru: 'Комментарий к заказу' })}
        value={notes}
        onChangeText={setNotes}
        multiline
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  clip: { overflow: 'hidden' },
  divider: { marginVertical: space.xs },
  footerMoney: { flexShrink: 1, maxWidth: '65%' },
  debtBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xs,
    padding: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerLight,
  },
  debtMoney: { flexShrink: 1, maxWidth: '55%' },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 60 },
  optionActive: { backgroundColor: colors.primaryLight },
  optionDisabled: { opacity: 0.55 },
  optionDivider: { marginHorizontal: space.md },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
});
