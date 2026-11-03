import { useContext, useId, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { SectionContext, useAssembly } from './context'
import type { Gesture } from './types'

/**
 * Registers the element with the nearest <Section> so the cursors assemble it.
 * The director owns `data-assemble`, so React never renders it (a re-render must not undo "done").
 */
export function useAssemble<T extends HTMLElement = HTMLElement>(options: {
  gesture: Gesture
  order: number
}): RefObject<T | null> {
  const { gesture, order } = options
  const ref = useRef<T | null>(null)
  const id = useId()
  const assembly = useAssembly()
  const sectionId = useContext(SectionContext)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !assembly || !sectionId) return
    return assembly.director.registerItem({ id, sectionId, el, gesture, order })
  }, [assembly, sectionId, id, gesture, order])

  return ref
}
