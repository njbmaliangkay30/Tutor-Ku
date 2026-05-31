import { useAppContext } from '../AppContext';
import { t, Language } from '../lib/i18n';

export function useTranslation() {
  const { language, setLanguage } = useAppContext();
  
  const translate = (key: string) => {
    return t(key, language as Language);
  };

  const getLocalizedValue = (value: string) => {
    if (!value) return "";
    const parts = value.split("|").map(p => p.trim());
    if (parts.length > 1) {
      return language === "en" ? parts[1] : parts[0];
    }
    return parts[0];
  };
  
  return { t: translate, language, setLanguage, getLocalizedValue };
}
