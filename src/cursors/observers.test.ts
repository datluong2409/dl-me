import { attachViewportObservers, evaluateViewport } from './observers'
import type { ObservedDirector } from './observers'
import type { Item } from './types'

const el = (top: number, bottom: number) =>
  ({ getBoundingClientRect: () => ({ top, bottom, left: 0, right: 0, width: 0, height: bottom - top }) }) as HTMLElement

function fake(
  sections: { id: string; top: number; bottom: number; status?: 'pending' | 'running' | 'done' }[],
  items: { id: string; top: number; bottom: number; status?: Item['status'] }[] = [],
) {
  const calls: string[] = []
  const director: ObservedDirector = {
    snapshot: () => ({
      sections: sections.map((s) => ({ id: s.id, el: el(s.top, s.bottom), status: s.status ?? 'pending' })),
      items: items.map((i) => ({
        id: i.id,
        sectionId: 's',
        el: el(i.top, i.bottom),
        gesture: 'drop',
        order: 1,
        status: i.status ?? 'pending',
      })),
    }),
    setItemEligible: (id, eligible) => void calls.push(`eligible:${id}:${eligible}`),
    triggerSection: (id) => void calls.push(`trigger:${id}`),
    completeSectionInstantly: (id) => void calls.push(`complete:${id}`),
  }
  return { director, calls }
}

describe('evaluateViewport', () => {
  it('completes a pending section that is entirely above the viewport', () => {
    const { director, calls } = fake([{ id: 'above', top: -500, bottom: -10 }])
    evaluateViewport(director, 900)
    expect(calls).toEqual(['complete:above'])
  })

  it('waits while too little of a section is visible', () => {
    const { director, calls } = fake([{ id: 'low', top: 880, bottom: 1500 }])
    evaluateViewport(director, 900)
    expect(calls).toEqual([])
  })

  it('triggers only the last of several qualifying sections and completes the earlier ones', () => {
    const { director, calls } = fake([
      { id: 'a', top: 0, bottom: 500 },
      { id: 'b', top: 500, bottom: 1000 },
    ])
    evaluateViewport(director, 900)
    expect(calls).toEqual(['complete:a', 'trigger:b'])
  })

  it('sets item eligibility before triggering, and ignores finished items and sections', () => {
    const { director, calls } = fake(
      [
        { id: 'run', top: 0, bottom: 900 },
        { id: 'done', top: 0, bottom: 900, status: 'done' },
      ],
      [
        { id: 'near', top: 100, bottom: 200 },
        { id: 'far', top: 3000, bottom: 3200 },
        { id: 'finished', top: 100, bottom: 200, status: 'done' },
      ],
    )
    evaluateViewport(director, 900)
    expect(calls).toEqual(['eligible:near:true', 'eligible:far:false', 'trigger:run'])
  })
})

describe('attachViewportObservers', () => {
  let frames: FrameRequestCallback[]

  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('re-evaluates once per animation frame after scroll or resize, and stops when detached', () => {
    const snapshot = vi.fn(() => ({ sections: [], items: [] }))
    const director = { ...fake([]).director, snapshot }
    const detach = attachViewportObservers(director, document.createElement('div'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    expect(frames).toHaveLength(1)
    frames.shift()!(0)
    expect(snapshot).toHaveBeenCalledTimes(1)
    detach()
    window.dispatchEvent(new Event('scroll'))
    expect(frames).toHaveLength(0)
  })
})
