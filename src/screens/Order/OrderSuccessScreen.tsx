import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { invoiceService } from '../../services/invoiceService';
import { useLanguageStore } from '../../store/languageStore';
import { Order, Shop } from '../../types';
import { colors } from '../../theme/colors';
import { CheckCircle2, Home, ShoppingBag, Printer } from 'lucide-react-native';

export const OrderSuccessScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { orderId, shopId } = route.params;
  const { lang, t } = useLanguageStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  useEffect(() => {
    if (orderId) {
      const ord = orderRepository.getById(orderId);
      setOrder(ord);
    }
    if (shopId) {
      const sh = shopRepository.getById(shopId);
      setShop(sh);
    }
  }, [orderId, shopId]);

  const handleSharePdf = async () => {
    if (!order) return;
    try {
      setIsGeneratingPdf(true);
      await invoiceService.printOrSharePdf(order, shop);
    } catch (e: any) {
      Alert.alert(t('error'), 'PDF generation error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CatalogMain' }],
    });
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('HomeTab');
    } else {
      navigation.navigate('HomeTab');
    }
  };

  const handleNewOrder = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'CatalogMain' }],
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      handleGoHome();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  const getPaymentLabel = (pm: string) => {
    if (pm === 'naqd') return t('checkout_pay_cash');
    if (pm === 'nasiya') return t('checkout_pay_debt');
    return t('checkout_pay_bank');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Minimalist Success Icon */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={44} color={colors.success} strokeWidth={2} />
        </View>

        <Text style={styles.title}>{t('order_success_title')}</Text>
        <Text style={styles.subtitle}>{t('checkout_confirm_msg')}</Text>

        {/* Document Receipt Card */}
        {order && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('order_success_sub')}</Text>
              <Text style={styles.orderIdBadge}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('checkout_client')}</Text>
              <Text style={styles.value} numberOfLines={1}>{order.shopName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('checkout_pay_method')}:</Text>
              <Text
                style={[
                  styles.value,
                  order.paymentMethod === 'nasiya' && { color: colors.danger },
                ]}
              >
                {getPaymentLabel(order.paymentMethod)}
              </Text>
            </View>

            {order.deliveryDate ? (
              <View style={styles.detailRow}>
                <Text style={styles.label}>
                  {lang === 'ru' ? 'Дата доставки:' : 'Yetkazish:'}
                </Text>
                <Text style={styles.value}>{order.deliveryDate}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.finalLabel}>{t('checkout_total_final')}</Text>
              <Text style={styles.finalAmount}>
                {order.finalAmount.toLocaleString(numLocale)} {t('currency')}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleSharePdf}
            disabled={isGeneratingPdf}
            activeOpacity={0.8}
          >
            {isGeneratingPdf ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Printer size={16} color="#FFFFFF" />
                <Text style={styles.pdfButtonText}>{t('order_print_receipt')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={styles.newOrderButton}
              onPress={handleNewOrder}
              activeOpacity={0.8}
            >
              <ShoppingBag size={15} color={colors.primary} />
              <Text style={styles.newOrderText} numberOfLines={1}>{t('order_new_btn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <Home size={15} color={colors.textSecondary} />
              <Text style={styles.homeButtonText} numberOfLines={1}>{t('order_back_home')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  orderIdBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 4,
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
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  newOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 10,
    gap: 6,
  },
  newOrderText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    gap: 6,
  },
  homeButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
