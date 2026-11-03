import { AGENTS } from './agents'
import { fleeTarget, idleOffset, insetRect, isInside, randomHome, startIdle } from './idle'
import { distance } from './path'
import type { Point, Rect } from './types'

/** Small deterministic generator so tests do not depend on Math.random. */
function seeded(seed = 7) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

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

describe('insetRect and isInside', () => {
  const rect: Rect = { x: 10, y: 20, width: 300, height: 200 }

  it('shrinks a rect by the margin on every side', () => {
    expect(insetRect(rect, 80)).toEqual({ x: 90, y: 100, width: 140, height: 40 })
  })

  it('collapses to the centre line when the margin is bigger than the rect', () => {
    expect(insetRect({ x: 0, y: 0, width: 100, height: 100 }, 80)).toEqual({ x: 50, y: 50, width: 0, height: 0 })
  })

  it('tells whether a point is inside a rect, edges included', () => {
    expect(isInside({ x: 10, y: 20 }, rect)).toBe(true)
    expect(isInside({ x: 310, y: 220 }, rect)).toBe(true)
    expect(isInside({ x: 311, y: 100 }, rect)).toBe(false)
    expect(isInside({ x: 100, y: 19 }, rect)).toBe(false)
  })
})

describe('randomHome', () => {
  const safe: Rect = { x: 100, y: 200, width: 400, height: 300 }

  it('picks a point across the whole safe area', () => {
    expect(randomHome(safe, () => 0)).toEqual({ x: 100, y: 200 })
    const far = randomHome(safe, () => 0.999)
    expect(far.x).toBeCloseTo(499.6)
    expect(far.y).toBeCloseTo(499.7)
  })
})

describe('fleeTarget', () => {
  const safe: Rect = { x: 80, y: 80, width: 840, height: 640 }

  it('runs away on the side of the pointer the cursor is already on, at least 280px off', () => {
    const target = fleeTarget({ x: 500, y: 400 }, { x: 540, y: 400 }, safe, () => 0)
    expect(target.x).toBeGreaterThan(500)
    expect(distance(target, { x: 500, y: 400 })).toBeGreaterThanOrEqual(280)
    expect(isInside(target, safe)).toBe(true)
  })

  it('does not get cornered against a wall: it still ends up 280px away', () => {
    const pointer = { x: 850, y: 400 }
    const target = fleeTarget(pointer, { x: 880, y: 400 }, safe, () => 0)
    expect(distance(target, pointer)).toBeGreaterThanOrEqual(280)
    expect(isInside(target, safe)).toBe(true)
  })

  it('stays inside the safe area and far enough away for any pointer position', () => {
    const rng = seeded(3)
    for (let i = 0; i < 200; i++) {
      const pointer = { x: 80 + rng() * 840, y: 80 + rng() * 640 }
      const from = { x: pointer.x + (rng() - 0.5) * 200, y: pointer.y + (rng() - 0.5) * 200 }
      const target = fleeTarget(pointer, from, safe, rng)
      expect(isInside(target, safe)).toBe(true)
      expect(distance(target, pointer)).toBeGreaterThanOrEqual(280 - 1e-6)
    }
  })

  it('copes with the pointer sitting exactly on the cursor', () => {
    const target = fleeTarget({ x: 300, y: 300 }, { x: 300, y: 300 }, safe, seeded(5))
    expect(Number.isFinite(target.x) && Number.isFinite(target.y)).toBe(true)
    expect(isInside(target, safe)).toBe(true)
  })

  it('takes the farthest reachable spot when the viewport is too small to get 280px away', () => {
    const tiny: Rect = { x: 0, y: 0, width: 200, height: 200 }
    const pointer = { x: 20, y: 20 }
    const target = fleeTarget(pointer, { x: 40, y: 40 }, tiny, () => 0)
    expect(isInside(target, tiny)).toBe(true)
    expect(distance(target, pointer)).toBeGreaterThan(200)
  })
})

