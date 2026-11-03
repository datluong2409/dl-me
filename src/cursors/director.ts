import type { Agent, AgentId } from './agents'
import { MOTION } from './motion-tokens'
import { dropOffset, nextItem } from './scheduler'
import type { CursorView, Gesture, GestureFn, IdleContext, Item, ItemStatus, Point, Rect } from './types'

export interface DirectorDeps {
  view: CursorView
  gestures: Record<Gesture, GestureFn>
  /** Starts an idle drift for an agent; returns the function that stops it. */
  startIdle: (ctx: IdleContext) => () => void
  agents: readonly Agent[]
  rng: () => number
  /** Box of an element in overlay (document) coordinates. */
  measure: (el: HTMLElement) => Rect
  /** A point on the viewport edge, in overlay coordinates, where an agent first appears. */
  spawn: () => Point
  /** The visible window in overlay (document) coordinates; read fresh whenever it is needed. */
  viewport: () => Rect
  /** Where the pointer is, in viewport coordinates, or null when it is not over the page. */
  pointer: () => Point | null
}

export interface StatusEvent {
  agentId: AgentId
  /** The section the agent is working on, or null when it is idle. */
  sectionId: string | null
}

export interface Snapshot {
  sections: { id: string; el: HTMLElement; status: ItemStatus }[]
  items: Item[]
}

type Timer = ReturnType<typeof setTimeout>

interface SectionState {
  id: string
  el?: HTMLElement
  status: ItemStatus
}

interface Run {
  item: Item
  agent: AgentState
  controller: AbortController
  watchdog: Timer
}

interface AgentState {
  agent: Agent
  index: number
  run?: Run
  waitTimer?: Timer
  visible: boolean
  position?: Point
  stopIdle?: () => void
  /** Last section reported to subscribers; null while idle. */
  reported: string | null
}

const CLEARED_ON_DONE = ['opacity', 'transform', 'outline', 'outline-offset', '--ax', '--ay']

export class Director {
  private sections = new Map<string, SectionState>()
  private items = new Map<string, Item>()
  private eligible = new Set<string>()
  private agents: AgentState[]
  private runningId: string | null = null
  private reduced = false
  private disposed = false
  private listeners = new Set<(event: StatusEvent) => void>()

  constructor(private deps: DirectorDeps) {
    this.agents = deps.agents.map((agent, index) => ({ agent, index, visible: false, reported: null }))
  }

  /** Reduced motion: finish everything now, hide the agents, and never animate again until turned off. */
  setReducedMotion(on: boolean): void {
    this.reduced = on
    if (!on) return
    this.cancelIdle()
    for (const id of [...this.sections.keys()]) this.completeSectionInstantly(id)
    for (const agent of this.agents) {
      this.releaseAgent(agent)
      this.deps.view.setVisible(agent.agent.id, false)
      agent.visible = false
    }
    this.settleAgents()
  }

  /** Finishes the section that is currently running, if any (used when the tab becomes visible again). */
  snapRunning(): void {
    if (!this.runningId) return
    this.completeSectionInstantly(this.runningId)
    this.settleAgents()
    this.beginIdle()
  }

