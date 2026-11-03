import type { CSSProperties, ReactNode } from 'react'

/** A tag that pops in, staggered by `index`, once the card or row it sits in has been assembled. */
export function Chip({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <span
      style={{ '--i': index } as CSSProperties}
      className="inline-flex items-center rounded-full border border-border bg-bg px-3 py-1 font-mono text-xs text-fg motion-safe:group-data-[assemble=done]:animate-chip-in [animation-delay:calc(var(--i,0)*40ms)]"
    >
      {children}
    </span>
  )
}
