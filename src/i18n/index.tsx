import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import ar, { type TKey } from './ar';
import fr from './fr';
import type { Lang } from '../lib/types';

const dictionaries: Record<Lang, Record<TKey, string>> = { ar, fr };

interface I18nCtx {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: TKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('tayyib.lang');
    if (saved === 'ar' || saved === 'fr') return saved;
  } catch {
    /* تجاهل */
  }
  return 'ar';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem('tayyib.lang', lang);
    } catch {
      /* تجاهل */
    }
  }, [lang, dir]);

  const t = useCallback((key: TKey) => dictionaries[lang][key] ?? key, [lang]);
  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      dir,
      setLang: setLangState,
      toggle: () => setLangState((l) => (l === 'ar' ? 'fr' : 'ar')),
      t,
    }),
    [lang, dir, t],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside I18nProvider');
  return v;
}

export type { TKey };
