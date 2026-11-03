export type Lang = 'en' | 'vi'
export type Localized<T = string> = Record<Lang, T>

export const LANG_STORAGE_KEY = 'dl:lang'

const SUPPORTED: readonly Lang[] = ['en', 'vi']

function asLang(value: string | null | undefined): Lang | null {
  if (!value) return null
  const primary = value.toLowerCase().split('-')[0]
  return (SUPPORTED as readonly string[]).includes(primary) ? (primary as Lang) : null
}

export function detectLang(languages: readonly string[] | undefined): Lang {
  for (const candidate of languages ?? []) {
    const lang = asLang(candidate)
    if (lang) return lang
  }
  return 'en'
}

export function resolveLang(stored: string | null, languages: readonly string[] | undefined): Lang {
  return asLang(stored) ?? detectLang(languages)
}

export function readStoredLang(): string | null {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the choice just won't persist.
  }
}
