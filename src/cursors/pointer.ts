import type { Point } from './types'

export interface PointerTracker {
  /** Where the mouse or finger is, in viewport coordinates, or null when it is not over the page. */
  get(): Point | null
  stop(): void
}

export function trackPointer(win: Window = window): PointerTracker {
  let current: Point | null = null

  const remember = (event: Event) => {
    const { clientX, clientY } = event as MouseEvent
    current = { x: clientX, y: clientY }
  }
  const forget = () => {
    current = null
  }
  // A lifted finger leaves no pointer behind; a released mouse button does not move the mouse.
  const onRelease = (event: Event) => {
    const { pointerType } = event as PointerEvent
    if (pointerType && pointerType !== 'mouse') current = null
  }

  const root = win.document.documentElement
  win.addEventListener('pointermove', remember, { passive: true })
  win.addEventListener('pointerdown', remember, { passive: true })
  win.addEventListener('pointerup', onRelease)
  win.addEventListener('pointercancel', onRelease)
  win.addEventListener('blur', forget)
  root.addEventListener('pointerleave', forget)

  return {
    get: () => current,
    stop() {
      win.removeEventListener('pointermove', remember)
      win.removeEventListener('pointerdown', remember)
      win.removeEventListener('pointerup', onRelease)
      win.removeEventListener('pointercancel', onRelease)
      win.removeEventListener('blur', forget)
      root.removeEventListener('pointerleave', forget)
      current = null
    },
  }
}