describe('startIdle', () => {
  const view = { setPosition: vi.fn(), setVisible: vi.fn(), showGhost: vi.fn(), setSelection: vi.fn() }
  let frames: FrameRequestCallback[]

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  function start(options: { from?: Point; rng?: () => number } = {}) {
    const state = { vp: { x: 0, y: 0, width: 1000, height: 700 } as Rect, pointer: null as Point | null }
    const positions: Point[] = []
    const stop = startIdle({
      agent: AGENTS[0],
      view,
      from: options.from ?? { x: 500, y: 350 },
      rng: options.rng ?? seeded(11),
      setPosition: (p) => {
        positions.push(p)
      },
      viewport: () => state.vp,
      pointer: () => state.pointer,
    })
    /** Runs frames at 16ms steps; `each` can change the world just before each frame. */
    const run = (fromT: number, toT: number, each?: (t: number) => void) => {
      for (let t = fromT; t <= toT; t += 16) {
        each?.(t)
        frames.shift()!(t)
      }
    }
    return { state, positions, stop, run }
  }

  it('starts exactly where the agent is', () => {
    const { run, positions } = start()
    run(0, 0)
    expect(positions[0]).toEqual({ x: 500, y: 350 })
  })

  it('drifts gently and stays on screen when nothing disturbs it', () => {
    const { run, positions } = start()
    run(0, 5000)
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(-90)
      expect(p.x).toBeLessThanOrEqual(1090)
      expect(p.y).toBeGreaterThanOrEqual(-90)
      expect(p.y).toBeLessThanOrEqual(790)
    }
    const steps = positions.slice(1).map((p, i) => distance(p, positions[i]))
    expect(Math.max(...steps)).toBeLessThan(12)
  })

  it('runs away when the pointer comes close, and ends up well clear of it', () => {
    const { run, state, positions } = start()
    run(0, 400)
    state.pointer = { x: positions.at(-1)!.x + 10, y: positions.at(-1)!.y }
    const pointerSpot = { ...state.pointer }
    run(416, 2000)
    const end = positions.at(-1)!
    expect(distance(end, pointerSpot)).toBeGreaterThanOrEqual(280 - 90)
    expect(isInside(end, state.vp)).toBe(true)
  })

  it('ignores a pointer that is far away or absent', () => {
    const { run, state, positions } = start()
    state.pointer = { x: 950, y: 680 }
    run(0, 3000)
    const steps = positions.slice(1).map((p, i) => distance(p, positions[i]))
    expect(Math.max(...steps)).toBeLessThan(12)
  })

  it('does not dodge again before the 400ms cooldown, then dodges again if the pointer keeps chasing', () => {
    let calls = 0
    const counting = seeded(13)
    const { run, state, positions } = start({
      rng: () => {
        calls++
        return counting()
      },
    })
    run(0, 160)
    const chase = () => {
      const last = positions.at(-1)!
      state.pointer = { x: last.x + 5, y: last.y }
    }
    chase()
    run(176, 176)
    const afterFirstFlee = calls
    run(192, 560, chase)
    expect(calls).toBe(afterFirstFlee)
    run(576, 640, chase)
    expect(calls).toBeGreaterThan(afterFirstFlee)
  })

  it('stays put in the document while the page scrolls, then glides back into view once the viewport settles', () => {
    const { run, state, positions } = start()
    run(0, 800)
    const before = positions.at(-1)!
    // scroll down 3000px over 320ms
    run(816, 1120, (t) => {
      state.vp = { x: 0, y: ((t - 800) / 320) * 3000, width: 1000, height: 700 }
    })
    state.vp = { x: 0, y: 3000, width: 1000, height: 700 }
    const during = positions.at(-1)!
    expect(Math.abs(during.y - before.y)).toBeLessThan(120)
    expect(isInside(during, state.vp)).toBe(false)
    run(1136, 2600)
    expect(isInside(positions.at(-1)!, state.vp)).toBe(true)
  })

  it('stops moving and cancels the pending frame when stopped', () => {
    const { run, stop, positions } = start()
    run(0, 0)
    expect(positions).toHaveLength(1)
    stop()
    expect(cancelAnimationFrame).toHaveBeenCalled()
    frames.shift()?.(16)
    expect(positions).toHaveLength(1)
  })
})
