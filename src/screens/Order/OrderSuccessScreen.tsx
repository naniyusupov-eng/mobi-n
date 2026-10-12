import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Check, Home, Printer, ShoppingBag } from 'lucide-react-native';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { useLanguageStore } from '../../store/languageStore';
import { Order, Shop } from '../../types';
import { AppText, Badge, Button, Card, Divider, KeyValue, Money, Row, Screen } from '../../components/ui';
import { PAYMENT_TONE, usePrintReceipt } from '../../components/shared';
import { COMMON, PAYMENT_LABELS, UNIT_LABELS, useL } from '../../i18n/tri';
import { formatDayLong, formatMoney, formatNumber } from '../../utils/format';
import { colors, space } from '../../theme/colors';

export const OrderSuccessScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { orderId, shopId } = route.params;
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const printReceipt = usePrintReceipt();
  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (orderId) setOrder(orderRepository.getById(orderId));
    if (shopId) setShop(shopRepository.getById(shopId));
  }, [orderId, shopId]);

  const handlePrint = async () => {
    if (!order) return;
    setPrinting(true);
    try {
      await printReceipt(order); // shows its own error alert
    } finally {
      setPrinting(false);
    }
  };

  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'CatalogMain' }] });
    const parent = navigation.getParent();
    if (parent) parent.navigate('HomeTab');
    else navigation.navigate('HomeTab');
  };

  const handleNewOrder = () => {
    navigation.reset({ index: 0, routes: [{ name: 'CatalogMain' }] });
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoHome();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderItems = order?.items || [];

  return (
    <Screen
      edges={['top', 'left', 'right']}
      footer={
        <>
          <Button
            title={L({ uz: 'Chekni chop etish', uz_cyrl: 'Чекни чоп этиш', ru: 'Распечатать чек' })}
            icon={Printer}
            size="lg"
            loading={printing}
            disabled={!order}
            onPress={handlePrint}
          />
          <Row gap={space.sm}>
            <Button
              title={L({ uz: 'Yangi buyurtma', uz_cyrl: 'Янги буюртма', ru: 'Новый заказ' })}
              icon={ShoppingBag}
              variant="secondary"
              onPress={handleNewOrder}
              style={styles.flex}
            />
            <Button
              title={L({ uz: 'Bosh sahifa', uz_cyrl: 'Бош саҳифа', ru: 'Главная' })}
              icon={Home}
              variant="outline"
              onPress={handleGoHome}
              style={styles.flex}
            />
          </Row>
        </>
      }
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Check size={34} color={colors.success} strokeWidth={2.6} />
        </View>
        <AppText variant="h2" align="center" lines={2}>
          {L({ uz: 'Buyurtma qabul qilindi', uz_cyrl: 'Буюртма қабул қилинди', ru: 'Заказ принят' })}
        </AppText>
        <AppText variant="small" align="center" lines={3}>
          {L({
            uz: 'Hujjat telefonda saqlandi va ofisga yuborish navbatiga qoʻyildi.',
            uz_cyrl: 'Ҳужжат телефонда сақланди ва офисга юбориш навбатига қўйилди.',
            ru: 'Документ сохранён на телефоне и поставлен в очередь на отправку в офис.',
          })}
        </AppText>
      </View>

      {order ? (
        <Card>
          <Row gap={space.sm}>
            <AppText variant="label" lines={1} style={styles.flex}>
              {L({ uz: 'Yuk xati', uz_cyrl: 'Юк хати', ru: 'Накладная' })}
            </AppText>
            <Badge label={`#${order.id.slice(-8).toUpperCase()}`} tone="primary" />
          </Row>

          <View>
            <AppText variant="title" lines={2}>
              {order.shopName}
            </AppText>
            {shop?.address ? (
              <AppText variant="small" lines={2}>
                {shop.address}
              </AppText>
            ) : null}
          </View>

          <KeyValue
            label={L(COMMON.payment)}
            value={<Badge label={L(PAYMENT_LABELS[order.paymentMethod])} tone={PAYMENT_TONE[order.paymentMethod]} />}
          />
          {order.deliveryDate ? (
            <KeyValue
              label={L({ uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' })}
              value={formatDayLong(order.deliveryDate, lang)}
            />
          ) : null}

          {orderItems.length > 0 ? (
            <>
              <Divider style={styles.divider} />
              {orderItems.map((it) => (
                <View key={it.id} style={styles.itemRow}>
                  <View style={styles.flex}>
                    <AppText variant="body" lines={2}>
                      {it.productName}
                    </AppText>
                    <AppText variant="caption" lines={1}>
                      {`${formatNumber(it.quantity)} ${L(UNIT_LABELS[it.unit])} × ${formatMoney(it.unitPrice, lang)}`}
                    </AppText>
                  </View>
                  <Money amount={it.totalPrice} variant="body" style={styles.itemMoney} />
                </View>
              ))}
            </>
          ) : null}

          <Divider style={styles.divider} />
          {order.discountAmount > 0 ? (
            <>
              <KeyValue label={L({ uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' })} value={<Money amount={order.totalAmount} variant="body" />} />
              <KeyValue
                label={L(COMMON.discount)}
                value={<Money amount={-order.discountAmount} variant="body" color={colors.danger} />}
              />
            </>
          ) : null}
          <KeyValue strong label={L(COMMON.total)} value={<Money amount={order.finalAmount} variant="title" color={colors.primaryDark} />} />
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { alignItems: 'center', gap: space.sm, paddingTop: space.xl, paddingBottom: space.sm, paddingHorizontal: space.lg },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  divider: { marginVertical: space.xs },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: 2 },
  itemMoney: { flexShrink: 1, maxWidth: '45%' },
});