  subscribe(listener: (event: StatusEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Stops all activity and timers but keeps registrations, so start() can resume (React StrictMode). */
  dispose(): void {
    this.snapRunning()
    this.cancelIdle()
    for (const agent of this.agents) {
      this.releaseAgent(agent)
      this.deps.view.setVisible(agent.agent.id, false)
      agent.visible = false
    }
    this.disposed = true
  }

  start(): void {
    this.disposed = false
  }

  registerSection(id: string, el: HTMLElement): () => void {
    this.section(id).el = el
    return () => {
      const section = this.sections.get(id)
      if (!section) return
      section.el = undefined
      if (!this.itemsOf(id).length) this.sections.delete(id)
    }
  }

  registerItem(spec: { id: string; sectionId: string; el: HTMLElement; gesture: Gesture; order: number }): () => void {
    const section = this.section(spec.sectionId)
    const item: Item = { ...spec, status: section.status === 'done' ? 'done' : 'pending' }
    this.items.set(item.id, item)
    spec.el.dataset.assemble = item.status
    spec.el.dataset.gesture = spec.gesture
    if (item.status === 'pending') {
      const offset = dropOffset(spec.order)
      spec.el.style.setProperty('--ax', `${offset.x}px`)
      spec.el.style.setProperty('--ay', `${offset.y}px`)
    }
    return () => this.unregisterItem(item.id)
  }

  setItemEligible(itemId: string, eligible: boolean): void {
    if (eligible) {
      this.eligible.add(itemId)
      this.pump()
    } else {
      this.eligible.delete(itemId)
    }
  }

  triggerSection(sectionId: string): void {
    const section = this.sections.get(sectionId)
    if (this.disposed || !section || section.status !== 'pending') return
    if (this.runningId && this.runningId !== sectionId) this.completeSectionInstantly(this.runningId)
    section.status = 'running'
    this.runningId = sectionId
    this.cancelIdle()
    for (const agent of this.agents) {
      this.releaseAgent(agent)
      if (agent.index > 0) this.holdAgent(agent, agent.index * MOTION.agentStagger)
    }
    this.pump()
  }

  completeSectionInstantly(sectionId: string): void {
    const section = this.sections.get(sectionId)
    if (!section) return
    for (const item of this.itemsOf(sectionId)) {
      if (item.status === 'done') continue
      this.abortRunOf(item.id)
      this.completeItem(item)
    }
    section.status = 'done'
    if (this.runningId === sectionId) this.runningId = null
  }

  getStatus(sectionId: string): ItemStatus | undefined {
    return this.sections.get(sectionId)?.status
  }

  snapshot(): Snapshot {
    const sections: Snapshot['sections'] = []
    for (const s of this.sections.values()) if (s.el) sections.push({ id: s.id, el: s.el, status: s.status })
    return { sections, items: [...this.items.values()] }
  }

  private section(id: string): SectionState {
    let section = this.sections.get(id)
    if (!section) {
      section = { id, status: this.reduced ? 'done' : 'pending' }
      this.sections.set(id, section)
    }
    return section
  }

  private itemsOf(sectionId: string): Item[] {
    return [...this.items.values()].filter((i) => i.sectionId === sectionId)
  }

  private unregisterItem(itemId: string): void {
    const item = this.items.get(itemId)
    if (!item) return
    this.abortRunOf(itemId)
    this.items.delete(itemId)
    this.eligible.delete(itemId)
    this.pump()
  }

  private isFree(agent: AgentState): boolean {
    return !agent.run && !agent.waitTimer
  }

  private releaseAgent(agent: AgentState): void {
    if (agent.waitTimer) clearTimeout(agent.waitTimer)
    agent.waitTimer = undefined
  }

  private holdAgent(agent: AgentState, ms: number): void {
    this.releaseAgent(agent)
    agent.waitTimer = setTimeout(() => {
      agent.waitTimer = undefined
      this.pump()
    }, ms)
  }

  /** Gives every free agent the next eligible pending item of the running section. */
  private pump(): void {
    if (this.disposed) return
    const section = this.runningId ? this.sections.get(this.runningId) : undefined
    if (section && section.status === 'running') {
      const items = this.itemsOf(section.id)
      for (const agent of this.agents) {
        while (this.isFree(agent)) {
          const item = nextItem(items, (i) => this.eligible.has(i.id))
          if (!item) break
          this.claim(agent, item)
        }
      }
      this.finishIfDone(section)
    }
    this.settleAgents()
  }

  private report(agent: AgentState, sectionId: string | null): void {
    if (agent.reported === sectionId) return
    agent.reported = sectionId
    for (const listener of [...this.listeners]) listener({ agentId: agent.agent.id, sectionId })
  }

  /** Reports every agent that has nothing to do as idle. */
  private settleAgents(): void {
    for (const agent of this.agents) if (this.isFree(agent)) this.report(agent, null)
  }

  /** Agents with no work keep drifting on screen, dodging the pointer, until the next section needs them. */
  private beginIdle(): void {
    if (this.reduced || this.disposed) return
    const { view } = this.deps
    for (const agent of this.agents) {
      if (!agent.visible) {
        agent.position = this.deps.spawn()
        view.setPosition(agent.agent.id, agent.position.x, agent.position.y)
        view.setVisible(agent.agent.id, true)
        agent.visible = true
      }
      agent.stopIdle?.()
      agent.stopIdle = this.deps.startIdle({
        agent: agent.agent,
        view,
        from: agent.position as Point,
        rng: this.deps.rng,
        setPosition: (p) => {
          agent.position = p
          view.setPosition(agent.agent.id, p.x, p.y)
        },
        viewport: this.deps.viewport,
        pointer: this.deps.pointer,
      })
    }
  }

  private cancelIdle(): void {
    for (const agent of this.agents) {
      agent.stopIdle?.()
      agent.stopIdle = undefined
    }
  }

  private claim(agent: AgentState, item: Item): void {
    const { el } = item
    item.status = 'running'
    el.style.opacity = '0'
    el.style.transform = 'none'
    el.dataset.assemble = 'running'

    const rect = this.deps.measure(el)
    if (rect.width <= 0 || rect.height <= 0) {
      this.completeItem(item)
      return
    }

    const { view } = this.deps
    if (!agent.visible) {
      agent.position = this.deps.spawn()
      view.setPosition(agent.agent.id, agent.position.x, agent.position.y)
      view.setVisible(agent.agent.id, true)
      agent.visible = true
    }

    const controller = new AbortController()
    const run: Run = {
      item,
      agent,
      controller,
      watchdog: setTimeout(() => this.snapItem(item), MOTION.gestureTimeout),
    }
    agent.run = run
    this.report(agent, item.sectionId)

    const ctx = {
      item,
      agent: agent.agent,
      view,
      signal: controller.signal,
      rect,
      from: agent.position as Point,
      rng: this.deps.rng,
      setPosition: (p: Point) => {
        agent.position = p
        view.setPosition(agent.agent.id, p.x, p.y)
      },
    }

    let promise: Promise<void>
    try {
      promise = this.deps.gestures[item.gesture](ctx)
    } catch (error) {
      promise = Promise.reject(error)
    }
    promise.then(
      () => this.onGestureEnd(run),
      (error) => {
        console.error('[assembly] gesture failed', error)
        this.onGestureEnd(run)
      },
    )
  }

  private onGestureEnd(run: Run): void {
    if (run.agent.run !== run) return // already snapped or aborted
    clearTimeout(run.watchdog)
    run.agent.run = undefined
    this.clearOverlay(run)
    this.completeItem(run.item)
    this.holdAgent(run.agent, MOTION.itemGap)
    const section = this.sections.get(run.item.sectionId)
    if (section) this.finishIfDone(section)
  }

  /** Aborts the gesture running for an item, if any, and frees its agent immediately. */
  private abortRunOf(itemId: string): void {
    for (const agent of this.agents) {
      const run = agent.run
      if (!run || run.item.id !== itemId) continue
      run.controller.abort()
      clearTimeout(run.watchdog)
      agent.run = undefined
      this.releaseAgent(agent)
      this.clearOverlay(run)
    }
  }

  private clearOverlay(run: Run): void {
    this.deps.view.showGhost(run.agent.agent.id, null)
    this.deps.view.setSelection(run.item.el, null)
  }

  private snapItem(item: Item): void {
    if (item.status === 'done') return
    this.abortRunOf(item.id)
    this.completeItem(item)
    this.pump()
  }

  private completeItem(item: Item): void {
    item.status = 'done'
    for (const property of CLEARED_ON_DONE) item.el.style.removeProperty(property)
    item.el.dataset.assemble = 'done'
  }

  private finishIfDone(section: SectionState): void {
    if (section.status !== 'running') return
    if (!this.itemsOf(section.id).every((i) => i.status === 'done')) return
    section.status = 'done'
    if (this.runningId === section.id) this.runningId = null
    this.beginIdle()
  }
}
