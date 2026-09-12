import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent } from '../types';
import { getDatabase } from '../database/db';

interface AuthState {
  agent: Agent | null;
  isLoading: boolean;
  error: string | null;
  loadStoredSession: () => Promise<void>;
  loginWithQR: (qrData: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = '@mobi_r_agent_session';

export const DEMO_AGENTS: Agent[] = [
  {
    id: 'agent_101',
    code: 'AGENT-QND-101',
    name: 'Alisher Vohidov',
    phone: '+998 90 900 11 22',
    territory: 'Chilonzor & Uchtepa',
    token: 'jwt_mock_token_chilonzor_101',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: 'agent_102',
    code: 'AGENT-QND-102',
    name: 'Jasurbek Oripov',
    phone: '+998 94 450 33 44',
    territory: 'Yunusobod & Mirzo Ulugʻbek',
    token: 'jwt_mock_token_yunusobod_102',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

export const useAuthStore = create<AuthState>((set) => ({
  agent: null,
  isLoading: true,
  error: null,

  loadStoredSession: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const agent: Agent = JSON.parse(stored);
        set({ agent, isLoading: false });
      } else {
        set({ agent: null, isLoading: false });
      }
    } catch (e) {
      set({ agent: null, isLoading: false });
    }
  },

  loginWithQR: async (qrData: string) => {
    try {
      set({ isLoading: true, error: null });
      let matchedAgent: Agent | null = null;

      // 1. Try parsing JSON from QR code
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.id && parsed.name) {
          matchedAgent = {
            id: parsed.id,
            code: parsed.code || `AGENT-${parsed.id}`,
            name: parsed.name,
            phone: parsed.phone || '+998 90 000 00 00',
            territory: parsed.territory || 'Toshkent',
            token: parsed.token || `token_${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
        }
      } catch (jsonErr) {
        // Not JSON, search demo agents by code
        const trimmed = qrData.trim();
        matchedAgent = DEMO_AGENTS.find((a) => a.code === trimmed || a.id === trimmed) || null;

        if (!matchedAgent && trimmed.length > 2) {
          // Dynamic fallback for any agent code scanned
          matchedAgent = {
            id: `agent_${Date.now()}`,
            code: trimmed,
            name: `Agent (${trimmed})`,
            phone: '+998 90 123 00 00',
            territory: 'Toshkent hududi',
            token: `jwt_${trimmed}_${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
        }
      }

      if (!matchedAgent) {
        set({ isLoading: false, error: 'QR kod formati notoʻgʻri yoki agent topilmadi' });
        return { success: false, error: 'QR kod formati notoʻgʻri' };
      }

      // Save to SQLite
      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO agents (id, code, name, phone, territory, token, loginAt)
         VALUES ($id, $code, $name, $phone, $territory, $token, $loginAt)`,
        {
          $id: matchedAgent.id,
          $code: matchedAgent.code,
          $name: matchedAgent.name,
          $phone: matchedAgent.phone,
          $territory: matchedAgent.territory,
          $token: matchedAgent.token,
          $loginAt: new Date().toISOString(),
        }
      );

      // Save session
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matchedAgent));
      set({ agent: matchedAgent, isLoading: false, error: null });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Xatolik yuz berdi' });
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ agent: null });
  },
}));
