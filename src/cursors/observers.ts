import type { Director } from './director'
import { isEligible, sectionAction } from './scheduler'

export type ObservedDirector = Pick<
  Director,
  'snapshot' | 'setItemEligible' | 'triggerSection' | 'completeSectionInstantly'
>

/**
 * Reads where everything is right now and tells the director: which items are near the viewport,
 * which sections are already behind us (finish them), and which one to run (the latest that qualifies).
 */
export function evaluateViewport(director: ObservedDirector, viewportHeight: number): void {
  const { sections, items } = director.snapshot()

  for (const item of items) {
    if (item.status === 'done') continue
    const { top, bottom } = item.el.getBoundingClientRect()
    director.setItemEligible(item.id, isEligible({ top, bottom }, viewportHeight))
  }

  const triggered: string[] = []
  for (const section of sections) {
    if (section.status !== 'pending') continue
    const { top, bottom } = section.el.getBoundingClientRect()
    const action = sectionAction({ top, bottom }, viewportHeight)
    if (action === 'skip') director.completeSectionInstantly(section.id)
    else if (action === 'trigger') triggered.push(section.id)
  }

  for (const id of triggered.slice(0, -1)) director.completeSectionInstantly(id)
  const latest = triggered.at(-1)
  if (latest) director.triggerSection(latest)
}

/** Re-evaluates once per animation frame after scroll, resize, or a layout change of `root`. */
export function attachViewportObservers(director: ObservedDirector, root: HTMLElement): () => void {
  let frame = 0
  const run = () => {
    frame = 0
    evaluateViewport(director, window.innerHeight)
  }
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(run)
  }

  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  const resizeObserver = new ResizeObserver(schedule)
  resizeObserver.observe(root)

  return () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    resizeObserver.disconnect()
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }
}
