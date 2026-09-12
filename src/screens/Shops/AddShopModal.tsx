import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { colors } from '../../theme/colors';
import { Store, User, Phone, MapPin, Calendar, Navigation, Check } from 'lucide-react-native';

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
        Alert.alert('GPS', lang === 'ru' ? 'Доступ к геопозиции отклонен' : lang === 'uz_cyrl' ? 'Геолокацияга рухсат берилмади' : 'GPS lokatsiyaga ruxsat berilmadi');
        setGettingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert(
        t('success'),
        (lang === 'ru' ? 'Широта: ' : lang === 'uz_cyrl' ? 'Кенглик: ' : 'Kenglik: ') +
          `${loc.coords.latitude.toFixed(4)}\n` +
          (lang === 'ru' ? 'Долгота: ' : lang === 'uz_cyrl' ? 'Узунлик: ' : 'Uzunlik: ') +
          `${loc.coords.longitude.toFixed(4)}`
      );
    } catch (e: any) {
      Alert.alert(t('error'), lang === 'ru' ? 'Не удалось определить GPS' : lang === 'uz_cyrl' ? 'GPS координаталарни олиб бўлмади' : 'GPS lokatsiyani aniqlab boʻlmadi');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Пожалуйста, введите название торговой точки' : lang === 'uz_cyrl' ? 'Илтимос, дўкон номини киритинг' : 'Iltimos, doʻkon nomini kiriting');
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите имя ответственного лица' : lang === 'uz_cyrl' ? 'Дўкон эгаси ёки сотувчи исмини киритинг' : 'Doʻkon egasi yoki sotuvchi ismini kiriting');
      return;
    }
    if (!address.trim()) {
      Alert.alert(t('error'), lang === 'ru' ? 'Введите адрес торговой точки' : lang === 'uz_cyrl' ? 'Дўкон манзилини киритинг' : 'Doʻkon manzilini kiriting');
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.modalTitle}>{t('add_shop_title')}</Text>
        <Text style={styles.modalSubtitle}>
          {t('add_shop_subtitle')}
        </Text>

        {/* Form Fields */}
        <View style={styles.formCard}>
          {/* Shop Name */}
          <Text style={styles.label}>{t('add_shop_name')}</Text>
          <View style={styles.inputRow}>
            <Store size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Барака Продукты' : lang === 'uz_cyrl' ? 'Масалан: Барака Озиқ-овқат' : 'Masalan: Baraka Oziq-ovqat'}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Owner Name */}
          <Text style={styles.label}>{t('add_shop_owner')}</Text>
          <View style={styles.inputRow}>
            <User size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Рустам ака' : lang === 'uz_cyrl' ? 'Масалан: Рустам ака' : 'Masalan: Rustam aka'}
              placeholderTextColor={colors.textMuted}
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>{t('add_shop_phone')}</Text>
          <View style={styles.inputRow}>
            <Phone size={18} color={colors.textSecondary} />
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
            <MapPin size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder={lang === 'ru' ? 'Например: Чиланзар 1-квартал, дом 23' : lang === 'uz_cyrl' ? 'Масалан: Чилонзор 1-мавзе, 23-уй' : 'Masalan: Chilonzor 1-mavze, 23-uy'}
              placeholderTextColor={colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* GPS Button */}
          <Text style={styles.label}>GPS</Text>
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleGetLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Navigation size={18} color={colors.primary} />
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
                >
                  <Text style={[styles.dayItemText, selected && styles.dayItemTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Buttons */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.8}>
          <Check size={20} color="#fff" />
          <Text style={styles.submitBtnText}>
            {lang === 'ru' ? 'Сохранить точку' : lang === 'uz_cyrl' ? 'Дўконни Сақлаш' : 'Doʻkonni Saqlash'}
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
    padding: 16,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  gpsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dayItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dayItemTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
