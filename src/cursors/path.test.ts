import { curvePoint, distance, makeBend, travelDuration } from './path'

describe('distance', () => {
  it('is the euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})

describe('travelDuration', () => {
  it('is 350ms plus 0.45ms per pixel, clamped to 350..900', () => {
    expect(travelDuration(0)).toBe(350)
    expect(travelDuration(100)).toBeCloseTo(395)
    expect(travelDuration(1000)).toBeCloseTo(800)
    expect(travelDuration(5000)).toBe(900)
  })
})

describe('makeBend', () => {
  it('is deterministic for a given rng: magnitude first, then sign', () => {
    expect(makeBend(() => 0)).toBeCloseTo(-0.08)
    expect(makeBend(() => 0.99)).toBeCloseTo(0.179)
  })
})

describe('curvePoint', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 100, y: 0 }

  it('starts at from and ends at to', () => {
    expect(curvePoint(a, b, 0, 0.1)).toEqual({ x: 0, y: 0 })
    const end = curvePoint(a, b, 1, 0.1)
    expect(end.x).toBeCloseTo(100)
    expect(end.y).toBeCloseTo(0)
  })

  it('is the midpoint when the bend is zero', () => {
    const mid = curvePoint(a, b, 0.5, 0)
    expect(mid.x).toBeCloseTo(50)
    expect(mid.y).toBeCloseTo(0)
  })

  it('deviates from the straight line by bend × distance / 2 at the middle', () => {
    const mid = curvePoint(a, b, 0.5, 0.1)
    expect(mid.x).toBeCloseTo(50)
    expect(mid.y).toBeCloseTo(5)
  })
})
