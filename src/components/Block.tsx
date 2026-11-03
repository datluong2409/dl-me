import { createElement } from 'react'
import type { HTMLAttributes } from 'react'
import { useAssemble } from '../cursors/useAssemble'
import type { Gesture } from '../cursors/types'

type Tag = 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'li' | 'span' | 'article' | 'header' | 'footer'

interface BlockProps extends HTMLAttributes<HTMLElement> {
  as?: Tag
  gesture: Gesture
  order: number
}

/** An element the cursors assemble. `group` lets descendants react to its `data-assemble` state. */
export function Block({ as = 'div', gesture, order, className = '', children, ...rest }: BlockProps) {
  const ref = useAssemble<HTMLElement>({ gesture, order })
  return createElement(as, { ref, className: `group ${className}`.trim(), ...rest }, children)
}
