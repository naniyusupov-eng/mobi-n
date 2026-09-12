import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSyncStore } from '../../store/syncStore';
import { useLanguageStore } from '../../store/languageStore';
import { MobileLanguage } from '../../i18n/mobileTranslations';
import { colors } from '../../theme/colors';
import { DEFAULT_API_BASE_URL, apiClient } from '../../services/apiClient';
import {
  User,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Database,
  Globe,
  Check,
} from 'lucide-react-native';

export const ProfileScreen = () => {
  const { agent, logout } = useAuthStore();
  const { pendingCount, triggerSync, isSyncing, lastSyncedAt } = useSyncStore();
  const { lang, setLang, t } = useLanguageStore();

  const [apiUrl, setApiUrl] = useState(DEFAULT_API_BASE_URL);
  const [testingServer, setTestingServer] = useState(false);

  const handleTestConnection = async () => {
    try {
      setTestingServer(true);
      await apiClient.get('/health', { timeout: 4000 });
      Alert.alert(t('success'), 'NestJS Server Online!');
    } catch (e: any) {
      Alert.alert(
        t('warning'),
        'SQLite Offline Mode'
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
    { id: 'ru', label: '🇷🇺 Русский', desc: 'Классический Моби-С' },
    { id: 'uz_cyrl', label: '🇺🇿 Ўзбекча', desc: 'Кирилл ёзувида' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Agent Card */}
        <View style={styles.agentCard}>
          <View style={styles.avatarCircle}>
            <User size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>{agent?.name}</Text>
            <Text style={styles.agentCode}>{t('profile_agent_code')} {agent?.code}</Text>
            <Text style={styles.territoryText}>{t('profile_route')} {agent?.territory}</Text>
          </View>
        </View>

        {/* Language Selector Card */}
        <Text style={styles.sectionHeader}>{t('profile_language_title')}</Text>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.langOptionLabel}>{item.label}</Text>
                  <Text style={styles.langOptionDesc}>({item.desc})</Text>
                </View>
                {isSelected && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mobi-S Exchange Parameters */}
        <Text style={styles.sectionHeader}>{t('profile_server_title')}</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('profile_server_url')}</Text>
          <TextInput
            style={styles.apiInput}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://api.mobir-trade.com/api/v1"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.syncStatusStrip}>
            <Text style={styles.syncStatusText}>
              {t('profile_unsynced_docs')}{' '}
              <Text style={{ fontWeight: '900', color: colors.danger }}>{pendingCount}</Text>
            </Text>
            <Text style={styles.syncStatusText}>
              {t('profile_last_sync')} {lastSyncedAt || t('profile_never_synced')}
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
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.fullSyncText}>
                {isSyncing ? t('loading') : t('profile_sync_btn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testConnBtn}
              onPress={handleTestConnection}
              disabled={testingServer}
            >
              <ShieldCheck size={16} color={colors.secondary} />
              <Text style={styles.testConnText}>{t('profile_test_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Database info */}
        <Text style={styles.sectionHeader}>SQLITE DATABASE</Text>
        <View style={styles.card}>
          <View style={styles.dbRow}>
            <Database size={16} color={colors.textSecondary} />
            <Text style={styles.dbLabel}>Engine:</Text>
            <Text style={styles.dbVal}>SQLite (expo-sqlite v57)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={colors.danger} />
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
    gap: 10,
    paddingBottom: 36,
  },
  agentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  agentCode: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  territoryText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 6,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  langOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  langOptionSelected: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
  },
  langOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  langOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  apiInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text,
  },
  syncStatusStrip: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    gap: 4,
  },
  syncStatusText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  syncActionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  fullSyncBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  fullSyncText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  testConnBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  testConnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  dbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dbLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dbVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
    marginTop: 10,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
});
