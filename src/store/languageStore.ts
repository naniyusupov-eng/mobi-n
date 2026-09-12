import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileLanguage, MobileTranslations, mobileTranslations } from '../i18n/mobileTranslations';

interface LanguageState {
  lang: MobileLanguage;
  setLang: (newLang: MobileLanguage) => Promise<void>;
  t: (key: keyof MobileTranslations) => string;
  loadStoredLanguage: () => Promise<void>;
}

const LANG_STORAGE_KEY = '@mobi_r_app_language';

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: 'uz',

  setLang: async (newLang: MobileLanguage) => {
    set({ lang: newLang });
    try {
      await AsyncStorage.setItem(LANG_STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language', e);
    }
  },

  t: (key: keyof MobileTranslations): string => {
    const currentLang = get().lang;
    const dictionary = mobileTranslations[currentLang] || mobileTranslations.uz;
    return dictionary[key] || mobileTranslations.uz[key] || String(key);
  },

  loadStoredLanguage: async () => {
    try {
      const savedLang = await AsyncStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'uz' || savedLang === 'ru' || savedLang === 'uz_cyrl') {
        set({ lang: savedLang });
      }
    } catch (e) {
      console.warn('Failed to load language', e);
    }
  },
}));
