import { AGENTS } from './agents'
import { Director } from './director'
import type { DirectorDeps } from './director'
import type { Gesture, GestureContext, Rect } from './types'

const FULL: Rect = { x: 0, y: 0, width: 100, height: 40 }

interface Call {
  ctx: GestureContext
  resolve(): void
  reject(error: unknown): void
}

function setup(measure: (el: HTMLElement) => Rect = () => FULL) {
  const calls: Call[] = []
  const seen: { opacity: string; transform: string; assemble: string | undefined }[] = []
  const gesture = (ctx: GestureContext) => {
    const { el } = ctx.item
    seen.push({ opacity: el.style.opacity, transform: el.style.transform, assemble: el.dataset.assemble })
    return new Promise<void>((resolve, reject) => {
      calls.push({ ctx, resolve, reject })
    })
  }
  const view = { setPosition: vi.fn(), setVisible: vi.fn(), showGhost: vi.fn(), setSelection: vi.fn() }
  const stops: ReturnType<typeof vi.fn>[] = []
  const deps: DirectorDeps = {
    view,
    gestures: { draw: gesture, drop: gesture },
    startIdle: vi.fn(() => {
      const stop = vi.fn()
      stops.push(stop)
      return stop
    }),
    agents: AGENTS.slice(0, 2),
    rng: () => 0.5,
    measure,
    spawn: () => ({ x: 5, y: 5 }),
  }
  const director = new Director(deps)

  const section = (id: string) => {
    const el = document.createElement('section')
    document.body.append(el)
    director.registerSection(id, el)
    return el
  }
  const item = (sectionId: string, id: string, order: number, gesture: Gesture = 'drop', eligible = true) => {
    const el = document.createElement('div')
    el.id = id
    document.body.append(el)
    const remove = director.registerItem({ id, sectionId, el, gesture, order })
    if (eligible) director.setItemEligible(id, true)
    return { el, remove }
  }
  const ids = () => calls.map((c) => c.ctx.item.id)
  const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms)

  return { director, view, deps, calls, seen, stops, section, item, ids, tick }
}

describe('Director: registration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('marks a registered item pending with its gesture and a drop offset in px', () => {
    const t = setup()
    t.section('s')
    const { el } = t.item('s', 'a', 1, 'drop')
    expect(el.dataset.assemble).toBe('pending')
    expect(el.dataset.gesture).toBe('drop')
    expect(el.style.getPropertyValue('--ax')).toMatch(/px$/)
    expect(el.style.getPropertyValue('--ay')).toMatch(/px$/)
  })

  it('lists sections and items in snapshot()', () => {
    const t = setup()
    const sectionEl = t.section('s')
    t.item('s', 'a', 1)
    const snap = t.director.snapshot()
    expect(snap.sections).toEqual([{ id: 's', el: sectionEl, status: 'pending' }])
    expect(snap.items.map((i) => [i.id, i.status])).toEqual([['a', 'pending']])
    expect(t.director.getStatus('s')).toBe('pending')
    expect(t.director.getStatus('missing')).toBeUndefined()
  })

  it('accepts items registered before their section (React layout-effect order)', async () => {
    const t = setup()
    const el = document.createElement('div')
    t.director.registerItem({ id: 'a', sectionId: 'x', el, gesture: 'drop', order: 1 })
    t.director.setItemEligible('a', true)
    t.director.registerSection('x', document.createElement('section'))
    t.director.triggerSection('x')
    await t.tick()
    expect(t.ids()).toEqual(['a'])
  })

  it('marks an item registered into an already-done section as done', () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.director.completeSectionInstantly('s')
    const late = t.item('s', 'late', 2)
    expect(late.el.dataset.assemble).toBe('done')
  })
})

