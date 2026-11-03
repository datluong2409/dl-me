import { AGENTS } from './agents'
import { createCursorView } from './cursor-view'

function setup() {
  const root = document.createElement('div')
  document.body.append(root)
  const view = createCursorView(root, AGENTS)
  return { root, view }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createCursorView', () => {
  it('creates one cursor per agent with its name, hidden at first', () => {
    const { root } = setup()
    const cursors = root.querySelectorAll('[data-cursor]')
    expect(cursors).toHaveLength(6)
    expect(root.querySelector('[data-cursor="mai"]')).toHaveTextContent('Mai')
    expect(root.querySelector('[data-cursor="mai"]')).toHaveAttribute('data-visible', 'false')
  })

  it('setPosition moves the cursor with a transform', () => {
    const { root, view } = setup()
    view.setPosition('kai', 10, 20)
    expect((root.querySelector('[data-cursor="kai"]') as HTMLElement).style.transform).toBe('translate3d(10px, 20px, 0)')
  })

  it('setVisible toggles data-visible', () => {
    const { root, view } = setup()
    view.setVisible('mai', true)
    expect(root.querySelector('[data-cursor="mai"]')).toHaveAttribute('data-visible', 'true')
    view.setVisible('mai', false)
    expect(root.querySelector('[data-cursor="mai"]')).toHaveAttribute('data-visible', 'false')
  })

  it('showGhost sizes and shows the ghost box, and null hides it', () => {
    const { root, view } = setup()
    view.showGhost('linh', { x: 5, y: 6, width: 70, height: 80 })
    const ghost = root.querySelector('[data-ghost="linh"]') as HTMLElement
    expect(ghost).toHaveAttribute('data-visible', 'true')
    expect([ghost.style.left, ghost.style.top, ghost.style.width, ghost.style.height]).toEqual(['5px', '6px', '70px', '80px'])
    view.showGhost('linh', null)
    expect(ghost).toHaveAttribute('data-visible', 'false')
  })

  it('setSelection outlines an element in the agent colour and clears it with null', () => {
    const { view } = setup()
    const el = document.createElement('div')
    view.setSelection(el, AGENTS[0])
    expect(el.style.outline).not.toBe('')
    expect(el.style.outlineOffset).toBe('2px')
    view.setSelection(el, null)
    expect(el.style.outline).toBe('')
    expect(el.style.outlineOffset).toBe('')
  })

  it('styles with Tailwind classes only', () => {
    const { root } = setup()
    const cursor = root.querySelector('[data-cursor="mai"]') as HTMLElement
    expect(cursor.className).toContain('absolute')
    expect(cursor.className).toContain('will-change-transform')
  })

  it('destroy removes everything it added', () => {
    const { root, view } = setup()
    view.destroy()
    expect(root.childElementCount).toBe(0)
  })
})
