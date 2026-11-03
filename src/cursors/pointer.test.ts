import { trackPointer } from './pointer'
import type { PointerTracker } from './pointer'

const at = (type: string, x: number, y: number) =>
  window.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y }))

function release(pointerType: string) {
  const event = new Event('pointerup')
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  window.dispatchEvent(event)
}

describe('trackPointer', () => {
  let tracker: PointerTracker

  beforeEach(() => {
    tracker = trackPointer()
  })
  afterEach(() => tracker.stop())

  it('has no position until the pointer moves', () => {
    expect(tracker.get()).toBeNull()
  })

  it('follows the pointer in viewport coordinates', () => {
    at('pointermove', 120, 340)
    expect(tracker.get()).toEqual({ x: 120, y: 340 })
    at('pointermove', 5, 6)
    expect(tracker.get()).toEqual({ x: 5, y: 6 })
  })

  it('also reacts to a touch landing without moving', () => {
    at('pointerdown', 40, 50)
    expect(tracker.get()).toEqual({ x: 40, y: 50 })
  })

  it('forgets the pointer when it leaves the page or the window loses focus', () => {
    at('pointermove', 10, 10)
    document.documentElement.dispatchEvent(new Event('pointerleave'))
    expect(tracker.get()).toBeNull()

    at('pointermove', 10, 10)
    window.dispatchEvent(new Event('blur'))
    expect(tracker.get()).toBeNull()
  })

  it('forgets a touch when the finger lifts, but keeps a mouse pointer on mouse button release', () => {
    at('pointermove', 30, 30)
    release('mouse')
    expect(tracker.get()).toEqual({ x: 30, y: 30 })
    release('touch')
    expect(tracker.get()).toBeNull()
  })

  it('stops listening after stop()', () => {
    tracker.stop()
    at('pointermove', 1, 1)
    expect(tracker.get()).toBeNull()
  })
})
