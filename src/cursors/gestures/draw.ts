import type { Tween } from '../animate'
import { MOTION } from '../motion-tokens'
import { paced } from '../path'
import type { GestureFn } from '../types'
import { durationForRect, travel } from './travel'

/** Drags out a selection box from the item's top-left corner, then reveals the real item in it. */
export function createDrawGesture(tween: Tween): GestureFn {
  return async (ctx) => {
    const { rect, agent, view, item, signal } = ctx
    try {
      await travel(ctx, tween, { x: rect.x, y: rect.y })
      if (signal.aborted) return

      await tween({
        duration: paced(durationForRect(rect, MOTION.draw), ctx.pace),
        ease: MOTION.draw.ease,
        signal,
        onUpdate: (progress) => {
          view.showGhost(agent.id, { x: rect.x, y: rect.y, width: rect.width * progress, height: rect.height * progress })
          ctx.setPosition({ x: rect.x + rect.width * progress, y: rect.y + rect.height * progress })
        },
      })
      if (signal.aborted) return

      // The ghost fades out (CSS transition) while the real item fades in underneath.
      view.showGhost(agent.id, null)
      await tween({
        duration: paced(MOTION.fadeIn, ctx.pace),
        ease: MOTION.draw.ease,
        signal,
        onUpdate: (progress) => {
          item.el.style.opacity = String(progress)
        },
      })
    } finally {
      view.showGhost(agent.id, null)
    }
  }
}
