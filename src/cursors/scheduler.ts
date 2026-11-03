import { MOTION } from './motion-tokens'
import type { ItemStatus, Point } from './types'

/** Top and bottom edges in viewport coordinates. */
export interface Box {
  top: number
  bottom: number
}

export type SectionAction = 'trigger' | 'skip' | 'wait'

export function isTriggered(box: Box, viewportHeight: number, threshold: number = MOTION.triggerThreshold): boolean {
  const height = box.bottom - box.top
  const visible = Math.min(box.bottom, viewportHeight) - Math.max(box.top, 0)
  if (height <= 0 || visible <= 0) return false
  return visible >= threshold * Math.min(height, viewportHeight)
}

export function sectionAction(box: Box, viewportHeight: number): SectionAction {
  if (box.bottom <= 0) return 'skip'
  return isTriggered(box, viewportHeight) ? 'trigger' : 'wait'
}

export function isEligible(box: Box, viewportHeight: number): boolean {
  return box.bottom > -MOTION.eligibleMargin && box.top < viewportHeight + MOTION.eligibleMargin
}

export function nextItem<T extends { order: number; status: ItemStatus }>(
  items: readonly T[],
  eligible: (item: T) => boolean,
  orderOf: (item: T) => number = (item) => item.order,
): T | undefined {
  let best: T | undefined
  for (const item of items) {
    if (item.status !== 'pending' || !eligible(item)) continue
    if (!best || orderOf(item) < orderOf(best)) best = item
  }
  return best
}

const mod = (n: number, m: number) => ((n % m) + m) % m

/** Where a "drop" item starts relative to its final spot: 8 directions in rotation, 60-140px away. */
export function dropOffset(order: number): Point {
  const angle = mod(order, 8) * (Math.PI / 4)
  const { offsetMin, offsetMax } = MOTION.drop
  const length = offsetMin + (mod(order, 5) / 4) * (offsetMax - offsetMin)
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length }
}
