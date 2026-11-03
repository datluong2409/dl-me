import { motionTween } from './animate'

const ease = [0.22, 1, 0.36, 1] as const

describe('motionTween', () => {
  it('reports progress up to 1 and resolves when finished', async () => {
    const onUpdate = vi.fn()
    await motionTween({ duration: 40, ease, onUpdate, signal: new AbortController().signal })
    expect(onUpdate).toHaveBeenCalled()
    expect(onUpdate.mock.calls.at(-1)?.[0]).toBeCloseTo(1)
  })

  it('resolves early and stops reporting once aborted', async () => {
    const controller = new AbortController()
    const onUpdate = vi.fn()
    const done = motionTween({ duration: 2000, ease, onUpdate, signal: controller.signal })
    await new Promise((r) => setTimeout(r, 60))
    controller.abort()
    await done
    const calls = onUpdate.mock.calls.length
    await new Promise((r) => setTimeout(r, 60))
    expect(onUpdate.mock.calls.length).toBe(calls)
    expect(onUpdate.mock.calls.at(-1)?.[0] ?? 0).toBeLessThan(1)
  })

  it('resolves immediately when already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const onUpdate = vi.fn()
    await motionTween({ duration: 1000, ease, onUpdate, signal: controller.signal })
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
