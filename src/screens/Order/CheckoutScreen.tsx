import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { PaymentMethod } from '../../types';
import { colors } from '../../theme/colors';
import {
  Check,
  AlertTriangle,
  Calendar,
} from 'lucide-react-native';

export const CheckoutScreen = ({ navigation }: { navigation: any }) => {
  const { lang, t } = useLanguageStore();
  const {
    shop,
    items,
    paymentMethod,
    setPaymentMethod,
    deliveryDate,
    setDeliveryDate,
    notes,
    setNotes,
    getFinalAmount,
    submitOrder,
  } = useCartStore();
  const { agent } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const finalAmount = getFinalAmount();

  const getDatePlusDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getDatePlusDays(0);
  const tomorrowStr = getDatePlusDays(1);
  const dayAfterStr = getDatePlusDays(2);

  const getFormattedDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const day = d.getDate();
        const year = d.getFullYear();
        const uzMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const uzWeekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        return `${day}-${uzMonths[d.getMonth()]}, ${year} (${uzWeekdays[d.getDay()]})`;
      }
    } catch (e) {}
    return dateStr;
  };

  const paymentMethodsList: { key: PaymentMethod; label: string; sub: string }[] = [
    {
      key: 'naqd',
      label: t('checkout_pay_cash'),
      sub: lang === 'ru' ? 'Оплата сразу' : 'Darhol toʻlov',
    },
    {
      key: 'nasiya',
      label: t('checkout_pay_debt'),
      sub: lang === 'ru' ? 'Отсрочка платежа' : 'Keyinchalik toʻlov',
    },
    {
      key: 'otkazma',
      label: t('checkout_pay_bank'),
      sub: lang === 'ru' ? 'Расчетный счет' : 'Hisob-raqam orqali',
    },
  ];

  const handleConfirmOrder = async () => {
    if (!shop || items.length === 0) {
      Alert.alert(t('error'), t('cart_empty'));
      return;
    }

    if (!agent) {
      Alert.alert(t('error'), t('auth_error_title'));
      return;
    }

    try {
      setSubmitting(true);

      let coords: { latitude?: number; longitude?: number } = {};
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch (locErr) {}

      const createdOrder = submitOrder(agent.id, agent.name, coords);

      if (createdOrder) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'OrderSuccessScreen', params: { orderId: createdOrder.id, shopId: shop.id } }],
        });
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message || t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Header Card */}
        <View style={styles.docHeaderCard}>
          <Text style={styles.docTypeTitle}>{t('nav_checkout').toUpperCase()}</Text>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>{t('checkout_client')}</Text>
            <Text style={styles.docVal}>{shop?.name}</Text>
          </View>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>{t('add_shop_address')}</Text>
            <Text style={styles.docVal}>{shop?.address}</Text>
          </View>
          <View style={styles.docRow}>
            <Text style={styles.docLabel}>
              {lang === 'ru' ? 'Торговый агент:' : 'Savdo agenti:'}
            </Text>
            <Text style={styles.docVal}>{agent?.name}</Text>
          </View>
          {shop && shop.debtBalance > 0 && (
            <View style={styles.debtWarningRow}>
              <AlertTriangle size={13} color={colors.danger} />
              <Text style={styles.debtWarningText}>
                {t('shop_debt')} {shop.debtBalance.toLocaleString(numLocale)} {t('currency')}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Date Selection Section */}
        <Text style={styles.sectionTitle}>
          {lang === 'ru' ? 'ДАТА ДОСТАВКИ' : 'YETKAZISH SANASI'}
        </Text>
        <View style={styles.dateCard}>
          {/* Quick Choice Chips */}
          <View style={styles.dateChipsRow}>
            <TouchableOpacity
              style={[styles.dateChip, deliveryDate === todayStr && styles.dateChipActive]}
              onPress={() => setDeliveryDate(todayStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateChipText, deliveryDate === todayStr && styles.dateChipTextActive]}>
                {lang === 'ru' ? 'Сегодня' : 'Bugun'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, deliveryDate === tomorrowStr && styles.dateChipActive]}
              onPress={() => setDeliveryDate(tomorrowStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateChipText, deliveryDate === tomorrowStr && styles.dateChipTextActive]}>
                {lang === 'ru' ? 'Завтра' : 'Ertaga'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateChip, deliveryDate === dayAfterStr && styles.dateChipActive]}
              onPress={() => setDeliveryDate(dayAfterStr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateChipText, deliveryDate === dayAfterStr && styles.dateChipTextActive]}>
                {lang === 'ru' ? 'Послезавтра' : 'Indinga'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Input with Calendar Icon */}
          <View style={styles.dateInputWrapper}>
            <Calendar size={16} color={colors.primary} />
            <TextInput
              style={styles.dateTextInput}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              maxLength={10}
            />
          </View>

          {/* Formatted Date Preview */}
          <Text style={styles.datePreviewText}>
            📅 {getFormattedDate(deliveryDate)}
          </Text>
        </View>

        {/* Payment Method Selector */}
        <Text style={styles.sectionTitle}>{t('checkout_pay_method').toUpperCase()}</Text>
        <View style={styles.paymentMethodsContainer}>
          {paymentMethodsList.map((pm) => {
            const isSelected = paymentMethod === pm.key;
            return (
              <TouchableOpacity
                key={pm.key}
                style={[styles.pmCard, isSelected && styles.pmCardActive]}
                onPress={() => setPaymentMethod(pm.key)}
                activeOpacity={0.7}
              >
                <View style={styles.pmInfo}>
                  <Text style={[styles.pmLabel, isSelected && styles.pmLabelActive]}>{pm.label}</Text>
                  <Text style={styles.pmSub}>{pm.sub}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes Input */}
        <Text style={styles.sectionTitle}>{t('checkout_notes').toUpperCase()}</Text>
        <TextInput
          style={styles.notesInput}
          placeholder={t('checkout_notes')}
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {/* Final Amount & Submit Button */}
        <View style={styles.summaryBox}>
          <View style={styles.amountStrip}>
            <Text style={styles.amountLabel}>{t('checkout_total_final')}</Text>
            <Text style={styles.amountVal}>{finalAmount.toLocaleString(numLocale)} {t('currency')}</Text>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirmOrder}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>{t('checkout_confirm_btn')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  docHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  docTypeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  docVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  debtWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerLight,
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
  },
  debtWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  datePreviewText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
  },
  paymentMethodsContainer: {
    gap: 6,
    marginBottom: 12,
  },
  pmCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  pmCardActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  pmInfo: {
    flex: 1,
  },
  pmLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  pmLabelActive: {
    color: colors.primary,
  },
  pmSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    fontSize: 13,
    color: colors.text,
    marginBottom: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
