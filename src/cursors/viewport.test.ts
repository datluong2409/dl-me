import { viewportInOverlay } from './viewport'

describe('viewportInOverlay', () => {
  it('places the visible window in overlay coordinates, which are relative to the page wrapper', () => {
    // The wrapper's top-left is 300px above and 20px right of the window's top-left: we have scrolled 300px down.
    expect(viewportInOverlay({ left: 20, top: -300 }, { width: 1000, height: 700 })).toEqual({
      x: -20,
      y: 300,
      width: 1000,
      height: 700,
    })
  })

  it('is the origin at the top of the page', () => {
    expect(viewportInOverlay({ left: 0, top: 0 }, { width: 375, height: 812 })).toEqual({
      x: 0,
      y: 0,
      width: 375,
      height: 812,
    })
  })
})
