import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { readStoredLang, resolveLang, writeStoredLang } from './lang'
import type { Lang, Localized } from './lang'
import { ui } from './messages'
import type { UiKey } from './messages'

interface LangValue {
  lang: Lang
  setLang(lang: Lang): void
  t(text: Localized): string
  tr(key: UiKey): string
}

const LangContext = createContext<LangValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    resolveLang(readStoredLang(), typeof navigator === 'undefined' ? undefined : navigator.languages),
  )

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = ui.title[lang]
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    writeStoredLang(next)
  }, [])

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (text) => text[lang],
      tr: (key) => ui[key][lang],
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangValue {
  const value = useContext(LangContext)
  if (!value) throw new Error('useLang must be used inside <LangProvider>')
  return value
}
