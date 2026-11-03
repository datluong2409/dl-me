import { AGENTS } from './agents'
import { clearance, isInside } from './geometry'
import { restingSpot } from './roost'
import type { Rect } from './types'

/** Small deterministic generator so tests do not depend on Math.random. */
function seeded(seed = 3) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

const wide: Rect = { x: 0, y: 64, width: 1800, height: 836 }
const content: Rect[] = [{ x: 380, y: 100, width: 1040, height: 760 }] // a centred column with 380px gutters
const spots = (viewport: Rect, obstacles: Rect[], count = 6) =>
  Array.from({ length: count }, (_, index) => restingSpot({ viewport, obstacles, slot: { index, count }, rng: seeded(index + 5) }))

describe('restingSpot with roomy gutters', () => {
  it('sends even slots to the left gutter and odd slots to the right one', () => {
    const all = spots(wide, content)
    all.forEach((spot, index) => {
      if (index % 2 === 0) expect(spot.home.x + 72, `slot ${index}`).toBeLessThanOrEqual(380 - 16)
      else expect(spot.home.x, `slot ${index}`).toBeGreaterThanOrEqual(1420 + 16)
    })
  })

  it('spreads each side evenly from top to bottom', () => {
    const all = spots(wide, content)
    const left = [all[0], all[2], all[4]].map((s) => s.home.y)
    const right = [all[1], all[3], all[5]].map((s) => s.home.y)
    for (const column of [left, right]) {
      expect(column[0]).toBeLessThan(column[1])
      expect(column[1]).toBeLessThan(column[2])
      expect(column[2] - column[0]).toBeGreaterThan(300)
    }
  })

  it('keeps every spot inside the viewport and clear of the content', () => {
    for (const spot of spots(wide, content)) {
      expect(isInside(spot.home, wide)).toBe(true)
      expect(clearance(spot.home, content)).toBeGreaterThanOrEqual(16 - 1e-6)
      expect(spot.room).toBeGreaterThan(0)
    }
  })

  it('works for the three cursors of a phone-sized team too', () => {
    const three = spots(wide, content, 3)
    expect(three.map((s) => s.home.x < 700)).toEqual([true, false, true])
  })

  it('is deterministic for a given random source', () => {
    expect(spots(wide, content)).toEqual(spots(wide, content))
  })
})

describe('restingSpot when there is little or no free space', () => {
  it('avoids the content when the gutters are too narrow, using the free band below it', () => {
    const viewport: Rect = { x: 0, y: 64, width: 1280, height: 736 }
    const column: Rect[] = [{ x: 112, y: 100, width: 1056, height: 520 }] // gutters of only 112px each, a free band below
    for (const spot of spots(viewport, column)) {
      expect(isInside(spot.home, viewport)).toBe(true)
      expect(clearance(spot.home, column)).toBeGreaterThan(0)
    }
  })

  it('still returns a sensible spot when content covers the whole screen (a phone)', () => {
    const viewport: Rect = { x: 0, y: 64, width: 375, height: 748 }
    const full: Rect[] = [{ x: 16, y: 80, width: 343, height: 1400 }]
    for (const spot of spots(viewport, full, 3)) {
      expect(isInside(spot.home, viewport)).toBe(true)
      expect(Number.isFinite(spot.room)).toBe(true)
      expect(spot.room).toBeGreaterThanOrEqual(0)
    }
  })

  it('with nothing on screen, rests toward the left and right edges', () => {
    const [left, right] = spots(wide, [], 2)
    expect(left.home.x).toBeLessThan(wide.width * 0.3)
    expect(right.home.x).toBeGreaterThan(wide.width * 0.7)
  })

  it('ignores content that is not on screen', () => {
    const offScreen: Rect[] = [{ x: 0, y: 5000, width: 1800, height: 400 }]
    const [left] = spots(wide, offScreen, 2)
    expect(left.home.x).toBeLessThan(wide.width * 0.3)
  })

  it('handles a single cursor and an odd team size', () => {
    expect(spots(wide, content, 1)).toHaveLength(1)
    expect(spots(wide, content, 5)).toHaveLength(5)
    expect(AGENTS.length).toBe(6)
  })
})
