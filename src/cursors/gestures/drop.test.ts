import { AGENTS } from '../agents'
import { fakeTween, makeCtx } from '../../test/gesture-helpers'
import { createDropGesture } from './drop'

function setup() {
  const made = makeCtx()
  made.el.style.setProperty('--ax', '-80px')
  made.el.style.setProperty('--ay', '60px')
  return made
}

describe('drop gesture', () => {
  it('waits at the tray offset, picks the item up, and carries it home', async () => {
    const { ctx, el, view } = setup()
    const transforms: string[] = []
    const { tween } = fakeTween(() => transforms.push(el.style.transform))
    await createDropGesture(tween)(ctx)
    expect(transforms[0]).toBe('translate3d(-80px, 60px, 0) scale(0.96)')
    expect(el.style.transform).toBe('translate3d(0px, 0px, 0) scale(1)')
    expect(el.style.opacity).toBe('1')
    expect(view.setSelection).toHaveBeenCalledWith(el, AGENTS[0])
    expect(view.setSelection.mock.calls.at(-1)).toEqual([el, null])
  })

  it('keeps the cursor on the item: ends at the item top-left plus the grip', async () => {
    const { ctx, positions, rect } = setup()
    const { tween } = fakeTween()
    await createDropGesture(tween)(ctx)
    expect(positions.at(-1)).toEqual({ x: rect.x + 12, y: rect.y + 12 })
  })

  it('uses a drop duration between 550 and 800ms', async () => {
    const { ctx } = setup()
    const { tween, durations } = fakeTween()
    await createDropGesture(tween)(ctx)
    expect(durations.at(-1)).toBeGreaterThanOrEqual(550)
    expect(durations.at(-1)).toBeLessThanOrEqual(800)
  })

  it('releases the selection when aborted mid-way', async () => {
    const { ctx, el, view, controller } = setup()
    let calls = 0
    const { tween } = fakeTween(() => {
      if (++calls === 2) controller.abort()
    })
    await createDropGesture(tween)(ctx)
    expect(view.setSelection.mock.calls.at(-1)).toEqual([el, null])
  })
})
