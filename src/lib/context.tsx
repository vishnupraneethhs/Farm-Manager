import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './i18n';

interface AppCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  online: boolean;
  role: 'owner' | 'manager' | null;
  setRole: (r: 'owner' | 'manager' | null) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('farm_lang') as Lang) || 'en';
  });
  const [role, setRoleState] = useState<'owner' | 'manager' | null>(() => {
    return (localStorage.getItem('farm_role') as 'owner' | 'manager' | null) || null;
  });
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('farm_lang', l);
  };

  const setRole = (r: 'owner' | 'manager' | null) => {
    setRoleState(r);
    if (r) localStorage.setItem('farm_role', r);
    else localStorage.removeItem('farm_role');
  };

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)[key] ?? key;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t, online, role, setRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
