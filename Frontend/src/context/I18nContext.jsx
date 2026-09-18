import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en';
import zh from '../i18n/zh';

const DICTS = { en, zh };
const LANGS = ['en', 'zh'];
const LOCALES = { en: 'en-US', zh: 'zh-CN' };

const getInitialLang = () => {
  try {
    const saved = localStorage.getItem('cq-lang');
    if (LANGS.includes(saved)) return saved;
  } catch { /* ignore */ }
  return 'en';
};

const lookup = (dict, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(getInitialLang);

  const t = useCallback((key, vars) => {
    let text = lookup(DICTS[lang], key);
    if (text === undefined) text = lookup(DICTS.en, key);
    if (text === undefined) {
      if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    // A placeholder with no value is left in place, so it shows up instead of
    // silently rendering a half-empty sentence.
    if (vars) text = text.replace(/\{(\w+)\}/g, (match, name) => {
      if (vars[name] === undefined || vars[name] === null) {
        if (import.meta.env.DEV) console.warn(`[i18n] no value for {${name}} in ${key}`);
        return match;
      }
      return vars[name];
    });
    return text;
  }, [lang]);

  // Like t(), but {name} placeholders can be React nodes (e.g. a highlighted <span>).
  const tr = useCallback((key, nodes = {}) => t(key).split(/(\{\w+\})/g).map((part, i) => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    if (name !== undefined && !(name in nodes) && import.meta.env.DEV) {
      console.warn(`[i18n] no node for {${name}} in ${key}`);
    }
    return <Fragment key={i}>{name !== undefined && name in nodes ? nodes[name] : part}</Fragment>;
  }), [t]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', LOCALES[lang]);
    document.title = t('meta.title');
    try { localStorage.setItem('cq-lang', lang); } catch { /* ignore */ }
  }, [lang, t]);

  const value = useMemo(() => ({
    lang,
    locale: LOCALES[lang],
    setLang,
    toggleLang: () => setLang((current) => (current === 'en' ? 'zh' : 'en')),
    t,
    tr,
  }), [lang, t, tr]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
