import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motionTween } from './animate'
import { activeAgents } from './agents'
import { AssemblyContext } from './context'
import type { AssemblyValue } from './context'
import { createCursorView } from './cursor-view'
import { Director } from './director'
import { createDrawGesture } from './gestures/draw'
import { createDropGesture } from './gestures/drop'
import { createStampGesture } from './gestures/stamp'
import { createTypeGesture } from './gestures/type'
import { startIdle } from './idle'
import { attachViewportObservers, evaluateViewport } from './observers'
import { trackPointer } from './pointer'
import type { PointerTracker } from './pointer'
import type { CursorView, Point } from './types'
import { contentRects, pointerInOverlay, viewportInOverlay } from './viewport'

// Pending items are hidden (and drop items start offset) only when motion is allowed. The data attributes
// exist only once JS has run, so nothing is ever hidden without the director to reveal it.
const WRAPPER =
  'relative overflow-x-clip ' +
  'motion-safe:[&_[data-assemble=pending]]:opacity-0 ' +
  'motion-safe:[&_[data-assemble=pending][data-gesture=drop]]:[transform:translate3d(var(--ax),var(--ay),0)_scale(0.96)]'

export function AssemblyProvider({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<CursorView | null>(null)
  const pointerRef = useRef<PointerTracker | null>(null)

  const [value] = useState<AssemblyValue>(() => {
    const agents = activeAgents(window.innerWidth)

    // The overlay does not exist until mount, so the director talks to the real view through this forwarder.
    const view: CursorView = {
      setPosition: (id, x, y) => viewRef.current?.setPosition(id, x, y),
      setVisible: (id, visible) => viewRef.current?.setVisible(id, visible),
      showGhost: (id, rect) => viewRef.current?.showGhost(id, rect),
      setSelection: (el, agent) => viewRef.current?.setSelection(el, agent),
    }

    const origin = () => wrapperRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    const measure = (el: HTMLElement) => {
      const box = el.getBoundingClientRect()
      const base = origin()
      return { x: box.left - base.left, y: box.top - base.top, width: box.width, height: box.height }
    }
    // The fixed nav covers the top of the window; resting cursors use the area below it.
    const navHeight = () => document.querySelector('header')?.getBoundingClientRect().height ?? 0

    const director = new Director({
      view,
      gestures: {
        draw: createDrawGesture(motionTween),
        drop: createDropGesture(motionTween),
        type: createTypeGesture(motionTween),
        stamp: createStampGesture(motionTween),
      },
      startIdle,
      agents,
      rng: Math.random,
      measure,
      spawn: (): Point => {
        const { innerWidth: w, innerHeight: h } = window
        const base = origin()
        const edge = Math.floor(Math.random() * 4)
        const along = Math.random()
        const viewport: Point =
          edge === 0 ? { x: along * w, y: -40 } : edge === 1 ? { x: along * w, y: h + 40 } : edge === 2 ? { x: -40, y: along * h } : { x: w + 40, y: along * h }
        return { x: viewport.x - base.left, y: viewport.y - base.top }
      },
      viewport: () =>
        viewportInOverlay(origin(), { width: window.innerWidth, height: window.innerHeight }, navHeight()),
      pointer: () => {
        const point = pointerRef.current?.get()
        return point ? pointerInOverlay(point, origin()) : null
      },
      obstacles: () => contentRects(document, measure),
    })
    return { director, agents }
  })

  useEffect(() => {
    const { director, agents } = value
    director.start()

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    director.setReducedMotion(motionQuery.matches)
    const onMotionChange = (event: MediaQueryListEvent) => director.setReducedMotion(event.matches)
    motionQuery.addEventListener('change', onMotionChange)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') director.snapRunning()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const cursorView = createCursorView(overlayRef.current!, agents)
    viewRef.current = cursorView
    pointerRef.current = trackPointer()
    const detach = attachViewportObservers(director, wrapperRef.current!)

    let cancelled = false
    void Promise.resolve(document.fonts?.ready).then(() => {
      if (!cancelled) evaluateViewport(director, window.innerHeight)
    })

    return () => {
      cancelled = true
      detach()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotionChange)
      director.dispose()
      cursorView.destroy()
      viewRef.current = null
      pointerRef.current?.stop()
      pointerRef.current = null
    }
  }, [value])

  return (
    <AssemblyContext.Provider value={value}>
      <div ref={wrapperRef} className={WRAPPER}>
        {children}
        <div ref={overlayRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-50 overflow-clip" />
      </div>
    </AssemblyContext.Provider>
  )
}
