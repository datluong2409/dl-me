import { AGENTS } from '../cursors/agents'
import type { Tween } from '../cursors/animate'
import type { GestureContext, Point, Rect } from '../cursors/types'

/** A synchronous tween: reports progress 0, 0.5 and 1 immediately, and records every duration it was asked for. */
export function fakeTween(onCall?: () => void) {
  const durations: number[] = []
  const tween: Tween = async ({ duration, onUpdate, signal }) => {
    onCall?.()
    durations.push(duration)
    if (signal.aborted) return
    for (const progress of [0, 0.5, 1]) onUpdate(progress)
  }
  return { tween, durations }
}

export function makeCtx(overrides: Partial<GestureContext> = {}) {
  const el = document.createElement('div')
  el.style.opacity = '0'
  el.style.transform = 'none'
  const positions: Point[] = []
  const view = { setPosition: vi.fn(), setVisible: vi.fn(), showGhost: vi.fn(), setSelection: vi.fn() }
  const controller = new AbortController()
  const rect: Rect = { x: 200, y: 100, width: 300, height: 120 }
  const ctx: GestureContext = {
    item: { id: 'a', sectionId: 's', el, gesture: 'draw', order: 1, status: 'running' },
    agent: AGENTS[0],
    view,
    signal: controller.signal,
    rect,
    from: { x: 0, y: 0 },
    rng: () => 0.5,
    setPosition: (p) => {
      positions.push(p)
    },
    ...overrides,
  }
  return { ctx, el, view, positions, controller, rect }
}
