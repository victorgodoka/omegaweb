import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import pt from './locales/pt.json';

const resources = {
  'en-US': { translation: en },
  'pt-BR': { translation: pt },
};

// Initialize synchronously to prevent production build issues
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;

// Initialize i18n synchronously
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang || 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Force synchronous initialization
    initImmediate: false,
  });

// Save language to localStorage on change
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
  }
});

export default i18n;
