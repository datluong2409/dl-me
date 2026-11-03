import { clearance, clampToRect, footprintAt, insetRect, isInside, rectGap } from './geometry'

describe('insetRect and isInside', () => {
  const rect = { x: 10, y: 20, width: 300, height: 200 }

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

describe('clampToRect', () => {
  it('pulls a point into a rect', () => {
    expect(clampToRect({ x: -5, y: 500 }, { x: 0, y: 0, width: 100, height: 100 })).toEqual({ x: 0, y: 100 })
  })
})

describe('rectGap', () => {
  const a = { x: 0, y: 0, width: 100, height: 50 }

  it('is 0 when rects overlap or touch', () => {
    expect(rectGap(a, { x: 50, y: 20, width: 100, height: 100 })).toBe(0)
    expect(rectGap(a, { x: 100, y: 0, width: 10, height: 10 })).toBe(0)
  })

  it('is the straight distance across a horizontal or vertical gap', () => {
    expect(rectGap(a, { x: 130, y: 10, width: 10, height: 10 })).toBe(30)
    expect(rectGap(a, { x: 10, y: 80, width: 10, height: 10 })).toBe(30)
  })

  it('is the diagonal distance across a corner', () => {
    expect(rectGap(a, { x: 130, y: 90, width: 10, height: 10 })).toBe(50) // 30 right, 40 down
  })
})

describe('footprintAt and clearance', () => {
  it('footprint is the arrow plus its name tag, anchored at the arrow tip', () => {
    expect(footprintAt({ x: 100, y: 200 })).toEqual({ x: 98, y: 198, width: 72, height: 36 })
  })

  it('clearance is the gap from the cursor footprint to the nearest obstacle', () => {
    const obstacles = [
      { x: 400, y: 0, width: 100, height: 1000 },
      { x: 0, y: 600, width: 1000, height: 50 },
    ]
    // footprint spans x 98..170, y 198..234: nearest is the left edge of the first obstacle (400 - 170 = 230)
    expect(clearance({ x: 100, y: 200 }, obstacles)).toBe(230)
  })

  it('is 0 over content and infinite when there is none', () => {
    expect(clearance({ x: 420, y: 100 }, [{ x: 400, y: 0, width: 100, height: 1000 }])).toBe(0)
    expect(clearance({ x: 0, y: 0 }, [])).toBe(Infinity)
  })
})
