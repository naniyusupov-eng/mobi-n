import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
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
        >
          <Minus size={14} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => updateQuantity(item.product.id, item.unit, 1)}
        >
          <Plus size={14} color={colors.primary} />
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
        >
          <Trash2 size={15} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Client Header */}
      <View style={styles.clientStrip}>
        <Store size={16} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.clientLabel}>{t('checkout_client')}</Text>
          <Text style={styles.clientName}>
            {shop ? `${shop.name} (${shop.ownerName})` : '—'}
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Trash2 size={14} color={colors.danger} />
            <Text style={styles.clearBtnText}>{t('cart_clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('cart_empty')}</Text>
          <Text style={styles.emptyDesc}>{t('cart_empty_sub')}</Text>
          <TouchableOpacity
            style={styles.toCatalogBtn}
            onPress={() => navigation.navigate('CatalogTab')}
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

          {/* Discount Section */}
          <View style={styles.discountSection}>
            <View style={styles.discountHeader}>
              <Tag size={15} color={colors.primary} />
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
                  >
                    <Text style={[styles.discPillText, isSelected && styles.discPillTextActive]}>
                      {disc}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Summary & Checkout Button */}
          <View style={styles.footerContainer}>
            <View style={styles.totalsTable}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('checkout_total_before')}</Text>
                <Text style={styles.totalVal}>{totalAmount.toLocaleString(numLocale)} {t('currency')}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {lang === 'ru' ? 'Дата доставки:' : lang === 'uz_cyrl' ? 'Етказиш санаси:' : 'Yetkazish sanasi:'}
                </Text>
                <Text style={[styles.totalVal, { color: colors.primary, fontWeight: '800' }]}>
                  {deliveryDate}
                </Text>
              </View>
              {discountPercent > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.accent }]}>
                    {t('checkout_discount')} {discountPercent}%:
                  </Text>
                  <Text style={[styles.totalVal, { color: colors.accent }]}>
                    -{discountAmount.toLocaleString(numLocale)} {t('currency')}
                  </Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>{t('checkout_total_final')}</Text>
                <Text style={styles.grandTotalVal}>{finalAmount.toLocaleString(numLocale)} {t('currency')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('CheckoutScreen')}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>{t('cart_proceed')}</Text>
              <ArrowRight size={18} color="#fff" />
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
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  clientLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  clientName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
  },
  listContent: {
    padding: 10,
    gap: 6,
  },
  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  indexBadge: {
    width: 20,
    alignItems: 'center',
  },
  indexText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  priceDetails: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    padding: 6,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 70,
  },
  rowTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
  },
  deleteBtn: {
    padding: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  toCatalogBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  toCatalogText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  discountSection: {
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  discountTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  discountPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  discPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  discPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  discPillTextActive: {
    color: '#fff',
  },
  footerContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalsTable: {
    gap: 4,
    marginBottom: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  grandTotalRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  grandTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
