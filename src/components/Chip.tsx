import type { ReactNode } from 'react'
import { Block } from './Block'

/** A tag the cursors stamp into place once the card or row it sits in has been drawn. */
export function Chip({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <Block
      as="span"
      gesture="stamp"
      order={index + 1}
      className="inline-flex items-center rounded-full border border-border bg-bg px-3 py-1 font-mono text-xs text-fg"
    >
      {children}
    </Block>
  )
}
