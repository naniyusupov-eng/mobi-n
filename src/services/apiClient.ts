import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NestJS Cloudflare API Base URL (default placeholder, can be overridden in settings or env)
export const DEFAULT_API_BASE_URL = 'https://api.mobir-trade.com/api/v1';

export const apiClient = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(async (config) => {
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
