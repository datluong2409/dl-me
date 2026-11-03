import type { Rect } from './types'

/**
 * The visible window in overlay coordinates. The overlay's origin is the page wrapper's top-left, and
 * `origin` is where that wrapper sits in the window (it goes negative as the page scrolls), so the window's
 * top-left is the negation of it.
 */
export function viewportInOverlay(origin: { left: number; top: number }, size: { width: number; height: number }): Rect {
  return { x: 0 - origin.left, y: 0 - origin.top, width: size.width, height: size.height }
}
