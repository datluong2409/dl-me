import type { Rect } from '../types'
import { fakeTween, makeCtx } from '../../test/gesture-helpers'
import { createTypeGesture } from './type'

function typedElement(words: string[]) {
  const made = makeCtx()
  const spans = words.map((w, i) => {
    const span = document.createElement('span')
    span.dataset.word = ''
    span.textContent = w
    made.el.append(span, i < words.length - 1 ? ' ' : '')
    return span
  })
  // Each word sits 60px to the right of the previous one.
  const rectOf = (el: HTMLElement): Rect => {
    const i = spans.indexOf(el as HTMLSpanElement)
    return i < 0 ? made.rect : { x: 100 + i * 60, y: 50, width: 50, height: 20 }
  }
  made.ctx.measure = rectOf
  return { ...made, spans }
}

describe('type gesture', () => {
  it('shows the element, hides every word, then reveals them one after another', async () => {
    const { ctx, el, spans } = typedElement(['one', 'two', 'three', 'four', 'five'])
    const frames: Record<number, string[]> = {}
    const { tween } = fakeTween(undefined, (p) => {
      if (spans[0].style.opacity !== '') frames[p] = spans.map((s) => s.style.opacity)
    })
    await createTypeGesture(tween)(ctx)
    expect(el.style.opacity).toBe('1')
    // 5 words at progress 0.5 = 2.5 words typed: two done, the third half-way, two still hidden.
    expect(frames[0.5]).toEqual(['1', '1', '0.5', '0', '0'])
    expect(spans.map((s) => s.style.opacity)).toEqual(['1', '1', '1', '1', '1'])
    expect(spans.map((s) => s.style.transform)).toEqual(Array(5).fill('translateY(0px)'))
  })

  it('flies to the first word, then rides the newest word to the end of the last one', async () => {
    const { ctx, positions } = typedElement(['one', 'two', 'three', 'four', 'five'])
    const { tween } = fakeTween()
    await createTypeGesture(tween)(ctx)
    expect(positions.some((p) => Math.abs(p.x - 100) < 1e-6 && Math.abs(p.y - 50) < 1e-6)).toBe(true)
    expect(positions.some((p) => p.x > 220 && p.x < 270)).toBe(true) // inside the third word mid-way
    expect(positions.at(-1)).toEqual({ x: 390, y: 62 })
  })

  it('takes 70ms a word, between 250ms and 1100ms, scaled by the pace', async () => {
    const run = async (count: number, pace = 1) => {
      const { ctx } = typedElement(Array.from({ length: count }, (_, i) => `w${i}`))
      ctx.pace = pace
      const { tween, durations } = fakeTween()
      await createTypeGesture(tween)(ctx)
      return durations.at(-1)
    }
    expect(await run(5)).toBe(350)
    expect(await run(2)).toBe(250)
    expect(await run(40)).toBe(1100)
    expect(await run(5, 0.4)).toBe(140)
  })

  it('falls back to fading the element in when it has no word spans', async () => {
    const { ctx, el } = makeCtx()
    const { tween } = fakeTween()
    await createTypeGesture(tween)(ctx)
    expect(el.style.opacity).toBe('1')
  })

  it('resolves when aborted part-way and leaves the director to tidy the words', async () => {
    const { ctx, controller, spans } = typedElement(['a', 'b', 'c'])
    let calls = 0
    const { tween } = fakeTween(() => {
      if (++calls === 2) controller.abort()
    })
    await expect(createTypeGesture(tween)(ctx)).resolves.toBeUndefined()
    expect(spans.length).toBe(3)
  })
})
