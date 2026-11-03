import type { Agent, AgentId } from './agents'

/** Gestures a cursor performs. */
export type AnimatedGesture = 'draw' | 'drop' | 'type' | 'stamp'
/** `group` is an invisible container: it completes instantly, with no cursor, and unlocks its children. */
export type Gesture = AnimatedGesture | 'group'
export type ItemStatus = 'pending' | 'running' | 'done'

export interface Point {
  x: number
  y: number
}

/** Position and size in overlay (document) coordinates. */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Item {
  id: string
  sectionId: string
  el: HTMLElement
  gesture: Gesture
  /** Position among its siblings; children are ordered right after their parent. */
  order: number
  /** The item whose frame must be done before this one can start. */
  parentId?: string
  status: ItemStatus
}

export interface CursorView {
  setPosition(agentId: AgentId, x: number, y: number): void
  setVisible(agentId: AgentId, visible: boolean): void
  /** Selection box drawn by the "draw" gesture; null hides it. */
  showGhost(agentId: AgentId, rect: Rect | null): void
  /** Outline around an item an agent is holding; agent null clears it. */
  setSelection(el: HTMLElement, agent: Agent | null): void
}

export interface GestureContext {
  item: Item
  agent: Agent
  view: CursorView
  signal: AbortSignal
  /** Item box in overlay coordinates, measured when the gesture starts. */
  rect: Rect
  /** The agent's current position. */
  from: Point
  rng: () => number
  /** Moves the agent's cursor and remembers where it is. */
  setPosition(p: Point): void
  /** A box in overlay coordinates, for gestures that follow parts of an item (the words being typed). */
  measure(el: HTMLElement): Rect
  /** Time scale, 1 normally; below 1 when many children are waiting so the section still finishes in a few seconds. */
  pace: number
}

/** Resolves (never rejects) when aborted, so callers check `signal.aborted` afterwards. */
export type GestureFn = (ctx: GestureContext) => Promise<void>

export interface IdleContext {
  agent: Agent
  view: CursorView
  /** Where the agent is now, in overlay coordinates. */
  from: Point
  rng: () => number
  setPosition(p: Point): void
  /** The visible window in overlay coordinates, read fresh each frame (it moves as the page scrolls). */
  viewport(): Rect
  /** The pointer in viewport coordinates (CSS px from the window's top-left), or null when it is not over the page. */
  pointer(): Point | null
}
