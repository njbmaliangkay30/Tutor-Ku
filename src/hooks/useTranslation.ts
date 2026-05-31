import { useAppContext } from '../AppContext';
import { t, Language } from '../lib/i18n';

export function useTranslation() {
  const { language, setLanguage } = useAppContext();
  
  const translate = (key: string) => {
    return t(key, language as Language);
  };
  
  return { t: translate, language, setLanguage };
}
