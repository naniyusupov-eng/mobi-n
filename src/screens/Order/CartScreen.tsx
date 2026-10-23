import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ArrowRight, ShoppingBag, Store, Trash2 } from 'lucide-react-native';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import {
  AppText,
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  KeyValue,
  Money,
  Row,
  Screen,
  SectionHeader,
} from '../../components/ui';
import { COMMON, UNIT_LABELS, promoLabel, useL } from '../../i18n/tri';
import { formatDayLong, formatMoney, formatNumber } from '../../utils/format';
import { colors, radius, space } from '../../theme/colors';
import { EqualSegments, QtyStepper } from '../../components/orderControls';

const DISCOUNT_OPTIONS = [0, 3, 5, 10];

export const CartScreen = ({ navigation }: { navigation: any }) => {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const {
    shop,
    items,
    updateQuantity,
    setQuantity,
    removeItem,
    clearCart,
    discountPercent,
    setDiscountPercent,
    deliveryDate,
    getTotalAmount,
    getManualDiscount,
    getPromoLines,
    getFinalAmount,
    getItemCount,
  } = useCartStore();

  const totalAmount = getTotalAmount();
  const discountAmount = getManualDiscount();
  const promoLines = getPromoLines();
  const finalAmount = getFinalAmount();

  const backToCatalog = () => navigation.navigate('CatalogMain');

  const handleClear = () => {
    Alert.alert(
      L({ uz: 'Savatchani tozalash', uz_cyrl: 'Саватчани тозалаш', ru: 'Очистить корзину' }),
      L({
        uz: 'Savatchadagi barcha tovarlar oʻchiriladi.',
        uz_cyrl: 'Саватчадаги барча товарлар ўчирилади.',
        ru: 'Все товары будут удалены из корзины.',
      }),
      [
        { text: L(COMMON.cancel), style: 'cancel' },
        { text: L({ uz: 'Tozalash', uz_cyrl: 'Тозалаш', ru: 'Очистить' }), style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const shopCard = shop ? (
    <Card style={styles.shopCard}>
      <View style={styles.shopIcon}>
        <Store size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.flex}>
        <AppText variant="strong" lines={1}>
          {shop.name}
        </AppText>
        {shop.ownerName ? (
          <AppText variant="small" lines={1}>
            {shop.ownerName}
          </AppText>
        ) : null}
      </View>
      {items.length > 0 ? <IconButton icon={Trash2} tone="danger" size={36} onPress={handleClear} /> : null}
    </Card>
  ) : null;

  if (items.length === 0) {
    return (
      <Screen>
        {shopCard}
        <EmptyState
          icon={ShoppingBag}
          title={L({ uz: 'Savatcha boʻsh', uz_cyrl: 'Саватча бўш', ru: 'Корзина пуста' })}
          hint={L({
            uz: 'Katalogdan tovar tanlang',
            uz_cyrl: 'Каталогдан товар танланг',
            ru: 'Выберите товары в каталоге',
          })}
          action={
            <Button
              title={L({ uz: 'Katalogga oʻtish', uz_cyrl: 'Каталогга ўтиш', ru: 'Перейти в каталог' })}
              onPress={backToCatalog}
              style={styles.emptyAction}
            />
          }
        />
      </Screen>
    );
  }

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
            title={L({ uz: 'Rasmiylashtirish', uz_cyrl: 'Расмийлаштириш', ru: 'Оформить заказ' })}
            icon={ArrowRight}
            size="lg"
            onPress={() => navigation.navigate('CheckoutScreen')}
          />
        </>
      }
    >
      {shopCard}

      <SectionHeader
        title={`${L({ uz: 'Tovarlar', uz_cyrl: 'Товарлар', ru: 'Товары' })} · ${formatNumber(items.length)}`}
        action={L({ uz: 'Yana qoʻshish', uz_cyrl: 'Яна қўшиш', ru: 'Добавить ещё' })}
        onAction={backToCatalog}
      />
      <Card padded={false}>
        {items.map((item, index) => (
          <View key={`${item.product.id}_${item.unit}`}>
            {index > 0 ? <Divider style={styles.lineDivider} /> : null}
            <View style={styles.line}>
              <View style={styles.lineTop}>
                <View style={styles.flex}>
                  <AppText variant="strong" lines={2}>
                    {item.product.name}
                  </AppText>
                  <AppText variant="caption" lines={1}>
                    {`${formatMoney(item.unitPrice, lang)} / ${L(UNIT_LABELS[item.unit])}`}
                  </AppText>
                </View>
                <IconButton icon={Trash2} size={32} onPress={() => removeItem(item.product.id, item.unit)} />
              </View>
              <View style={styles.lineBottom}>
                <QtyStepper
                  value={item.quantity}
                  trashAtOne
                  onInc={() => updateQuantity(item.product.id, item.unit, 1)}
                  onDec={() => updateQuantity(item.product.id, item.unit, -1)}
                  onSet={(n) => setQuantity(item.product.id, item.unit, n)}
                />
                <View style={styles.lineTotal}>
                  <Money amount={item.totalPrice} />
                </View>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title={L(COMMON.discount)} />
      <EqualSegments
        options={DISCOUNT_OPTIONS.map((d) => ({ key: d, label: `${d}%` }))}
        value={discountPercent}
        onChange={setDiscountPercent}
      />

      <Card>
        <KeyValue
          label={L({ uz: 'Tovarlar soni', uz_cyrl: 'Товарлар сони', ru: 'Количество' })}
          value={formatNumber(getItemCount())}
        />
        <KeyValue label={L({ uz: 'Summa', uz_cyrl: 'Сумма', ru: 'Сумма' })} value={<Money amount={totalAmount} variant="body" />} />
        {discountPercent > 0 ? (
          <KeyValue
            label={`${L(COMMON.discount)} ${discountPercent}%`}
            value={<Money amount={-discountAmount} variant="body" color={colors.danger} />}
          />
        ) : null}
        {promoLines.map((p) => (
          <KeyValue
            key={p.id}
            label={L(promoLabel(p.name, p.percent))}
            value={<Money amount={-p.amount} variant="body" color={colors.danger} />}
          />
        ))}
        {deliveryDate ? (
          <KeyValue
            label={L({ uz: 'Yetkazish', uz_cyrl: 'Етказиш', ru: 'Доставка' })}
            value={formatDayLong(deliveryDate, lang)}
          />
        ) : null}
        <Divider style={styles.summaryDivider} />
        <KeyValue strong label={L(COMMON.total)} value={<Money amount={finalAmount} color={colors.primaryDark} />} />
      </Card>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shopCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  shopIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: { marginTop: space.sm, alignSelf: 'stretch' },
  line: { padding: space.md, gap: space.md },
  lineTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  lineBottom: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  lineTotal: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
  lineDivider: { marginHorizontal: space.md },
  summaryDivider: { marginVertical: space.xs },
  footerMoney: { flexShrink: 1, maxWidth: '65%' },
});
