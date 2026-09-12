import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { orderRepository } from '../../database/orderRepository';
import { shopRepository } from '../../database/shopRepository';
import { invoiceService } from '../../services/invoiceService';
import { useLanguageStore } from '../../store/languageStore';
import { Order, Shop } from '../../types';
import { colors } from '../../theme/colors';
import { CheckCircle2, Share2, Home, ShoppingBag, Printer } from 'lucide-react-native';

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
    navigation.navigate('HomeTab');
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
        {/* Success Icon */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={56} color={colors.success} />
        </View>

        <Text style={styles.title}>{t('order_success_title')}</Text>
        <Text style={styles.subtitle}>
          {t('checkout_confirm_msg')}
        </Text>

        {/* Order Details Card */}
        {order && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('order_success_sub')}</Text>
              <Text style={styles.value}>#{order.id.slice(-8).toUpperCase()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('checkout_client')}</Text>
              <Text style={styles.value}>{order.shopName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('checkout_pay_method')}:</Text>
              <Text
                style={[
                  styles.value,
                  {
                    color: order.paymentMethod === 'nasiya' ? colors.danger : colors.success,
                  },
                ]}
              >
                {getPaymentLabel(order.paymentMethod)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={[styles.label, { fontSize: 13, fontWeight: '800' }]}>
                {t('checkout_total_final')}
              </Text>
              <Text style={[styles.value, { fontSize: 16, color: colors.primary, fontWeight: '900' }]}>
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
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Printer size={18} color="#fff" />
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
              <ShoppingBag size={17} color={colors.primary} />
              <Text style={styles.newOrderText} numberOfLines={1}>{t('order_new_btn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <Home size={17} color={colors.textSecondary} />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
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
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
  },
  newOrderText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  homeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 6,
  },
  homeButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
});
