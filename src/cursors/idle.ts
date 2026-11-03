import { MOTION } from './motion-tokens'
import { distance, lerp } from './path'
import type { IdleContext, Point, Rect } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Slow Lissajous-style wander around the origin; |x| and |y| never exceed the amplitude. */
export function idleOffset(t: number, phase: number, amplitude: number): Point {
  return {
    x: amplitude * Math.sin(t * 0.0007 + phase),
    y: amplitude * Math.sin(t * 0.0011 + phase * 1.7),
  }
}

/** Shrinks a rect by `margin` on every side; collapses to its centre line when the margin does not fit. */
export function insetRect(rect: Rect, margin: number): Rect {
  const mx = Math.min(margin, rect.width / 2)
  const my = Math.min(margin, rect.height / 2)
  return { x: rect.x + mx, y: rect.y + my, width: rect.width - 2 * mx, height: rect.height - 2 * my }
}

export function isInside(p: Point, rect: Rect): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height
}

const clampToRect = (p: Point, rect: Rect): Point => ({
  x: clamp(p.x, rect.x, rect.x + rect.width),
  y: clamp(p.y, rect.y, rect.y + rect.height),
})

export function randomHome(safe: Rect, rng: () => number): Point {
  return { x: safe.x + rng() * safe.width, y: safe.y + rng() * safe.height }
}

// Directions tried, in order of preference, relative to "straight away from the pointer".
const DETOURS = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, Math.PI]

/**
 * Where an idle cursor runs when the pointer comes close: at least `flee.distance` px from the pointer,
 * preferably straight away from it. If a wall is in the way it takes a detour, and if no direction gets far
 * enough (a tiny viewport) it takes the farthest spot it can reach.
 */
export function fleeTarget(pointer: Point, from: Point, safe: Rect, rng: () => number): Point {
  const away =
    distance(from, pointer) < 1e-6 ? rng() * Math.PI * 2 : Math.atan2(from.y - pointer.y, from.x - pointer.x)
  const reach = MOTION.flee.distance + rng() * 80

  let best: Point | undefined
  let bestDistance = -1
  for (const detour of DETOURS) {
    const candidate = clampToRect(
      { x: pointer.x + Math.cos(away + detour) * reach, y: pointer.y + Math.sin(away + detour) * reach },
      safe,
    )
    const d = distance(candidate, pointer)
    if (d > bestDistance + 1e-9) {
      best = candidate
      bestDistance = d
    }
  }
  return best as Point
}

const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Keeps an idle agent alive on screen until stopped: it drifts around a "home" spot, runs away when the pointer
 * gets close, and glides back into view once the page has stopped scrolling. Returns the function that stops it.
 * Positions are in overlay (document) coordinates, so while the page scrolls the cursor scrolls with it.
 */
export function startIdle(ctx: IdleContext): () => void {
  const { rng } = ctx
  const { roam, flee } = MOTION
  const amplitude = lerp(MOTION.idleAmplitude.min, MOTION.idleAmplitude.max, rng())
  const phase = rng() * Math.PI * 2

  let startedAt: number | undefined
  let home: Point = ctx.from
  let glide: { from: Point; startedAt: number; duration: number } | null = null
  let lastFleeAt = -Infinity
  let lastViewport: Rect | undefined
  let stillSince = 0
  let frame = 0
  let stopped = false

  const tick = (time: number) => {
    if (stopped) return
    const viewport = ctx.viewport()
    const safe = insetRect(viewport, roam.margin)

    if (startedAt === undefined) {
      startedAt = time
      home = isInside(ctx.from, viewport) ? clampToRect(ctx.from, safe) : randomHome(safe, rng)
      glide = { from: ctx.from, startedAt: 0, duration: roam.glide }
    }
    const now = time - startedAt

    if (!lastViewport || !sameRect(lastViewport, viewport)) {
      lastViewport = viewport
      stillSince = now
    }

    const offset = idleOffset(now, phase, amplitude)
    const target = { x: home.x + offset.x, y: home.y + offset.y }
    let position = target
    if (glide) {
      const progress = clamp((now - glide.startedAt) / glide.duration, 0, 1)
      if (progress >= 1) {
        glide = null
      } else {
        const eased = 1 - (1 - progress) ** 3
        position = {
          x: lerp(glide.from.x, target.x, eased),
          y: lerp(glide.from.y, target.y, eased),
        }
      }
    }

    const pointer = ctx.pointer()
    if (pointer && now - lastFleeAt >= flee.cooldown) {
      const inOverlay = { x: pointer.x + viewport.x, y: pointer.y + viewport.y }
      if (distance(inOverlay, position) < flee.radius) {
        home = fleeTarget(inOverlay, position, safe, rng)
        glide = { from: position, startedAt: now, duration: flee.duration }
        lastFleeAt = now
      }
    }

    if (!glide && now - stillSince >= roam.settleAfter && !isInside(position, viewport)) {
      home = randomHome(safe, rng)
      glide = { from: position, startedAt: now, duration: roam.glide }
    }

    ctx.setPosition(position)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
  }
}
