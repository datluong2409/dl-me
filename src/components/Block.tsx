import { createElement, useId } from 'react'
import type { HTMLAttributes } from 'react'
import { ItemContext } from '../cursors/context'
import { useAssemble } from '../cursors/useAssemble'
import type { Gesture } from '../cursors/types'

type Tag =
  | 'div'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'li'
  | 'span'
  | 'article'
  | 'header'
  | 'footer'
  | 'a'
  | 'dt'
  | 'dd'

export interface BlockProps extends HTMLAttributes<HTMLElement> {
  as?: Tag
  gesture: Gesture
  /** Position among its siblings (its parent's other children, or the section's other top-level blocks). */
  order: number
  href?: string
  download?: boolean
}

/**
 * An element the cursors assemble. `group` lets descendants react to its `data-assemble` state, and a block
 * inside another block becomes its child: it is only started once the outer block's frame is done.
 */
export function Block({ as = 'div', gesture, order, className = '', children, ...rest }: BlockProps) {
  const id = useId()
  const ref = useAssemble<HTMLElement>({ gesture, order, id })
  return createElement(
    ItemContext.Provider,
    { value: id },
    createElement(as, { ref, className: `group ${className}`.trim(), ...rest }, children),
  )
}
