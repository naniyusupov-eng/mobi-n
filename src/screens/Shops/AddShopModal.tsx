import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Check, CheckCircle2, Navigation } from 'lucide-react-native';
import { AppText, Button, Card, Field, Row, Screen, SectionHeader } from '../../components/ui';
import { COMMON, Tri, useL } from '../../i18n/tri';
import { useShopStore } from '../../store/shopStore';
import { useLanguageStore } from '../../store/languageStore';
import { ROUTE_DAYS } from '../../services/lineService';
import { routeDayName } from '../../utils/format';
import { colors, radius, space } from '../../theme/colors';
import { EVERY_DAY } from '../../components/shopHelpers';

// Stored values stay the Latin day names used in the database ("Dushanba" ... "Barchasi")
const ALL_DAYS = 'Barchasi';

const TX = {
  subtitle: {
    uz: 'Telefonda saqlanadi va internet boʻlganda serverga yuboriladi',
    uz_cyrl: 'Телефонда сақланади ва интернет бўлганда серверга юборилади',
    ru: 'Сохраняется на телефоне и отправляется на сервер при наличии интернета',
  },
  main: { uz: 'Asosiy maʼlumot', uz_cyrl: 'Асосий маълумот', ru: 'Основное' },
  name: { uz: 'Doʻkon nomi', uz_cyrl: 'Дўкон номи', ru: 'Название магазина' },
  namePh: { uz: 'Masalan: Baraka market', uz_cyrl: 'Масалан: Барака маркет', ru: 'Например: Барака маркет' },
  owner: { uz: 'Doʻkon egasi', uz_cyrl: 'Дўкон эгаси', ru: 'Владелец' },
  ownerPh: { uz: 'Masalan: Rustam aka', uz_cyrl: 'Масалан: Рустам ака', ru: 'Например: Рустам ака' },
  phone: { uz: 'Telefon raqami', uz_cyrl: 'Телефон рақами', ru: 'Номер телефона' },
  address: { uz: 'Manzil', uz_cyrl: 'Манзил', ru: 'Адрес' },
  addressPh: { uz: 'Masalan: Chilonzor 1-mavze', uz_cyrl: 'Масалан: Чилонзор 1-мавзе', ru: 'Например: Чиланзар 1-квартал' },
  location: { uz: 'Joylashuv', uz_cyrl: 'Жойлашув', ru: 'Местоположение' },
  getGps: { uz: 'Joriy joylashuvni olish', uz_cyrl: 'Жорий жойлашувни олиш', ru: 'Определить координаты' },
  gpsSaved: { uz: 'Koordinatalar olindi', uz_cyrl: 'Координаталар олинди', ru: 'Координаты получены' },
  gpsHint: {
    uz: 'Doʻkon oldida turib bosing — keyin xaritada ochiladi',
    uz_cyrl: 'Дўкон олдида туриб босинг — кейин харитада очилади',
    ru: 'Нажмите, стоя у магазина — потом его можно открыть на карте',
  },
  gpsDenied: { uz: 'Geolokatsiyaga ruxsat berilmadi', uz_cyrl: 'Геолокацияга рухсат берилмади', ru: 'Доступ к геопозиции отклонён' },
  gpsError: { uz: 'Joylashuvni aniqlab boʻlmadi', uz_cyrl: 'Жойлашувни аниқлаб бўлмади', ru: 'Не удалось определить местоположение' },
  lat: { uz: 'Kenglik', uz_cyrl: 'Кенглик', ru: 'Широта' },
  lng: { uz: 'Uzunlik', uz_cyrl: 'Узунлик', ru: 'Долгота' },
  day: { uz: 'Marshrut kuni', uz_cyrl: 'Маршрут куни', ru: 'День маршрута' },
  needName: { uz: 'Doʻkon nomini kiriting', uz_cyrl: 'Дўкон номини киритинг', ru: 'Введите название магазина' },
  needOwner: { uz: 'Doʻkon egasi ismini kiriting', uz_cyrl: 'Дўкон эгаси исмини киритинг', ru: 'Введите имя владельца' },
  needAddress: { uz: 'Doʻkon manzilini kiriting', uz_cyrl: 'Дўкон манзилини киритинг', ru: 'Введите адрес магазина' },
  saved: { uz: 'Doʻkon qoʻshildi', uz_cyrl: 'Дўкон қўшилди', ru: 'Магазин добавлен' },
  savedText: {
    uz: 'saqlandi va serverga yuborish navbatiga qoʻyildi.',
    uz_cyrl: 'сақланди ва серверга юбориш навбатига қўйилди.',
    ru: 'сохранён и поставлен в очередь отправки на сервер.',
  },
  saveShop: { uz: 'Doʻkonni saqlash', uz_cyrl: 'Дўконни сақлаш', ru: 'Сохранить магазин' },
} satisfies Record<string, Tri>;

