import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent } from '../types';
import { getDatabase } from '../database/db';
import { lineService, parseLineCode } from '../services/lineService';
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
  isLoading: boolean;
  error: string | null;
  loadStoredSession: () => Promise<void>;
  loginWithQR: (qrData: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = '@mobi_r_agent_session';

export const useAuthStore = create<AuthState>((set) => ({
  agent: null,
  isLoading: true,
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
      set({ isLoading: false, error });
      return { success: false, error };
    };

    try {
      set({ isLoading: true, error: null });

      const lineCode = parseLineCode(qrData);
      if (!lineCode) {
        return fail(msg(ERR.notLine));
      }

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
        code: `LINE-${lineCode}`,
        name: `${lineCode} liniya`,
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
      set({ agent: session, isLoading: false, error: null });
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
