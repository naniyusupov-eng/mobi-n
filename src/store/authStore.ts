import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agent } from '../types';
import { getDatabase } from '../database/db';
import { lineService, parseLineKey, parseServerUrl } from '../services/lineService';
import { apiClient, loadSavedApiUrl, setAuthToken, setCustomApiUrl, setUnauthorizedHandler } from '../services/apiClient';
import { useLanguageStore } from './languageStore';
import { useSyncStore } from './syncStore';
import { useCartStore } from './cartStore';
import { syncRepository } from '../database/syncRepository';
import { cacheRepository } from '../database/cacheRepository';
import { productRepository } from '../database/productRepository';
import { pricingService } from '../services/pricingService';
import { Tri, pick } from '../i18n/tri';

// Sign-in errors in the current app language
const msg = (text: Tri) => pick(text, useLanguageStore.getState().lang);
const ERR = {
  noKey: {
    uz: 'Bu liniya QR kodi emas. QR ostidagi kalitni kiriting, masalan K7QM-29XP',
    uz_cyrl: 'Бу линия QR коди эмас. QR остидаги калитни киритинг, масалан K7QM-29XP',
    ru: 'Это не QR-код линии. Введите ключ под QR-кодом, например K7QM-29XP',
  },
  unknownKey: {
    uz: 'Kalit notoʻgʻri yoki eskirgan. Saytdagi yangi QR kodni skanerlang',
    uz_cyrl: 'Калит нотўғри ёки эскирган. Сайтдаги янги QR кодни сканерланг',
    ru: 'Неверный или устаревший ключ. Отсканируйте новый QR-код с сайта',
  },
  tooMany: {
    uz: 'Juda koʻp urinish. 10 daqiqadan soʻng qayta urinib koʻring',
    uz_cyrl: 'Жуда кўп уриниш. 10 дақиқадан сўнг қайта уриниб кўринг',
    ru: 'Слишком много попыток. Повторите через 10 минут',
  },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Internet yoki server manzilini tekshiring',
    uz_cyrl: 'Серверга уланиб бўлмади. Интернет ёки сервер манзилини текширинг',
    ru: 'Нет связи с сервером. Проверьте интернет или адрес сервера',
  },
  generic: { uz: 'Xatolik yuz berdi', uz_cyrl: 'Хатолик юз берди', ru: 'Произошла ошибка' },
  sessionEnded: {
    uz: 'Liniya kaliti oʻzgardi yoki seans tugadi. Yangi QR kodni skanerlang',
    uz_cyrl: 'Линия калити ўзгарди ёки сеанс тугади. Янги QR кодни сканерланг',
    ru: 'Ключ линии изменён или сеанс завершён. Отсканируйте новый QR-код',
  },
  sessionTitle: { uz: 'Qayta kiring', uz_cyrl: 'Қайта киринг', ru: 'Войдите снова' },
  unsentTitle: { uz: 'Yuborilmagan maʼlumotlar', uz_cyrl: 'Юборилмаган маълумотлар', ru: 'Неотправленные данные' },
  stay: { uz: 'Qolish', uz_cyrl: 'Қолиш', ru: 'Остаться' },
  signOutAnyway: { uz: 'Baribir chiqish', uz_cyrl: 'Барибир чиқиш', ru: 'Всё равно выйти' },
} satisfies Record<string, Tri>;

const unsentText = (n: number): Tri => ({
  uz: `${n} ta amal (buyurtma, toʻlov) serverga yuborilmadi. Boshqa liniyaga kirsangiz, ular yoʻqoladi. Baribir chiqasizmi?`,
  uz_cyrl: `${n} та амал (буюртма, тўлов) серверга юборилмади. Бошқа линияга кирсангиз, улар йўқолади. Барибир чиқасизми?`,
  ru: `${n} действ. (заказы, оплаты) не отправлены на сервер. При входе в другую линию они будут потеряны. Всё равно выйти?`,
});

interface AuthState {
  agent: Agent | null;
  isLoading: boolean; // restoring the saved session at start-up
  isLoggingIn: boolean; // a QR / key sign-in in progress (keeps the sign-in screen mounted)
  error: string | null;
  loadStoredSession: () => Promise<void>;
  loginWithQR: (qrData: string) => Promise<{ success: boolean; error?: string }>;
  /** Signs out; with unsent items it syncs first and asks before dropping them. False = the user stayed. */
  logout: (opts?: { force?: boolean }) => Promise<boolean>;
}

const STORAGE_KEY = '@mobi_r_agent_session';
// "lineCode|role" of the last successful sign-in; kept after logout to spot a line switch
const LAST_LINE_KEY = '@mobi_r_last_line';

/** Line-specific data on the phone (shops and products are replaced by the sign-in downloads) */
const clearLineData = () => {
  useCartStore.getState().resetCart();
  cacheRepository.clear(); // driver day lists, price lists
  pricingService.reset();
  syncRepository.clearAll(); // leftovers of the old session must not be sent with the new line's token
  useSyncStore.getState().refreshPendingCount();
};