describe('Director: running a section', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('runs items in order with at most one item per agent, staggering the second agent', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.item('s', 'b', 2)
    t.item('s', 'c', 3)
    t.director.triggerSection('s')
    await t.tick()
    expect(t.ids()).toEqual(['a'])
    await t.tick(140)
    expect(t.ids()).toEqual(['a', 'b'])
    await t.tick(1000)
    expect(t.ids()).toEqual(['a', 'b'])
    t.calls[0].resolve()
    await t.tick(120)
    expect(t.ids()).toEqual(['a', 'b', 'c'])
  })

  it('does not start ineligible items until they become eligible', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1, 'drop', false)
    t.director.triggerSection('s')
    await t.tick(500)
    expect(t.ids()).toEqual([])
    t.director.setItemEligible('a', true)
    await t.tick()
    expect(t.ids()).toEqual(['a'])
  })

  it('sets the element running, hidden and untransformed before the gesture starts', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.director.triggerSection('s')
    await t.tick()
    expect(t.seen[0]).toEqual({ opacity: '0', transform: 'none', assemble: 'running' })
  })

  it('brings the first agent in from the spawn point', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.item('s', 'b', 2)
    t.director.triggerSection('s')
    await t.tick(140)
    expect(t.view.setPosition).toHaveBeenCalledWith('mai', 5, 5)
    expect(t.view.setVisible).toHaveBeenCalledWith('mai', true)
    expect(t.calls[0].ctx.from).toEqual({ x: 5, y: 5 })
    t.calls[0].ctx.setPosition({ x: 1, y: 2 })
    expect(t.view.setPosition).toHaveBeenCalledWith('mai', 1, 2)
  })

  it('finishes items by clearing the inline styles the gesture left, and finishes the section', async () => {
    const t = setup()
    t.section('s')
    const { el } = t.item('s', 'a', 1)
    t.director.triggerSection('s')
    await t.tick()
    el.style.opacity = '1'
    el.style.transform = 'translate3d(0px, 0px, 0) scale(1)'
    el.style.outline = '1px solid red'
    el.style.outlineOffset = '2px'
    t.calls[0].resolve()
    await t.tick(120)
    expect(el.dataset.assemble).toBe('done')
    for (const property of ['opacity', 'transform', 'outline', 'outline-offset', '--ax', '--ay']) {
      expect(el.style.getPropertyValue(property)).toBe('')
    }
    expect(t.director.getStatus('s')).toBe('done')
  })

  it('ignores trigger on a section that is already running or done', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.director.triggerSection('s')
    t.director.triggerSection('s')
    await t.tick()
    expect(t.calls).toHaveLength(1)
    t.calls[0].resolve()
    await t.tick(120)
    t.director.triggerSection('s')
    await t.tick(500)
    expect(t.calls).toHaveLength(1)
  })

  it('completeSectionInstantly finishes every item without running a gesture', async () => {
    const t = setup()
    t.section('s')
    const a = t.item('s', 'a', 1)
    const b = t.item('s', 'b', 2)
    t.director.completeSectionInstantly('s')
    await t.tick(500)
    expect(t.calls).toHaveLength(0)
    expect([a.el.dataset.assemble, b.el.dataset.assemble]).toEqual(['done', 'done'])
    expect(t.director.getStatus('s')).toBe('done')
  })
})

