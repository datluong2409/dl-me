import { AGENTS } from './agents'
import { Director } from './director'
import type { DirectorDeps } from './director'
import type { Gesture, GestureContext, Point, Rect } from './types'

const FULL: Rect = { x: 0, y: 0, width: 100, height: 40 }
const VIEWPORT: Rect = { x: 0, y: 1200, width: 1000, height: 800 }

interface Call {
  ctx: GestureContext
  resolve(): void
  reject(error: unknown): void
}

function setup(measure: (el: HTMLElement) => Rect = () => FULL, agentCount = 2) {
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
  let pointerAt: Point | null = null
  const deps: DirectorDeps = {
    view,
    gestures: { draw: gesture, drop: gesture, type: gesture, stamp: gesture },
    startIdle: vi.fn(() => {
      const stop = vi.fn()
      stops.push(stop)
      return stop
    }),
    agents: AGENTS.slice(0, agentCount),
    rng: () => 0.5,
    measure,
    spawn: () => ({ x: 5, y: 5 }),
    viewport: () => VIEWPORT,
    pointer: () => pointerAt,
  }
  const director = new Director(deps)

  const section = (id: string) => {
    const el = document.createElement('section')
    document.body.append(el)
    director.registerSection(id, el)
    return el
  }
  const item = (
    sectionId: string,
    id: string,
    order: number,
    gesture: Gesture = 'drop',
    eligible = true,
    parentId?: string,
  ) => {
    const el = document.createElement('div')
    el.id = id
    document.body.append(el)
    const remove = director.registerItem({ id, sectionId, el, gesture, order, parentId })
    if (eligible) director.setItemEligible(id, true)
    return { el, remove }
  }
  const ids = () => calls.map((c) => c.ctx.item.id)
  const tick = (ms = 0) => vi.advanceTimersByTimeAsync(ms)

  const setPointer = (p: Point | null) => {
    pointerAt = p
  }

  return { director, view, deps, calls, seen, stops, section, item, ids, tick, setPointer }
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

describe('Director: idle drift', () => {
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

  it('starts an idle drift for every agent, handing it the visible viewport and the pointer', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.setPointer({ x: 7, y: 9 })
    await finishSection(t, 's')
    expect(t.deps.startIdle).toHaveBeenCalledTimes(2)
    const first = (t.deps.startIdle as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(first.agent.id).toBe('mai')
    expect(first.viewport()).toEqual(VIEWPORT)
    expect(first.pointer()).toEqual({ x: 7, y: 9 })
    t.setPointer(null)
    expect(first.pointer()).toBeNull()
  })

  it('never fades the agents out, however long they idle', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    await finishSection(t, 's')
    await t.tick(10 * 60 * 1000)
    expect(t.view.setVisible).not.toHaveBeenCalledWith('mai', false)
    expect(t.view.setVisible).not.toHaveBeenCalledWith('kai', false)
    expect(t.stops).toHaveLength(2)
    expect(t.stops.every((stop) => stop.mock.calls.length === 0)).toBe(true)
  })

  it('stops the drift when a new section triggers', async () => {
    const t = setup()
    t.section('s')
    t.section('s2')
    t.item('s', 'a', 1)
    t.item('s2', 'b', 1)
    await finishSection(t, 's')
    expect(t.stops).toHaveLength(2)
    t.director.triggerSection('s2')
    expect(t.stops.every((stop) => stop.mock.calls.length > 0)).toBe(true)
  })

  it('goes back to drifting after snapRunning() finishes the running section', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'a', 1)
    t.director.triggerSection('s')
    await t.tick()
    expect(t.deps.startIdle).not.toHaveBeenCalled()
    t.director.snapRunning()
    expect(t.deps.startIdle).toHaveBeenCalledTimes(2)
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

describe('Director: parents, children and groups', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('starts a child only after its parent is done, and hands it to an idle agent straight away', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'card', 1, 'draw')
    t.item('s', 'title', 1, 'type', true, 'card')
    t.director.triggerSection('s')
    await t.tick(500)
    expect(t.ids()).toEqual(['card'])
    t.calls[0].resolve()
    await t.tick()
    expect(t.ids()).toEqual(['card', 'title'])
    expect(t.calls[1].ctx.agent.id).toBe('kai')
  })

  it("finishes a parent's children before the next top-level item, in order", async () => {
    const t = setup(undefined, 1)
    t.section('s')
    t.item('s', 'p1', 1, 'draw')
    t.item('s', 'p2', 2, 'draw')
    t.item('s', 'c1', 1, 'type', true, 'p1')
    t.item('s', 'c2', 2, 'type', true, 'p1')
    t.director.triggerSection('s')
    // Finish every gesture as soon as it starts, so the start order shows the scheduling order.
    for (let i = 0; i < 12; i++) {
      await t.tick(200)
      for (const call of t.calls) call.resolve()
    }
    const order = t.ids()
    expect(order.indexOf('p1')).toBeLessThan(order.indexOf('c1'))
    expect(order.indexOf('c1')).toBeLessThan(order.indexOf('c2'))
    expect(order.indexOf('c2')).toBeLessThan(order.indexOf('p2'))
  })

  it('completes a group instantly, with no gesture and no agent, and unlocks its children', async () => {
    const t = setup()
    t.section('s')
    const group = t.item('s', 'g', 1, 'group')
    t.item('s', 'word', 1, 'type', true, 'g')
    t.director.triggerSection('s')
    await t.tick()
    expect(group.el.dataset.assemble).toBe('done')
    expect(t.ids()).toEqual(['word'])
  })

  it('completes nested groups in one go, and keeps a group waiting while its parent is not done', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'card', 1, 'draw')
    const outer = t.item('s', 'g1', 1, 'group', true, 'card')
    const inner = t.item('s', 'g2', 1, 'group', true, 'g1')
    t.item('s', 'leaf', 1, 'stamp', true, 'g2')
    t.director.triggerSection('s')
    await t.tick()
    expect([outer.el.dataset.assemble, inner.el.dataset.assemble]).toEqual(['pending', 'pending'])
    t.calls[0].resolve()
    await t.tick(200)
    expect([outer.el.dataset.assemble, inner.el.dataset.assemble]).toEqual(['done', 'done'])
    expect(t.ids()).toEqual(['card', 'leaf'])
  })

  it('does not finish the section until every child is done', async () => {
    const t = setup()
    t.section('s')
    t.item('s', 'card', 1, 'draw')
    t.item('s', 'child', 1, 'type', true, 'card')
    t.director.triggerSection('s')
    await t.tick()
    t.calls[0].resolve()
    await t.tick(200)
    expect(t.director.getStatus('s')).toBe('running')
    t.calls[1].resolve()
    await t.tick(200)
    expect(t.director.getStatus('s')).toBe('done')
  })

  it('lets a child start when its parent has been unregistered', async () => {
    const t = setup()
    t.section('s')
    const parent = t.item('s', 'card', 1, 'draw')
    t.item('s', 'child', 1, 'type', true, 'card')
    parent.remove()
    t.director.triggerSection('s')
    await t.tick()
    expect(t.ids()).toEqual(['child'])
  })

  it('snaps children too, and clears the inline styles typing leaves on word spans', () => {
    const t = setup()
    t.section('s')
    t.item('s', 'card', 1, 'draw')
    const text = t.item('s', 'text', 1, 'type', true, 'card')
    const word = document.createElement('span')
    word.dataset.word = ''
    word.style.opacity = '0'
    word.style.transform = 'translateY(3px)'
    text.el.append(word)
    t.director.completeSectionInstantly('s')
    expect(text.el.dataset.assemble).toBe('done')
    expect(word.style.getPropertyValue('opacity')).toBe('')
    expect(word.style.getPropertyValue('transform')).toBe('')
  })

  it('gives gestures a measure function and a pace: normal for few children, faster when many wait', async () => {
    const few = setup()
    few.section('s')
    few.item('s', 'card', 1, 'draw')
    few.item('s', 'c', 1, 'type', true, 'card')
    few.director.triggerSection('s')
    await few.tick()
    expect(few.calls[0].ctx.pace).toBe(1)
    expect(typeof few.calls[0].ctx.measure).toBe('function')
    few.calls[0].resolve()
    await few.tick(200)
    expect(few.calls[1].ctx.pace).toBe(1)

    const many = setup()
    many.section('s')
    many.item('s', 'card', 1, 'draw')
    for (let i = 1; i <= 60; i++) many.item('s', 'c' + i, i, 'stamp', true, 'card')
    many.director.triggerSection('s')
    await many.tick()
    many.calls[0].resolve()
    await many.tick(200)
    expect(many.calls[0].ctx.pace).toBe(1)
    expect(many.calls[1].ctx.pace).toBeCloseTo(0.4)
  })
})
