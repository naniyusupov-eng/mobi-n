/**
 * Sign-in: scan the line QR code (or type the key printed under it, e.g. "K7QM-29XP").
 * Language can be switched before signing in.
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, LogIn } from 'lucide-react-native';
import { AppText, Button, Card, Field, Screen } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import { colors, radius, shadow, space } from '../../theme/colors';

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

  const scannerSize = Math.min(width - space.lg * 2, 300);
  const frameSize = Math.round(scannerSize * 0.7);

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
        <Image source={require('../../../assets/logo.jpg')} style={styles.logo} resizeMode="cover" />
        <AppText variant="small" color={colors.primary} align="center" lines={1} style={styles.brandName}>
          {t('auth_brand')}
        </AppText>
        <AppText variant="h2" align="center" lines={2}>
          {t('auth_subtitle')}
        </AppText>
        <AppText variant="small" align="center" lines={3}>
          {t('auth_scan_hint')}
        </AppText>
      </View>

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
            <View style={styles.permissionIcon}>
              <Camera size={26} color={colors.primary} strokeWidth={1.8} />
            </View>
            <AppText variant="strong" align="center" lines={2}>
              {t('auth_camera_permission')}
            </AppText>
            <Button title={t('auth_grant_camera')} onPress={requestPermission} style={styles.permissionBtn} />
          </View>
        )}

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.white} />
            <AppText variant="strong" color={colors.white} align="center" lines={1}>
              {t('loading')}
            </AppText>
          </View>
        ) : null}
      </View>

      <Card style={styles.manual}>
        <Field
          label={t('auth_enter_code')}
          value={manualCode}
          onChangeText={setManualCode}
          placeholder={t('auth_code_placeholder')}
          keyboardType="default"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleManualLogin}
          editable={!isLoading}
        />
        <Button title={t('auth_login_btn')} icon={LogIn} onPress={handleManualLogin} loading={isLoading} />
      </Card>
    </Screen>
  );
};

const CORNER = 26;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: space.lg },

  langBar: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    ...shadow.card,
  },
  langBtn: { minWidth: 44, alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.pill },
  langBtnActive: { backgroundColor: colors.primaryLight },
  langText: { fontWeight: '600' },

  brand: { alignSelf: 'stretch', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm },
  logo: { width: 64, height: 64, borderRadius: 32, marginBottom: space.sm },
  brandName: { fontWeight: '600' },

  scanner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.text,
    ...shadow.pop,
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
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  permissionBtn: { alignSelf: 'stretch' },

  loading: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    backgroundColor: colors.overlay,
  },

  manual: { alignSelf: 'stretch', gap: space.md },
});