describe('Director: interruptions and failures', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('snaps the running section when another section is triggered, then starts the new one', async () => {
    const t = setup()
    t.section('s1')
    t.section('s2')
    const a = t.item('s1', 'a', 1)
    const b = t.item('s1', 'b', 2)
    t.item('s2', 'c', 1)
    t.director.triggerSection('s1')
    await t.tick(140)
    expect(t.ids()).toEqual(['a', 'b'])
    t.director.triggerSection('s2')
    await t.tick()
    expect(t.calls[0].ctx.signal.aborted).toBe(true)
    expect(t.calls[1].ctx.signal.aborted).toBe(true)
    expect([a.el.dataset.assemble, b.el.dataset.assemble]).toEqual(['done', 'done'])
    expect(t.director.getStatus('s1')).toBe('done')
    expect(t.director.getStatus('s2')).toBe('running')
    expect(t.ids()).toContain('c')
  })

  it('survives an item being unregistered mid-gesture: aborts it, frees the agent, still finishes', async () => {
    const t = setup()
    t.section('s')
    const a = t.item('s', 'a', 1)
    t.item('s', 'b', 2)
    t.item('s', 'c', 3)
    t.director.triggerSection('s')
    await t.tick(140)
    expect(t.ids()).toEqual(['a', 'b'])
    expect(() => a.remove()).not.toThrow()
    await t.tick()
    expect(t.calls[0].ctx.signal.aborted).toBe(true)
    expect(t.ids()).toEqual(['a', 'b', 'c'])
    t.calls[1].resolve()
    t.calls[2].resolve()
    await t.tick(120)
    expect(t.director.getStatus('s')).toBe('done')
  })

  it('completes an item with zero size without running a gesture, and an empty section immediately', async () => {
    const t = setup((el) => (el.id === 'z' ? { x: 0, y: 0, width: 0, height: 40 } : FULL))
    t.section('s')
    t.section('empty')
    const z = t.item('s', 'z', 1)
    t.item('s', 'b', 2)
    t.director.triggerSection('s')
    await t.tick()
    expect(t.ids()).toEqual(['b'])
    expect(z.el.dataset.assemble).toBe('done')
    t.director.triggerSection('empty')
    expect(t.director.getStatus('empty')).toBe('done')
  })

  it('snaps an item whose gesture rejects and carries on', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const t = setup()
    t.section('s')
    const a = t.item('s', 'a', 1)
    t.item('s', 'b', 2)
    t.item('s', 'c', 3)
    t.director.triggerSection('s')
    await t.tick(140)
    t.calls[0].reject(new Error('boom'))
    await t.tick(120)
    expect(a.el.dataset.assemble).toBe('done')
    expect(t.ids()).toEqual(['a', 'b', 'c'])
    expect(error).toHaveBeenCalled()
  })

  it('snaps an item whose gesture never finishes after the 4000ms watchdog', async () => {
    const t = setup()
    t.section('s')
    const a = t.item('s', 'a', 1)
    t.director.triggerSection('s')
    await t.tick()
    await t.tick(3999)
    expect(a.el.dataset.assemble).toBe('running')
    await t.tick(1)
    expect(t.calls[0].ctx.signal.aborted).toBe(true)
    expect(a.el.dataset.assemble).toBe('done')
    expect(t.director.getStatus('s')).toBe('done')
  })
})

describe('Director: reduced motion', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('snaps a running section, finishes every section and hides every agent', async () => {
    const t = setup()
    t.section('s')
    t.section('later')
    const a = t.item('s', 'a', 1)
    const b = t.item('s', 'b', 2)
    const c = t.item('later', 'c', 1)
    t.director.triggerSection('s')
    await t.tick(140)
    t.director.setReducedMotion(true)
    expect(t.calls[0].ctx.signal.aborted).toBe(true)
    expect(t.calls[1].ctx.signal.aborted).toBe(true)
    expect([a, b, c].map((i) => i.el.dataset.assemble)).toEqual(['done', 'done', 'done'])
    expect(t.director.getStatus('later')).toBe('done')
    expect(t.view.setVisible).toHaveBeenCalledWith('mai', false)
    expect(t.view.setVisible).toHaveBeenCalledWith('kai', false)
  })

  it('never animates afterwards: new items are done and no idle drift starts', async () => {
    const t = setup()
    t.director.setReducedMotion(true)
    t.section('s')
    const a = t.item('s', 'a', 1)
    expect(a.el.dataset.assemble).toBe('done')
    t.director.triggerSection('s')
    await t.tick(500)
    expect(t.calls).toHaveLength(0)
    expect(t.deps.startIdle).not.toHaveBeenCalled()
  })
})

