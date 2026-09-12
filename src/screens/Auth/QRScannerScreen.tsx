import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore, DEMO_AGENTS } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import { colors } from '../../theme/colors';
import { Sparkles, UserCheck, ShieldAlert, KeyRound, Globe } from 'lucide-react-native';

export const QRScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const { loginWithQR, isLoading } = useAuthStore();
  const { lang, setLang, t } = useLanguageStore();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isLoading) return;
    setScanned(true);

    const result = await loginWithQR(data);
    if (!result.success) {
      Alert.alert(
        t('auth_error_title'),
        result.error || t('auth_error_title'),
        [{ text: t('auth_retry'), onPress: () => setScanned(false) }]
      );
    }
  };

  const handleManualLogin = async (codeToUse?: string) => {
    const code = codeToUse || manualCode.trim();
    if (!code) {
      Alert.alert(t('warning'), t('auth_enter_code_alert'));
      return;
    }

    const result = await loginWithQR(code);
    if (!result.success) {
      Alert.alert(t('error'), result.error || t('auth_error_title'));
    }
  };

  const languageOptions: { id: MobileLanguage; label: string }[] = [
    { id: 'uz', label: '🇺🇿 UZ' },
    { id: 'ru', label: '🇷🇺 RU' },
    { id: 'uz_cyrl', label: '🇺🇿 ЎЗБ' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Top Language Switcher Bar */}
        <View style={styles.langBar}>
          <View style={styles.langPillContainer}>
            {languageOptions.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setLang(opt.id)}
                style={[
                  styles.langBtn,
                  lang === opt.id && styles.langBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    lang === opt.id && styles.langBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../../assets/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.brandTitle}>{t('auth_brand')}</Text>
          <Text style={styles.subtitle}>{t('auth_subtitle')}</Text>
          <Text style={styles.description}>
            {t('auth_scan_hint')}
          </Text>
        </View>

        {/* Camera Scanner View */}
        <View style={styles.scannerWrapper}>
          {permission?.granted ? (
            <View style={styles.cameraBox}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              {/* Overlay Frame */}
              <View style={styles.overlay}>
                <View style={styles.scanTarget}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noCameraBox}>
              <ShieldAlert size={48} color={colors.warning} />
              <Text style={styles.noCameraTitle}>{t('auth_camera_permission')}</Text>
              <Text style={styles.noCameraText}>
                {t('auth_scan_hint')}
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionBtnText}>{t('auth_grant_camera')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          )}
        </View>

        {/* Demo Fast Login Buttons (Essential for testing & when camera is unavailable) */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.demoTitle}>{t('auth_manual_title')}</Text>
          </View>

          {DEMO_AGENTS.map((demo) => (
            <TouchableOpacity
              key={demo.id}
              style={styles.demoCard}
              onPress={() => handleManualLogin(demo.code)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={styles.demoIconBadge}>
                <UserCheck size={20} color={colors.primary} />
              </View>
              <View style={styles.demoInfo}>
                <Text style={styles.demoName}>{demo.name}</Text>
                <Text style={styles.demoTerritory}>{demo.territory} • {demo.code}</Text>
              </View>
              <Text style={styles.demoActionText}>{t('auth_login_btn')} →</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Manual Code Entry Toggle */}
        <View style={styles.manualToggleContainer}>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setShowManual(!showManual)}
          >
            <KeyRound size={16} color={colors.textSecondary} />
            <Text style={styles.toggleBtnText}>
              {showManual ? t('close') : t('auth_enter_code')}
            </Text>
          </TouchableOpacity>

          {showManual && (
            <View style={styles.manualInputBox}>
              <TextInput
                style={styles.input}
                placeholder={t('auth_code_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.manualSubmitBtn}
                onPress={() => handleManualLogin()}
                disabled={isLoading}
              >
                <Text style={styles.manualSubmitText}>{t('auth_login_btn')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    padding: 20,
    alignItems: 'center',
  },
  langBar: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  langBtnTextActive: {
    color: colors.primary,
  },
  header: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
  scannerWrapper: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#000',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraBox: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  noCameraBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCameraTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  noCameraText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  demoSection: {
    width: '100%',
    marginTop: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  demoInfo: {
    flex: 1,
  },
  demoName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  demoTerritory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  demoActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  manualToggleContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  toggleBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  manualInputBox: {
    width: '100%',
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  manualSubmitBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  manualSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
