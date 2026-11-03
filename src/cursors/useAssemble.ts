import { useContext, useId, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { ItemContext, SectionContext, useAssembly } from './context'
import type { Gesture } from './types'

/**
 * Registers the element with the nearest <Section> so the cursors assemble it.
 * The director owns `data-assemble`, so React never renders it (a re-render must not undo "done").
 * An item inside another item becomes its child: it waits until the parent's frame is done.
 */
export function useAssemble<T extends HTMLElement = HTMLElement>(options: {
  gesture: Gesture
  order: number
  /** Pass an id when the caller needs to know it (to provide it to its own children). */
  id?: string
}): RefObject<T | null> {
  const { gesture, order } = options
  const ref = useRef<T | null>(null)
  const generatedId = useId()
  const id = options.id ?? generatedId
  const parentId = useContext(ItemContext) ?? undefined
  const assembly = useAssembly()
  const sectionId = useContext(SectionContext)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !assembly || !sectionId) return
    return assembly.director.registerItem({ id, sectionId, el, gesture, order, parentId })
  }, [assembly, sectionId, id, gesture, order, parentId])

  return ref
}
