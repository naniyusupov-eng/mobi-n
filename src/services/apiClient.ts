import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default to host PC LAN IP on port 3000 where sync-server runs
export const DEFAULT_API_BASE_URL = 'http://192.168.1.47:3000/api/v1';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const setCustomApiUrl = async (url: string) => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem('@mobi_r_api_url', cleanUrl);
  apiClient.defaults.baseURL = cleanUrl;
};

export const getApiUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem('@mobi_r_api_url');
    return saved ? saved.trim().replace(/\/+$/, '') : DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

// Request interceptor to attach dynamic baseURL and JWT token
apiClient.interceptors.request.use(async (config) => {
  try {
    const savedUrl = await AsyncStorage.getItem('@mobi_r_api_url');
    if (savedUrl) {
      config.baseURL = savedUrl.trim().replace(/\/+$/, '');
    }
  } catch (e) {}

  const session = await AsyncStorage.getItem('@mobi_r_agent_session');
  if (session) {
    try {
      const agent = JSON.parse(session);
      if (agent.token) {
        config.headers.Authorization = `Bearer ${agent.token}`;
      }
    } catch (e) {}
  }
  return config;
});
