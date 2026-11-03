import type { Point, Rect } from './types'

/**
 * The window's visible area in overlay coordinates, minus `topInset` px for a fixed bar at the top (the nav).
 * The overlay's origin is the page wrapper's top-left, and `origin` is where that wrapper sits in the window
 * (it goes negative as the page scrolls), so the window's top-left is the negation of it.
 */
export function viewportInOverlay(
  origin: { left: number; top: number },
  size: { width: number; height: number },
  topInset = 0,
): Rect {
  return { x: 0 - origin.left, y: 0 - origin.top + topInset, width: size.width, height: size.height - topInset }
}

/** A point in window coordinates (the mouse, a finger) in overlay coordinates. */
export function pointerInOverlay(p: Point, origin: { left: number; top: number }): Point {
  return { x: p.x - origin.left, y: p.y - origin.top }
}

/** Boxes of the page content for keeping resting cursors off the text: every assembled item, and the footer. */
export function contentRects(root: ParentNode, measure: (el: HTMLElement) => Rect): Rect[] {
  return [...root.querySelectorAll<HTMLElement>('main [data-assemble], footer')].map(measure)
}
