import { useEffect, useState } from 'react'
import type { SectionId } from '../content/sections'
import type { AgentId } from './agents'
import { useAssembly } from './context'

/** Which section each agent is working on right now (null = idle). Updates only when that changes. */
export function usePresence(): Partial<Record<AgentId, SectionId | null>> {
  const assembly = useAssembly()
  const [presence, setPresence] = useState<Partial<Record<AgentId, SectionId | null>>>({})

  useEffect(() => {
    if (!assembly) return
    return assembly.director.subscribe((event) =>
      setPresence((previous) => ({ ...previous, [event.agentId]: event.sectionId as SectionId | null })),
    )
  }, [assembly])

  return presence
}
