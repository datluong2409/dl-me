import type { Tween } from '../animate'
import { MOTION } from '../motion-tokens'
import { lerp, paced } from '../path'
import type { GestureFn } from '../types'
import { travel } from './travel'

/** Hops to a small element (a chip, badge, icon or button) and pops it into place. */
export function createStampGesture(tween: Tween): GestureFn {
  return async (ctx) => {
    const { rect, item, signal } = ctx
    const { el } = item
    const grip = { x: Math.min(10, rect.width / 2), y: Math.min(8, rect.height / 2) }

    await travel(ctx, tween, { x: rect.x + grip.x, y: rect.y + grip.y })
    if (signal.aborted) return

    await tween({
      duration: paced(MOTION.stamp.duration, ctx.pace),
      ease: MOTION.stamp.ease,
      signal,
      onUpdate: (progress) => {
        el.style.opacity = String(Math.min(1, progress * 2))
        el.style.transform = `scale(${lerp(MOTION.stamp.startScale, 1, progress)})`
      },
    })
  }
}
