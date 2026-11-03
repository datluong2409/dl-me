export type AgentId = 'mai' | 'kai' | 'linh' | 'alex' | 'sora' | 'minh'

export interface Agent {
  id: AgentId
  name: string
  color: string
}

export const AGENTS: readonly Agent[] = [
  { id: 'mai', name: 'Mai', color: '#FF6B6B' },
  { id: 'kai', name: 'Kai', color: '#38BDF8' },
  { id: 'linh', name: 'Linh', color: '#A78BFA' },
  { id: 'alex', name: 'Alex', color: '#FBBF24' },
  { id: 'sora', name: 'Sora', color: '#F472B6' },
  { id: 'minh', name: 'Minh', color: '#2DD4BF' },
]

export const MOBILE_BREAKPOINT = 768

export function activeAgents(viewportWidth: number): readonly Agent[] {
  return viewportWidth < MOBILE_BREAKPOINT ? AGENTS.slice(0, 3) : AGENTS
}
