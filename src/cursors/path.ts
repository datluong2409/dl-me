import { MOTION } from './motion-tokens'
import type { Point } from './types'

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function travelDuration(distanceInPx: number): number {
  const { base, perPx, min, max } = MOTION.travel
  return Math.min(max, Math.max(min, base + perPx * distanceInPx))
}

/** Signed bend as a fraction of the travel distance: magnitude first, then sign (negative when rng < 0.5). */
export function makeBend(rng: () => number): number {
  const { min, max } = MOTION.bend
  const magnitude = min + rng() * (max - min)
  return rng() < 0.5 ? -magnitude : magnitude
}

/** Quadratic Bézier whose control point sits off the midpoint by `bend × distance`, perpendicular to the line. */
export function curvePoint(from: Point, to: Point, t: number, bend: number): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const d = Math.hypot(dx, dy)
  const control = {
    x: (from.x + to.x) / 2 + (d === 0 ? 0 : (-dy / d) * bend * d),
    y: (from.y + to.y) / 2 + (d === 0 ? 0 : (dx / d) * bend * d),
  }
  const u = 1 - t
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  }
}
