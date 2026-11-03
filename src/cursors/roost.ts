import { clearance, insetRect } from './geometry'
import { MOTION } from './motion-tokens'
import type { Point, Rect, RestSlot } from './types'

export interface RestingSpot {
  home: Point
  /** Free space around the spot in px; an idle cursor only drifts inside a fraction of it. */
  room: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Where an idle cursor should rest. Even slots take the free space left of the content, odd slots the space on
 * its right, each side spread evenly from top to bottom. When a gutter is too narrow it tries the other side, and
 * if neither fits (a small screen) it picks the spot farthest from the content.
 */
export function restingSpot(options: {
  viewport: Rect
  obstacles: readonly Rect[]
  slot: RestSlot
  rng: () => number
}): RestingSpot {
  const { viewport, obstacles, slot, rng } = options
  const { roost } = MOTION
  const safe = insetRect(viewport, roost.edge)
  const onScreen = obstacles.filter(
    (o) =>
      o.width > 0 &&
      o.height > 0 &&
      o.y < viewport.y + viewport.height &&
      o.y + o.height > viewport.y &&
      o.x < viewport.x + viewport.width &&
      o.x + o.width > viewport.x,
  )

  const left = slot.index % 2 === 0
  const sideCount = Math.max(1, left ? Math.ceil(slot.count / 2) : Math.floor(slot.count / 2))
  const band = safe.height / sideCount
  const y = clamp(safe.y + band * (Math.floor(slot.index / 2) + 0.5) + (rng() - 0.5) * band * 0.4, safe.y, safe.y + safe.height)

  const contentLeft = onScreen.length ? Math.min(...onScreen.map((o) => o.x)) : undefined
  const contentRight = onScreen.length ? Math.max(...onScreen.map((o) => o.x + o.width)) : undefined
  const fw = roost.footprint.width
  const gutterOf = (isLeft: boolean) =>
    isLeft
      ? { from: safe.x, to: contentLeft === undefined ? safe.x + safe.width * 0.25 : contentLeft - roost.gap }
      : {
          from: contentRight === undefined ? safe.x + safe.width * 0.75 : contentRight + roost.gap,
          to: viewport.x + viewport.width - 8,
        }

  for (const isLeft of [left, !left]) {
    const { from, to } = gutterOf(isLeft)
    const available = to - fw - from
    if (available < roost.minRoom) continue
    const x = from + available * (0.15 + 0.7 * rng())
    return { home: { x, y }, room: Math.max(0, Math.min(available / 2, band / 2, roost.maxRoom)) }
  }

  // No gutter is wide enough: take the spot with the most clear space, leaning toward this slot's side and height.
  const anchor = { x: left ? safe.x : safe.x + safe.width, y }
  let best: Point = { x: anchor.x, y }
  let bestScore = -Infinity
  for (let i = 0; i < roost.tries; i++) {
    const candidate = { x: safe.x + rng() * safe.width, y: safe.y + rng() * safe.height }
    const score = Math.min(clearance(candidate, onScreen), 300) - 0.02 * Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return { home: best, room: Math.max(0, Math.min(clearance(best, onScreen), roost.maxRoom)) }
}
