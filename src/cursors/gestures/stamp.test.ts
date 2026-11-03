import type { Tween } from '../animate'
import { fakeTween, makeCtx } from '../../test/gesture-helpers'
import { createStampGesture } from './stamp'

describe('stamp gesture', () => {
  it('hops to the element, then pops it into place from 85% size', async () => {
    const { ctx, el, rect, positions } = makeCtx()
    const scales: string[] = []
    const { tween } = fakeTween(undefined, () => {
      if (el.style.transform.startsWith('scale(')) scales.push(el.style.transform)
    })
    await createStampGesture(tween)(ctx)
    expect(scales[0]).toBe('scale(0.85)')
    expect(scales.at(-1)).toBe('scale(1)')
    expect(el.style.opacity).toBe('1')
    expect(positions.at(-1)).toEqual({ x: rect.x + 10, y: rect.y + 8 })
  })

  it('rests the cursor inside a very small element', async () => {
    const { ctx, positions } = makeCtx({ rect: { x: 50, y: 60, width: 12, height: 10 } })
    const { tween } = fakeTween()
    await createStampGesture(tween)(ctx)
    expect(positions.at(-1)).toEqual({ x: 56, y: 65 })
  })

  it('takes 220ms, scaled by the pace, and hops instead of flying when it is a child', async () => {
    const { ctx } = makeCtx()
    ctx.item.parentId = 'card'
    ctx.pace = 0.5
    const { tween, durations } = fakeTween()
    await createStampGesture(tween)(ctx)
    expect(durations[0]).toBeLessThan(520 * 0.5 + 1) // hop, not a 350-900ms flight
    expect(durations.at(-1)).toBe(110)
  })

  it('resolves without touching the element when aborted before it starts', async () => {
    const { ctx, el, controller } = makeCtx()
    controller.abort()
    const { tween } = fakeTween()
    await createStampGesture(tween)(ctx)
    expect(el.style.opacity).toBe('0')
  })

  it('works with any Tween implementation', async () => {
    const noop: Tween = async () => {}
    await expect(createStampGesture(noop)(makeCtx().ctx)).resolves.toBeUndefined()
  })
})
