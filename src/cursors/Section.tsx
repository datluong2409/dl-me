import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { SectionId } from '../content/sections'
import { SectionContext, useAssembly } from './context'

export function Section({ id, className = '', children }: { id: SectionId; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const assembly = useAssembly()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !assembly) return
    return assembly.director.registerSection(id, el)
  }, [assembly, id])

  return (
    <SectionContext.Provider value={id}>
      <section ref={ref} id={id} className={`scroll-mt-16 ${className}`.trim()}>
        {children}
      </section>
    </SectionContext.Provider>
  )
}