/** Asks whether to sign out although items are still unsent */
const confirmLoseUnsent = (count: number): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      msg(ERR.unsentTitle),
      msg(unsentText(count)),
      [
        { text: msg(ERR.stay), style: 'cancel', onPress: () => resolve(false) },
        { text: msg(ERR.signOutAnyway), style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

/** Server session tokens are 64 hex chars; old app versions stored fake "line_<id>" tokens */
const isRealToken = (token: unknown): token is string => typeof token === 'string' && /^[0-9a-f]{32,}$/i.test(token);

/** Maps an axios error from POST /auth/line to a message */
const signInError = (err: any): string => {
  const status = err?.response?.status;
  if (status === 401) return msg(ERR.unknownKey);
  if (status === 429) return msg(ERR.tooMany);
  if (!err?.response) return msg(ERR.offline);
  return err.response?.data?.error || err.message || msg(ERR.generic);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  agent: null,
  isLoading: true,
  isLoggingIn: false,
  error: null,

  loadStoredSession: async () => {
    try {
      set({ isLoading: true });
      await loadSavedApiUrl();
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const agent: Agent | null = stored ? JSON.parse(stored) : null;
      // Old sessions (personal agent QR, or line sessions without a server token): ask to rescan
      if (agent && agent.lineCode && isRealToken(agent.token)) {
        setAuthToken(agent.token);
        set({ agent, isLoading: false });
      } else {
        if (stored) await AsyncStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
        set({ agent: null, isLoading: false });
      }
    } catch (e) {
      setAuthToken(null);
      set({ agent: null, isLoading: false });
    }
  },

  // Signs in to a line with its key (from the line QR code, or typed from under the QR)
  loginWithQR: async (qrData: string) => {
    const previousUrl = apiClient.defaults.baseURL;
    const fail = (error: string) => {
      setAuthToken(null);
      apiClient.defaults.baseURL = previousUrl; // a failed sign-in keeps the old server
      set({ isLoggingIn: false, error });
      return { success: false, error };
    };

    try {
      set({ isLoggingIn: true, error: null });

      const key = parseLineKey(qrData);
      if (!key) {
        return fail(msg(ERR.noKey));
      }

      // The QR code names the server; it is kept only when the sign-in works
      const serverUrl = parseServerUrl(qrData);
      if (serverUrl) apiClient.defaults.baseURL = serverUrl;

      let signIn;
      try {
        signIn = await lineService.signIn(key);
      } catch (err: any) {
        return fail(signInError(err));
      }
      const { token, role, line } = signIn;
      const lineCode = line.code;

      // Downloads below need the token before the session is saved
      setAuthToken(token);
      try {
        await lineService.downloadShops(lineCode);
      } catch (err: any) {
        return fail(signInError(err));
      }
      // Another line or role than last time: drop the old session's local data before the new downloads
      const sessionKey = `${lineCode}|${role}`;
      const previousKey = await AsyncStorage.getItem(LAST_LINE_KEY);
      if (previousKey && previousKey !== sessionKey) clearLineData();

      try {
        await lineService.downloadProducts();
      } catch (err) {
        // The catalogue already on the phone stays; the next sync retries. Without any catalogue no orders can be taken.
        console.warn('[Auth] Products download failed', err);
        if (productRepository.count() === 0) return fail(msg(ERR.offline));
      }
      if (role !== 'driver') {
        try {
          // Price lists and today's promotions for the agent's cart
          await lineService.downloadPricing();
        } catch (err) {
          console.warn('[Auth] Pricing download failed', err);
        }
      }

      const session: Agent = {
        id: line.id,
        code: role === 'driver' ? `DRIVER-${lineCode}` : `LINE-${lineCode}`,
        name: role === 'driver' ? `${lineCode} yetkazuvchi` : `${lineCode} liniya`,
        role,
        phone: '',
        territory: lineCode,
        token,
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

      if (serverUrl) await setCustomApiUrl(serverUrl);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      await AsyncStorage.setItem(LAST_LINE_KEY, sessionKey);
      set({ agent: session, isLoggingIn: false, error: null });
      return { success: true };
    } catch (err: any) {
      return fail(err?.message || msg(ERR.generic));
    }
  },

  logout: async (opts) => {
    if (!opts?.force && syncRepository.getPendingCount() > 0) {
      // Last chance to send what is still on the phone
      await useSyncStore.getState().triggerSync();
      // A 401 during that sync already signed out
      if (!get().agent) return true;
      const left = syncRepository.getPendingCount();
      if (left > 0 && !(await confirmLoseUnsent(left))) return false;
    }
    setAuthToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ agent: null });
    return true;
  },
}));

// Any 401 from the server = the phone session ended (key changed on the website): back to the scan screen
setUnauthorizedHandler(() => {
  const { agent, isLoggingIn, logout } = useAuthStore.getState();
  // During sign-in the sign-in flow reports its own error
  if (!agent || isLoggingIn) return;
  void logout({ force: true });
  Alert.alert(msg(ERR.sessionTitle), msg(ERR.sessionEnded));
});
