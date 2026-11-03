import { clearance, clampToRect, insetRect, isInside } from './geometry'
import { MOTION } from './motion-tokens'
import { distance, lerp } from './path'
import { restingSpot } from './roost'
import type { RestingSpot } from './roost'
import type { IdleContext, Point, Rect } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Slow Lissajous-style wander around the origin; |x| and |y| never exceed the amplitude. */
export function idleOffset(t: number, phase: number, amplitude: number): Point {
  return {
    x: amplitude * Math.sin(t * 0.0007 + phase),
    y: amplitude * Math.sin(t * 0.0011 + phase * 1.7),
  }
}

// Directions tried, in order of preference, relative to "straight away from the pointer".
const DETOURS = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, (3 * Math.PI) / 4, (-3 * Math.PI) / 4, Math.PI]

/**
 * Where an idle cursor runs when the pointer comes close: at least `flee.distance` px from the pointer,
 * preferably straight away from it and, among those, where there is the most room around it (away from content).
 * If no direction gets far enough (a tiny viewport) it takes the farthest spot it can reach.
 */
export function fleeTarget(
  pointer: Point,
  from: Point,
  safe: Rect,
  rng: () => number,
  obstacles: readonly Rect[] = [],
): Point {
  const away =
    distance(from, pointer) < 1e-6 ? rng() * Math.PI * 2 : Math.atan2(from.y - pointer.y, from.x - pointer.x)
  const reach = MOTION.flee.distance + rng() * 80

  let best: Point | undefined
  let bestScore = -Infinity
  for (const detour of DETOURS) {
    const candidate = clampToRect(
      { x: pointer.x + Math.cos(away + detour) * reach, y: pointer.y + Math.sin(away + detour) * reach },
      safe,
    )
    const score = Math.min(distance(candidate, pointer), MOTION.flee.distance) * 1000 + Math.min(clearance(candidate, obstacles), 200)
    if (score > bestScore + 1e-9) {
      best = candidate
      bestScore = score
    }
  }
  return best as Point
}

const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height

/**
 * Keeps an idle agent alive on screen until stopped. It glides to a resting spot in the free space beside the
 * content (see roost.ts), drifts gently there, runs away when the pointer gets close, and finds a new spot if the
 * page has stopped scrolling and it is out of view or sitting on content. Returns the function that stops it.
 * Positions are in overlay (document) coordinates, so while the page scrolls the cursor scrolls with it.
 */
export function startIdle(ctx: IdleContext): () => void {
  const { rng } = ctx
  const { roam, flee, roost } = MOTION
  const amplitude = lerp(MOTION.idleAmplitude.min, MOTION.idleAmplitude.max, rng())
  const phase = rng() * Math.PI * 2

  let startedAt: number | undefined
  let home: Point = ctx.from
  let drift = 1 // how much of the orbit to use; shrinks where there is little room
  let glide: { from: Point; startedAt: number; duration: number } | null = null
  let lastFleeAt = -Infinity
  let lastCheckAt = -Infinity
  let lastViewport: Rect | undefined
  let stillSince = 0
  let frame = 0
  let stopped = false

  const settleAt = (spot: RestingSpot) => {
    home = spot.home
    drift = clamp((spot.room * roost.drift) / amplitude, 0, 1)
  }
  const findSpot = (viewport: Rect, obstacles: readonly Rect[]) =>
    restingSpot({ viewport, obstacles, slot: ctx.slot, rng })

  const tick = (time: number) => {
    if (stopped) return
    const viewport = ctx.viewport()

    if (startedAt === undefined) {
      startedAt = time
      settleAt(findSpot(viewport, ctx.obstacles()))
      glide = { from: ctx.from, startedAt: 0, duration: roam.glide }
    }
    const now = time - startedAt

    if (!lastViewport || !sameRect(lastViewport, viewport)) {
      lastViewport = viewport
      stillSince = now
    }

    const offset = idleOffset(now, phase, amplitude)
    const target = { x: home.x + offset.x * drift, y: home.y + offset.y * drift }
    let position = target
    if (glide) {
      const progress = clamp((now - glide.startedAt) / glide.duration, 0, 1)
      if (progress >= 1) {
        glide = null
      } else {
        const eased = 1 - (1 - progress) ** 3
        position = { x: lerp(glide.from.x, target.x, eased), y: lerp(glide.from.y, target.y, eased) }
      }
    }

    const pointer = ctx.pointer()
    if (pointer && now - lastFleeAt >= flee.cooldown && distance(pointer, position) < flee.radius) {
      const obstacles = ctx.obstacles()
      const to = fleeTarget(pointer, position, insetRect(viewport, roost.edge), rng, obstacles)
      settleAt({ home: to, room: Math.min(clearance(to, obstacles), roost.maxRoom) })
      glide = { from: position, startedAt: now, duration: flee.duration }
      lastFleeAt = now
    }

    if (!glide && now - stillSince >= roam.settleAfter) {
      if (!isInside(position, viewport)) {
        settleAt(findSpot(viewport, ctx.obstacles()))
        glide = { from: position, startedAt: now, duration: roam.glide }
        lastCheckAt = now
      } else if (now - lastCheckAt >= roost.recheck) {
        lastCheckAt = now
        const obstacles = ctx.obstacles()
        if (clearance(position, obstacles) <= 0) {
          const spot = findSpot(viewport, obstacles)
          if (spot.room >= roost.minRoom) {
            settleAt(spot)
            glide = { from: position, startedAt: now, duration: roam.glide }
          }
        }
      }
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
