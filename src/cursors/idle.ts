import { MOTION } from './motion-tokens'
import { lerp } from './path'
import type { IdleContext, Point } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Slow Lissajous-style wander around the origin; |x| and |y| never exceed the amplitude. */
export function idleOffset(t: number, phase: number, amplitude: number): Point {
  return {
    x: amplitude * Math.sin(t * 0.0007 + phase),
    y: amplitude * Math.sin(t * 0.0011 + phase * 1.7),
  }
}

/** Lets an idle agent drift near where it last worked. Returns the function that stops it. */
export function startIdle(ctx: IdleContext): () => void {
  const { from, bounds } = ctx
  const amplitude = lerp(MOTION.idleAmplitude.min, MOTION.idleAmplitude.max, ctx.rng())
  const phase = ctx.rng() * Math.PI * 2
  const center = {
    x: clamp(from.x, bounds.x, bounds.x + bounds.width),
    y: clamp(from.y, bounds.y, bounds.y + bounds.height),
  }

  let start: number | undefined
  let frame = 0
  let stopped = false

  const tick = (time: number) => {
    if (stopped) return
    start ??= time
    const elapsed = time - start
    const offset = idleOffset(elapsed, phase, amplitude)
    const settle = 1 - (1 - Math.min(1, elapsed / 800)) ** 3 // ease out from the current spot into the orbit
    ctx.setPosition({
      x: from.x + (center.x + offset.x - from.x) * settle,
      y: from.y + (center.y + offset.y - from.y) * settle,
    })
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return () => {
    stopped = true
    cancelAnimationFrame(frame)
  }
}