export const AddShopModal = ({ navigation }: { navigation: any }) => {
  const { addNewShop } = useShopStore();
  const lang = useLanguageStore((s) => s.lang);
  const L = useL();

  const days = [
    ...ROUTE_DAYS.map((key, i) => ({ key, label: routeDayName(i + 1, lang) })),
    { key: ALL_DAYS, label: L(EVERY_DAY) },
  ];

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [visitDay, setVisitDay] = useState(ROUTE_DAYS[0]);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(L(TX.location), L(TX.gpsDenied));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Alert.alert(
        L(TX.gpsSaved),
        `${L(TX.lat)}: ${loc.coords.latitude.toFixed(4)}\n${L(TX.lng)}: ${loc.coords.longitude.toFixed(4)}`
      );
    } catch {
      Alert.alert(L(COMMON.error), L(TX.gpsError));
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(L(COMMON.error), L(TX.needName));
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert(L(COMMON.error), L(TX.needOwner));
      return;
    }
    if (!address.trim()) {
      Alert.alert(L(COMMON.error), L(TX.needAddress));
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

    Alert.alert(L(TX.saved), `«${createdShop.name}» ${L(TX.savedText)}`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const hasCoords = coords.latitude != null && coords.longitude != null;

  return (
    <Screen
      edges={['left', 'right', 'bottom']}
      footer={
        <Row gap={space.sm}>
          <Button title={L(COMMON.cancel)} variant="outline" onPress={() => navigation.goBack()} style={styles.flex} />
          <Button title={L(TX.saveShop)} icon={Check} onPress={handleSave} style={styles.flexWide} />
        </Row>
      }
    >
      <AppText variant="small">{L(TX.subtitle)}</AppText>

      <SectionHeader title={L(TX.main)} />
      <Card style={styles.form}>
        <Field label={L(TX.name)} value={name} onChangeText={setName} placeholder={L(TX.namePh)} returnKeyType="next" />
        <Field label={L(TX.owner)} value={ownerName} onChangeText={setOwnerName} placeholder={L(TX.ownerPh)} returnKeyType="next" />
        <Field
          label={L(TX.phone)}
          value={phone}
          onChangeText={setPhone}
          placeholder="+998 90 123 45 67"
          keyboardType="phone-pad"
        />
        <Field label={L(TX.address)} value={address} onChangeText={setAddress} placeholder={L(TX.addressPh)} multiline />
      </Card>

      <SectionHeader title={L(TX.location)} />
      <Card>
        <Button
          title={hasCoords ? L(TX.gpsSaved) : L(TX.getGps)}
          icon={hasCoords ? CheckCircle2 : Navigation}
          variant={hasCoords ? 'secondary' : 'outline'}
          onPress={handleGetLocation}
          loading={gettingLocation}
        />
        <AppText variant="caption" align="center">
          {hasCoords ? `${coords.latitude!.toFixed(4)}, ${coords.longitude!.toFixed(4)}` : L(TX.gpsHint)}
        </AppText>
      </Card>

      <SectionHeader title={L(TX.day)} />
      <Row gap={space.sm} wrap>
        {days.map((d) => {
          const selected = visitDay === d.key;
          return (
            <Pressable
              key={d.key}
              onPress={() => setVisitDay(d.key)}
              style={({ pressed }) => [styles.chip, selected && styles.chipActive, pressed && styles.pressed]}
            >
              <AppText variant="small" lines={1} color={selected ? colors.primaryDark : colors.textSecondary} style={selected && styles.bold}>
                {d.label}
              </AppText>
            </Pressable>
          );
        })}
      </Row>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  flexWide: { flex: 2, minWidth: 0 },
  bold: { fontWeight: '600' },
  pressed: { opacity: 0.75 },
  form: { gap: space.md },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
});
