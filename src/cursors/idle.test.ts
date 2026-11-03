import { AGENTS } from './agents'
import { clearance, isInside } from './geometry'
import { fleeTarget, idleOffset, startIdle } from './idle'
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

  it('prefers a destination that is clear of content over one that lands on it', () => {
    const pointer = { x: 500, y: 400 }
    const content: Rect[] = [{ x: 700, y: 300, width: 200, height: 200 }] // exactly where "straight away" would land
    const target = fleeTarget(pointer, { x: 540, y: 400 }, safe, () => 0, content)
    expect(distance(target, pointer)).toBeGreaterThanOrEqual(280)
    expect(clearance(target, content)).toBeGreaterThan(30)
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

  function start(options: { from?: Point; rng?: () => number; slot?: { index: number; count: number } } = {}) {
    const state = {
      vp: { x: 0, y: 0, width: 1000, height: 700 } as Rect,
      pointer: null as Point | null,
      obstacles: [] as Rect[],
    }
    const positions: Point[] = []
    const stop = startIdle({
      agent: AGENTS[0],
      view,
      from: options.from ?? { x: 500, y: 350 },
      rng: options.rng ?? seeded(11),
      slot: options.slot ?? { index: 0, count: 2 },
      setPosition: (p) => {
        positions.push(p)
      },
      viewport: () => state.vp,
      pointer: () => state.pointer,
      obstacles: () => state.obstacles,
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

  it('glides to a resting spot, then drifts gently and stays on screen', () => {
    const { run, positions } = start()
    run(0, 5000)
    for (const p of positions) {
      expect(p.x).toBeGreaterThanOrEqual(-90)
      expect(p.x).toBeLessThanOrEqual(1090)
      expect(p.y).toBeGreaterThanOrEqual(-90)
      expect(p.y).toBeLessThanOrEqual(790)
    }
    const afterGlide = positions.slice(Math.ceil(700 / 16))
    const steps = afterGlide.slice(1).map((p, i) => distance(p, afterGlide[i]))
    expect(Math.max(...steps)).toBeLessThan(12)
  })

  describe('beside a centred column of content', () => {
    const vp: Rect = { x: 0, y: 64, width: 1800, height: 836 }
    const column: Rect[] = [{ x: 380, y: 100, width: 1040, height: 760 }]

    it('rests in the left gutter for an even slot and the right gutter for an odd one, clear of the content', () => {
      for (const [index, side] of [
        [0, 'left'],
        [1, 'right'],
        [2, 'left'],
        [3, 'right'],
      ] as const) {
        const { run, state, positions } = start({ from: { x: 900, y: 450 }, slot: { index, count: 6 } })
        state.vp = vp
        state.obstacles = column
        run(0, 4000)
        const settled = positions.slice(Math.ceil(800 / 16))
        for (const p of settled) {
          expect(clearance(p, column), `slot ${index}`).toBeGreaterThan(0)
          if (side === 'left') expect(p.x).toBeLessThan(380)
          else expect(p.x).toBeGreaterThan(1420)
        }
      }
    })

    it('moves off content that ends up under it, once the page is still', () => {
      const { run, state, positions } = start({ from: { x: 120, y: 300 }, slot: { index: 0, count: 6 } })
      state.vp = vp
      state.obstacles = column
      run(0, 1500)
      const rested = positions.at(-1)!
      // A wide banner appears right over the resting cursor.
      state.obstacles = [...column, { x: 0, y: rested.y - 60, width: 1800, height: 120 }]
      expect(clearance(rested, state.obstacles)).toBe(0)
      run(1516, 3600)
      expect(clearance(positions.at(-1)!, state.obstacles)).toBeGreaterThan(0)
    })
  })

  it('runs away when the pointer comes close, and ends up well clear of it', () => {
    const { run, state, positions } = start()
    run(0, 1000)
    state.pointer = { x: positions.at(-1)!.x + 10, y: positions.at(-1)!.y }
    const pointerSpot = { ...state.pointer }
    run(1016, 3000)
    const end = positions.at(-1)!
    expect(distance(end, pointerSpot)).toBeGreaterThanOrEqual(280 - 90)
    expect(isInside(end, { x: -20, y: -20, width: 1040, height: 740 })).toBe(true)
  })

  it('ignores a pointer that is far away or absent', () => {
    const { run, state, positions } = start()
    state.pointer = { x: 950, y: 680 }
    run(0, 3000)
    const afterGlide = positions.slice(Math.ceil(700 / 16))
    const steps = afterGlide.slice(1).map((p, i) => distance(p, afterGlide[i]))
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
    run(0, 1000)
    const before = positions.at(-1)!
    // scroll down 3000px over 320ms
    run(1016, 1320, (t) => {
      state.vp = { x: 0, y: ((t - 1000) / 320) * 3000, width: 1000, height: 700 }
    })
    state.vp = { x: 0, y: 3000, width: 1000, height: 700 }
    const during = positions.at(-1)!
    expect(Math.abs(during.y - before.y)).toBeLessThan(120)
    expect(isInside(during, state.vp)).toBe(false)
    run(1336, 2800)
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
