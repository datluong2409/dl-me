import type { Tween } from '../animate'
import { MOTION } from '../motion-tokens'
import { curvePoint, distance, hopDuration, lerp, makeBend, paced, travelDuration } from '../path'
import type { GestureContext, Point, Rect } from '../types'

/** Flies the agent's cursor along a gentle curve from where it is to `to` (children hop, and everything follows the pace). */
export async function travel(ctx: GestureContext, tween: Tween, to: Point): Promise<void> {
  const from = ctx.from
  const bend = makeBend(ctx.rng)
  await tween({
    duration: paced(
      ctx.item.parentId ? hopDuration(distance(from, to)) : travelDuration(distance(from, to)),
      ctx.pace,
    ),
    ease: MOTION.travel.ease,
    signal: ctx.signal,
    onUpdate: (progress) => ctx.setPosition(curvePoint(from, to, progress, bend)),
  })
}

/** Bigger items take longer to draw or drop: interpolates between min and max by area. */
export function durationForRect(rect: Rect, range: { min: number; max: number }): number {
  const share = Math.min(1, (rect.width * rect.height) / (1000 * 600))
  return lerp(range.min, range.max, share)
}
