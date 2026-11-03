import { fakeTween, makeCtx } from '../../test/gesture-helpers'
import { distance, hopDuration, travelDuration } from '../path'
import { createDrawGesture } from './draw'

describe('draw gesture', () => {
  it('travels to the top-left corner, then drags to the bottom-right corner', async () => {
    const { tween } = fakeTween()
    const { ctx, positions, rect } = makeCtx()
    await createDrawGesture(tween)(ctx)
    expect(positions.some((p) => Math.abs(p.x - rect.x) < 1e-6 && Math.abs(p.y - rect.y) < 1e-6)).toBe(true)
    expect(positions.at(-1)).toEqual({ x: rect.x + rect.width, y: rect.y + rect.height })
  })

  it('grows a ghost box up to the full rect and clears it at the end', async () => {
    const { tween } = fakeTween()
    const { ctx, view, rect } = makeCtx()
    await createDrawGesture(tween)(ctx)
    const boxes = view.showGhost.mock.calls.filter((c) => c[1]).map((c) => c[1])
    expect(boxes.length).toBeGreaterThan(1)
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].width).toBeGreaterThanOrEqual(boxes[i - 1].width)
    expect(boxes.at(-1)).toEqual(rect)
    expect(view.showGhost.mock.calls.at(-1)).toEqual(['mai', null])
  })

  it('fades the real element in and uses the spec durations', async () => {
    const { tween, durations } = fakeTween()
    const { ctx, el } = makeCtx()
    await createDrawGesture(tween)(ctx)
    expect(el.style.opacity).toBe('1')
    expect(durations[0]).toBeCloseTo(travelDuration(distance({ x: 0, y: 0 }, { x: 200, y: 100 })))
    expect(durations[1]).toBeGreaterThanOrEqual(500)
    expect(durations[1]).toBeLessThanOrEqual(700)
    expect(durations[2]).toBe(180)
  })

  it('resolves and clears the ghost when aborted before it starts', async () => {
    const { tween } = fakeTween()
    const { ctx, el, view, controller } = makeCtx()
    controller.abort()
    await createDrawGesture(tween)(ctx)
    expect(view.showGhost.mock.calls.at(-1)).toEqual(['mai', null])
    expect(el.style.opacity).toBe('0')
  })

  it('as a child it hops instead of flying, and every step is scaled by the pace', async () => {
    const { ctx } = makeCtx()
    ctx.item.parentId = 'card'
    ctx.pace = 0.5
    const { tween, durations } = fakeTween()
    await createDrawGesture(tween)(ctx)
    expect(durations[0]).toBeCloseTo(hopDuration(distance({ x: 0, y: 0 }, { x: 200, y: 100 })) * 0.5)
    expect(durations[1]).toBeGreaterThanOrEqual(250)
    expect(durations[1]).toBeLessThanOrEqual(350)
    expect(durations[2]).toBe(90)
  })
})
