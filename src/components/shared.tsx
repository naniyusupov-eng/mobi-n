/**
 * Feature pieces used on several screens: printing a receipt, an order card and the
 * debt payment (PKO) sheet. One implementation instead of a copy per screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { CloudOff, Printer } from 'lucide-react-native';
import { AppText, Badge, Button, Field, IconButton, Money, Row, Sheet, Tone } from './ui';
import { colors, radius, space } from '../theme/colors';
import { COMMON, CURRENCY, PAYMENT_LABELS, STATUS_LABELS, useL } from '../i18n/tri';
import { useLanguageStore } from '../store/languageStore';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { orderRepository } from '../database/orderRepository';
import { shopRepository } from '../database/shopRepository';
import { invoiceService } from '../services/invoiceService';
import { Order, OrderStatus, PaymentMethod, Shop } from '../types';
import { formatDateTime, formatMoney, formatNumber, formatTime } from '../utils/format';

export const PAYMENT_TONE: Record<PaymentMethod, Tone> = { naqd: 'success', nasiya: 'danger', otkazma: 'primary' };
const STATUS_TONE: Record<OrderStatus, Tone> = { pending: 'warning', confirmed: 'primary', delivered: 'success', cancelled: 'danger' };

/** Builds the PDF receipt for an order and opens the share/print dialog */
export const usePrintReceipt = () => {
  const L = useL();
  return useCallback(
    async (order: Order) => {
      try {
        const full = orderRepository.getById(order.id) || order;
        const shop = shopRepository.getById(order.shopId);
        await invoiceService.printOrSharePdf(full, shop);
      } catch {
        Alert.alert(L(COMMON.error), L(COMMON.printError));
      }
    },
    [L]
  );
};

/** Order summary used in lists (home, history, shop page) */
export const OrderCard: React.FC<{ order: Order; showDate?: boolean; showShop?: boolean; onPress?: () => void }> = ({
  order,
  showDate,
  showShop = true,
  onPress,
}) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const print = usePrintReceipt();

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
      <View style={styles.orderMain}>
        {showShop ? (
          <AppText variant="strong" lines={1}>
            {order.shopName}
          </AppText>
        ) : null}
        <Row gap={6} wrap>
          <AppText variant="caption">{showDate ? formatDateTime(order.createdAt, lang) : formatTime(order.createdAt)}</AppText>
          <Badge label={L(PAYMENT_LABELS[order.paymentMethod])} tone={PAYMENT_TONE[order.paymentMethod]} />
          {order.status !== 'pending' ? <Badge label={L(STATUS_LABELS[order.status])} tone={STATUS_TONE[order.status]} /> : null}
          {!order.isSynced ? (
            <Badge icon={CloudOff} label={L({ uz: 'Yuborilmagan', uz_cyrl: 'Юборилмаган', ru: 'Не отправлен' })} tone="warning" />
          ) : null}
        </Row>
      </View>
      <View style={styles.orderRight}>
        <Money amount={order.finalAmount} />
        <IconButton icon={Printer} onPress={() => print(order)} size={34} />
      </View>
    </Pressable>
  );
};

/** Debt payment (PKO) for one shop. Saved on the phone and queued for the server. */
export const PaymentSheet: React.FC<{ shop: Shop | null; onClose: () => void; onDone?: () => void }> = ({ shop, onClose, onDone }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const triggerSync = useSyncStore((s) => s.triggerSync);
  const session = useAuthStore((s) => s.agent);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    setAmount(shop && shop.debtBalance > 0 ? String(shop.debtBalance) : '');
  }, [shop]);

  const debt = shop ? Math.max(0, shop.debtBalance) : 0;
  // PKO pays off old debt only; it can never be more than the debt
  const value = Math.min(Number(amount.replace(/\D/g, '')) || 0, debt);
  const quick = [100_000, 500_000, 1_000_000].filter((q) => q < debt);

  // A second tap before the sheet closes must not take the payment twice
  const takenFor = useRef<string | null>(null);
  useEffect(() => {
    if (!shop) takenFor.current = null;
  }, [shop]);

  const handleConfirm = () => {
    if (!shop || value <= 0 || debt <= 0 || takenFor.current === shop.id) return;
    takenFor.current = shop.id;
    shopRepository.collectPayment(shop.id, value, `${session?.role || 'agent'}:${session?.lineCode || ''}`);
    onClose();
    onDone?.();
    Alert.alert(L(COMMON.paymentAccepted), `${shop.name}\n${formatMoney(value, lang)}`);
    // Sent to the server now; if offline it stays queued and is retried later
    triggerSync().then(() => onDone?.());
  };

  return (
    <Sheet
      visible={!!shop}
      onClose={onClose}
      title={L(COMMON.acceptPayment)}
      subtitle={shop?.name}
      footer={
        <>
          <Button title={L(COMMON.cancel)} variant="outline" onPress={onClose} style={styles.flex} />
          <Button title={L(COMMON.confirm)} onPress={handleConfirm} disabled={value <= 0 || debt <= 0} style={styles.flex} />
        </>
      }
    >
      <AppText variant="caption" lines={3}>
        {L({
          uz: 'PKO — faqat eski qarz toʻlovi. Bugun yetkazilgan naqd buyurtma puli bu yerga kiritilmaydi, u yetkazishda olinadi.',
          uz_cyrl: 'ПКО — фақат эски қарз тўлови. Бугун етказилган нақд буюртма пули бу ерга киритилмайди, у етказишда олинади.',
          ru: 'ПКО — только оплата старого долга. Деньги за доставленный сегодня заказ за наличные сюда не вносятся, их берут при доставке.',
        })}
      </AppText>
      {shop && shop.debtBalance <= 0 ? (
        <AppText variant="strong" color={colors.success}>
          {L(COMMON.noDebt)}
        </AppText>
      ) : null}
      {shop && shop.debtBalance > 0 ? (
        <View style={styles.debtBox}>
          <AppText variant="small" color={colors.danger}>
            {L({ uz: 'Joriy qarz', uz_cyrl: 'Жорий қарз', ru: 'Текущий долг' })}
          </AppText>
          <Money amount={shop.debtBalance} color={colors.danger} />
        </View>
      ) : null}
      <Field
        label={L({ uz: 'Qabul qilingan summa', uz_cyrl: 'Қабул қилинган сумма', ru: 'Принятая сумма' })}
        value={value ? formatNumber(value) : ''}
        onChangeText={setAmount}
        keyboardType="number-pad"
        placeholder="0"
        suffix={L(CURRENCY)}
        autoFocus
      />
      <Row gap={space.sm} wrap>
        {quick.map((q) => (
          <Button key={q} title={formatNumber(q)} size="sm" variant="outline" onPress={() => setAmount(String(q))} />
        ))}
        {shop && shop.debtBalance > 0 ? (
          <Button
            title={L({ uz: 'Toʻliq qarz', uz_cyrl: 'Тўлиқ қарз', ru: 'Весь долг' })}
            size="sm"
            variant="secondary"
            onPress={() => setAmount(String(shop.debtBalance))}
          />
        ) : null}
      </Row>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  orderMain: { flex: 1, minWidth: 0, gap: 6 },
  orderRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm, maxWidth: '50%' },
  debtBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
  },
});
