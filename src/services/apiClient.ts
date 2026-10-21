import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback when EXPO_PUBLIC_API_URL is not set: host PC LAN IP on port 3000 where sync-server runs
const FALLBACK_API_BASE_URL = 'http://192.168.1.47:3000/api/v1';

const cleanUrl = (url: string) => url.trim().replace(/\/+$/, '');

// Expo inlines EXPO_PUBLIC_* at bundle time; only static dot access is replaced (no destructuring)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const DEFAULT_API_BASE_URL = ENV_API_URL && ENV_API_URL.trim() ? cleanUrl(ENV_API_URL) : FALLBACK_API_BASE_URL;

const API_URL_KEY = '@mobi_r_api_url';
const SESSION_KEY = '@mobi_r_agent_session';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const setCustomApiUrl = async (url: string) => {
  const clean = cleanUrl(url);
  await AsyncStorage.setItem(API_URL_KEY, clean);
  apiClient.defaults.baseURL = clean;
};

export const getApiUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(API_URL_KEY);
    return saved ? cleanUrl(saved) : DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

// ---- Session token ----
// authStore keeps this in sync (sign-in, start-up, sign-out). `undefined` = not set yet,
// then the token is read from the saved session.
let authToken: string | null | undefined;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const readStoredToken = async (): Promise<string | null> => {
  try {
    const session = await AsyncStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session).token || null : null;
  } catch {
    return null;
  }
};

// ---- Session ended (401) ----
// authStore registers its sign-out here; keeps apiClient free of an import cycle with the store.
let onUnauthorized: ((message?: string) => void) | null = null;

export const setUnauthorizedHandler = (fn: ((message?: string) => void) | null) => {
  onUnauthorized = fn;
};

// Request interceptor: dynamic baseURL and the session token
apiClient.interceptors.request.use(async (config) => {
  try {
    const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
    if (savedUrl) {
      config.baseURL = cleanUrl(savedUrl);
    }
  } catch {
    // keep the default URL
  }

  const token = authToken === undefined ? await readStoredToken() : authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: any 401 (except the sign-in call itself) means the session ended
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    if (status === 401 && !/\/auth\/line$/.test(url) && onUnauthorized) {
      try {
        onUnauthorized(error.response?.data?.error);
      } catch {
        // sign-out must never break the caller's error handling
      }
    }
    return Promise.reject(error);
  }
);
