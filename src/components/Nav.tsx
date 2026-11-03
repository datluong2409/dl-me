import { useEffect, useRef, useState } from 'react'
import { List, X } from '@phosphor-icons/react'
import { SECTION_IDS } from '../content/sections'
import { profile } from '../content/profile'
import { useLang } from '../i18n/LangProvider'
import { LangToggle } from './LangToggle'
import { PresenceBar } from './PresenceBar'

const LINKS = SECTION_IDS.filter((id) => id !== 'hero')
const PAGE_LINKS = LINKS.filter((id) => id !== 'contact')

export function Nav() {
  const { tr } = useLang()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border bg-bg motion-safe:animate-fade-in">
        <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#hero" className="inline-flex min-h-11 items-center font-mono text-sm font-medium text-fg no-underline">
            {profile.name}
          </a>

          <nav aria-label={tr('nav.label')} className="hidden items-center gap-6 md:flex">
            {PAGE_LINKS.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex min-h-11 items-center text-sm text-fg-muted transition-colors hover:text-fg"
              >
                {tr(`nav.${id}`)}
              </a>
            ))}
            <a
              href="#contact"
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-bg"
            >
              {tr('nav.contact')}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <PresenceBar />
            <LangToggle />
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? tr('menu.close') : tr('menu.open')}
              onClick={() => setOpen((value) => !value)}
              className="inline-grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-full border border-border text-fg md:hidden"
            >
              {open ? <X aria-hidden="true" size={20} weight="bold" /> : <List aria-hidden="true" size={20} weight="bold" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 z-[60] border-b border-border bg-bg p-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-lg px-3 text-fg hover:bg-surface"
                >
                  {tr(`nav.${id}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
