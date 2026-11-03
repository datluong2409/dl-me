import { AGENTS } from './agents'
import { idleOffset, startIdle } from './idle'

describe('idleOffset', () => {
  it('stays within the amplitude, is deterministic, and actually moves', () => {
    const seen = new Set<string>()
    for (let t = 0; t < 100_000; t += 997) {
      const a = idleOffset(t, 1.3, 60)
      expect(Math.abs(a.x)).toBeLessThanOrEqual(60)
      expect(Math.abs(a.y)).toBeLessThanOrEqual(60)
      expect(idleOffset(t, 1.3, 60)).toEqual(a)
      seen.add(`${a.x.toFixed(3)},${a.y.toFixed(3)}`)
    }
    expect(seen.size).toBeGreaterThan(50)
  })
})

describe('startIdle', () => {
  const bounds = { x: 0, y: 0, width: 500, height: 400 }
  let frames: FrameRequestCallback[]

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  function start(setPosition = vi.fn()) {
    const view = { setPosition: vi.fn(), setVisible: vi.fn(), showGhost: vi.fn(), setSelection: vi.fn() }
    const stop = startIdle({ agent: AGENTS[0], view, from: { x: 100, y: 100 }, bounds, rng: () => 0.5, setPosition })
    return { stop, setPosition }
  }

  it('moves the cursor every frame, starting from where it is, and keeps near the bounds', () => {
    const { setPosition } = start()
    frames.shift()!(0)
    expect(setPosition.mock.calls[0][0]).toEqual({ x: 100, y: 100 })
    for (let t = 16; t < 4000; t += 16) frames.shift()!(t)
    for (const [p] of setPosition.mock.calls) {
      expect(p.x).toBeGreaterThanOrEqual(bounds.x - 90)
      expect(p.x).toBeLessThanOrEqual(bounds.x + bounds.width + 90)
      expect(p.y).toBeGreaterThanOrEqual(bounds.y - 90)
      expect(p.y).toBeLessThanOrEqual(bounds.y + bounds.height + 90)
    }
  })

  it('stops moving and cancels the pending frame when stopped', () => {
    const { stop, setPosition } = start()
    frames.shift()!(0)
    expect(setPosition).toHaveBeenCalledTimes(1)
    stop()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    frames.shift()?.(16)
    expect(setPosition).toHaveBeenCalledTimes(1)
  })
})
