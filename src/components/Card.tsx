import type { HTMLAttributes } from 'react'
import { Block } from './Block'

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Position in the section's assembly sequence (cards are drawn, not dropped). */
  order: number
  as?: 'div' | 'article' | 'li'
}

export function Card({ order, as = 'div', className = '', children, ...rest }: CardProps) {
  return (
    <Block as={as} gesture="draw" order={order} className={`rounded-xl border border-border bg-surface p-6 ${className}`} {...rest}>
      {children}
    </Block>
  )
}
