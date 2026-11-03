import type { Tween } from '../animate'
import { MOTION } from '../motion-tokens'
import { paced } from '../path'
import type { GestureFn } from '../types'
import { travel } from './travel'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Types a text block: the element becomes visible with every word hidden, the cursor flies to the first
 * word, then words fade in one after another while the cursor rides the newest one (across line breaks too).
 * Text without word spans just fades in. Whatever stops the gesture, the director restores the words.
 */
export function createTypeGesture(tween: Tween): GestureFn {
  return async (ctx) => {
    const { rect, item, signal } = ctx
    const { el } = item
    const words = [...el.querySelectorAll<HTMLElement>('[data-word]')]

    if (words.length === 0) {
      await travel(ctx, tween, { x: rect.x, y: rect.y })
      if (signal.aborted) return
      await tween({
        duration: paced(MOTION.fadeIn, ctx.pace),
        ease: MOTION.draw.ease,
        signal,
        onUpdate: (progress) => {
          el.style.opacity = String(progress)
        },
      })
      return
    }

    const { lift, perWord, min, max, ease } = MOTION.type
    for (const word of words) {
      word.style.opacity = '0'
      word.style.transform = `translateY(${lift}px)`
    }
    el.style.opacity = '1'

    const first = ctx.measure(words[0])
    await travel(ctx, tween, { x: first.x, y: first.y })
    if (signal.aborted) return

    await tween({
      duration: paced(clamp(words.length * perWord, min, max), ctx.pace),
      ease,
      signal,
      onUpdate: (progress) => {
        const typed = progress * words.length
        words.forEach((word, i) => {
          const shown = clamp(typed - i, 0, 1)
          word.style.opacity = String(shown)
          word.style.transform = `translateY(${lift * (1 - shown)}px)`
        })
        const index = Math.min(words.length - 1, Math.floor(typed))
        const box = ctx.measure(words[index])
        const along = typed >= words.length ? 1 : typed - index
        ctx.setPosition({ x: box.x + box.width * along, y: box.y + (box.height * 3) / 5 })
      },
    })
  }
}
