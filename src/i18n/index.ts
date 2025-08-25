import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert } from 'react-native';

// Import translation files
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ar from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = 'app.language';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'tr', 'es', 'fr', 'de', 'it', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language options for UI
export const LANGUAGE_OPTIONS = [
  { code: 'system', label: 'System default', nativeLabel: 'System default' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'tr', label: 'Türkçe', nativeLabel: 'Türkçe' },
  { code: 'es', label: 'Español', nativeLabel: 'Español' },
  { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  { code: 'de', label: 'Deutsch', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italiano', nativeLabel: 'Italiano' },
  { code: 'ar', label: 'العربية', nativeLabel: 'العربية', rtl: true },
] as const;

// Get device language with fallback support (e.g., 'es-MX' → 'es')
const getDeviceLanguage = (): SupportedLanguage => {
  try {
    const locales = Localization.getLocales();
    
    // Try multiple locales in order of preference
    for (const locale of locales) {
      const languageCode = locale?.languageCode?.toLowerCase();
      if (!languageCode) continue;
      
      // Try exact match first
      if (SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage)) {
        return languageCode as SupportedLanguage;
      }
      
      // Try base language (e.g., 'es-MX' → 'es')
      const baseLanguage = (languageCode && typeof languageCode === 'string') ? languageCode.split('-')[0] : 'en';
      if (SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)) {
        return baseLanguage as SupportedLanguage;
      }
    }
  } catch (error) {
    console.warn('Failed to get device language:', error);
  }
  
  // Fallback to English
  return 'en';
};

// Check if language is RTL
const isRTLLanguage = (language: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
};

// Handle RTL layout changes
const handleRTLChange = async (language: SupportedLanguage): Promise<void> => {
  const isRTL = isRTLLanguage(language);
  const currentRTL = I18nManager.isRTL;
  
  if (isRTL !== currentRTL) {
    try {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
      
      if (isRTL) {
        // Show one-time toast for RTL languages
        Alert.alert(
          'Right-to-Left Layout',
          'To fully apply RTL layout, please restart the app.',
          [{ text: 'Restart Later', style: 'default' }]
        );
      }
    } catch (error) {
      console.warn('RTL layout change failed:', error);
    }
  }
};

// Initialize i18next
const initI18n = async (): Promise<void> => {
  try {
    // Get stored language preference
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    // Determine language to use
    let languageToUse: SupportedLanguage;
    if (storedLanguage && storedLanguage !== 'system') {
      languageToUse = storedLanguage as SupportedLanguage;
    } else {
      languageToUse = getDeviceLanguage();
    }

    // Handle RTL for initial language
    await handleRTLChange(languageToUse);

    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: { common: en },
          tr: { common: tr },
          es: { common: es },
          fr: { common: fr },
          de: { common: de },
          it: { common: it },
          ar: { common: ar },
        },
        lng: languageToUse,
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES,
        defaultNS: 'common',
        interpolation: {
          escapeValue: false, // React already escapes values
        },
        react: {
          useSuspense: false, // Disable suspense for React Native
        },
      });
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Initialize with default settings if storage fails
    await i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: { common: en },
          tr: { common: tr },
          es: { common: es },
          fr: { common: fr },
          de: { common: de },
          it: { common: it },
          ar: { common: ar },
        },
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: SUPPORTED_LANGUAGES,
        defaultNS: 'common',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  }
};

// Set language and persist choice
const setLanguage = async (language: SupportedLanguage | 'system'): Promise<void> => {
  try {
    let targetLanguage: SupportedLanguage;
    
    if (language === 'system') {
      // Remove stored preference to use system default
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
      targetLanguage = getDeviceLanguage();
    } else {
      // Store language preference
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      targetLanguage = language;
    }
    
    // Handle RTL changes
    await handleRTLChange(targetLanguage);
    
    // Change language
    await i18n.changeLanguage(targetLanguage);
  } catch (error) {
    console.error('Failed to set language:', error);
    // Fallback to just changing language without persistence
    if (language !== 'system') {
      await i18n.changeLanguage(language);
    }
  }
};

// Get current stored language preference
const getStoredLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get stored language:', error);
    return null;
  }
};

export { i18n, initI18n, setLanguage, getStoredLanguage, getDeviceLanguage, isRTLLanguage };
export default i18n;
