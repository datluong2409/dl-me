import { useLang } from '../i18n/LangProvider'
import type { Lang } from '../i18n/lang'

const LANGS: Lang[] = ['en', 'vi']

export function LangToggle() {
  const { lang, setLang, tr } = useLang()
  return (
    <div
      role="group"
      aria-label={tr('lang.label')}
      className="inline-flex overflow-hidden rounded-full border border-border font-mono text-xs"
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`min-h-11 min-w-11 cursor-pointer px-3 font-medium transition-colors ${
            lang === code ? 'bg-fg text-bg' : 'text-fg-muted hover:text-fg'
          }`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
