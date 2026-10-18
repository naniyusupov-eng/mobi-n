import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent } from '../types';
import { getDatabase } from '../database/db';
import { lineService, parseLineQR } from '../services/lineService';
import { useLanguageStore } from './languageStore';
import { Tri, pick } from '../i18n/tri';

// Sign-in errors in the current app language
const msg = (text: Tri) => pick(text, useLanguageStore.getState().lang);
const ERR = {
  notLine: {
    uz: 'Bu liniya QR kodi emas. Liniya kodini kiriting, masalan 4-3',
    uz_cyrl: 'Бу линия QR коди эмас. Линия кодини киритинг, масалан 4-3',
    ru: 'Это не QR-код линии. Введите код линии, например 4-3',
  },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Internet yoki server manzilini tekshiring',
    uz_cyrl: 'Серверга уланиб бўлмади. Интернет ёки сервер манзилини текширинг',
    ru: 'Нет связи с сервером. Проверьте интернет или адрес сервера',
  },
  notFound: { uz: 'liniyasi topilmadi', uz_cyrl: 'линияси топилмади', ru: '— линия не найдена' },
  generic: { uz: 'Xatolik yuz berdi', uz_cyrl: 'Хатолик юз берди', ru: 'Произошла ошибка' },
} satisfies Record<string, Tri>;

interface AuthState {
  agent: Agent | null;
  isLoading: boolean; // restoring the saved session at start-up
  isLoggingIn: boolean; // a QR / code sign-in in progress (keeps the sign-in screen mounted)
  error: string | null;
  loadStoredSession: () => Promise<void>;
  loginWithQR: (qrData: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = '@mobi_r_agent_session';

export const useAuthStore = create<AuthState>((set) => ({
  agent: null,
  isLoading: true,
  isLoggingIn: false,
  error: null,

  loadStoredSession: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const agent: Agent | null = stored ? JSON.parse(stored) : null;
      // Sessions from the old personal agent QR codes have no line: ask to scan the line QR
      set({ agent: agent?.lineCode ? agent : null, isLoading: false });
    } catch (e) {
      set({ agent: null, isLoading: false });
    }
  },

  // Signs in to a line: the QR code (or typed code like "4-3") belongs to the line, not to an agent
  loginWithQR: async (qrData: string) => {
    const fail = (error: string) => {
      set({ isLoggingIn: false, error });
      return { success: false, error };
    };

    try {
      set({ isLoggingIn: true, error: null });

      const parsed = parseLineQR(qrData);
      if (!parsed) {
        return fail(msg(ERR.notLine));
      }
      const { lineCode, role } = parsed;

      let line;
      try {
        line = await lineService.findLine(lineCode);
      } catch {
        return fail(msg(ERR.offline));
      }
      if (!line) {
        return fail(`${lineCode} ${msg(ERR.notFound)}`);
      }

      await lineService.downloadShops(lineCode);

      const session: Agent = {
        id: line.id,
        code: role === 'driver' ? `DRIVER-${lineCode}` : `LINE-${lineCode}`,
        name: role === 'driver' ? `${lineCode} yetkazuvchi` : `${lineCode} liniya`,
        role,
        phone: '',
        territory: lineCode,
        token: `line_${line.id}`,
        loginAt: new Date().toISOString(),
        lineCode,
      };

      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO agents (id, code, name, phone, territory, token, loginAt)
         VALUES ($id, $code, $name, $phone, $territory, $token, $loginAt)`,
        {
          $id: session.id,
          $code: session.code,
          $name: session.name,
          $phone: session.phone,
          $territory: session.territory,
          $token: session.token,
          $loginAt: session.loginAt!,
        }
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      set({ agent: session, isLoggingIn: false, error: null });
      return { success: true };
    } catch (err: any) {
      return fail(err.message || msg(ERR.generic));
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ agent: null });
  },
}));
