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
}

const CLEARED_ON_DONE = ['opacity', 'transform', 'outline', 'outline-offset', '--ax', '--ay']

export class Director {
  private sections = new Map<string, SectionState>()
  private items = new Map<string, Item>()
  private eligible = new Set<string>()
  private agents: AgentState[]
  private runningId: string | null = null

  constructor(private deps: DirectorDeps) {
    this.agents = deps.agents.map((agent, index) => ({ agent, index, visible: false }))
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
    if (!section || section.status !== 'pending') return
    if (this.runningId && this.runningId !== sectionId) this.completeSectionInstantly(this.runningId)
    section.status = 'running'
    this.runningId = sectionId
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
      section = { id, status: 'pending' }
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
    const section = this.runningId ? this.sections.get(this.runningId) : undefined
    if (!section || section.status !== 'running') return
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
  }
}
