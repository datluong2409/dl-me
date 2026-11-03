import { createContext, useContext } from 'react'
import type { SectionId } from '../content/sections'
import type { Agent } from './agents'
import type { Director } from './director'

export interface AssemblyValue {
  director: Director
  agents: readonly Agent[]
}

export const AssemblyContext = createContext<AssemblyValue | null>(null)
export const SectionContext = createContext<SectionId | null>(null)
/** The id of the nearest enclosing assembled item, so a nested item knows its parent. */
export const ItemContext = createContext<string | null>(null)

/** The director and active agents, or null when rendered outside an AssemblyProvider. */
export function useAssembly(): AssemblyValue | null {
  return useContext(AssemblyContext)
}
