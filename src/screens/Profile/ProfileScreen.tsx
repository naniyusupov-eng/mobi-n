import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { apiClient, DEFAULT_API_BASE_URL, getApiUrl, setCustomApiUrl } from '../../services/apiClient';
import { colors } from '../../theme/colors';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import {
  User,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
} from 'lucide-react-native';

export const ProfileScreen = () => {
  const { agent, logout } = useAuthStore();
  const { pendingCount, triggerSync, isSyncing, lastSyncedAt } = useSyncStore();
  const { lang, setLang, t } = useLanguageStore();

  const [apiUrl, setApiUrl] = useState(DEFAULT_API_BASE_URL);
  const [testingServer, setTestingServer] = useState(false);

  useEffect(() => {
    getApiUrl().then((saved) => {
      if (saved) setApiUrl(saved);
    });
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setApiUrl(newUrl);
    setCustomApiUrl(newUrl);
  };

  const handleTestConnection = async () => {
    try {
      setTestingServer(true);
      await setCustomApiUrl(apiUrl);
      await apiClient.get('/health', { baseURL: apiUrl.trim().replace(/\/+$/, ''), timeout: 4000 });
      Alert.alert(
        t('success'),
        lang === 'ru'
          ? 'Связь с сервером установлена (192.168.1.47)'
          : lang === 'uz_cyrl'
          ? 'Сервер билан алоқа ўрнатилди (192.168.1.47)'
          : 'Server bilan aloqa oʻrnatildi (192.168.1.47)'
      );
    } catch (e: any) {
      Alert.alert(
        t('warning'),
        lang === 'ru'
          ? `Сервер недоступен (${apiUrl}). Проверьте Wi-Fi.`
          : lang === 'uz_cyrl'
          ? `Серверга уланиб бўлмади (${apiUrl}). Wi-Fi ни текширинг.`
          : `Serverga ulanib boʻlmadi (${apiUrl}). Kompyuter va telefon bitta Wi-Fi tarmogʻida ekanini tekshiring.`
      );
    } finally {
      setTestingServer(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('profile_logout_btn'), t('profile_logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('profile_logout_btn'), style: 'destructive', onPress: logout },
    ]);
  };

  const languages: { id: MobileLanguage; label: string; desc: string }[] = [
    { id: 'uz', label: "🇺🇿 Oʻzbekcha", desc: 'Lotin yozuvida' },
    { id: 'ru', label: '🇷🇺 Русский', desc: 'Классический' },
    { id: 'uz_cyrl', label: '🇺🇿 Ўзбекча', desc: 'Кирилл ёзувида' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Agent Passport Card */}
        <View style={styles.agentCard}>
          <View style={styles.avatarCircle}>
            <User size={26} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>{agent?.name}</Text>
            <View style={styles.agentMetaRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{agent?.code}</Text>
              </View>
              <Text style={styles.territoryText}>{agent?.territory}</Text>
            </View>
          </View>
        </View>

        {/* Language Selector Card */}
        <Text style={styles.sectionHeader}>{t('profile_language_title').toUpperCase()}</Text>
        <View style={styles.card}>
          {languages.map((item, idx) => {
            const isSelected = lang === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.langOption,
                  idx < languages.length - 1 && styles.langOptionBorder,
                  isSelected && styles.langOptionSelected,
                ]}
                onPress={() => setLang(item.id)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.langOptionLabel}>{item.label}</Text>
                  <Text style={styles.langOptionDesc}>({item.desc})</Text>
                </View>
                {isSelected && <Check size={16} color={colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 1C / Mobi_R Server Connection Parameters */}
        <Text style={styles.sectionHeader}>{t('profile_server_title').toUpperCase()}</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('profile_server_url')}</Text>
          <TextInput
            style={styles.apiInput}
            value={apiUrl}
            onChangeText={handleUrlChange}
            placeholder="http://192.168.1.47:3000/api/v1"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.syncStatusStrip}>
            <Text style={styles.syncStatusText}>
              {t('profile_unsynced_docs')}:{' '}
              <Text style={{ fontWeight: '700', color: pendingCount > 0 ? colors.warning : colors.success }}>
                {pendingCount}
              </Text>
            </Text>
            <Text style={styles.syncStatusText}>
              {lastSyncedAt ? `${t('profile_last_sync')} ${lastSyncedAt.split('T')[0]}` : t('profile_never_synced')}
            </Text>
          </View>

          {/* Action Buttons for Sync */}
          <View style={styles.syncActionsContainer}>
            <TouchableOpacity
              style={styles.fullSyncBtn}
              onPress={triggerSync}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.fullSyncText}>
                {isSyncing ? t('loading') : t('profile_sync_btn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testConnBtn}
              onPress={handleTestConnection}
              disabled={testingServer}
              activeOpacity={0.7}
            >
              <ShieldCheck size={14} color={colors.textSecondary} />
              <Text style={styles.testConnText}>{t('profile_test_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color={colors.danger} />
          <Text style={styles.logoutText}>{t('profile_logout_btn')}</Text>
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
    gap: 8,
    paddingBottom: 30,
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  agentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  codeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  territoryText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  langOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  langOptionSelected: {
    backgroundColor: '#FFFFFF',
  },
  langOptionLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  langOptionDesc: {
    fontSize: 11,
    color: colors.textMuted,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  apiInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    color: colors.text,
    marginBottom: 8,
  },
  syncStatusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  syncStatusText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  syncActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  fullSyncBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fullSyncText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  testConnBtn: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  testConnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
