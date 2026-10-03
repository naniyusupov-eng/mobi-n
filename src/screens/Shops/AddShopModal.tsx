import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { colors } from '../../theme/colors';
import { Store, User, Phone, MapPin, Navigation, Check } from 'lucide-react-native';

export const AddShopModal = ({ navigation }: { navigation: any }) => {
  const { addNewShop } = useShopStore();
  const { t, lang } = useLanguageStore();

  const DAYS = [
    { key: 'Dushanba', label: t('day_mon') },
    { key: 'Seshanba', label: t('day_tue') },
    { key: 'Chorshanba', label: t('day_wed') },
    { key: 'Payshanba', label: t('day_thu') },
    { key: 'Juma', label: t('day_fri') },
    { key: 'Shanba', label: t('day_sat') },
    { key: 'Barchasi', label: t('day_all') },
  ];

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [visitDay, setVisitDay] = useState('Dushanba');
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'GPS',
          lang === 'ru'
            ? 'Доступ к геопозиции отклонен'
            : lang === 'uz_cyrl'
            ? 'Геолокацияга рухсат берилмади'
            : 'GPS lokatsiyaga ruxsat berilmadi'
        );
        setGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert(
        t('success'),
        (lang === 'ru' ? 'Широта: ' : 'Kenglik: ') +
          `${loc.coords.latitude.toFixed(4)}\n` +
          (lang === 'ru' ? 'Долгота: ' : 'Uzunlik: ') +
          `${loc.coords.longitude.toFixed(4)}`
      );
    } catch (e: any) {
      Alert.alert(t('error'), 'GPS');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите название точки' : 'Iltimos, doʻkon nomini kiriting');
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите имя ответственного' : 'Doʻkon egasi ismini kiriting');
      return;
    }
    if (!address.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите адрес точки' : 'Doʻkon manzilini kiriting');
      return;
    }

    const createdShop = addNewShop({
      name: name.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      visitDay,
      debtBalance: 0,
    });

    Alert.alert(
      t('success'),
      `"${createdShop.name}" ${t('add_shop_saved_success')}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.modalTitle}>{t('add_shop_title')}</Text>
        <Text style={styles.modalSubtitle}>{t('add_shop_subtitle')}</Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Shop Name */}
          <Text style={styles.label}>{t('add_shop_name')}</Text>
          <View style={styles.inputRow}>
            <Store size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Барака Маркет' : 'Masalan: Baraka Oziq-ovqat'}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Owner Name */}
          <Text style={styles.label}>{t('add_shop_owner')}</Text>
          <View style={styles.inputRow}>
            <User size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Рустам ака' : 'Masalan: Rustam aka'}
              placeholderTextColor={colors.textMuted}
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>{t('add_shop_phone')}</Text>
          <View style={styles.inputRow}>
            <Phone size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="+998 90 123 45 67"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Address */}
          <Text style={styles.label}>{t('add_shop_address')}</Text>
          <View style={styles.inputRow}>
            <MapPin size={16} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Чиланзар 1-квартал' : 'Masalan: Chilonzor 1-mavze'}
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* GPS Button */}
          <Text style={styles.label}>GPS LOKATSIYA</Text>
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleGetLocation}
            disabled={gettingLocation}
            activeOpacity={0.7}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Navigation size={16} color={colors.primary} />
            )}
            <Text style={styles.gpsBtnText}>
              {coords.latitude
                ? `GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude?.toFixed(4)} ✓`
                : t('add_shop_gps_btn')}
            </Text>
          </TouchableOpacity>

          {/* Visit Day Selector */}
          <Text style={styles.label}>{t('add_shop_day')}</Text>
          <View style={styles.daysGrid}>
            {DAYS.map((day) => {
              const selected = visitDay === day.key;
              return (
                <TouchableOpacity
                  key={day.key}
                  style={[styles.dayItem, selected && styles.dayItemSelected]}
                  onPress={() => setVisitDay(day.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayItemText, selected && styles.dayItemTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
          <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.submitBtnText}>
            {lang === 'ru' ? 'Сохранить точку' : 'Doʻkonni saqlash'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 5,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 0,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 6,
    paddingVertical: 9,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dayItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayItemSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  dayItemText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dayItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
