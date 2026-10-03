import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { CartItem } from '../../types';
import { colors } from '../../theme/colors';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store,
  Tag,
  ShoppingBag,
} from 'lucide-react-native';

const DISCOUNT_OPTIONS = [0, 3, 5, 10];

export const CartScreen = ({ navigation }: { navigation: any }) => {
  const { lang, t } = useLanguageStore();
  const {
    shop,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    discountPercent,
    setDiscountPercent,
    deliveryDate,
    getTotalAmount,
    getDiscountAmount,
    getFinalAmount,
  } = useCartStore();

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const totalAmount = getTotalAmount();
  const discountAmount = getDiscountAmount();
  const finalAmount = getFinalAmount();

  const handleClear = () => {
    Alert.alert(t('cart_clear'), t('cart_empty') + '?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('cart_clear'), style: 'destructive', onPress: clearCart },
    ]);
  };

  const renderCartRow = ({ item, index }: { item: CartItem; index: number }) => (
    <View style={styles.itemRow}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.priceDetails}>
          {item.unitPrice.toLocaleString(numLocale)} {t('currency')}/{item.unit}
        </Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepperBox}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateQuantity(item.product.id, item.unit, -1)}
          activeOpacity={0.7}
        >
          <Minus size={13} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.stepperBtn, styles.stepperBtnAdd]}
          onPress={() => updateQuantity(item.product.id, item.unit, 1)}
          activeOpacity={0.7}
        >
          <Plus size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Total & Delete */}
      <View style={styles.rowRight}>
        <Text style={styles.rowTotal}>
          {item.totalPrice.toLocaleString(numLocale)} {t('currency')}
        </Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => removeItem(item.product.id, item.unit)}
          activeOpacity={0.7}
        >
          <Trash2 size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Client Header Strip */}
      <View style={styles.clientStrip}>
        <Store size={15} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.clientLabel}>{t('checkout_client')}:</Text>
          <Text style={styles.clientName} numberOfLines={1}>
            {shop ? `${shop.name} (${shop.ownerName})` : '—'}
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <Trash2 size={13} color={colors.danger} />
            <Text style={styles.clearBtnText}>{t('cart_clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t('cart_empty')}</Text>
          <Text style={styles.emptyDesc}>{t('cart_empty_sub')}</Text>
          <TouchableOpacity
            style={styles.toCatalogBtn}
            onPress={() => navigation.navigate('CatalogTab')}
            activeOpacity={0.8}
          >
            <Text style={styles.toCatalogText}>{t('tab_catalog')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.product.id}_${item.unit}`}
            renderItem={renderCartRow}
            contentContainerStyle={styles.listContent}
          />

          {/* Discount Selector */}
          <View style={styles.discountSection}>
            <View style={styles.discountHeader}>
              <Tag size={13} color={colors.primary} />
              <Text style={styles.discountTitle}>{t('checkout_discount')}</Text>
            </View>
            <View style={styles.discountPillsRow}>
              {DISCOUNT_OPTIONS.map((disc) => {
                const isSelected = discountPercent === disc;
                return (
                  <TouchableOpacity
                    key={disc}
                    style={[styles.discPill, isSelected && styles.discPillActive]}
                    onPress={() => setDiscountPercent(disc)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.discPillText, isSelected && styles.discPillTextActive]}>
                      {disc}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Document Summary Card & Checkout Button */}
          <View style={styles.footerContainer}>
            <View style={styles.totalsTable}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('checkout_total_before')}</Text>
                <Text style={styles.totalVal}>{totalAmount.toLocaleString(numLocale)} {t('currency')}</Text>
              </View>

              {deliveryDate ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {lang === 'ru' ? 'Дата доставки:' : 'Yetkazish sanasi:'}
                  </Text>
                  <Text style={[styles.totalVal, { color: colors.primary, fontWeight: '600' }]}>
                    {deliveryDate}
                  </Text>
                </View>
              ) : null}

              {discountPercent > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.danger }]}>
                    {t('checkout_discount')} ({discountPercent}%):
                  </Text>
                  <Text style={[styles.totalVal, { color: colors.danger }]}>
                    -{discountAmount.toLocaleString(numLocale)} {t('currency')}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.totalRowFinal}>
                <Text style={styles.finalLabel}>{t('checkout_total_final')}</Text>
                <Text style={styles.finalAmount}>
                  {finalAmount.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('CheckoutScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>{t('cart_proceed')}</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  clientStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.dangerLight,
  },
  clearBtnText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  toCatalogBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  toCatalogText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  indexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  priceDetails: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    height: 30,
  },
  stepperBtn: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 6,
  },
  rowRight: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  rowTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  deleteBtn: {
    padding: 3,
  },
  discountSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  discountTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  discountPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  discPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  discPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  discPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  footerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalsTable: {
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 6,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  finalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  finalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
