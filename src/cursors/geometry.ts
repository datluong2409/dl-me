import { MOTION } from './motion-tokens'
import type { Point, Rect } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Shrinks a rect by `margin` on every side; collapses to its centre line when the margin does not fit. */
export function insetRect(rect: Rect, margin: number): Rect {
  const mx = Math.min(margin, rect.width / 2)
  const my = Math.min(margin, rect.height / 2)
  return { x: rect.x + mx, y: rect.y + my, width: rect.width - 2 * mx, height: rect.height - 2 * my }
}

export function isInside(p: Point, rect: Rect): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height
}

export function clampToRect(p: Point, rect: Rect): Point {
  return { x: clamp(p.x, rect.x, rect.x + rect.width), y: clamp(p.y, rect.y, rect.y + rect.height) }
}

/** The straight distance between two rects: 0 when they overlap or touch. */
export function rectGap(a: Rect, b: Rect): number {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0)
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0)
  return Math.hypot(dx, dy)
}

/** The space a resting cursor takes up: the arrow, whose tip is `p`, and its name tag. */
export function footprintAt(p: Point): Rect {
  const { width, height } = MOTION.roost.footprint
  return { x: p.x - 2, y: p.y - 2, width, height }
}

/** How far a cursor at `p` is from the nearest piece of content (0 when it sits on top of some). */
export function clearance(p: Point, obstacles: readonly Rect[]): number {
  const box = footprintAt(p)
  let nearest = Infinity
  for (const obstacle of obstacles) nearest = Math.min(nearest, rectGap(box, obstacle))
  return nearest
}
