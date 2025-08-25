import { useTranslation } from 'react-i18next';
import { i18n, setLanguage as setI18nLanguage, SupportedLanguage, isRTLLanguage } from '../i18n';

export interface UseI18nReturn {
  t: (key: string, options?: any) => string;
  i18n: typeof i18n;
  language: string;
  setLanguage: (language: SupportedLanguage | 'system') => Promise<void>;
  isRTL: boolean;
}

export const useI18n = (): UseI18nReturn => {
  const { t, i18n: i18nInstance } = useTranslation();
  
  const currentLanguage = i18nInstance.language;
  const isRTL = isRTLLanguage(currentLanguage);

  const setLanguage = async (language: SupportedLanguage | 'system') => {
    await setI18nLanguage(language);
  };

  return {
    t,
    i18n: i18nInstance,
    language: currentLanguage,
    setLanguage,
    isRTL,
  };
};

export default useI18n;
