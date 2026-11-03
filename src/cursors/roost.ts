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

  const widthOf = (isLeft: boolean) => {
    const { from, to } = gutterOf(isLeft)
    return { from, available: to - fw - from }
  }
  const sides = [left, !left].map((isLeft) => ({ isLeft, ...widthOf(isLeft) })).filter((g) => g.available >= roost.minRoom)
  if (sides.length > 0) {
    const gutter = sides[0]
    // Both gutters usable: each side has its own evenly spaced column. Only one: everyone shares it, evenly spaced.
    const solo = sides.length === 1
    const rows = solo ? slot.count : sideCount
    const row = solo ? slot.index : Math.floor(slot.index / 2)
    const rowHeight = safe.height / Math.max(1, rows)
    const rowY = clamp(safe.y + rowHeight * (row + 0.5) + (rng() - 0.5) * rowHeight * 0.4, safe.y, safe.y + safe.height)
    const x = gutter.from + gutter.available * (0.15 + 0.7 * rng())
    return { home: { x, y: rowY }, room: Math.max(0, Math.min(gutter.available / 2, rowHeight / 2, roost.maxRoom)) }
  }

  // No gutter is wide enough: take the spot with the most clear space, leaning toward this slot's side and height.
  const maxX = viewport.x + viewport.width - fw - 8 // keep the name tag inside the window too
  const anchor = { x: left ? safe.x : maxX, y }
  let best: Point = { x: anchor.x, y }
  let bestScore = -Infinity
  for (let i = 0; i < roost.tries; i++) {
    const candidate = { x: safe.x + rng() * Math.max(0, maxX - safe.x), y: safe.y + rng() * safe.height }
    const score = Math.min(clearance(candidate, onScreen), 300) - 0.02 * Math.hypot(candidate.x - anchor.x, candidate.y - anchor.y)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return { home: best, room: Math.max(0, Math.min(clearance(best, onScreen), roost.maxRoom)) }
}
