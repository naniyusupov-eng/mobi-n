import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
      sub: lang === 'ru' ? 'Оплата сразу' : lang === 'uz_cyrl' ? 'Дарҳол тўлов' : 'Darhol toʻlov',
    },
    {
      key: 'nasiya',
      label: t('checkout_pay_debt'),
      sub: lang === 'ru' ? 'Отсрочка платежа' : lang === 'uz_cyrl' ? 'Кейинчалик тўлов' : 'Keyinchalik toʻlov',
    },
    {
      key: 'otkazma',
      label: t('checkout_pay_bank'),
      sub: lang === 'ru' ? 'Расчетный счет' : lang === 'uz_cyrl' ? 'Ҳисоб-рақам орқали' : 'Hisob-raqam orqali',
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
    <SafeAreaView style={styles.container}>
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
              {lang === 'ru' ? 'Торговый агент:' : lang === 'uz_cyrl' ? 'Савдо агенти:' : 'Savdo agenti:'}
            </Text>
            <Text style={styles.docVal}>{agent?.name}</Text>
          </View>
          {shop && shop.debtBalance > 0 && (
            <View style={styles.debtWarningRow}>
              <AlertTriangle size={14} color={colors.danger} />
              <Text style={styles.debtWarningText}>
                {t('shop_debt')} {shop.debtBalance.toLocaleString(numLocale)} {t('currency')}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Date Selection Section */}
        <Text style={styles.sectionTitle}>
          {lang === 'ru' ? 'ДАТА ДОСТАВКИ (ВВОД ДАТЫ)' : lang === 'uz_cyrl' ? 'ЕТКАЗИШ САНАСИ (САНА КИРИТИШ)' : 'YETKAZISH SANASI (SANA KIRITISH)'}
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
            <View style={styles.dateInputIcon}>
              <Calendar size={18} color={colors.primary} />
            </View>
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
                  {isSelected && <Check size={14} color="#fff" />}
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
          numberOfLines={3}
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
              <ActivityIndicator color="#fff" />
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
    gap: 10,
    paddingBottom: 36,
  },
  docHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  docTypeTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  docVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  debtWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
  },
  debtWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 6,
    marginLeft: 2,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  dateChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    height: 42,
  },
  dateInputIcon: {
    marginRight: 8,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
  },
  datePreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 2,
  },
  paymentMethodsContainer: {
    gap: 6,
  },
  pmCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pmCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFF',
  },
  pmInfo: {
    flex: 1,
  },
  pmLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  pmLabelActive: {
    color: colors.primary,
  },
  pmSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    fontSize: 12,
    color: colors.text,
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  amountStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  amountVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
