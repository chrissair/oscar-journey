import React, { createContext, useContext, useState, useCallback } from 'react';
import { en } from './en';
import { zh } from './zh';

const DICTS = { en, zh };
const LS_KEY = 'oscar_lang';

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
  } catch { /* SSR / storage blocked */ }
  return 'en';
}

function resolvePath(obj, key) {
  const parts = key.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return null;
  }
  return cur;
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] == null ? '' : String(params[k])));
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = useCallback((l) => {
    if (l !== 'en' && l !== 'zh') return;
    setLangState(l);
    try { localStorage.setItem(LS_KEY, l); } catch { /* noop */ }
    // Update <html lang> so screen readers / browsers know
    try { document.documentElement.lang = l === 'zh' ? 'zh-Hant' : 'en'; } catch { /* noop */ }
  }, []);

  // Keep <html lang> in sync on first render
  React.useEffect(() => {
    try { document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en'; } catch { /* noop */ }
  }, [lang]);

  const t = useCallback((key, params) => {
    const dict = DICTS[lang];
    const val = resolvePath(dict, key);
    if (typeof val === 'string') return interpolate(val, params);
    // Fallback to English so nothing renders as a raw key if a zh entry is missing
    const eng = resolvePath(DICTS.en, key);
    if (typeof eng === 'string') return interpolate(eng, params);
    return key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
