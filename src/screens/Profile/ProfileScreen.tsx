import React, { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Check, LogOut, Route, RefreshCw, Wifi } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import { colors, radius, space } from '../../theme/colors';
import { AppText, Badge, Button, Card, Divider, KeyValue, Row, Screen, SectionHeader } from '../../components/ui';
import { COMMON, useL } from '../../i18n/tri';
import { formatNumber } from '../../utils/format';

// Each language is named in its own script, so these labels never change with the UI language
const LANGUAGES: { id: MobileLanguage; label: string }[] = [
  { id: 'uz', label: 'Oʻzbekcha' },
  { id: 'uz_cyrl', label: 'Ўзбекча' },
  { id: 'ru', label: 'Русский' },
];

export const ProfileScreen = () => {
  const L = useL();
  const agent = useAuthStore((s) => s.agent);
  const logout = useAuthStore((s) => s.logout);
  const { pendingCount, triggerSync, isSyncing, lastSyncedAt, refreshPendingCount } = useSyncStore();
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const lineCode = agent?.lineCode || agent?.territory || '';

  const handleSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      Alert.alert(
        L({ uz: 'Sinxronlash', uz_cyrl: 'Синхронлаш', ru: 'Синхронизация' }),
        L({ uz: 'Maʼlumotlar yuborildi va yangilandi.', uz_cyrl: 'Маълумотлар юборилди ва янгиланди.', ru: 'Данные отправлены и обновлены.' })
      );
    } else {
      Alert.alert(
        L(COMMON.warning),
        L({
          uz: 'Serverga ulanib boʻlmadi. Maʼlumotlar telefonda saqlangan.',
          uz_cyrl: 'Серверга уланиб бўлмади. Маълумотлар телефонда сақланган.',
          ru: 'Не удалось связаться с сервером. Данные сохранены на телефоне.',
        })
      );
    }
  };

  const handleLogout = () => {
    const title = L({ uz: 'Liniyadan chiqish', uz_cyrl: 'Линиядан чиқиш', ru: 'Выйти из линии' });
    Alert.alert(
      title,
      L({
        uz: 'Chiqib, boshqa liniya QR kodi bilan kirmoqchimisiz?',
        uz_cyrl: 'Чиқиб, бошқа линия QR коди билан кирмоқчимисиз?',
        ru: 'Выйти и войти по QR-коду другой линии?',
      }),
      [
        { text: L(COMMON.cancel), style: 'cancel' },
        { text: title, style: 'destructive', onPress: () => void logout() },
      ]
    );
  };

  return (
    <Screen>
      {/* Line */}
      <Card>
        <Row gap={space.md}>
          <View style={styles.lineIcon}>
            <Route size={20} color={colors.primaryDark} />
          </View>
          <View style={styles.flex}>
            <AppText variant="caption" lines={1}>
              {agent?.role === 'driver'
                ? L({ uz: 'Yetkazuvchi', uz_cyrl: 'Етказувчи', ru: 'Доставщик' })
                : L({ uz: 'Agent', uz_cyrl: 'Агент', ru: 'Агент' })}
            </AppText>
            <AppText variant="h2" lines={1}>
              {lineCode ? `${lineCode} ${L(COMMON.line)}` : '—'}
            </AppText>
          </View>
        </Row>
      </Card>

      {/* Language */}
      <SectionHeader title={L({ uz: 'Ilova tili', uz_cyrl: 'Илова тили', ru: 'Язык приложения' })} />
      <Card padded={false}>
        {LANGUAGES.map((item, i) => {
          const selected = lang === item.id;
          return (
            <View key={item.id}>
              {i > 0 ? <Divider style={styles.inset} /> : null}
              <Pressable
                onPress={() => setLang(item.id)}
                style={({ pressed }) => [styles.langRow, pressed && styles.pressed]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <AppText variant={selected ? 'strong' : 'body'} lines={1} style={styles.flex}>
                  {item.label}
                </AppText>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </Card>

      {/* Sync */}
      <SectionHeader title={L({ uz: 'Sinxronlash', uz_cyrl: 'Синхронлаш', ru: 'Синхронизация' })} />
      <Card>
        <KeyValue
          label={L({ uz: 'Yuborilmagan', uz_cyrl: 'Юборилмаган', ru: 'Не отправлено' })}
          value={
            <View>
              <Badge label={formatNumber(pendingCount)} tone={pendingCount > 0 ? 'warning' : 'success'} />
            </View>
          }
        />
        <KeyValue
          label={L({ uz: 'Oxirgi sinxronlash', uz_cyrl: 'Охирги синхронлаш', ru: 'Последняя синхронизация' })}
          value={lastSyncedAt || L({ uz: 'Hali boʻlmagan', uz_cyrl: 'Ҳали бўлмаган', ru: 'Ещё не было' })}
        />
        <Button
          title={L({ uz: 'Sinxronlash', uz_cyrl: 'Синхронлаш', ru: 'Синхронизировать' })}
          icon={pendingCount > 0 ? RefreshCw : Wifi}
          onPress={handleSync}
          loading={isSyncing}
          style={styles.topGap}
        />
      </Card>

      <Button
        title={L({ uz: 'Liniyadan chiqish', uz_cyrl: 'Линиядан чиқиш', ru: 'Выйти из линии' })}
        icon={LogOut}
        variant="danger"
        onPress={handleLogout}
        style={styles.logout}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.75 },
  topGap: { marginTop: space.xs },
  inset: { marginLeft: space.lg },
  logout: { marginTop: space.md },
  lineIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 48,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
