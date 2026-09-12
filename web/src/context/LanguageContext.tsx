import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations, translations } from '../i18n/translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('mobir_web_lang') as Language;
    return saved && (saved === 'uz' || saved === 'ru' || saved === 'uz_cyrl') ? saved : 'uz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('mobir_web_lang', newLang);
  };

  const t = (key: keyof Translations): string => {
    const currentDict = translations[lang] || translations.uz;
    return currentDict[key] || translations.uz[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
