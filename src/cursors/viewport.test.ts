import { contentRects, pointerInOverlay, viewportInOverlay } from './viewport'

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

  it('can leave out a bar at the top (the fixed nav) so cursors do not rest under it', () => {
    expect(viewportInOverlay({ left: 0, top: -300 }, { width: 1000, height: 700 }, 64)).toEqual({
      x: 0,
      y: 364,
      width: 1000,
      height: 636,
    })
  })
})

describe('pointerInOverlay', () => {
  it('converts a pointer in window coordinates to overlay coordinates', () => {
    expect(pointerInOverlay({ x: 100, y: 200 }, { left: 20, top: -300 })).toEqual({ x: 80, y: 500 })
  })
})

describe('contentRects', () => {
  it('measures the assembled items inside <main> and the footer, but not the nav', () => {
    document.body.innerHTML = `
      <header data-assemble="done" id="nav"></header>
      <main><div data-assemble="done" id="a"><span data-assemble="pending" id="b"></span></div><div id="plain"></div></main>
      <footer id="foot"></footer>`
    const seen: string[] = []
    const rects = contentRects(document, (el) => {
      seen.push(el.id)
      return { x: seen.length, y: 0, width: 10, height: 10 }
    })
    expect(seen.sort()).toEqual(['a', 'b', 'foot'])
    expect(rects).toHaveLength(3)
    document.body.innerHTML = ''
  })
})
