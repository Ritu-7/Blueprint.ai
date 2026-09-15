import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import appConfig from '@/config/appConfig.json';

const resources: Record<string, { translation: Record<string, string> }> = {};
const localization = (appConfig as Record<string, unknown>).localization as Record<string, Record<string, string>> | undefined;

if (localization) {
  Object.entries(localization).forEach(([lang, translations]) => {
    resources[lang] = { translation: translations };
  });
}

i18n.use(initReactI18next).init({
  resources,
  lng: appConfig.metadata.defaultLanguage || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
