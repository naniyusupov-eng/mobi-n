/**
 * Sign-in: scan the line QR code (or type the key printed under it, e.g. "K7QM-29XP").
 * Language can be switched before signing in.
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, KeyRound, LogIn, ScanLine } from 'lucide-react-native';
import { Tri, useL } from '../../i18n/tri';

const TX = {
  hint: {
    uz: 'Liniya QR kodini ramka ichiga toʻgʻrilang',
    uz_cyrl: 'Линия QR кодини рамка ичига тўғриланг',
    ru: 'Наведите рамку на QR-код линии',
  },
  keyHint: {
    uz: 'QR kod ostida yozilgan kalitni kiriting',
    uz_cyrl: 'QR код остида ёзилган калитни киритинг',
    ru: 'Введите ключ, напечатанный под QR-кодом',
  },
  byKey: { uz: 'Kalit bilan kirish', uz_cyrl: 'Калит билан кириш', ru: 'Войти по ключу' },
  byScan: { uz: 'QR kodni skanerlash', uz_cyrl: 'QR кодни сканерлаш', ru: 'Сканировать QR-код' },
} satisfies Record<string, Tri>;
import { AppText, Button, Field, Screen } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import { colors, radius, space } from '../../theme/colors';

// Each language is labelled in its own script
const LANGUAGES: { id: MobileLanguage; label: string }[] = [
  { id: 'uz', label: 'UZ' },
  { id: 'uz_cyrl', label: 'ЎЗ' },
  { id: 'ru', label: 'RU' },
];

const LanguageSwitch: React.FC<{ value: MobileLanguage; onChange: (l: MobileLanguage) => void }> = ({ value, onChange }) => (
  <View style={styles.langBar}>
    {LANGUAGES.map((opt) => {
      const active = opt.id === value;
      return (
        <Pressable
          key={opt.id}
          onPress={() => onChange(opt.id)}
          hitSlop={4}
          style={[styles.langBtn, active && styles.langBtnActive]}
        >
          <AppText variant="small" color={active ? colors.primaryDark : colors.textSecondary} style={styles.langText}>
            {opt.label}
          </AppText>
        </Pressable>
      );
    })}
  </View>
);

export const QRScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const { loginWithQR, isLoggingIn: isLoading } = useAuthStore();
  // The camera reports the same code several times before a re-render; one sign-in per scan
  const busy = useRef(false);
  const { lang, setLang, t } = useLanguageStore();
  const { width } = useWindowDimensions();
  const L = useL();
  // Two ways in, one on screen at a time: the camera, or the key field near the top
  // (with the camera gone, the keyboard does not cover the field)
  const [mode, setMode] = useState<'scan' | 'key'>('scan');

  const scannerSize = Math.min(width - space.lg * 2, 340);
  const frameSize = Math.round(scannerSize * 0.62);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (busy.current) return;
    busy.current = true;
    setScanned(true);

    // The code itself says whether it opens the agent or the driver app
    const result = await loginWithQR(data);
    if (!result.success) {
      Alert.alert(t('auth_error_title'), result.error || t('auth_error_title'), [
        {
          text: t('auth_retry'),
          onPress: () => {
            busy.current = false;
            setScanned(false);
          },
        },
      ]);
    }
  };

  const handleManualLogin = async () => {
    if (busy.current) return;
    const code = manualCode.trim();
    if (!code) {
      Alert.alert(t('warning'), t('auth_enter_code_alert'));
      return;
    }

    busy.current = true;
    const result = await loginWithQR(code);
    busy.current = false;
    if (!result.success) {
      Alert.alert(t('error'), result.error || t('auth_error_title'));
    }
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.content}>
      <LanguageSwitch value={lang} onChange={setLang} />

      <View style={styles.brand}>
        <Image source={require('../../../assets/splash-icon.png')} style={styles.logo} resizeMode="cover" />
        <AppText variant="h2" align="center" lines={1}>
          {t('auth_subtitle')}
        </AppText>
        <AppText variant="small" color={colors.textSecondary} align="center" lines={2}>
          {L(mode === 'scan' ? TX.hint : TX.keyHint)}
        </AppText>
      </View>

      {mode === 'scan' ? (
        <View style={[styles.scanner, { width: scannerSize, height: scannerSize }]}>
          {permission?.granted ? (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              <View style={styles.frameWrap} pointerEvents="none">
                <View style={{ width: frameSize, height: frameSize }}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.permission}>
              <Camera size={28} color={colors.primary} strokeWidth={1.8} />
              <AppText variant="strong" align="center" lines={2}>
                {t('auth_camera_permission')}
              </AppText>
              <Button title={t('auth_grant_camera')} onPress={requestPermission} style={styles.permissionBtn} />
            </View>
          )}

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.white} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.manual}>
          <Field
            label={t('auth_enter_code')}
            value={manualCode}
            onChangeText={setManualCode}
            placeholder={t('auth_code_placeholder')}
            keyboardType="default"
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={handleManualLogin}
            editable={!isLoading}
          />
          <Button title={t('auth_login_btn')} icon={LogIn} onPress={handleManualLogin} loading={isLoading} />
        </View>
      )}

      <Pressable
        onPress={() => setMode((m) => (m === 'scan' ? 'key' : 'scan'))}
        disabled={isLoading}
        hitSlop={8}
        style={styles.modeSwitch}
      >
        {mode === 'scan' ? <KeyRound size={16} color={colors.primary} /> : <ScanLine size={16} color={colors.primary} />}
        <AppText variant="small" color={colors.primary} style={styles.modeSwitchText}>
          {L(mode === 'scan' ? TX.byKey : TX.byScan)}
        </AppText>
      </Pressable>
    </Screen>
  );
};

const CORNER = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: space.lg },

  langBar: { alignSelf: 'flex-end', flexDirection: 'row', gap: 2 },
  langBtn: { minWidth: 44, alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  langBtnActive: { backgroundColor: colors.primaryLight },
  langText: { fontWeight: '600' },

  brand: { alignSelf: 'stretch', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: space.sm },

  scanner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.text,
  },
  frameWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: radius.md },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: radius.md },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: radius.md },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: radius.md,
  },

  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
    backgroundColor: colors.card,
  },
  permissionBtn: { alignSelf: 'stretch' },

  loading: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    backgroundColor: colors.overlay,
  },

  modeSwitch: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: space.sm },
  modeSwitchText: { fontWeight: '600' },
  manual: { alignSelf: 'stretch', gap: space.md },
});
