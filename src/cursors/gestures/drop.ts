import type { Tween } from '../animate'
import { MOTION } from '../motion-tokens'
import { lerp } from '../path'
import type { GestureFn } from '../types'
import { durationForRect, travel } from './travel'

/** Picks the item up from its tray offset (--ax/--ay) and carries it home; one progress value drives both. */
export function createDropGesture(tween: Tween): GestureFn {
  return async (ctx) => {
    const { rect, agent, view, item, signal } = ctx
    const { el } = item
    const ax = parseFloat(el.style.getPropertyValue('--ax')) || 0
    const ay = parseFloat(el.style.getPropertyValue('--ay')) || 0
    const grip = { x: Math.min(12, rect.width / 2), y: Math.min(12, rect.height / 2) }
    const { startScale } = MOTION.drop

    const place = (progress: number) => {
      el.style.transform = `translate3d(${ax * (1 - progress)}px, ${ay * (1 - progress)}px, 0) scale(${lerp(startScale, 1, progress)})`
      ctx.setPosition({ x: rect.x + grip.x + ax * (1 - progress), y: rect.y + grip.y + ay * (1 - progress) })
    }

    try {
      // The item waits, still invisible, at its tray spot while the cursor flies over.
      el.style.transform = `translate3d(${ax}px, ${ay}px, 0) scale(${startScale})`
      await travel(ctx, tween, { x: rect.x + ax + grip.x, y: rect.y + ay + grip.y })
      if (signal.aborted) return

      el.style.opacity = '1'
      view.setSelection(el, agent)
      await tween({
        duration: durationForRect(rect, MOTION.drop),
        ease: MOTION.drop.ease,
        signal,
        onUpdate: place,
      })
    } finally {
      view.setSelection(el, null)
    }
  }
}
