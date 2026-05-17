import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

const resources = {
  'en-US': { translation: en },
  'pt-BR': { translation: pt },
  'de-DE': { translation: de },
  'fr-FR': { translation: fr },
  'es-ES': { translation: es },
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
    // Enable pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
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
