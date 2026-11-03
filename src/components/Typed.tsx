import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Block } from './Block'
import type { BlockProps } from './Block'

interface TypedProps extends Omit<BlockProps, 'gesture' | 'children'> {
  text: string
  /** Rendered after the words (an icon, say) and not typed. */
  trailing?: ReactNode
}

/**
 * Text the cursors type word by word. Every word is its own inline-block span so it can be revealed on its
 * own; the spans are separated by plain spaces, so the text reads, copies and is announced as usual.
 */
export function Typed({ as = 'p', text, trailing, ...rest }: TypedProps) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <Block as={as} gesture="type" {...rest}>
      {words.map((word, index) => (
        <Fragment key={index}>
          {index > 0 ? ' ' : null}
          <span data-word="" className="inline-block">
            {word}
          </span>
        </Fragment>
      ))}
      {trailing}
    </Block>
  )
}
