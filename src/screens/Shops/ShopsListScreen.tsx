import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShopStore } from '../../store/shopStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { shopRepository } from '../../database/shopRepository';
import { Shop } from '../../types';
import { colors } from '../../theme/colors';
import {
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react-native';

type FilterTab = 'today' | 'all' | 'debt' | 'visited';

export const ShopsListScreen = ({ navigation }: { navigation: any }) => {
  const { shops, loadShops, searchQuery, setSearchQuery, setCurrentShop } = useShopStore();
  const { setShop: setCartShop } = useCartStore();
  const { t, lang } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [selectedShopForPayment, setSelectedShopForPayment] = useState<Shop | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const numLocale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.ownerName.toLowerCase().includes(q) ||
        shop.address.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'today') {
        return (
          shop.visitDay === 'Dushanba' ||
          shop.visitDay === 'Barchasi' ||
          shop.visitDay === t('day_mon') ||
          shop.visitDay === t('day_all')
        );
      }
      if (activeTab === 'debt') {
        return shop.debtBalance > 0;
      }
      if (activeTab === 'visited') {
        return Boolean(shop.lastVisitedAt);
      }
      return true;
    });
  }, [shops, searchQuery, activeTab, t]);

  const handleStartOrder = (shop: Shop) => {
    setCurrentShop(shop);
    setCartShop(shop);
    navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
  };

  const handleOpenPayment = (shop: Shop) => {
    setSelectedShopForPayment(shop);
    setPaymentAmount(shop.debtBalance > 0 ? String(shop.debtBalance) : '');
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    const amount = parseFloat(paymentAmount.replace(/\D/g, ''));
    if (!amount || amount <= 0 || !selectedShopForPayment) {
      Alert.alert(
        t('error'),
        lang === 'ru'
          ? 'Введите корректную сумму оплаты'
          : lang === 'uz_cyrl'
          ? 'Тўғри тўлов суммасини киритинг'
          : 'Toʻgʻri toʻlov summasini kiriting'
      );
      return;
    }

    shopRepository.collectPayment(selectedShopForPayment.id, amount);
    loadShops();
    setPaymentModalVisible(false);
    Alert.alert(
      t('pko_modal_title'),
      `${t('pko_success')}\n${amount.toLocaleString(numLocale)} ${t('currency')}`
    );
  };

  const handleCardPress = (shop: Shop) => {
    setCurrentShop(shop);
    navigation.navigate('ShopDetail', { shopId: shop.id });
  };

  const setShortcutAmount = (val: number) => {
    setPaymentAmount(String(val));
  };

  const renderShopItem = ({ item }: { item: Shop }) => {
    const isVisited = Boolean(item.lastVisitedAt);
    const hasDebt = item.debtBalance > 0;

    return (
      <View style={styles.shopCard}>
        {/* Card Header & Body - tap to open details */}
        <TouchableOpacity
          style={styles.cardMainArea}
          onPress={() => handleCardPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
              {isVisited && (
                <View style={styles.visitedChip}>
                  <CheckCircle2 size={11} color={colors.success} />
                  <Text style={styles.visitedText}>{t('shop_visited_today')}</Text>
                </View>
              )}
            </View>
            <View style={styles.dayChip}>
              <Text style={styles.dayChipText}>{item.visitDay}</Text>
            </View>
          </View>

          <Text style={styles.ownerText}>
            {item.ownerName}
          </Text>

          <View style={styles.addressRow}>
            <MapPin size={13} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
          </View>
        </TouchableOpacity>

        {/* Card Footer: Debt/Phone strip & Action Buttons */}
        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {hasDebt ? (
              <View style={styles.debtPill}>
                <Text style={styles.debtPillText}>
                  {item.debtBalance.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            ) : (
              <Text style={styles.noDebtText}>{t('shop_no_debt_text')}</Text>
            )}

            {item.phone ? (
              <TouchableOpacity
                style={styles.phoneBtn}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
                activeOpacity={0.7}
              >
                <Phone size={12} color={colors.textSecondary} />
                <Text style={styles.phoneBtnText}>{item.phone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.pkoBtn}
              onPress={() => handleOpenPayment(item)}
              activeOpacity={0.7}
            >
              <CreditCard size={13} color={colors.textSecondary} />
              <Text style={styles.pkoBtnText}>PKO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => handleStartOrder(item)}
              activeOpacity={0.8}
            >
              <ShoppingBag size={13} color="#FFFFFF" />
              <Text style={styles.orderBtnText}>{t('shop_action_order')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search') + '...'}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addShopBtn}
          onPress={() => navigation.navigate('AddShopModal')}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'today' && styles.tabChipActive]}
          onPress={() => setActiveTab('today')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabChipText, activeTab === 'today' && styles.tabChipTextActive]}>
            {t('home_route_plan')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}>
            {t('catalog_all')} ({shops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'debt' && styles.tabChipActive]}
          onPress={() => setActiveTab('debt')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabChipText, activeTab === 'debt' && styles.tabChipTextActive]}>
            {t('rep_client_debts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'visited' && styles.tabChipActive]}
          onPress={() => setActiveTab('visited')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabChipText, activeTab === 'visited' && styles.tabChipTextActive]}>
            {t('shop_visited_today')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shops List */}
      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('search')} — {t('error')}</Text>
          </View>
        }
      />

      {/* Fast PKO Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('pko_modal_title')}</Text>
                <Text style={styles.modalClientName} numberOfLines={1}>
                  {selectedShopForPayment?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedShopForPayment && selectedShopForPayment.debtBalance > 0 && (
              <View style={styles.modalDebtAlert}>
                <Text style={styles.modalDebtLabel}>{t('rep_debt_receivable')}:</Text>
                <Text style={styles.modalDebtValue}>
                  {selectedShopForPayment.debtBalance.toLocaleString(numLocale)} {t('currency')}
                </Text>
              </View>
            )}

            <Text style={styles.modalInputLabel}>{t('pko_amount_label')}</Text>
            <View style={styles.modalInputWrapper}>
              <TextInput
                style={styles.modalAmountInput}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <Text style={styles.modalCurrencySuffix}>{t('currency')}</Text>
            </View>

            {/* Quick Amount Shortcuts */}
            <View style={styles.shortcutsRow}>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setShortcutAmount(100000)}
              >
                <Text style={styles.shortcutBtnText}>100k</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setShortcutAmount(500000)}
              >
                <Text style={styles.shortcutBtnText}>500k</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => setShortcutAmount(1000000)}
              >
                <Text style={styles.shortcutBtnText}>1M</Text>
              </TouchableOpacity>
              {selectedShopForPayment && selectedShopForPayment.debtBalance > 0 && (
                <TouchableOpacity
                  style={[styles.shortcutBtn, { backgroundColor: colors.primaryLight }]}
                  onPress={() => setShortcutAmount(selectedShopForPayment.debtBalance)}
                >
                  <Text style={[styles.shortcutBtnText, { color: colors.primary }]}>
                    {lang === 'ru' ? 'Весь долг' : 'Toʻliq qarz'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmPayment}
              >
                <Text style={styles.modalConfirmText}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  addShopBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  cardMainArea: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  visitedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  visitedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  dayChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  ownerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  debtPill: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debtPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  noDebtText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  phoneBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pkoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pkoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  orderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  orderBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalClientName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalDebtAlert: {
    backgroundColor: colors.dangerLight,
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalDebtLabel: {
    fontSize: 12,
    color: colors.danger,
  },
  modalDebtValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  modalInputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  modalAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalCurrencySuffix: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  shortcutBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
