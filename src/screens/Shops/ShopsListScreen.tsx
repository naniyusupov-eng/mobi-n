import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useShopStore } from '../../store/shopStore';
import { useCartStore } from '../../store/cartStore';
import { useLanguageStore } from '../../store/languageStore';
import { Shop } from '../../types';
import { colors } from '../../theme/colors';
import {
  Search,
  Plus,
  Phone,
  MapPin,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Navigation,
  FileText,
  X,
  XCircle,
} from 'lucide-react-native';

type FilterTab = 'today' | 'all' | 'debt' | 'visited';

export const ShopsListScreen = ({ navigation }: { navigation: any }) => {
  const { shops, loadShops, searchQuery, setSearchQuery, setCurrentShop, markShopVisited } = useShopStore();
  const { setShop: setCartShop } = useCartStore();
  const { t, lang } = useLanguageStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  // Filter logic based on Mobi-S tabs
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      // Text search
      const matchesSearch =
        !searchQuery ||
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'today') {
        return shop.visitDay === 'Dushanba' || shop.visitDay === 'Barchasi' || shop.visitDay === t('day_mon') || shop.visitDay === t('day_all');
      }
      if (activeTab === 'debt') {
        return shop.debtBalance > 0;
      }
      if (activeTab === 'visited') {
        return Boolean(shop.lastVisitedAt);
      }
      return true; // 'all'
    });
  }, [shops, searchQuery, activeTab, t]);

  const handleOpenActionMenu = (shop: Shop) => {
    setSelectedShop(shop);
    setModalVisible(true);
  };

  const handleStartOrder = () => {
    if (selectedShop) {
      setCurrentShop(selectedShop);
      setCartShop(selectedShop);
      setModalVisible(false);
      navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
    }
  };

  const handleRegisterGPS = async () => {
    if (!selectedShop) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('GPS', lang === 'ru' ? 'Доступ к геопозиции отклонен' : lang === 'uz_cyrl' ? 'Геолокацияга рухсат берилмади' : 'Geolokatsiyaga ruxsat berilmadi');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      markShopVisited(selectedShop.id);
      setModalVisible(false);
      Alert.alert(
        t('shop_visited_today') + ' ✅',
        (lang === 'ru' ? 'Координаты: ' : lang === 'uz_cyrl' ? 'Координаталар: ' : 'Koordinatalar: ') +
          `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`
      );
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    }
  };

  const handleAcceptPayment = () => {
    setModalVisible(false);
    setPaymentAmount('');
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    const amount = parseFloat(paymentAmount.replace(/\D/g, ''));
    if (!amount || amount <= 0 || !selectedShop) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите корректную сумму оплаты' : lang === 'uz_cyrl' ? 'Тўғри тўлов суммасини киритинг' : 'Toʻgʻri toʻlov summasini kiriting');
      return;
    }

    const { shopRepository } = require('../../database/shopRepository');
    shopRepository.collectPayment(selectedShop.id, amount);
    loadShops();
    setPaymentModalVisible(false);
    Alert.alert(
      t('pko_modal_title'),
      `${t('pko_success')}\n${amount.toLocaleString('ru-RU')} ${t('currency')}`
    );
  };

  const handleDirectOrder = (shop: Shop) => {
    setCurrentShop(shop);
    setCartShop(shop);
    navigation.navigate('CatalogTab', { screen: 'CatalogMain' });
  };

  const handleDirectPayment = (shop: Shop) => {
    setSelectedShop(shop);
    setPaymentAmount('');
    setPaymentModalVisible(true);
  };

  const handleOpenCard = () => {
    if (selectedShop) {
      setCurrentShop(selectedShop);
      setModalVisible(false);
      navigation.navigate('ShopDetail', { shopId: selectedShop.id });
    }
  };

  const renderShopItem = ({ item }: { item: Shop }) => {
    const isVisited = Boolean(item.lastVisitedAt);

    return (
      <View style={styles.shopCard}>
        {/* Top Header Row */}
        <TouchableOpacity
          style={styles.shopCardHeader}
          onPress={() => handleOpenActionMenu(item)}
          activeOpacity={0.7}
        >
          <View style={styles.shopHeaderLeft}>
            <View style={styles.statusIndicator}>
              {isVisited ? (
                <CheckCircle2 size={18} color={colors.success} />
              ) : (
                <Circle size={16} color={colors.textMuted} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.routeDayPill}>
                  <Text style={styles.routeDayText}>{item.visitDay ? item.visitDay.slice(0, 3) : ''}</Text>
                </View>
              </View>
              <Text style={styles.shopSubtext} numberOfLines={1}>
                {item.ownerName} • {item.address}
              </Text>
            </View>
          </View>

          {/* Right Debt Badge */}
          <View style={styles.debtColumn}>
            {item.debtBalance > 0 ? (
              <View style={styles.debtBadgeRed}>
                <Text style={styles.debtTextRed}>
                  {item.debtBalance.toLocaleString('ru-RU')}
                </Text>
                <Text style={styles.debtSubLabel}>{t('shop_debt')}</Text>
              </View>
            ) : (
              <View style={styles.debtBadgeGreen}>
                <Text style={styles.debtTextGreen}>0</Text>
                <Text style={styles.debtSubLabel}>{t('shop_no_debt')}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Quick Ergonomic Action Bar */}
        <View style={styles.shopActionBar}>
          <TouchableOpacity
            style={styles.actionBtnOrder}
            onPress={() => handleDirectOrder(item)}
            activeOpacity={0.8}
          >
            <ShoppingBag size={13} color="#fff" />
            <Text style={styles.actionBtnOrderText} numberOfLines={1}>
              {t('shop_action_order')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPko}
            onPress={() => handleDirectPayment(item)}
            activeOpacity={0.8}
          >
            <CreditCard size={13} color={colors.primary} />
            <Text style={styles.actionBtnPkoText} numberOfLines={1}>
              {t('shop_action_pko_short')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDetails}
            onPress={() => handleOpenActionMenu(item)}
            activeOpacity={0.8}
          >
            <FileText size={13} color={colors.textSecondary} />
            <Text style={styles.actionBtnDetailsText} numberOfLines={1}>
              {t('shop_action_history_short')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('shops_search')}
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
      </View>

      {/* Mobi-S 4 Filter Tabs */}
      <View style={styles.tabsStrip}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'today' && styles.tabBtnActive]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
            {t('tab_today')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            {t('tab_all_shops')} ({shops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'debt' && styles.tabBtnActive]}
          onPress={() => setActiveTab('debt')}
        >
          <Text style={[styles.tabText, activeTab === 'debt' && styles.tabTextActive]}>
            {t('tab_debt_shops')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'visited' && styles.tabBtnActive]}
          onPress={() => setActiveTab('visited')}
        >
          <Text style={[styles.tabText, activeTab === 'visited' && styles.tabTextActive]}>
            {t('tab_visited_shops')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* High Density Table List */}
      <FlatList
        data={filteredShops}
        keyExtractor={(item) => item.id}
        renderItem={renderShopItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {lang === 'ru' ? 'Клиенты не найдены' : lang === 'uz_cyrl' ? 'Мижозлар топилмади' : 'Mijozlar topilmadi'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {lang === 'ru' ? 'В выбранном фильтре нет торговых точек' : lang === 'uz_cyrl' ? 'Танланган филтрда савдо нуқталари йўқ' : 'Tanlangan filtrda savdo nuqtalari yoʻq'}
            </Text>
          </View>
        }
      />

      {/* FAB: Add New Client */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddShopModal')}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#fff" />
        <Text style={styles.fabText}>{t('shops_add_btn')}</Text>
      </TouchableOpacity>

      {/* Mobi-S Point Action Menu (Меню торговой точки) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionSheet}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetShopName}>{selectedShop?.name}</Text>
                <Text style={styles.sheetOwner}>
                  {selectedShop?.ownerName} • {selectedShop?.phone}
                </Text>
                {selectedShop && selectedShop.debtBalance > 0 && (
                  <Text style={styles.sheetDebtAlert}>
                    {t('shop_balance_debt')} {selectedShop.debtBalance.toLocaleString('ru-RU')} {t('currency')}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetActions}>
              {/* Option 1: Новый заказ */}
              <TouchableOpacity style={styles.menuActionItem} onPress={handleStartOrder}>
                <View style={[styles.menuActionIcon, { backgroundColor: colors.primaryLight }]}>
                  <ShoppingBag size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionTitle}>{t('shop_action_order')}</Text>
                  <Text style={styles.menuActionSubtitle}>
                    {lang === 'ru' ? 'Оформить поставку кондитерских изделий' : lang === 'uz_cyrl' ? 'Қандолат маҳсулотлари буюртмасини шакллантириш' : 'Qandolat mahsulotlari buyurtmasini shakllantirish'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Прием оплаты (ПКО) */}
              <TouchableOpacity style={styles.menuActionItem} onPress={handleAcceptPayment}>
                <View style={[styles.menuActionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <CreditCard size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionTitle}>{t('shop_action_pko')}</Text>
                  <Text style={styles.menuActionSubtitle}>
                    {lang === 'ru' ? 'Внести деньги в счет погашения долга' : lang === 'uz_cyrl' ? 'Қарзни ёпиш учун нақд пул қабул қилиш' : 'Qarzni yopish uchun naqd pul qabul qilish'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Зафиксировать GPS визит */}
              <TouchableOpacity style={styles.menuActionItem} onPress={handleRegisterGPS}>
                <View style={[styles.menuActionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Navigation size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionTitle}>{t('shop_gps_register')}</Text>
                  <Text style={styles.menuActionSubtitle}>
                    {lang === 'ru' ? 'Отметить прибытие в торговую точку' : lang === 'uz_cyrl' ? 'Дўконга келганликни белгилаш' : 'Doʻkonga kelganlikni belgilash'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 4: Позвонить */}
              <TouchableOpacity
                style={styles.menuActionItem}
                onPress={() => {
                  setModalVisible(false);
                  if (selectedShop?.phone) Linking.openURL(`tel:${selectedShop.phone}`);
                }}
              >
                <View style={[styles.menuActionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Phone size={20} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionTitle}>{t('shop_call_client')}</Text>
                  <Text style={styles.menuActionSubtitle}>{selectedShop?.phone}</Text>
                </View>
              </TouchableOpacity>

              {/* Option 5: Карточка клиента */}
              <TouchableOpacity style={styles.menuActionItem} onPress={handleOpenCard}>
                <View style={[styles.menuActionIcon, { backgroundColor: '#ECEFF1' }]}>
                  <FileText size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuActionTitle}>{t('nav_shop_detail')}</Text>
                  <Text style={styles.menuActionSubtitle}>
                    {lang === 'ru' ? 'Реквизиты, прошлые накладные' : lang === 'uz_cyrl' ? 'Маълумотлар, аввалги юк хатлари' : 'Maʼlumotlar, avvalgi yuk xatlari'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment / ПКО Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.actionSheet, { padding: 20 }]}>
            <Text style={styles.sheetShopName}>{t('pko_modal_title')}</Text>
            <Text style={styles.sheetOwner}>{selectedShop?.name}</Text>
            <Text style={styles.sheetDebtAlert}>
              {t('shop_balance_debt')} {selectedShop?.debtBalance.toLocaleString('ru-RU')} {t('currency')}
            </Text>

            <TextInput
              style={styles.paymentInput}
              placeholder={t('pko_amount_label')}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              autoFocus
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.sheetBtn, { backgroundColor: colors.background }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t('cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetBtn, { backgroundColor: colors.success, flex: 1 }]}
                onPress={handleConfirmPayment}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                  {lang === 'ru' ? 'Принять оплату' : lang === 'uz_cyrl' ? 'Тўловни қабул қилиш' : 'Toʻlovni qabul qilish'}
                </Text>
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
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  tabsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.accent,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CFD8DC',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 8,
    paddingBottom: 85,
    gap: 8,
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  shopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  shopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  routeDayPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  routeDayText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  shopActionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  actionBtnOrder: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 5,
  },
  actionBtnOrderText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnPko: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnPkoText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnDetails: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnDetailsText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  shopSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  debtColumn: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  debtBadgeRed: {
    alignItems: 'flex-end',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debtTextRed: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.danger,
  },
  debtBadgeGreen: {
    alignItems: 'flex-end',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  debtTextGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.success,
  },
  debtSubLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
    marginBottom: 8,
  },
  sheetShopName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
  sheetOwner: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sheetDebtAlert: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 4,
  },
  closeBtn: {
    padding: 4,
  },
  sheetActions: {
    gap: 4,
  },
  menuActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  menuActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  menuActionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: 14,
    backgroundColor: colors.background,
  },
  sheetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