describe('Director: idle drift and fade-out', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  async function finishSection(t: ReturnType<typeof setup>, id: string) {
    t.director.triggerSection(id)
    await t.tick()
    t.calls[t.calls.length - 1].resolve()
    await t.tick(120)
  }

  it('starts an idle drift for every agent around the finished section', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    await finishSection(t, 's')
    expect(t.deps.startIdle).toHaveBeenCalledTimes(2)
    const firstCall = (t.deps.startIdle as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(firstCall.bounds).toEqual(FULL)
    expect(firstCall.agent.id).toBe('mai')
  })

  it('fades every agent out after 5000ms without a new trigger and stops their drift', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    await finishSection(t, 's') // the 5000ms countdown started when the last item finished, 120ms ago
    await t.tick(4879)
    expect(t.view.setVisible).not.toHaveBeenCalledWith('mai', false)
    await t.tick(1)
    expect(t.view.setVisible).toHaveBeenCalledWith('mai', false)
    expect(t.view.setVisible).toHaveBeenCalledWith('kai', false)
    expect(t.stops).toHaveLength(2)
    expect(t.stops.every((stop) => stop.mock.calls.length > 0)).toBe(true)
  })

  it('cancels the fade-out and stops the drift when a new section triggers', async () => {
    const t = setup()
    t.section('s')
    t.section('s2')
    t.item('s', 'a', 1)
    t.item('s2', 'b', 1)
    await finishSection(t, 's')
    await t.tick(4000)
    expect(t.stops).toHaveLength(2)
    t.director.triggerSection('s2')
    expect(t.stops.every((stop) => stop.mock.calls.length > 0)).toBe(true)
    await t.tick(6000)
    expect(t.view.setVisible).not.toHaveBeenCalledWith('mai', false)
  })

  it('brings an agent back in from the spawn point after it faded out', async () => {
    const t = setup()
    t.section('s')
    t.section('s2')
    t.item('s', 'a', 1)
    t.item('s2', 'b', 1)
    await finishSection(t, 's')
    await t.tick(5000)
    t.view.setPosition.mockClear()
    t.view.setVisible.mockClear()
    t.director.triggerSection('s2')
    await t.tick()
    expect(t.view.setPosition).toHaveBeenCalledWith('mai', 5, 5)
    expect(t.view.setVisible).toHaveBeenCalledWith('mai', true)
    expect(t.view.setPosition.mock.invocationCallOrder[0]).toBeLessThan(t.view.setVisible.mock.invocationCallOrder[0])
  })
})

describe('Director: status events and lifecycle', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('reports when an agent takes an item and when it goes idle, until unsubscribed', async () => {
    const t = setup()
    t.section('s')
    t.section('s2')
    t.item('s', 'a', 1)
    t.item('s2', 'b', 1)
    const events: unknown[] = []
    const off = t.director.subscribe((e) => events.push(e))
    t.director.triggerSection('s')
    await t.tick()
    expect(events).toEqual([{ agentId: 'mai', sectionId: 's' }])
    t.calls[0].resolve()
    await t.tick(120)
    expect(events).toEqual([
      { agentId: 'mai', sectionId: 's' },
      { agentId: 'mai', sectionId: null },
    ])
    off()
    t.director.triggerSection('s2')
    await t.tick()
    expect(events).toHaveLength(2)
  })

  it('snapRunning() finishes only the running section', async () => {
    const t = setup()
    t.section('s1')
    t.section('s2')
    const a = t.item('s1', 'a', 1)
    const b = t.item('s2', 'b', 1)
    t.director.triggerSection('s1')
    await t.tick()
    t.director.snapRunning()
    expect(a.el.dataset.assemble).toBe('done')
    expect(b.el.dataset.assemble).toBe('pending')
    expect(t.director.getStatus('s2')).toBe('pending')
  })

  it('dispose() aborts running gestures and clears every timer; start() makes it usable again', async () => {
    const t = setup()
    t.section('s')
    t.section('s2')
    t.item('s', 'a', 1)
    t.item('s', 'b', 2)
    t.item('s2', 'c', 1)
    t.director.triggerSection('s')
    await t.tick(140)
    t.director.dispose()
    expect(t.calls[0].ctx.signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    t.director.triggerSection('s2')
    await t.tick(500)
    expect(t.ids()).toEqual(['a', 'b'])
    t.director.start()
    t.director.triggerSection('s2')
    await t.tick()
    expect(t.ids()).toEqual(['a', 'b', 'c'])
  })
})
