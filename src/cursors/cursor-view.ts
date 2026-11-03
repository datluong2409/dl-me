import type { Agent, AgentId } from './agents'
import type { CursorView, Rect } from './types'

// Styling is Tailwind classes only (no stylesheet): positions and sizes are set inline because they change every frame.
const CURSOR =
  'pointer-events-none absolute top-0 left-0 opacity-0 transition-opacity duration-[180ms] will-change-transform data-[visible=true]:opacity-100 data-[visible=false]:duration-[400ms]'
const TAG =
  'absolute top-4 left-4 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs leading-4 font-medium text-bg'
const GHOST =
  'pointer-events-none absolute top-0 left-0 border-[1.5px] opacity-0 transition-opacity duration-[120ms] data-[visible=true]:opacity-100'
const HANDLE = 'absolute size-1.5 border-[1.5px] bg-fg'
const HANDLE_POSITIONS = ['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1']
const SVG_NS = 'http://www.w3.org/2000/svg'

function createArrow(color: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', '20')
  svg.setAttribute('height', '22')
  svg.setAttribute('viewBox', '0 0 20 22')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M2 2 L2 18 L6.5 13.5 L10 21 L13 19.5 L9.5 12.5 L16 12.5 Z')
  path.setAttribute('fill', color)
  path.setAttribute('stroke', '#FFFFFF')
  path.setAttribute('stroke-width', '1.5')
  path.setAttribute('stroke-linejoin', 'round')
  svg.append(path)
  return svg
}

export function createCursorView(root: HTMLElement, agents: readonly Agent[]): CursorView & { destroy(): void } {
  const cursors = new Map<AgentId, HTMLElement>()
  const ghosts = new Map<AgentId, HTMLElement>()

  for (const agent of agents) {
    const cursor = document.createElement('div')
    cursor.className = CURSOR
    cursor.dataset.cursor = agent.id
    cursor.dataset.visible = 'false'
    const tag = document.createElement('span')
    tag.className = TAG
    tag.style.backgroundColor = agent.color
    tag.textContent = agent.name
    cursor.append(createArrow(agent.color), tag)

    const ghost = document.createElement('div')
    ghost.className = GHOST
    ghost.dataset.ghost = agent.id
    ghost.dataset.visible = 'false'
    ghost.style.borderColor = agent.color
    for (const position of HANDLE_POSITIONS) {
      const handle = document.createElement('span')
      handle.className = `${HANDLE} ${position}`
      handle.style.borderColor = agent.color
      ghost.append(handle)
    }

    cursors.set(agent.id, cursor)
    ghosts.set(agent.id, ghost)
    root.append(ghost, cursor)
  }

  return {
    setPosition(agentId, x, y) {
      const cursor = cursors.get(agentId)
      if (cursor) cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
    },
    setVisible(agentId, visible) {
      const cursor = cursors.get(agentId)
      if (cursor) cursor.dataset.visible = String(visible)
    },
    showGhost(agentId, rect: Rect | null) {
      const ghost = ghosts.get(agentId)
      if (!ghost) return
      if (!rect) {
        ghost.dataset.visible = 'false'
        return
      }
      ghost.style.left = `${rect.x}px`
      ghost.style.top = `${rect.y}px`
      ghost.style.width = `${rect.width}px`
      ghost.style.height = `${rect.height}px`
      ghost.dataset.visible = 'true'
    },
    setSelection(el, agent) {
      if (agent) {
        el.style.outline = `1.5px solid ${agent.color}`
        el.style.outlineOffset = '2px'
      } else {
        el.style.removeProperty('outline')
        el.style.removeProperty('outline-offset')
      }
    },
    destroy() {
      for (const node of [...cursors.values(), ...ghosts.values()]) node.remove()
      cursors.clear()
      ghosts.clear()
    },
  }
}
